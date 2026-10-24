"use client";

import Link from "next/link";
import { useState } from "react";
import { Avatar, Folder } from "@/components/Brand";
import { Icon } from "@/components/Icon";
import { Button, Empty, PageTitle, RoundButton, Screen, inputCls } from "@/components/ui";
import { archiveWith } from "@/lib/mock";
import { useDemo } from "@/lib/store";

const paperStickers: Record<string, string[]> = {
  r0: ["🤖", "🧠", "🔤"],
  r1: ["🖼️", "🎨", "🌫️"],
  r2: ["🧩", "📊", "🧮"],
  r3: ["🚀", "💡", "🗒️"],
  r4: ["🧭", "⚛️", "📁"],
};

export default function Archive() {
  const { deletedArchives, endedLectures } = useDemo();
  const [q, setQ] = useState("");
  const [searching, setSearching] = useState(false);
  const items = archiveWith(endedLectures).filter((a) => !deletedArchives.includes(a.id)).filter((a) => !q || a.title.includes(q) || a.speaker.includes(q));

  return (
    <Screen nav>
      <PageTitle meta={`${items.length}개 강의`} action={<RoundButton icon={searching ? "x" : "search"} label="검색" onClick={() => (setSearching((s) => !s), setQ(""))} />}>
        보관함
      </PageTitle>

      <div className="px-5">
        {searching && (
          <div className="relative mt-5 animate-rise">
            <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
            <input autoFocus className={`${inputCls} rounded-full pl-11`} placeholder="강의명, 강연자 검색" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        )}

        {items.length === 0 ? (
          <Empty title={q ? "검색 결과가 없어요" : "아직 참여한 강의가 없어요"} desc="QR을 찍고 강의에 참여하면 여기에 모여요.">
            <Button href="/join" icon="qr">
              강의 입장하기
            </Button>
          </Empty>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-7 md:grid-cols-3 md:gap-x-6">
            {items.map((a, i) => (
              <Link key={a.id} href={`/archive/${a.id}`} className="group block animate-rise" style={{ animationDelay: `${i * 60}ms` }}>
                <Folder
                  tone={a.tone}
                  title={a.title}
                  sub={`질문 ${a.myQuestions.length}개${a.summary === "ready" ? " · 요약 노트" : a.summary === "generating" ? " · 요약 노트 생성 중" : ""}`}
                  stickers={paperStickers[a.id] ?? [a.emoji]}
                  corner={<Avatar name={a.speaker} size={26} />}
                />
              </Link>
            ))}
          </div>
        )}
      </div>
    </Screen>
  );
}
