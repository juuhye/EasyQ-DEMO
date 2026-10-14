"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Sticker } from "@/components/Brand";
import { Icon } from "@/components/Icon";
import { SummaryNote } from "@/components/SummaryNote";
import { Button, Empty, Modal, RoundButton, Screen, StatusPill, Tabs, TopBar } from "@/components/ui";
import { archive, findLecture, pageHistogram, pastQuestionLog } from "@/lib/mock";
import { setDemo } from "@/lib/store";

const transformerNote = {
  headline: "단어끼리 서로를 바라보는 셀프 어텐션으로 RNN 없이 문맥을 읽는 트랜스포머",
  sections: [
    { title: "핵심 개념", points: ["Q · K 내적으로 관련도를 구하고 softmax 가중치로 V를 섞는다 (교안 12p)", "√dₖ로 나눠 softmax 쏠림과 기울기 소실을 막는다", "멀티헤드로 여러 관계를 동시에 본다 (h = 8)"] },
    { title: "구조", points: ["인코더 · 디코더 각각 6층, 층마다 Add & Norm", "디코더는 미래 토큰을 가리는 masked self-attention을 쓴다", "cross-attention: Query는 디코더, Key · Value는 인코더 출력"] },
    { title: "청중이 많이 물은 것", points: ["포지셔널 인코딩: 고정(sin/cos) vs 학습형", "학습 시 병렬화가 가능한 이유 (teacher forcing)"] },
  ],
  keywords: ["Self-Attention", "Multi-Head", "Positional Encoding", "Masking", "Cross-Attention"],
};

export default function Report() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const lecture = findLecture(id);
  const justEnded = lecture?.status === "live";
  const [tab, setTab] = useState<"stats" | "note" | "log">(justEnded ? "note" : "stats");
  const [noteReady, setNoteReady] = useState(!justEnded);
  const [del, setDel] = useState(false);

  useEffect(() => {
    if (noteReady) return;
    const t = setTimeout(() => setNoteReady(true), 3500);
    return () => clearTimeout(t);
  }, [noteReady]);

  if (!lecture)
    return (
      <Screen>
        <TopBar back="/lectures" />
        <Empty title="강의를 찾을 수 없어요" />
      </Screen>
    );

  const stats = lecture.stats ?? { questions: 19, ai: 9, forwarded: 10, likes: 142, retracted: 1 };
  const note = lecture.id === "l1" ? transformerNote : lecture.id === "l3" ? { ...archive[3].note!, headline: "React 상태를 어디에 둘지 고르는 기준: 지역 상태, 리듀서, Context" } : archive[1].note!;
  const aiRate = Math.round((stats.ai / stats.questions) * 100);
  const maxBar = Math.max(...pageHistogram.map((p) => p.count));

  return (
    <Screen>
      <TopBar
        back="/lectures"
        title="강의 리포트"
        right={
          <RoundButton icon="trash" label="세션 데이터 삭제" onClick={() => setDel(true)} />
        }
      />

      <div className="px-5 pb-10">
        <div className="flex items-start justify-between gap-3 pt-2">
          <h1 className="text-[32px] font-extrabold leading-[1.08] tracking-[-0.05em]">{lecture.title}</h1>
          <Sticker size={48} rotate={10} className="shrink-0">
            {lecture.emoji}
          </Sticker>
        </div>
        <p className="mt-3 flex items-center gap-2 text-sm text-muted">
          <StatusPill status="ended" />
          {lecture.date} · 청중 {lecture.audience}명
        </p>

        {justEnded && (
          <div className="mt-5 flex animate-pop items-center gap-3 rounded-[24px] bg-ink p-4 text-white">
            <Sticker size={34} rotate={-10}>
              🎉
            </Sticker>
            <div className="text-sm">
              <p className="text-base font-bold">강의 수고하셨어요!</p>
              <p className="text-white/55">질문이 마감되고 QR이 꺼졌어요.</p>
            </div>
          </div>
        )}

        <Tabs
          className="mt-5"
          value={tab}
          onChange={setTab}
          tabs={[
            { value: "stats", label: "통계" },
            { value: "note", label: "요약 노트" },
            { value: "log", label: "질문 기록" },
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
                  <b className="text-mint">●</b> AI 답변 {stats.ai}개 (철회 {stats.retracted})
                </span>
                <span>
                  <b className="text-coral">●</b> 강연자 {stats.forwarded}개
                </span>
              </div>
            </div>

            <div className="mt-3 rounded-[24px] bg-white p-5">
              <p className="font-bold">교안 페이지별 질문</p>
              <p className="text-xs text-muted">어느 부분에서 질문이 몰렸는지 보여줘요</p>
              <div className="mt-4 flex h-36 items-end gap-2">
                {pageHistogram.map((p) => (
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

        {tab === "log" && (
          <div className="animate-rise space-y-2.5 pt-4">
            {pastQuestionLog.map((q) => (
              <div key={q.text} className="flex items-center gap-3 rounded-[24px] bg-white p-4">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${q.kind === "ai" ? "bg-mint" : "bg-coral"}`}>
                  <Icon name={q.kind === "ai" ? "spark" : "chat"} size={17} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] leading-snug">{q.text}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    교안 {q.page}p · {q.kind === "ai" ? "AI 답변" : `강연자 답변 · 공감 ${q.likes}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        <button onClick={() => setDel(true)} className="mt-8 flex w-full items-center justify-center gap-1.5 text-sm text-muted underline underline-offset-4">
          <Icon name="trash" size={15} /> 이 강의의 세션 데이터 삭제
        </button>
      </div>

      <Modal open={del} onClose={() => setDel(false)} title="세션 데이터를 삭제할까요?">
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
