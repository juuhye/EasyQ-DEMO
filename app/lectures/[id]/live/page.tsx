"use client";

import { useParams, useRouter } from "next/navigation";
import { Fragment, useEffect, useRef, useState } from "react";
import { FakeQR } from "@/components/FakeQR";
import { Bubble, Logo, Sticker } from "@/components/Brand";
import { Icon } from "@/components/Icon";
import { QrModal, QrReissue } from "@/components/QrModal";
import { TeachingFiles } from "@/components/lecture";
import { SourceChips } from "@/components/SourceChips";
import { Button, Empty, Modal, RoundButton, inputCls, useToast } from "@/components/ui";
import { type AiQuestion, demoClock, findLecture, incomingQuestions, initialTranscript, liveAiQuestions, livePublicQuestions, type PublicQuestion, statusOf, toneCycle, transcriptScript } from "@/lib/mock";
import { setDemo, useDemo } from "@/lib/store";

// 음성 인식 상태. 불안정(unstable)한 동안의 발화는 인식 누락 구간으로 남긴다
type Stt = "connecting" | "listening" | "paused" | "unstable";
type Line = { at: string; text: string } | { gap: { from: string; to: string } };

// 강연 시작 기준 경과 시간 mm:ss
function mmss(sec: number) {
  return `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;
}

const SILENCE_MS = 30_000;

type RetractReason = "evidence" | "self";

const retractReasons: { value: RetractReason; label: string; desc: string }[] = [
  { value: "evidence", label: "근거가 부족해요", desc: "답변이 교안 · 발화 근거와 맞지 않거나 정확하지 않아요." },
  { value: "self", label: "제가 직접 답변할게요", desc: "AI 답변 대신 강연 중에 직접 설명할게요." },
];

export default function LiveDashboard() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const lecture = findLecture(id) ?? findLecture("l1")!;
  const { codes, endedLectures, startedLectures } = useDemo();
  const code = codes[lecture.id] ?? lecture.code;
  // 관리자가 강제 종료하는 등 강연이 끝나면 리포트로 보낸다
  const ended = statusOf(lecture, endedLectures, startedLectures) === "ended";
  useEffect(() => {
    if (ended) router.replace(`/lectures/${lecture.id}/report`);
  }, [ended, lecture.id, router]);
  // 데모 질문 · 발화는 트랜스포머 강연(l1)에만 있다
  const seeded = lecture.id === "l1";

  const [qs, setQs] = useState<PublicQuestion[]>(seeded ? livePublicQuestions : []);
  const [ai, setAi] = useState<AiQuestion[]>(seeded ? liveAiQuestions : []);
  const [sort, setSort] = useState<"likes" | "page">("page");
  const [hideDone, setHideDone] = useState(false);
  // 시작할 때 음성 인식에 동의했으니 들어오자마자 연결한다
  const [stt, setStt] = useState<Stt>("connecting");
  const [lines, setLines] = useState<Line[]>(seeded ? initialTranscript : []);
  const gapFrom = useRef<string | null>(null);
  const [elapsed, setElapsed] = useState(34 * 60 + 12);
  // 인식 텍스트 · 누락 구간에 찍을 경과 시간 (effect 안에서 최신 값을 읽는다)
  const elapsedRef = useRef(elapsed);
  useEffect(() => {
    elapsedRef.current = elapsed;
  }, [elapsed]);
  const [qrOpen, setQrOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);
  const [retractId, setRetractId] = useState<string | null>(null);
  const [retractReason, setRetractReason] = useState<RetractReason | null>(null);
  const [retractDetail, setRetractDetail] = useState("");
  const [openAi, setOpenAi] = useState<string | null>("a2");
  const [mobileTab, setMobileTab] = useState<"board" | "ai" | "stt">("board");
  const scriptIdx = useRef(0);
  const incomingIdx = useRef(0);
  const ticks = useRef(0);
  const lastHeard = useRef(0);
  const [silent, setSilent] = useState(false);
  const transcriptBox = useRef<HTMLDivElement>(null);

  const showToast = toast.show;

  // 경과 시간
  useEffect(() => {
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // 다른 청중의 공감 + 강연자에게 전달된 새 질문 도착
  useEffect(() => {
    if (!seeded) return;
    const like = setInterval(() => {
      setQs((list) => {
        const waiting = list.filter((q) => q.status === "waiting");
        if (!waiting.length) return list;
        const pick = waiting[Math.floor(Math.random() * waiting.length)].id;
        return list.map((q) => (q.id === pick ? { ...q, likes: q.likes + 1 } : q));
      });
    }, 3000);
    const incoming = setInterval(() => {
      const next = incomingQuestions[incomingIdx.current++];
      if (!next) return;
      setQs((list) => [...list.map((q) => ({ ...q, isNew: false })), { ...next, id: `in${incomingIdx.current}`, at: demoClock(), isNew: true }]);
      showToast("새 질문이 들어왔어요", "coral");
    }, 12000);
    return () => {
      clearInterval(like);
      clearInterval(incoming);
    };
  }, [seeded, showToast]);

  // 연결 중 → 인식 중
  useEffect(() => {
    if (stt !== "connecting") return;
    const t = setTimeout(() => setStt("listening"), 1800);
    return () => clearTimeout(t);
  }, [stt]);

  // 불안정 구간이 끝나면 인식 누락 구간으로 기록한다
  useEffect(() => {
    if (stt === "unstable") {
      gapFrom.current = mmss(elapsedRef.current);
      const t = setTimeout(() => setStt("listening"), 5000);
      return () => clearTimeout(t);
    }
    if (gapFrom.current) {
      const from = gapFrom.current;
      gapFrom.current = null;
      setLines((l) => [...l, { gap: { from, to: mmss(elapsedRef.current) } }]);
    }
  }, [stt]);

  // 실시간 발화 인식 + 10분 제한 재연결로 불안정해지는 구간 + 무음 구간 시뮬레이션
  useEffect(() => {
    if (stt !== "listening") return;
    const t = setInterval(() => {
      const tick = ticks.current++;
      if (tick >= 8 && tick < 16) return; // 무음 구간 (약 36초)
      const text = transcriptScript[scriptIdx.current % transcriptScript.length];
      scriptIdx.current++;
      lastHeard.current = Date.now();
      setLines((l) => [...l.slice(-30), { at: mmss(elapsedRef.current), text }]);
      if (scriptIdx.current === 5) setStt("unstable");
    }, 4500);
    return () => clearInterval(t);
  }, [stt]);

  // 장시간 무음 경고 (F3-4): 인식 중인데 30초 넘게 발화가 없으면 알려준다
  useEffect(() => {
    if (stt !== "listening") return;
    lastHeard.current = Date.now();
    const t = setInterval(() => setSilent(Date.now() - lastHeard.current > SILENCE_MS), 1000);
    return () => {
      clearInterval(t);
      setSilent(false);
    };
  }, [stt]);

  useEffect(() => {
    const box = transcriptBox.current;
    if (box) box.scrollTo({ top: box.scrollHeight, behavior: "smooth" });
  }, [lines]);

  function toggleDone(qid: string) {
    setQs((list) => list.map((q) => (q.id === qid ? { ...q, status: q.status === "done" ? "waiting" : "done", isNew: false } : q)));
    const q = qs.find((x) => x.id === qid);
    toast.show(q?.status === "done" ? "다시 대기로 돌렸어요" : "답변 완료! 질문자에게 알렸어요", q?.status === "done" ? "ink" : "mint");
  }

  function openRetract(id: string) {
    setRetractReason(null);
    setRetractDetail("");
    setRetractId(id);
  }

  // 철회 사유를 고르면 답변을 숨기고 질문을 공개 목록으로 옮긴다 (F6-4)
  function retract() {
    const target = ai.find((q) => q.id === retractId);
    if (!target || !retractReason) return;
    setAi((list) => list.map((q) => (q.id === target.id ? { ...q, retracted: true } : q)));
    setQs((list) => [...list, { id: target.id, text: target.text, page: Number(target.sources.find((src) => src.kind === "slide")?.label.match(/\d+/)?.[0]) || null, likes: 0, status: "waiting", at: target.at, isNew: true }]);
    setRetractId(null);
    toast.show("AI 답변을 철회했어요. 질문자에게는 “강연자가 직접 설명합니다”로 보여요", "coral");
  }

  function endLecture() {
    setDemo((s) => ({ endedLectures: [...s.endedLectures, lecture.id], endReasons: { ...s.endReasons, [lecture.id]: "manual" } }));
  }

  const waiting = qs.filter((q) => q.status === "waiting");
  // 페이지순이면 교안 페이지별로 묶고(F6-2), 묶음 안에서는 대기 → 공감순
  const visible = qs
    .filter((q) => !hideDone || q.status === "waiting")
    .sort((a, b) => {
      if (sort === "page" && a.page !== b.page) return (a.page ?? 999) - (b.page ?? 999);
      if (a.status !== b.status) return a.status === "waiting" ? -1 : 1;
      return b.likes - a.likes;
    });
  const total = qs.length + ai.length;
  const aiRate = total ? Math.round((ai.filter((a) => !a.retracted).length / total) * 100) : 0;
  const gaps = lines.flatMap((l) => ("gap" in l ? [l.gap] : []));
  const [mm, ss] = mmss(elapsed).split(":");

  return (
    <div className="grid-paper min-h-dvh bg-paper">
      {toast.node}

      {/* 상단 바 */}
      <header className="sticky top-0 z-30 bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-3 px-4 py-3 md:px-6">
          <RoundButton href="/lectures" icon="back" label="내 강연" />
          <Logo className="hidden text-2xl md:inline" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-extrabold leading-tight tracking-[-0.03em] md:text-xl">{lecture.title}</p>
            <p className="flex items-center gap-2 text-xs text-muted">
              <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 font-semibold text-ink">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-coral" /> LIVE
              </span>
              <span className="font-semibold text-ink tabular-nums">
                {mm}:{ss}
              </span>
              <span>· 청중 {lecture.audience}명</span>
            </p>
          </div>
          <Button size="sm" variant="white" icon="qr" onClick={() => setQrOpen(true)}>
            <span className="hidden sm:inline">QR 띄우기</span>
          </Button>
          <Button size="sm" onClick={() => setEndOpen(true)}>
            강연 종료
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-4 pb-16 pt-5 md:px-6">
        {/* 지표 */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="대기 중 질문" value={waiting.length} color="#f4625a" emoji="🙋" />
          <Stat label="AI가 답한 질문" value={ai.filter((a) => !a.retracted).length} color="#3dbf6e" emoji="✨" />
          <Stat label="AI 처리율" value={`${aiRate}%`} color="#3a82f7" emoji="📊" />
          <Stat label="받은 공감" value={qs.reduce((s, q) => s + q.likes, 0)} color="#ffc830" emoji="💛" />
        </div>

        {/* 모바일 탭 */}
        <div className="mt-6 flex gap-1.5 lg:hidden">
          {(
            [
              ["board", "전달된 질문"],
              ["ai", "AI 답변 검토"],
              ["stt", "음성 · 교안"],
            ] as const
          ).map(([v, l]) => (
            <button key={v} onClick={() => setMobileTab(v)} className={`flex-1 rounded-full py-2.5 text-sm font-semibold ${mobileTab === v ? "bg-ink text-white" : "bg-white text-ink/55"}`}>
              {l}
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-12">
          {/* 강연자에게 전달된 질문: 교안 페이지별 · 공감순. 작성자는 보여주지 않는다 */}
          <section className={`lg:col-span-7 ${mobileTab === "board" ? "" : "hidden lg:block"}`}>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <h2 className="text-[26px] font-extrabold tracking-[-0.045em]">전달된 질문</h2>
              <span className="text-sm">{waiting.length}개 대기</span>
              <div className="ml-auto flex items-center gap-1 text-sm">
                <button onClick={() => setHideDone((h) => !h)} className={`mr-1 rounded-full px-3 py-1.5 font-semibold ${hideDone ? "bg-ink text-white" : "text-muted"}`}>
                  완료 숨기기
                </button>
                {(["likes", "page"] as const).map((s) => (
                  <button key={s} onClick={() => setSort(s)} className={`rounded-full px-3 py-1.5 font-semibold ${sort === s ? "bg-sand text-ink" : "text-muted"}`}>
                    {s === "likes" ? "공감순" : "교안 페이지별"}
                  </button>
                ))}
              </div>
            </div>
            <p className="mb-5 text-sm text-muted">AI가 답하지 못해 강연자에게 전달된 질문이에요. 구두로 답한 뒤 완료를 눌러주세요.</p>

            <div>
              {visible.map((q, i) => {
                const done = q.status === "done";
                const groupStart = sort === "page" && (i === 0 || visible[i - 1].page !== q.page);
                return (
                  <Fragment key={q.id}>
                    {groupStart && (
                      <p className={`mb-2 flex items-center gap-2 text-sm font-bold ${i ? "mt-6" : ""}`}>
                        {q.page ? `교안 p.${q.page}` : "일반 질문"}
                        <span className="font-normal text-muted">{visible.filter((x) => x.page === q.page).length}개</span>
                      </p>
                    )}
                    <Bubble
                      tone={toneCycle[i % toneCycle.length]}
                      tail={i % 2 ? "right" : "left"}
                      muted={done}
                      className={`mb-[18px] ${i && !groupStart ? "-mt-1" : ""} ${q.isNew ? "animate-pop" : ""}`}
                      style={{ zIndex: visible.length - i }}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-full ${done ? "bg-white/60" : "bg-ink text-white"}`}>
                          <Icon name="heart" size={15} />
                          <span className="text-lg font-extrabold leading-none tabular-nums">{q.likes}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="mb-0.5 flex flex-wrap items-center gap-1.5 text-xs text-ink/55">
                            <b className="text-ink">{q.page ? `교안 p.${q.page}` : "일반"}</b>
                            {q.at}
                            {q.isNew && <span className="rounded-full bg-ink px-2 py-0.5 font-bold text-white">NEW</span>}
                          </p>
                          <p className={`text-[16px] font-medium leading-snug ${done ? "text-ink/45 line-through decoration-ink/30" : ""}`}>{q.text}</p>
                        </div>
                        <button
                          onClick={() => toggleDone(q.id)}
                          className={`flex h-11 shrink-0 items-center gap-1 rounded-full px-4 text-sm font-semibold transition-all ${done ? "bg-white/60 text-ink/60 hover:bg-white" : "bg-white text-ink hover:bg-white/80"}`}
                        >
                          <Icon name={done ? "undo" : "check"} size={16} stroke={2.6} />
                          <span className="hidden sm:inline">{done ? "완료 취소" : "답변 완료"}</span>
                        </button>
                      </div>
                    </Bubble>
                  </Fragment>
                );
              })}
              {visible.length === 0 && <Empty emoji="🎉" title="대기 중인 질문이 없어요!" />}
            </div>
          </section>

          <div className="space-y-5 lg:col-span-5">
            {/* 음성 인식 */}
            <section className={`${mobileTab === "stt" ? "" : "hidden lg:block"}`}>
              <div className="overflow-hidden rounded-[28px] bg-ink text-white">
                <div className="flex items-center gap-3 p-4">
                  <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${stt === "listening" ? "bg-coral" : "bg-white/10"}`}>
                    <Icon name="mic" />
                  </span>
                  <div className="flex-1">
                    <p className="font-bold">음성 인식</p>
                    <SttBadge stt={stt} />
                  </div>
                  <Levels on={stt === "listening"} />
                  <button
                    onClick={() => setStt(stt === "paused" ? "listening" : "paused")}
                    disabled={stt === "connecting"}
                    className="flex h-10 items-center gap-1 rounded-full bg-white/12 px-3 text-sm font-semibold hover:bg-white/20 disabled:opacity-40"
                  >
                    <Icon name={stt === "paused" ? "play" : "pause"} size={16} />
                    {stt === "paused" ? "다시 듣기" : "일시정지"}
                  </button>
                </div>

                <div ref={transcriptBox} className="no-scrollbar h-56 space-y-2 overflow-y-auto border-t border-white/10 p-4">
                  {stt === "connecting" && lines.length === 0 && <p className="pt-16 text-center text-sm text-white/55">마이크에 연결하는 중이에요… 권한을 묻는 창이 뜨면 허용해 주세요.</p>}
                  {lines.map((l, i) =>
                    "gap" in l ? (
                      <p key={i} className="flex items-center gap-1.5 rounded-xl bg-coral/20 px-3 py-1.5 text-xs font-semibold text-coral">
                        <Icon name="alert" size={13} className="shrink-0" />
                        {l.gap.from} – {l.gap.to} 인식 누락 · 이 구간의 발화는 AI 근거로 쓰이지 않아요
                      </p>
                    ) : (
                      <p key={i} className={`flex gap-2 text-sm leading-relaxed ${i === lines.length - 1 ? "animate-rise text-white" : "text-white/60"}`}>
                        <span className="shrink-0 pt-0.5 text-xs font-semibold text-white/35 tabular-nums">{l.at}</span>
                        {l.text}
                      </p>
                    ),
                  )}
                  {stt === "unstable" && <p className="pt-2 text-center text-xs text-coral">연결이 불안정해요 · 다시 연결하는 동안의 발화는 인식 누락으로 남아요</p>}
                  {stt === "paused" && <p className="pt-2 text-center text-xs text-honey">일시정지 중 · 이 동안의 발화는 인식하지 않아요</p>}
                  {silent && stt === "listening" && (
                    <p className="sticky bottom-0 flex items-center gap-1.5 rounded-xl bg-honey px-3 py-2 text-xs font-semibold text-ink">
                      <Icon name="alert" size={14} className="shrink-0" />
                      {SILENCE_MS / 1000}초 넘게 말소리가 들리지 않아요. 마이크가 꺼졌거나 음소거됐는지 확인해 주세요.
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 border-t border-white/10 px-4 py-3 text-xs">
                  <span className={gaps.length ? "font-semibold text-coral" : "text-white/50"}>인식 누락 구간 {gaps.length}개</span>
                  {gaps.length > 0 && <span className="truncate text-white/50">· 최근 {gaps[gaps.length - 1].from} – {gaps[gaps.length - 1].to}</span>}
                </div>
              </div>

              {/* 교안: 진행 중에는 추가 업로드만 (삭제는 시작 전 · 종료 후) */}
              <div className="mt-4">
                <p className="mb-2 flex items-center gap-2 font-bold">
                  교안 <span className="text-xs font-normal text-muted">진행 중에도 추가로 올릴 수 있어요</span>
                </p>
                <TeachingFiles initial={lecture.file ? [{ id: "f0", name: lecture.file.name, pages: lecture.file.pages, state: lecture.file.state, failReason: lecture.file.failReason }] : []} canUpload canDelete={false} />
              </div>

              {/* QR */}
              <div className="mt-4 flex items-center gap-4 rounded-[28px] bg-white p-4">
                <FakeQR code={code} size={96} />
                <div className="flex-1">
                  <p className="text-xs text-muted">입장 코드</p>
                  <p className="text-3xl font-extrabold tracking-[0.2em]">{code}</p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Button size="sm" variant="soft" icon="expand" onClick={() => setQrOpen(true)}>
                    전체 화면
                  </Button>
                  <QrReissue lectureId={lecture.id} onDone={(c) => toast.show(`새 입장 코드 ${c}를 만들었어요. 이전 QR은 꺼졌어요`, "mint")} />
                </div>
              </div>
            </section>

            {/* AI 답변 확인 · 철회 */}
            <section className={`${mobileTab === "ai" ? "" : "hidden lg:block"}`}>
              <div className="mb-3 flex items-center gap-2">
                <h2 className="text-[26px] font-extrabold tracking-[-0.045em]">AI 답변 검토</h2>
                <span className="text-sm">{ai.length}개</span>
              </div>
              <p className="mb-3 text-sm text-muted">질문자에게만 보인 답변이에요. 틀린 답은 철회할 수 있어요.</p>
              {ai.length === 0 && <Empty emoji="✨" title="아직 AI가 답한 질문이 없어요" />}
              <div className="space-y-2.5">
                {ai.map((q) => {
                  const open = openAi === q.id;
                  return (
                    <div key={q.id} className={`rounded-[24px] bg-white ${q.retracted ? "opacity-55" : ""}`}>
                      <button onClick={() => setOpenAi(open ? null : q.id)} className="flex w-full items-center gap-3 p-4 text-left">
                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${q.retracted ? "bg-ink/8 text-muted" : "bg-mint text-ink"}`}>
                          <Icon name={q.retracted ? "x" : "spark"} size={17} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-bold">{q.text}</span>
                          <span className="text-xs text-muted">
                            {q.at} · 판정 점수 {q.score.toFixed(2)} · {q.route}
                            {q.retracted && " · 철회됨"}
                          </span>
                        </span>
                        <Icon name="right" size={16} className={`shrink-0 text-muted transition-transform ${open ? "rotate-90" : ""}`} />
                      </button>
                      {open && (
                        <div className="animate-rise border-t border-line px-4 pb-4 pt-3">
                          <p className="text-[15px] leading-relaxed">{q.answer}</p>
                          <SourceChips sources={q.sources} />
                          {!q.retracted && (
                            <div className="mt-3 flex justify-end">
                              <Button size="sm" variant="soft" icon="undo" onClick={() => openRetract(q.id)}>
                                답변 철회
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      </main>

      <QrModal open={qrOpen} onClose={() => setQrOpen(false)} code={code} title={lecture.title} />

      <Modal open={!!retractId} onClose={() => setRetractId(null)} title="이 AI 답변을 철회할까요?">
        <p className="rounded-2xl bg-white p-3.5 font-bold">{ai.find((a) => a.id === retractId)?.text}</p>
        <p className="mt-5 text-sm font-semibold text-ink/70">철회 사유를 골라 주세요</p>
        <div role="radiogroup" aria-label="철회 사유" className="mt-2 space-y-2">
          {retractReasons.map((r) => {
            const on = retractReason === r.value;
            return (
              <button
                key={r.value}
                role="radio"
                aria-checked={on}
                onClick={() => setRetractReason(r.value)}
                className={`flex w-full gap-3 rounded-[20px] bg-white p-3.5 text-left ring-inset transition-all ${on ? "ring-2 ring-ink" : "ring-0"}`}
              >
                <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white ${on ? "bg-ink" : "bg-ink/10"}`}>
                  <Icon name="check" size={14} stroke={3.2} />
                </span>
                <span>
                  <span className="block font-bold">{r.label}</span>
                  <span className="mt-0.5 block text-sm leading-relaxed text-muted">{r.desc}</span>
                </span>
              </button>
            );
          })}
        </div>
        <label className="mt-4 block">
          <span className="text-sm font-semibold text-ink/70">상세 사유 (선택)</span>
          <textarea className={`${inputCls} mt-2 h-20 resize-none text-sm`} value={retractDetail} onChange={(e) => setRetractDetail(e.target.value)} maxLength={200} placeholder="어떤 점이 틀렸는지 적어 주면 판정 모델 개선에 쓰여요" />
        </label>
        <p className="mt-3 text-xs leading-relaxed text-muted">질문자 화면에서 답변이 가려지고 “강연자가 직접 설명합니다”로 바뀌어요. 질문은 공개 목록으로 옮겨지고, 철회한 답변은 판정 모델 재학습 데이터로 쓰여요.</p>
        <div className="mt-6 flex gap-2">
          <Button variant="soft" className="flex-1" onClick={() => setRetractId(null)}>
            취소
          </Button>
          <Button className="flex-1" onClick={retract} disabled={!retractReason}>
            철회하기
          </Button>
        </div>
      </Modal>

      <Modal open={endOpen} onClose={() => setEndOpen(false)}>
        <div className="flex flex-col items-center text-center">
          <Sticker size={56} rotate={-8}>
            🏁
          </Sticker>
          <p className="mt-4 text-[22px] font-extrabold tracking-[-0.04em]">강연을 종료할까요?</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            청중 질문이 마감되고 입장 QR이 꺼져요.
            <br />
            종료 후 요약 노트를 만들어 회원 청중의 보관함에 보내드려요.
          </p>
          {waiting.length > 0 && <p className="mt-3 rounded-full bg-coral/20 px-3 py-1.5 text-sm font-semibold">아직 대기 중인 질문이 {waiting.length}개 있어요</p>}
        </div>
        <div className="mt-6 flex gap-2">
          <Button variant="soft" className="flex-1" onClick={() => setEndOpen(false)}>
            계속 진행
          </Button>
          <Button className="flex-1" onClick={endLecture}>
            종료하기
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function Stat({ label, value, color, emoji }: { label: string; value: React.ReactNode; color: string; emoji: string }) {
  return (
    <div className="relative overflow-hidden rounded-[24px] p-4 pb-5" style={{ backgroundColor: color }}>
      <p className="text-[34px] font-extrabold leading-none tracking-[-0.04em] tabular-nums">{value}</p>
      <p className="mt-2 text-sm font-medium text-ink/65">{label}</p>
      <Sticker size={34} rotate={12} className="absolute right-3 top-3">
        {emoji}
      </Sticker>
    </div>
  );
}

function SttBadge({ stt }: { stt: Stt }) {
  const map = {
    connecting: ["bg-white/50 animate-pulse", "연결 중"],
    listening: ["bg-[#7cf7b6] animate-pulse", "인식 중"],
    paused: ["bg-honey", "일시정지"],
    unstable: ["bg-coral animate-ping", "불안정"],
  } as const;
  const [dot, label] = map[stt];
  return (
    <span className="flex items-center gap-1.5 text-xs text-white/70">
      <span className={`h-2 w-2 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

function Levels({ on }: { on: boolean }) {
  return (
    <span className="flex h-6 items-end gap-0.5" aria-hidden>
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className={`w-1 rounded-full bg-coral ${on ? "animate-pulse" : ""}`}
          style={{ height: on ? `${30 + ((i * 37) % 70)}%` : "20%", animationDelay: `${i * 120}ms`, animationDuration: "0.8s" }}
        />
      ))}
    </span>
  );
}
