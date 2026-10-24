"use client";

import Link from "next/link";
import { useState } from "react";
import { Bubble, Sticker } from "@/components/Brand";
import { Icon } from "@/components/Icon";
import { Empty, PageTitle, RoundButton, Screen, StatusPill, Tabs } from "@/components/ui";
import { lectures, logStats, questionLogs, type LectureStatus } from "@/lib/mock";
import { useDemo } from "@/lib/store";

export default function Lectures() {
  const { created, deletedLectures, endedLectures } = useDemo();
  const [tab, setTab] = useState<LectureStatus>("live");

  const all = [
    ...(created ? [{ ...lectures[1], id: created.id, title: created.title, date: created.date, time: created.time, status: "ready" as const, tone: "berry" as const, emoji: "✨", file: null }] : []),
    ...lectures,
  ]
    .filter((l) => !deletedLectures.includes(l.id))
    .map((l) => (endedLectures.includes(l.id) ? { ...l, status: "ended" as const } : l));
  const list = all.filter((l) => l.status === tab);

  return (
    <Screen nav>
      <PageTitle meta={`${all.length}개 강의`} action={<RoundButton href="/lectures/new" icon="plus" label="새 강의" />}>
        내 강의
      </PageTitle>

      <div className="px-5">
        <Tabs
          className="mt-6"
          value={tab}
          onChange={setTab}
          tabs={[
            { value: "live", label: "진행 중", count: all.filter((l) => l.status === "live").length },
            { value: "ready", label: "예정", count: all.filter((l) => l.status === "ready").length },
            { value: "ended", label: "지난 강의", count: all.filter((l) => l.status === "ended").length },
          ]}
        />

        {list.length === 0 ? (
          <Empty title="해당하는 강의가 없어요" />
        ) : (
          <div className="mt-5">
            {list.map((l, i) => {
              const href = l.status === "live" ? `/lectures/${l.id}/live` : l.status === "ended" ? `/lectures/${l.id}/report` : `/lectures/${l.id}`;
              return (
                <Link key={l.id} href={href} className="block animate-rise transition-transform hover:-translate-y-0.5">
                  <Bubble tone={l.tone} tail={i % 2 ? "right" : "left"} className={`mb-[22px] ${i ? "-mt-1" : ""}`} style={{ zIndex: list.length - i }}>
                    <div className="flex items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <StatusPill status={l.status} onColor />
                        <p className="mt-2.5 text-[21px] font-extrabold leading-tight tracking-[-0.04em]">{l.title}</p>
                        <p className="mt-1 text-sm text-ink/60">
                          {l.date} {l.time}
                        </p>
                      </div>
                      <Sticker size={42} rotate={i % 2 ? -10 : 10}>
                        {l.emoji}
                      </Sticker>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-sm">
                      <span className="text-ink/65">
                        {l.status === "ended" && `질문 ${logStats(questionLogs[l.id] ?? []).questions} · 청중 ${l.audience}`}
                        {l.status === "live" && `청중 ${l.audience}명 참여 중`}
                        {l.status === "ready" && (l.file?.state === "done" ? "교안 준비 완료" : l.file ? "교안 처리 확인 필요" : "교안 업로드 전")}
                      </span>
                      <span className="flex items-center gap-1 rounded-full bg-ink px-3.5 py-2 text-xs font-semibold text-white">
                        {l.status === "live" ? "대시보드" : l.status === "ended" ? "리포트" : "준비하기"}
                        <Icon name="right" size={14} />
                      </span>
                    </div>
                  </Bubble>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </Screen>
  );
}
