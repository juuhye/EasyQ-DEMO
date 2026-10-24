"use client";

import { useParams, useRouter } from "next/navigation";
import { Fragment, useEffect, useRef, useState } from "react";
import { FakeQR } from "@/components/FakeQR";
import { Bubble, Logo, Sticker } from "@/components/Brand";
import { Icon } from "@/components/Icon";
import { QrModal, QrReissue } from "@/components/QrModal";
import { SourceChips } from "@/components/SourceChips";
import { Button, Empty, Modal, RoundButton, useToast } from "@/components/ui";
import { type AiQuestion, findLecture, incomingQuestions, initialTranscript, liveAiQuestions, livePublicQuestions, type PublicQuestion, toneCycle, transcriptScript } from "@/lib/mock";
import { setDemo, useDemo } from "@/lib/store";

type Stt = "off" | "listening" | "paused" | "reconnecting";

function clock(offsetSec = 0) {
  const d = new Date(Date.now() + offsetSec * 1000);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

const SILENCE_MS = 30_000;

export default function LiveDashboard() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const lecture = findLecture(id) ?? findLecture("l1")!;
  const code = useDemo().codes[lecture.id] ?? lecture.code;

  const [qs, setQs] = useState<PublicQuestion[]>(livePublicQuestions);
  const [ai, setAi] = useState<AiQuestion[]>(liveAiQuestions);
  const [sort, setSort] = useState<"likes" | "page">("likes");
  const [hideDone, setHideDone] = useState(false);
  const [stt, setStt] = useState<Stt>("off");
  const [lines, setLines] = useState(initialTranscript);
  const [elapsed, setElapsed] = useState(34 * 60 + 12);
  const [qrOpen, setQrOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);
  const [retractId, setRetractId] = useState<string | null>(null);
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

  // 다른 청중의 공감 + 새 이관 질문 도착
  useEffect(() => {
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
      setQs((list) => [...list.map((q) => ({ ...q, isNew: false })), { ...next, id: `in${incomingIdx.current}`, at: clock(), isNew: true }]);
      showToast("새 질문이 들어왔어요", "coral");
    }, 12000);
    return () => {
      clearInterval(like);
      clearInterval(incoming);
    };
  }, [showToast]);

  // 실시간 STT 자막 + 10분 제한 재연결 + 무음 구간 시뮬레이션
  useEffect(() => {
    if (stt !== "listening") return;
    const t = setInterval(() => {
      const tick = ticks.current++;
      if (tick >= 8 && tick < 16) return; // 무음 구간 (약 36초)
      const text = transcriptScript[scriptIdx.current % transcriptScript.length];
      scriptIdx.current++;
      lastHeard.current = Date.now();
      setLines((l) => [...l.slice(-30), { at: clock(), text }]);
      if (scriptIdx.current === 5) {
        setStt("reconnecting");
        setTimeout(() => setStt((s) => (s === "reconnecting" ? "listening" : s)), 2500);
      }
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

  // 철회하면 답변을 숨기고 질문을 공개 목록으로 옮긴다 (F6-4)
  function retract() {
    const target = ai.find((q) => q.id === retractId);
    if (!target) return;
    setAi((list) => list.map((q) => (q.id === target.id ? { ...q, retracted: true } : q)));
    setQs((list) => [...list, { id: target.id, text: target.text, page: Number(target.sources.find((src) => src.kind === "slide")?.label.match(/\d+/)?.[0]) || null, likes: 0, status: "waiting", at: target.at, isNew: true }]);
    setRetractId(null);
    toast.show("AI 답변을 철회하고 질문을 공개 목록으로 옮겼어요", "coral");
  }

  function endLecture() {
    setDemo((s) => ({ endedLectures: [...s.endedLectures, lecture.id] }));
    router.push(`/lectures/${lecture.id}/report`);
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
  const aiRate = Math.round((ai.filter((a) => !a.retracted).length / total) * 100);
  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  return (
    <div className="grid-paper min-h-dvh bg-paper">
      {toast.node}

      {/* 상단 바 */}
      <header className="sticky top-0 z-30 bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-3 px-4 py-3 md:px-6">
          <RoundButton href="/lectures" icon="back" label="내 강의" />
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
            강의 종료
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
              ["board", "질문 보드"],
              ["ai", "AI 답변"],
              ["stt", "음성 · QR"],
            ] as const
          ).map(([v, l]) => (
            <button key={v} onClick={() => setMobileTab(v)} className={`flex-1 rounded-full py-2.5 text-sm font-semibold ${mobileTab === v ? "bg-ink text-white" : "bg-white text-ink/55"}`}>
              {l}
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-12">
          {/* 이관 질문 보드 */}
          <section className={`lg:col-span-7 ${mobileTab === "board" ? "" : "hidden lg:block"}`}>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <h2 className="text-[26px] font-extrabold tracking-[-0.045em]">질문 보드</h2>
              <span className="text-sm">{waiting.length}개 대기</span>
              <div className="ml-auto flex items-center gap-1 text-sm">
                <button onClick={() => setHideDone((h) => !h)} className={`mr-1 rounded-full px-3 py-1.5 font-semibold ${hideDone ? "bg-ink text-white" : "text-muted"}`}>
                  완료 숨기기
                </button>
                {(["likes", "page"] as const).map((s) => (
                  <button key={s} onClick={() => setSort(s)} className={`rounded-full px-3 py-1.5 font-semibold ${sort === s ? "bg-sand text-ink" : "text-muted"}`}>
                    {s === "likes" ? "공감순" : "교안 페이지순"}
                  </button>
                ))}
              </div>
            </div>
            <p className="mb-5 text-sm text-muted">AI가 답하지 못해 넘어온 질문이에요. 구두로 답한 뒤 완료를 눌러주세요.</p>

            <div>
              {visible.map((q, i) => {
                const done = q.status === "done";
                const groupStart = sort === "page" && (i === 0 || visible[i - 1].page !== q.page);
                return (
                  <Fragment key={q.id}>
                    {groupStart && (
                      <p className={`mb-2 flex items-center gap-2 text-sm font-bold ${i ? "mt-6" : ""}`}>
                        {q.page ? `교안 ${q.page}p` : "일반 질문"}
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
                            <b className="text-ink">{q.page ? `교안 ${q.page}p` : "일반"}</b>
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
                  {stt !== "off" && (
                    <>
                      <Levels on={stt === "listening"} />
                      <button
                        onClick={() => setStt(stt === "paused" ? "listening" : "paused")}
                        className="flex h-10 items-center gap-1 rounded-full bg-white/12 px-3 text-sm font-semibold hover:bg-white/20"
                      >
                        <Icon name={stt === "paused" ? "play" : "pause"} size={16} />
                        {stt === "paused" ? "다시 듣기" : "일시정지"}
                      </button>
                    </>
                  )}
                </div>

                {stt === "off" ? (
                  <div className="border-t border-white/10 p-5 text-center">
                    <p className="text-sm text-white/75">마이크를 연결하면 강연 내용이 실시간으로 인식돼 AI 답변 근거로 쓰여요. 음성 원본은 저장하지 않아요.</p>
                    <Button variant="white" className="mt-4" icon="mic" onClick={() => setStt("listening")}>
                      마이크 연결
                    </Button>
                    <p className="mt-2 text-xs text-white/50">권한을 거부했다면 주소창 왼쪽 자물쇠 → 마이크 허용</p>
                  </div>
                ) : (
                  <div ref={transcriptBox} className="no-scrollbar h-56 space-y-2 overflow-y-auto border-t border-white/10 p-4">
                    {lines.map((l, i) => (
                      <p key={i} className={`flex gap-2 text-sm leading-relaxed ${i === lines.length - 1 ? "animate-rise text-white" : "text-white/60"}`}>
                        <span className="shrink-0 pt-0.5 text-xs font-semibold text-white/35 tabular-nums">{l.at}</span>
                        {l.text}
                      </p>
                    ))}
                    {stt === "paused" && <p className="pt-2 text-center text-xs text-honey">일시정지 중 · 이 동안의 발화는 인식하지 않아요</p>}
                    {silent && stt === "listening" && (
                      <p className="sticky bottom-0 flex items-center gap-1.5 rounded-xl bg-honey px-3 py-2 text-xs font-semibold text-ink">
                        <Icon name="alert" size={14} className="shrink-0" />
                        {SILENCE_MS / 1000}초 넘게 말소리가 들리지 않아요. 마이크가 꺼졌거나 음소거됐는지 확인해 주세요.
                      </p>
                    )}
                  </div>
                )}
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
                <h2 className="text-[26px] font-extrabold tracking-[-0.045em]">AI 답변</h2>
                <span className="text-sm">{ai.length}개</span>
              </div>
              <p className="mb-3 text-sm text-muted">질문자에게만 보인 답변이에요. 틀린 답은 철회할 수 있어요.</p>
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
                              <Button size="sm" variant="soft" icon="undo" onClick={() => setRetractId(q.id)}>
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
        <p className="mt-3 text-sm leading-relaxed text-muted">질문자 화면에서 답변이 가려지고, 질문은 공개 목록으로 옮겨져 강연 중에 다룰 수 있어요. 철회한 답변은 판정 모델 재학습 데이터로 쓰여요.</p>
        <div className="mt-6 flex gap-2">
          <Button variant="soft" className="flex-1" onClick={() => setRetractId(null)}>
            취소
          </Button>
          <Button className="flex-1" onClick={retract}>
            철회하기
          </Button>
        </div>
      </Modal>

      <Modal open={endOpen} onClose={() => setEndOpen(false)}>
        <div className="flex flex-col items-center text-center">
          <Sticker size={56} rotate={-8}>
            🏁
          </Sticker>
          <p className="mt-4 text-[22px] font-extrabold tracking-[-0.04em]">강의를 종료할까요?</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            청중 질문이 마감되고 입장 QR이 꺼져요.
            <br />
            종료 후 요약 노트를 만들어 청중 보관함에 보내드려요.
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
    off: ["bg-white/30", "연결 안 됨"],
    listening: ["bg-[#7cf7b6] animate-pulse", "인식 중"],
    paused: ["bg-honey", "일시정지"],
    reconnecting: ["bg-coral animate-ping", "재연결 중..."],
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
