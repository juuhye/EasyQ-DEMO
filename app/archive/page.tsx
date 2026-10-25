"use client";

import Link from "next/link";
import { useState } from "react";
import { Folder } from "@/components/Brand";
import { Icon } from "@/components/Icon";
import { Button, Empty, Modal, PageTitle, RoundButton, Screen, inputCls, useToast } from "@/components/ui";
import { archiveWith, type ArchiveItem } from "@/lib/mock";
import { setDemo, useDemo } from "@/lib/store";

const paperStickers: Record<string, string[]> = {
  r0: ["🤖", "🧠", "🔤"],
  r1: ["🖼️", "🎨", "🌫️"],
  r2: ["🧩", "📊", "🧮"],
  r3: ["🚀", "💡", "🗒️"],
  r4: ["🧭", "⚛️", "📁"],
  r5: ["🗃️", "🔑", "🧮"],
  r7: ["⚛️", "🔁", "🧠"],
};

const noteText = { ready: "요약 노트 있음", generating: "요약 노트 만드는 중", failed: "요약 노트 없음", none: "요약 노트 없음" };

export default function Archive() {
  const { deletedArchives, endedLectures } = useDemo();
  const [q, setQ] = useState("");
  const [searching, setSearching] = useState(false);
  const [removing, setRemoving] = useState<ArchiveItem | null>(null);
  const toast = useToast();
  const items = archiveWith(endedLectures).filter((a) => !deletedArchives.includes(a.id)).filter((a) => !q || a.title.includes(q) || a.speaker.includes(q));

  return (
    <Screen nav>
      {toast.node}
      <PageTitle meta={`${items.length}개 강연`} action={<RoundButton icon={searching ? "x" : "search"} label="검색" onClick={() => (setSearching((s) => !s), setQ(""))} />}>
        보관함
      </PageTitle>

      <div className="px-5">
        {searching && (
          <div className="relative mt-5 animate-rise">
            <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
            <input autoFocus className={`${inputCls} rounded-full pl-11`} placeholder="강연명, 강연자 검색" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        )}

        {items.length === 0 ? (
          <Empty title={q ? "검색 결과가 없어요" : "아직 참여한 강연이 없어요"} desc="QR을 찍고 강연에 참여하면 여기에 모여요.">
            <Button href="/join" icon="qr">
              강연 입장하기
            </Button>
          </Empty>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-7 md:grid-cols-3 md:gap-x-6">
            {items.map((a, i) => (
              <div key={a.id} className="relative animate-rise" style={{ animationDelay: `${i * 60}ms` }}>
                <Link href={`/archive/${a.id}`} className="group block">
                  <Folder
                    tone={a.tone}
                    title={a.title}
                    sub={
                      <>
                        <p className="truncate">
                          {a.speaker} · {a.date}
                        </p>
                        <p className="truncate">
                          내 질문 {a.myQuestions.length} · {noteText[a.summary]}
                        </p>
                      </>
                    }
                    stickers={paperStickers[a.id] ?? [a.emoji]}
                  />
                </Link>
                <button
                  onClick={() => setRemoving(a)}
                  className="absolute bottom-2.5 right-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/60 text-ink/70 hover:bg-white"
                  aria-label={`${a.title} 강연 삭제`}
                >
                  <Icon name="trash" size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={!!removing} onClose={() => setRemoving(null)} title="이 강연 기록을 지울까요?">
        <p className="rounded-2xl bg-white p-3.5 font-bold">{removing?.title}</p>
        <p className="mt-3 text-sm leading-relaxed text-muted">요약 노트와 내 질문 · 필기가 내 보관함에서 지워지고 되돌릴 수 없어요.</p>
        <div className="mt-6 flex gap-2">
          <Button variant="soft" className="flex-1" onClick={() => setRemoving(null)}>
            취소
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            onClick={() => {
              const id = removing?.id;
              if (id) setDemo((s) => ({ deletedArchives: [...s.deletedArchives, id] }));
              setRemoving(null);
              toast.show("강연 기록을 지웠어요");
            }}
          >
            지우기
          </Button>
        </div>
      </Modal>
    </Screen>
  );
}
