"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Sticker } from "@/components/Brand";
import { Icon } from "@/components/Icon";
import { EndReasonPill, TeachingFiles } from "@/components/lecture";
import { SummaryNote } from "@/components/SummaryNote";
import { Button, Empty, Modal, Screen, StatusPill, Tabs, TopBar } from "@/components/ui";
import { archive, findLecture, reactStateNote, tcpNote, logStats, pageCounts, questionLogs, transformerNote } from "@/lib/mock";
import { setDemo, useDemo } from "@/lib/store";

export default function Report() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const lecture = findLecture(id);
  const { endedLectures, endReasons } = useDemo();
  // 이번 데모에서 방금 끝낸 강연이면 요약 노트를 만드는 중부터 보여준다
  const justEnded = endedLectures.includes(id);
  const [tab, setTab] = useState<"note" | "public" | "stats">("note");
  const [noteReady, setNoteReady] = useState(!justEnded);
  const [del, setDel] = useState(false);
  const log = questionLogs[id] ?? [];
  // 공개 질문: 강연자에게 전달됐거나 AI 답변이 철회돼 공개된 질문
  const publicLog = log.filter((q) => q.kind === "forwarded" || q.retracted).sort((a, b) => b.likes - a.likes);

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

  // 통계는 강연 종료 때 한 번 집계한 값(API-39). 질문 기록에서 계산해 탭끼리 숫자가 어긋나지 않게 한다
  const stats = logStats(log);
  const participants = lecture.participants ?? { members: lecture.audience, guests: 0 };
  const endReason = endReasons[lecture.id] ?? lecture.endReason ?? "manual";
  const histogram = pageCounts(log);
  const note = lecture.id === "l1" ? transformerNote : lecture.id === "l3" ? reactStateNote : lecture.id === "l6" ? tcpNote : archive[1].note!;
  const aiRate = stats.questions ? Math.round((stats.ai / stats.questions) * 100) : 0;
  const maxBar = Math.max(1, ...histogram.map((p) => p.count));

  return (
    <Screen>
      <TopBar
        back="/lectures"
        title="강연 리포트"
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
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Tile n={stats.questions} l="질문 수" c="#ffffff" e="💬" />
              <Tile n={`${aiRate}%`} l="AI 답변 비중" c="#3dbf6e" e="✨" />
              <Tile n={stats.ai} l="AI 답변 수" c="#ffffff" e="🤖" />
              <Tile n={stats.forwarded} l="이관 수" c="#f4625a" e="📮" />
              <Tile n={stats.done} l="답변 완료 수" c="#ffffff" e="🙌" />
              <Tile n={stats.retracted} l="철회 수" c="#ffffff" e="↩️" />
              <Tile n={stats.likes} l="공감 합계" c="#ffc830" e="💛" />
              <Tile n={`${participants.members} · ${participants.guests}`} l="회원 · 게스트 참가자" c="#ffffff" e="👥" />
            </div>
            <p className="mt-2 text-xs text-muted">강연이 끝날 때 한 번 집계한 값이라 이후에는 바뀌지 않아요. 이관 수에는 철회돼 강연자에게 전달된 질문도 들어가요.</p>

            <div className="mt-3 rounded-[24px] bg-white p-5">
              <p className="font-bold">교안 페이지별 질문</p>
              <p className="text-xs text-muted">교안 페이지가 없는 질문은 “일반 질문”으로 묶어요</p>
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

      <Modal open={del} onClose={() => setDel(false)} title="강연 데이터를 삭제할까요?">
        <div className="space-y-2 text-sm leading-relaxed">
          <div className="rounded-2xl bg-white p-3.5">
            <p className="font-bold">지워지는 것</p>
            <p className="mt-0.5 text-muted">질문 · 답변 원문, 발화 기록, 교안 · 색인(강연 원자료)</p>
          </div>
          <div className="rounded-2xl bg-white p-3.5">
            <p className="font-bold">남는 것</p>
            <p className="mt-0.5 text-muted">이 강연을 보관함에 둔 회원이 있으면 강연 기록(제목 · 일시 · 요약 노트 · 공개 질문)과 그 회원의 개인 기록</p>
          </div>
          <p className="text-xs text-muted">강연자 리포트에서는 바로 사라지고 되돌릴 수 없어요.</p>
        </div>
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
