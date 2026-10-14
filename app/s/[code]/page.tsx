"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Avatar, Bubble, Sticker } from "@/components/Brand";
import { Icon } from "@/components/Icon";
import { Button, Empty, Modal, RoundButton, Screen, Tabs, useToast } from "@/components/ui";
import { SourceChips } from "@/components/SourceChips";
import { cannedAnswers, findLectureByCode, liveAiQuestions, livePublicQuestions, type PublicQuestion, type Source, toneCycle } from "@/lib/mock";
import { useDemo } from "@/lib/store";

type Mine = {
  id: string;
  text: string;
  at: string;
  state: "judging" | "ai" | "forwarded";
  answer?: string;
  sources?: Source[];
  feedback?: "up" | "down" | null;
  retracted?: boolean;
};

type Noti = { id: string; text: string; tone: "mint" | "coral"; read: boolean };

const MAX = 200;
const COOLDOWN = 10;

function now() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function AudienceLive() {
  const { code } = useParams<{ code: string }>();
  const lecture = findLectureByCode(code);
  const { name, guestName } = useDemo();
  const toast = useToast();

  const [tab, setTab] = useState<"ask" | "board" | "mine">("ask");
  const [publicQs, setPublicQs] = useState<PublicQuestion[]>(livePublicQuestions);
  const [mine, setMine] = useState<Mine[]>(() => [
    ...liveAiQuestions.filter((q) => q.mine).map((q) => ({ id: q.id, text: q.text, at: q.at, state: "ai" as const, answer: q.answer, sources: q.sources, feedback: null })),
    ...livePublicQuestions.filter((q) => q.mine).map((q) => ({ id: q.id, text: q.text, at: q.at, state: "forwarded" as const })),
  ]);
  const [notis, setNotis] = useState<Noti[]>([]);
  const [notiOpen, setNotiOpen] = useState(false);
  const [text, setText] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [sort, setSort] = useState<"likes" | "page">("likes");
  const [ended, setEnded] = useState(false);

  // 실시간 이벤트 시뮬레이션: 다른 청중의 공감, 강연자 답변 완료, AI 답변 철회
  const showToast = toast.show;
  useEffect(() => {
    const push = (text: string, tone: Noti["tone"]) => {
      setNotis((n) => [{ id: crypto.randomUUID(), text, tone, read: false }, ...n]);
      showToast(text, tone);
    };
    const likeTimer = setInterval(() => {
      setPublicQs((qs) => {
        const waiting = qs.filter((q) => q.status === "waiting");
        if (!waiting.length) return qs;
        const pick = waiting[Math.floor(Math.random() * waiting.length)].id;
        return qs.map((q) => (q.id === pick ? { ...q, likes: q.likes + 1 } : q));
      });
    }, 3500);
    const doneTimer = setTimeout(() => {
      setPublicQs((qs) => qs.map((q) => (q.id === "p2" ? { ...q, status: "done" } : q)));
      push("강연자가 ‘과제 3번 제출 기한…’ 질문에 답했어요", "mint");
    }, 12000);
    const retractTimer = setTimeout(() => {
      setMine((m) => m.map((q) => (q.id === "a2" ? { ...q, retracted: true } : q)));
      push("강연자가 AI 답변 하나를 철회했어요", "coral");
    }, 24000);
    return () => {
      clearInterval(likeTimer);
      clearTimeout(doneTimer);
      clearTimeout(retractTimer);
    };
  }, [showToast]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  // 입력 중 비슷한 공개 질문 먼저 보여주기
  const similar = useMemo(() => {
    const words = text
      .replace(/[?.!,]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length >= 2);
    if (!words.length) return [];
    return publicQs
      .map((q) => ({ q, hit: words.filter((w) => q.text.toLowerCase().includes(w.toLowerCase().slice(0, 3))).length }))
      .filter((x) => x.hit > 0)
      .sort((a, b) => b.hit - a.hit)
      .slice(0, 3)
      .map((x) => x.q);
  }, [text, publicQs]);

  if (!lecture)
    return (
      <Screen>
        <Empty emoji="🔍" title="입장 코드를 찾을 수 없어요" desc="코드를 다시 확인하거나 강연자에게 QR을 요청해 주세요.">
          <Button href="/join">다시 입력하기</Button>
        </Empty>
      </Screen>
    );

  function like(id: string) {
    const q = publicQs.find((x) => x.id === id);
    if (!q) return;
    if (q.liked) return toast.show("이미 공감한 질문이에요");
    setPublicQs((qs) => qs.map((x) => (x.id === id ? { ...x, liked: true, likes: x.likes + 1 } : x)));
  }

  function mergeInto(id: string) {
    like(id);
    setText("");
    toast.show("같은 질문에 공감으로 합쳤어요 💛", "coral");
  }

  function submit() {
    const t = text.trim();
    if (ended) return toast.show("강의가 끝나 더 이상 질문할 수 없어요");
    if (!t) return;
    if (t.length > MAX) return toast.show(`질문은 ${MAX}자까지 쓸 수 있어요`);
    if (cooldown > 0) return toast.show(`${cooldown}초 뒤에 다시 질문할 수 있어요`);

    const id = crypto.randomUUID();
    setMine((m) => [{ id, text: t, at: now(), state: "judging" }, ...m]);
    setText("");
    setCooldown(COOLDOWN);
    setTab("mine");

    setTimeout(() => {
      const hit = cannedAnswers.find((c) => c.keys.some((k) => t.toLowerCase().includes(k)));
      if (hit) {
        setMine((m) => m.map((q) => (q.id === id ? { ...q, state: "ai", answer: hit.answer, sources: hit.sources, feedback: null } : q)));
        toast.show("AI가 바로 답했어요 ✨", "mint");
      } else {
        setMine((m) => m.map((q) => (q.id === id ? { ...q, state: "forwarded" } : q)));
        setPublicQs((qs) => [...qs, { id, text: t, page: 26, likes: 0, status: "waiting", at: now(), mine: true, liked: false }]);
        toast.show("강연자에게 전달했어요. 모두의 질문에 올라갔어요", "coral");
      }
    }, 2200);
  }

  const unread = notis.filter((n) => !n.read).length;
  const sorted = [...publicQs].sort((a, b) => {
    if (a.status !== b.status) return a.status === "waiting" ? -1 : 1;
    return sort === "likes" ? b.likes - a.likes : (a.page ?? 999) - (b.page ?? 999);
  });

  return (
    <Screen>
      {toast.node}
      {/* 헤더 */}
      <header className="px-5 pt-5">
        <div className="flex items-center justify-between">
          <RoundButton href="/home" icon="back" label="나가기" />
          <span className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm font-semibold">
            <span className={`h-1.5 w-1.5 rounded-full ${ended ? "bg-ink/30" : "animate-pulse bg-coral"}`} />
            {ended ? "종료됨" : "LIVE"} · {lecture.audience}명
          </span>
          <button
            onClick={() => {
              setNotiOpen(true);
              setNotis((n) => n.map((x) => ({ ...x, read: true })));
            }}
            className="relative flex h-10 w-10 items-center justify-center rounded-full bg-sand"
            aria-label="알림"
          >
            <Icon name="bell" size={19} />
            {unread > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1 text-xs font-bold text-white">{unread}</span>}
          </button>
        </div>
        <div className="mt-6 flex items-end justify-between gap-3">
          <h1 className="text-[32px] font-extrabold leading-[1.08] tracking-[-0.05em]">{lecture.title}</h1>
          <Sticker size={46} rotate={10} className="shrink-0">
            {lecture.emoji}
          </Sticker>
        </div>
        <p className="mt-2 text-sm text-muted">
          {guestName ? `게스트 ‘${guestName}’` : `${name}님`}으로 참여 중 · 교안 {lecture.file?.pages}p
        </p>
      </header>

      <div className="flex flex-1 flex-col px-5 pt-5">
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { value: "ask", label: "질문하기" },
            { value: "board", label: "모두의 질문", count: publicQs.filter((q) => q.status === "waiting").length },
            { value: "mine", label: "내 질문", count: mine.length },
          ]}
        />

        {ended && (
          <div className="mt-4 flex items-center gap-2 rounded-2xl bg-ink px-4 py-3 text-sm text-white">
            <Icon name="alert" size={18} /> 강의가 끝났어요. 요약 노트는 곧 보관함에 도착해요.
          </div>
        )}

        {/* 질문하기 */}
        {tab === "ask" && (
          <div className="animate-rise pb-8">
            <div className="mt-4 rounded-[26px] bg-white p-4">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={4}
                placeholder="궁금한 걸 편하게 적어보세요. 교안 내용이면 AI가 먼저 답해줘요."
                className="w-full resize-none bg-transparent text-[17px] leading-relaxed outline-none placeholder:text-ink/30"
              />
              <div className="flex items-center justify-between pt-2">
                <span className={`text-xs ${text.length > MAX ? "text-[#e5484d]" : "text-muted"}`}>
                  {text.length}/{MAX}
                </span>
                <Button size="sm" icon="send" onClick={submit} disabled={!text.trim() || ended}>
                  {cooldown > 0 ? `${cooldown}초 후 가능` : "보내기"}
                </Button>
              </div>
            </div>

            {similar.length > 0 ? (
              <div className="mt-6 animate-rise">
                <p className="mb-3 text-[15px] font-bold">혹시 이 질문과 같나요?</p>
                <div className="space-y-2">
                  {similar.map((q) => (
                    <div key={q.id} className="flex items-center gap-3 rounded-[22px] bg-white p-3 pl-4">
                      <p className="flex-1 text-sm leading-snug">{q.text}</p>
                      <button onClick={() => mergeInto(q.id)} className="flex shrink-0 items-center gap-1 rounded-full bg-ink px-3 py-2 text-xs font-semibold text-white">
                        <Icon name="heart" size={14} />
                        같아요 {q.likes}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-8">
                <p className="text-[22px] font-bold leading-[1.45] tracking-[-0.035em] text-ink/35">
                  질문을 보내면 교안과 강연에서 <span className="text-ink">근거를 찾고</span> <Sticker size={24} rotate={-8}>🔎</Sticker>, 충분하면{" "}
                  <span className="text-ink">AI가 나에게만</span> 답해요. 아니면 <span className="text-ink">강연자에게 전달</span>{" "}
                  <Sticker size={24} rotate={8}>📮</Sticker> 돼요.
                </p>
                <p className="mt-5 rounded-2xl bg-sand/70 p-3 text-xs leading-relaxed text-ink/60">
                  데모 팁 · ‘어텐션’, ‘마스킹’, ‘인코더’, ‘포지셔널’이 들어가면 AI 답변, 그 밖에는 강연자에게 전달돼요.
                </p>
              </div>
            )}
          </div>
        )}

        {/* 모두의 질문 — 시안의 Chats 말풍선 */}
        {tab === "board" && (
          <div className="animate-rise pb-10">
            <div className="mt-5 flex items-center justify-between">
              <p className="text-sm text-muted">강연자에게 전달된 질문</p>
              <div className="flex gap-1 text-sm">
                {(["likes", "page"] as const).map((s) => (
                  <button key={s} onClick={() => setSort(s)} className={`rounded-full px-3 py-1.5 font-semibold ${sort === s ? "bg-sand text-ink" : "text-muted"}`}>
                    {s === "likes" ? "공감순" : "페이지순"}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-4">
              {sorted.map((q, i) => (
                <BoardBubble key={q.id} q={q} i={i} total={sorted.length} onLike={() => like(q.id)} />
              ))}
            </div>
          </div>
        )}

        {/* 내 질문 */}
        {tab === "mine" && (
          <div className="animate-rise space-y-3 pb-8 pt-4">
            {mine.length === 0 && <Empty title="아직 보낸 질문이 없어요" desc="궁금한 게 생기면 언제든 물어보세요!" emoji="💭" />}
            {mine.map((q) => {
              const pub = publicQs.find((p) => p.id === q.id);
              return (
                <div key={q.id} className="animate-rise rounded-[26px] bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-[16px] font-bold leading-snug">{q.text}</p>
                    <span className="shrink-0 pt-0.5 text-xs text-muted">{q.at}</span>
                  </div>

                  {q.state === "judging" && (
                    <div className="mt-3 flex items-center gap-3 rounded-2xl bg-paper p-3">
                      <Sticker size={26} className="animate-spin [animation-duration:2.4s]">
                        🔎
                      </Sticker>
                      <div className="text-sm">
                        <p className="font-semibold">근거 찾는 중…</p>
                        <p className="text-xs text-muted">교안 {lecture.file?.pages}p와 최근 발화를 살펴보고 있어요</p>
                      </div>
                    </div>
                  )}

                  {q.state === "ai" && !q.retracted && (
                    <div className="mt-3 rounded-[20px] bg-mint/18 p-4">
                      <p className="mb-1.5 flex items-center gap-1.5 text-xs font-bold">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-ink text-[10px] text-white">✦</span>
                        AI 답변 · 나에게만 보여요
                      </p>
                      <p className="text-[15px] leading-relaxed">{q.answer}</p>
                      <SourceChips sources={q.sources ?? []} />
                      <div className="mt-3 flex items-center gap-1.5 border-t border-ink/10 pt-3">
                        <span className="flex-1 text-xs text-ink/55">{q.feedback ? "피드백 고마워요!" : "도움이 됐나요?"}</span>
                        {(["up", "down"] as const).map((f) => (
                          <button
                            key={f}
                            onClick={() => setMine((m) => m.map((x) => (x.id === q.id ? { ...x, feedback: x.feedback === f ? null : f } : x)))}
                            className={`flex h-9 items-center gap-1 rounded-full px-3 text-sm font-semibold transition-colors ${q.feedback === f ? "bg-ink text-white" : "bg-white/70 text-ink/60"}`}
                          >
                            <Icon name={f} size={15} />
                            {f === "up" ? "도움 됐어요" : "아쉬워요"}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {q.retracted && (
                    <div className="mt-3 rounded-[20px] bg-coral/15 p-4 text-sm">
                      <p className="font-bold">강연자가 이 AI 답변을 철회했어요</p>
                      <p className="mt-1 text-ink/60">답변이 정확하지 않을 수 있어요. 강연 중 직접 다뤄질 수 있어요.</p>
                    </div>
                  )}

                  {q.state === "forwarded" && (
                    <div className={`mt-3 flex items-center gap-3 rounded-[20px] p-3.5 text-sm ${pub?.status === "done" ? "bg-mint/18" : "bg-honey/30"}`}>
                      <Sticker size={26} rotate={-8}>
                        {pub?.status === "done" ? "🙌" : "📮"}
                      </Sticker>
                      <div className="flex-1">
                        <p className="font-bold">{pub?.status === "done" ? "강연자가 답변했어요" : "강연자에게 전달됐어요"}</p>
                        <p className="text-xs text-ink/55">공감 {pub?.likes ?? 0} · 공감이 많을수록 먼저 다뤄져요</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <button onClick={() => setEnded(true)} className="mb-6 mt-auto self-center text-xs text-muted underline underline-offset-4">
          데모: 강의 종료 상태 보기
        </button>
      </div>

      <Modal open={notiOpen} onClose={() => setNotiOpen(false)} title="알림">
        {notis.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">아직 알림이 없어요. 잠시 기다리면 데모 알림이 도착해요.</p>
        ) : (
          <ul className="space-y-2">
            {notis.map((n) => (
              <li key={n.id} className="flex items-center gap-3 rounded-2xl bg-white p-3.5 text-sm">
                <span className={`h-2 w-2 shrink-0 rounded-full ${n.tone === "mint" ? "bg-mint" : "bg-coral"}`} />
                {n.text}
              </li>
            ))}
          </ul>
        )}
      </Modal>
    </Screen>
  );
}

function BoardBubble({ q, i, total, onLike }: { q: PublicQuestion; i: number; total: number; onLike: () => void }) {
  const done = q.status === "done";
  return (
    <Bubble
      tone={toneCycle[i % toneCycle.length]}
      tail={i % 2 === 0 ? "left" : "right"}
      muted={done}
      className={`animate-rise ${i > 0 ? "-mt-1" : ""} mb-[18px]`}
      style={{ zIndex: total - i }}
    >
      <div className="flex items-center gap-3">
        <Avatar name={q.mine ? "나" : String.fromCharCode(0xac00 + ((q.id.charCodeAt(1) * 37) % 11172))} size={46} />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-[15px] font-bold">
            {q.mine ? "내 질문" : "익명의 청중"}
            <span className="text-xs font-normal text-ink/50">
              {q.at} · {q.page ? `${q.page}p` : "일반"}
            </span>
          </p>
          <p className="mt-0.5 text-sm leading-snug text-ink/80">{q.text}</p>
          {done && <p className="mt-1.5 text-xs font-semibold text-ink/50">✓ 강연자가 답변했어요</p>}
        </div>
        <button
          onClick={onLike}
          disabled={done}
          aria-label="공감"
          className={`flex shrink-0 flex-col items-center justify-center rounded-full transition-all ${
            q.liked ? "h-12 w-12 bg-ink text-white" : "h-12 w-12 bg-white/55 text-ink hover:bg-white/80"
          }`}
        >
          <Icon name="heart" size={15} />
          <span className="text-xs font-bold leading-none">{q.likes}</span>
        </button>
      </div>
    </Bubble>
  );
}
