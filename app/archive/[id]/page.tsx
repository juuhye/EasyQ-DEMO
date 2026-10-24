"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Avatar, Sticker } from "@/components/Brand";
import { Icon } from "@/components/Icon";
import { SummaryNote } from "@/components/SummaryNote";
import { SourceChips } from "@/components/SourceChips";
import { Button, Empty, Modal, RoundButton, Screen, Tabs, TopBar, useToast } from "@/components/ui";
import { archiveWith } from "@/lib/mock";
import { setDemo, useDemo } from "@/lib/store";

export default function ArchiveDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const { endedLectures, memos } = useDemo();
  const item = archiveWith(endedLectures).find((a) => a.id === id);
  const [tab, setTab] = useState<"note" | "mine" | "all">("note");
  const [questions, setQuestions] = useState(item?.myQuestions ?? []);
  const [summary, setSummary] = useState(item?.summary ?? "none");

  // 생성 중인 요약 노트는 완성되면 바로 보여준다
  useEffect(() => {
    if (summary !== "generating" || !item?.note) return;
    const t = setTimeout(() => setSummary("ready"), 3500);
    return () => clearTimeout(t);
  }, [summary, item?.note]);
  const [confirm, setConfirm] = useState<null | { kind: "one"; qid: string } | { kind: "all" }>(null);

  if (!item)
    return (
      <Screen>
        <TopBar back="/archive" />
        <Empty title="기록을 찾을 수 없어요" />
      </Screen>
    );

  
  function doDelete() {
    if (!confirm) return;
    if (confirm.kind === "one") {
      setQuestions((qs) => qs.filter((q) => q.id !== confirm.qid));
      toast.show("질문 기록을 지웠어요");
      setConfirm(null);
    } else {
      setDemo((s) => ({ deletedArchives: [...s.deletedArchives, id] }));
      router.push("/archive");
    }
  }

  return (
    <Screen>
      {toast.node}
      <TopBar back="/archive" right={<RoundButton icon="trash" label="강의 기록 삭제" onClick={() => setConfirm({ kind: "all" })} />} />
      <div className="px-5">
        <div className="flex items-start justify-between gap-3 pt-2">
          <h1 className="text-[32px] font-extrabold leading-[1.08] tracking-[-0.05em]">{item.title}</h1>
          <Sticker size={48} rotate={10} className="shrink-0">
            {item.emoji}
          </Sticker>
        </div>
        <p className="mt-3 flex items-center gap-2 text-sm text-muted">
          <Avatar name={item.speaker} size={24} />
          {item.speaker} · {item.date}
        </p>
      </div>

      <div className="flex-1 px-5 pb-10 pt-6">
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { value: "note", label: "요약 노트" },
            { value: "mine", label: "내 질문", count: questions.length },
            { value: "all", label: "전체 질문", count: item.questions.length },
          ]}
        />

        {tab === "note" && (
          <div className="animate-rise pt-4">
            {summary === "ready" && item.note ? (
              <SummaryNote note={item.note} tone={item.tone} />
            ) : summary === "generating" ? (
              <Empty emoji="✍️" title="요약 노트를 만드는 중이에요" desc="강연 발화와 교안을 읽고 있어요. 완성되면 여기에 바로 보여드릴게요." />
            ) : summary === "failed" ? (
              <Empty emoji="⚠️" title="요약 노트를 만들지 못했어요" desc="잠시 뒤 자동으로 다시 만들어요. 완성되면 여기에 보여드릴게요." />
            ) : (
              <Empty emoji="🫙" title="요약 노트가 만들어지지 않았어요" desc="강연 발화가 너무 짧으면 요약 노트를 만들지 않아요." />
            )}
          </div>
        )}

        {tab === "mine" && (
          <div className="animate-rise space-y-3 pt-4">
            {questions.length === 0 && <Empty title="남은 질문 기록이 없어요" />}
            {questions.map((q) => (
              <div key={q.id} className="rounded-[24px] bg-white p-4">
                <div className="flex items-start gap-2">
                  <p className="flex-1 font-bold leading-snug">{q.text}</p>
                  <button onClick={() => setConfirm({ kind: "one", qid: q.id })} className="-mr-1 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted hover:bg-ink/5" aria-label="질문 삭제">
                    <Icon name="trash" size={16} />
                  </button>
                </div>
                {q.kind === "ai" && q.retracted ? (
                  <div className="mt-3 rounded-[20px] bg-coral/15 p-4">
                    <p className="inline-flex items-center gap-1 rounded-full bg-white/70 px-3 py-1.5 text-xs font-semibold">↩︎ AI 답변 철회됨</p>
                    <p className="mt-2 text-sm leading-relaxed text-ink/60">강연자가 이 AI 답변을 철회했어요. 질문은 강연자에게 전달됐어요.</p>
                  </div>
                ) : q.kind === "ai" ? (
                  <div className="mt-3 rounded-[20px] bg-mint/18 p-4">
                    <p className="mb-1.5 flex items-center gap-1.5 text-xs font-bold">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-ink text-[10px] text-white">✦</span> AI 답변
                    </p>
                    <p className="text-sm leading-relaxed">{q.answer}</p>
                    <SourceChips sources={q.sources ?? []} />
                  </div>
                ) : (
                  <p className="mt-3 inline-flex items-center gap-1 rounded-full bg-honey/35 px-3 py-1.5 text-xs font-semibold">📮 강연자에게 전달 · {q.status === "done" ? "답변 완료" : "대기"}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === "all" && (
          <div className="animate-rise space-y-3 pt-4">
            {item.questions.length === 0 && <Empty title="강연자에게 전달된 질문이 없어요" />}
            {[...item.questions]
              .sort((a, b) => b.likes - a.likes)
              .map((q) => (
                <div key={q.id} className="flex items-center gap-3 rounded-[24px] bg-white p-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] leading-snug">{q.text}</p>
                    {(memos[q.id] ?? q.memo)?.trim() && (
                      <p className="mt-2 flex gap-1.5 rounded-2xl bg-paper px-3 py-2 text-sm text-ink/70">
                        <Icon name="pen" size={14} className="mt-0.5 shrink-0" />
                        {memos[q.id] ?? q.memo}
                      </p>
                    )}
                  </div>
                  <span
                    className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-sm font-semibold ${q.liked ? "bg-ink text-white" : "bg-sand text-ink/50"}`}
                    aria-label={q.liked ? `내가 공감함 · 공감 ${q.likes}` : `공감 ${q.likes}`}
                  >
                    <Icon name="heart" size={14} /> {q.likes}
                  </span>
                </div>
              ))}
          </div>
        )}
      </div>

      <Modal open={!!confirm} onClose={() => setConfirm(null)} title={confirm?.kind === "all" ? "이 강의 기록을 모두 지울까요?" : "이 질문 기록을 지울까요?"}>
        <p className="text-sm leading-relaxed text-muted">
          {confirm?.kind === "all" ? "요약 노트와 내 질문, 전체 질문 기록이 모두 지워지고 되돌릴 수 없어요." : "내 보관함에서만 지워져요. 되돌릴 수 없어요."}
        </p>
        <div className="mt-6 flex gap-2">
          <Button variant="ghost" className="flex-1" onClick={() => setConfirm(null)}>
            취소
          </Button>
          <Button variant="danger" className="flex-1" onClick={doDelete}>
            지우기
          </Button>
        </div>
      </Modal>
    </Screen>
  );
}
