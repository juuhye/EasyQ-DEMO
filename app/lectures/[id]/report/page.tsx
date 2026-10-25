"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Sticker } from "@/components/Brand";
import { Icon } from "@/components/Icon";
import { EndReasonPill, TeachingFiles } from "@/components/lecture";
import { SummaryNote } from "@/components/SummaryNote";
import { Button, Empty, Modal, RoundButton, Screen, StatusPill, Tabs, TopBar, useToast } from "@/components/ui";
import { archive, findLecture, reactStateNote, tcpNote, logStats, pageHistogram, questionLogs, transformerNote } from "@/lib/mock";
import { setDemo, useDemo } from "@/lib/store";

export default function Report() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const lecture = findLecture(id);
  const { deletedQuestions, endedLectures, endReasons } = useDemo();
  // 이번 데모에서 방금 끝낸 강연이면 요약 노트를 만드는 중부터 보여준다
  const justEnded = endedLectures.includes(id);
  const [tab, setTab] = useState<"note" | "public" | "stats">("note");
  const [noteReady, setNoteReady] = useState(!justEnded);
  const [del, setDel] = useState(false);
  const [delQ, setDelQ] = useState<string | null>(null);
  const toast = useToast();
  const log = (questionLogs[id] ?? []).filter((q) => !deletedQuestions.includes(q.text));
  // 공개 질문: 강연자에게 전달됐거나 AI 답변이 철회돼 공개된 질문
  const publicLog = log.filter((q) => q.kind === "forwarded" || q.retracted).sort((a, b) => b.likes - a.likes);
  const topLiked = [...log].filter((q) => q.likes > 0).sort((a, b) => b.likes - a.likes).slice(0, 3);

  useEffect(() => {
    if (noteReady) return;
    const t = setTimeout(() => setNoteReady(true), 3500);
    return () => clearTimeout(t);
  }, [noteReady]);

  if (!lecture)
    return (
      <Screen>
        <TopBar back="/lectures" />
        <Empty title="강연을 찾을 수 없어요" />
      </Screen>
    );

  // 통계는 질문 기록에서 바로 계산해 탭끼리 숫자가 어긋나지 않게 한다
  const stats = logStats(log);
  const endReason = endReasons[lecture.id] ?? lecture.endReason ?? "manual";
  const histogram = pageHistogram(log, lecture.file?.pages ?? 30);
  const note = lecture.id === "l1" ? transformerNote : lecture.id === "l3" ? reactStateNote : lecture.id === "l6" ? tcpNote : archive[1].note!;
  const aiRate = stats.questions ? Math.round((stats.ai / stats.questions) * 100) : 0;
  const maxBar = Math.max(1, ...histogram.map((p) => p.count));

  return (
    <Screen>
      {toast.node}
      <TopBar
        back="/lectures"
        title="강연 리포트"
        right={
          <RoundButton icon="trash" label="강연 데이터 삭제" onClick={() => setDel(true)} />
        }
      />

      <div className="px-5 pb-10">
        <div className="flex items-start justify-between gap-3 pt-2">
          <h1 className="text-[32px] font-extrabold leading-[1.08] tracking-[-0.05em]">{lecture.title}</h1>
          <Sticker size={48} rotate={10} className="shrink-0">
            {lecture.emoji}
          </Sticker>
        </div>
        <p className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted">
          <StatusPill status="ended" />
          <EndReasonPill reason={endReason} />
          {lecture.date} · 청중 {lecture.audience}명
        </p>

        {justEnded && (
          <div className="mt-5 flex animate-pop items-center gap-3 rounded-[24px] bg-ink p-4 text-white">
            <Sticker size={34} rotate={-10}>
              🎉
            </Sticker>
            <div className="text-sm">
              <p className="text-base font-bold">{endReason === "admin" ? "관리자가 강연을 종료했어요" : "강연 수고하셨어요!"}</p>
              <p className="text-white/55">질문이 마감되고 QR이 꺼졌어요.</p>
            </div>
          </div>
        )}

        <Tabs
          className="mt-5"
          value={tab}
          onChange={setTab}
          tabs={[
            { value: "note", label: "요약 노트" },
            { value: "public", label: "공개 질문", count: publicLog.length },
            { value: "stats", label: "통계" },
          ]}
        />

        {tab === "stats" && (
          <div className="animate-rise pt-4">
            <div className="grid grid-cols-2 gap-3">
              <Tile n={stats.questions} l="전체 질문" c="#ffffff" e="💬" />
              <Tile n={`${aiRate}%`} l="AI 처리율" c="#3dbf6e" e="✨" />
              <Tile n={stats.forwarded} l="강연자에게 온 질문" c="#f4625a" e="🙋" />
              <Tile n={stats.likes} l="받은 공감" c="#ffc830" e="💛" />
            </div>

            <div className="mt-3 rounded-[24px] bg-white p-5">
              <p className="font-bold">AI vs 강연자</p>
              <div className="mt-3 flex h-3 gap-1 overflow-hidden">
                <div className="rounded-full bg-mint" style={{ width: `${aiRate}%` }} />
                <div className="flex-1 rounded-full bg-coral" />
              </div>
              <div className="mt-2 flex justify-between text-xs text-muted">
                <span>
                  <b className="text-mint">●</b> AI 답변 {stats.ai}개
                </span>
                <span>
                  <b className="text-coral">●</b> 강연자 {stats.forwarded}개{stats.retracted > 0 && ` (철회 ${stats.retracted} 포함)`}
                </span>
              </div>
            </div>

            <div className="mt-3 rounded-[24px] bg-white p-5">
              <p className="font-bold">교안 페이지별 질문</p>
              <p className="text-xs text-muted">어느 부분에서 질문이 몰렸는지 보여줘요</p>
              <div className="mt-4 flex h-36 items-end gap-2">
                {histogram.map((p) => (
                  <div key={p.page} className="flex h-full flex-1 flex-col items-center gap-1">
                    <div className="flex w-full flex-1 flex-col items-center justify-end gap-1">
                      <span className="text-xs font-bold">{p.count}</span>
                      <div className={`w-full rounded-t-xl ${p.count === maxBar ? "bg-ink" : "bg-sand"}`} style={{ height: `${(p.count / maxBar) * 80}%` }} />
                    </div>
                    <span className="text-[10px] text-muted">{p.page}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-3 rounded-[24px] bg-white p-5">
              <p className="font-bold">공감 상위 질문</p>
              <p className="text-xs text-muted">청중이 가장 많이 공감한 질문이에요</p>
              <ol className="mt-3 space-y-2">
                {topLiked.map((q, i) => (
                  <li key={q.text} className="flex items-center gap-3 rounded-2xl bg-paper p-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-bold text-white">{i + 1}</span>
                    <span className="min-w-0 flex-1 text-sm leading-snug">
                      {q.text}
                      <span className="mt-0.5 block text-xs text-muted">{q.page ? `교안 p.${q.page}` : "일반 질문"}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-1 text-sm font-semibold">
                      <Icon name="heart" size={14} /> {q.likes}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}

        {tab === "note" && (
          <div className="animate-rise pt-4">
            {noteReady ? (
              <SummaryNote note={note} tone={lecture.tone} />
            ) : (
              <div className="flex flex-col items-center rounded-[24px] bg-white px-6 py-10 text-center">
                <Sticker size={56} rotate={-8} float>
                  ✍️
                </Sticker>
                <p className="mt-5 text-lg font-bold">요약 노트를 만드는 중이에요</p>
                <p className="mt-1 text-sm text-muted">강연 발화와 교안을 읽고 있어요. 완성되면 청중 보관함에도 보내드려요.</p>
                <div className="mt-4 flex gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="h-2.5 w-2.5 animate-bounce rounded-full bg-ink" style={{ animationDelay: `${i * 150}ms` }} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "public" && (
          <div className="animate-rise space-y-2.5 pt-4">
            <p className="text-sm text-muted">강연자에게 전달된 질문이에요. 작성자는 보여주지 않아요.</p>
            {publicLog.length === 0 && <Empty title="남은 공개 질문이 없어요" />}
            {publicLog.map((q) => (
              <div key={q.text} className="flex items-center gap-3 rounded-[24px] bg-white p-4">
                <span className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-full bg-sand text-xs font-bold">
                  <Icon name="heart" size={13} />
                  {q.likes}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] leading-snug">{q.text}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted">
                    {q.page ? `교안 p.${q.page}` : "일반 질문"}
                    {q.done && <span className="rounded-full bg-mint/25 px-2 py-0.5 font-semibold text-ink">✓ 답변 완료</span>}
                    {q.retracted && <span className="rounded-full bg-coral/20 px-2 py-0.5 font-semibold text-ink">AI 답변 철회됨</span>}
                  </p>
                </div>
                <button onClick={() => setDelQ(q.text)} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted hover:bg-ink/5" aria-label="질문 기록 삭제">
                  <Icon name="trash" size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 교안: 종료 후에는 삭제만 할 수 있다 */}
        <h2 className="mb-3 mt-8 text-[19px] font-bold tracking-[-0.03em]">교안</h2>
        <TeachingFiles initial={lecture.file ? [{ id: "f0", name: lecture.file.name, pages: lecture.file.pages, state: lecture.file.state }] : []} canUpload={false} canDelete />

        <button onClick={() => setDel(true)} className="mt-8 flex w-full items-center justify-center gap-1.5 text-sm text-muted underline underline-offset-4">
          <Icon name="trash" size={15} /> 이 강연의 데이터 삭제
        </button>
      </div>

      <Modal open={!!delQ} onClose={() => setDelQ(null)} title="이 질문 기록을 지울까요?">
        <p className="rounded-2xl bg-white p-3.5 font-bold">{delQ}</p>
        <p className="mt-3 text-sm leading-relaxed text-muted">질문과 답변이 이 강연 기록에서 바로 지워지고 되돌릴 수 없어요. 청중 보관함에 저장된 개인 기록은 남아요.</p>
        <div className="mt-6 flex gap-2">
          <Button variant="soft" className="flex-1" onClick={() => setDelQ(null)}>
            취소
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            onClick={() => {
              const text = delQ;
              if (text) setDemo((s) => ({ deletedQuestions: [...s.deletedQuestions, text] }));
              setDelQ(null);
              toast.show("질문 기록을 지웠어요");
            }}
          >
            지우기
          </Button>
        </div>
      </Modal>

      <Modal open={del} onClose={() => setDel(false)} title="강연 데이터를 삭제할까요?">
        <p className="text-sm leading-relaxed text-muted">질문, AI 답변, 발화 기록, 교안 인덱스가 바로 지워지고 되돌릴 수 없어요. 청중 보관함에 이미 저장된 개인 기록은 남아요.</p>
        <div className="mt-6 flex gap-2">
          <Button variant="soft" className="flex-1" onClick={() => setDel(false)}>
            취소
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            onClick={() => {
              setDemo((s) => ({ deletedLectures: [...s.deletedLectures, lecture.id] }));
              router.push("/lectures");
            }}
          >
            삭제하기
          </Button>
        </div>
      </Modal>
    </Screen>
  );
}

function Tile({ n, l, c, e }: { n: React.ReactNode; l: string; c: string; e: string }) {
  return (
    <div className="relative rounded-[24px] p-4 pb-5" style={{ backgroundColor: c }}>
      <p className="text-[34px] font-extrabold leading-none tracking-[-0.04em]">{n}</p>
      <p className="mt-2 text-sm font-medium text-ink/60">{l}</p>
      <Sticker size={30} rotate={12} className="absolute right-3 top-3">
        {e}
      </Sticker>
    </div>
  );
}
