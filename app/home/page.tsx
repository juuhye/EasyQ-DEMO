"use client";

import Link from "next/link";
import { Avatar, Sticker } from "@/components/Brand";
import { Icon } from "@/components/Icon";
import { RoundButton, Screen } from "@/components/ui";
import { archive, lectures, tones } from "@/lib/mock";
import { useDemo } from "@/lib/store";

export default function Home() {
  const { name, deletedArchives } = useDemo();
  const live = lectures.find((l) => l.status === "live")!;
  const ready = lectures.find((l) => l.status === "ready")!;
  const recent = archive.filter((a) => !deletedArchives.includes(a.id)).slice(0, 3);
  const notes = archive.filter((a) => a.summary === "ready").length;

  return (
    <Screen nav dark width="wide">
      <div className="flex flex-1 flex-col lg:grid lg:grid-cols-[1fr_1.05fr] lg:items-start lg:gap-10 lg:px-6 lg:py-10">
        {/* 시안의 Today 화면 */}
        <section className="px-6 pb-10 pt-9 md:px-8 lg:sticky lg:top-0 lg:px-2 lg:pt-4">
          <div className="flex items-start justify-between">
            <h1 className="text-[44px] font-extrabold leading-none tracking-[-0.05em] md:text-[56px]">오늘</h1>
            <p className="pt-1 text-right text-[15px] leading-tight">
              <span className="mr-1.5 inline-block h-1.5 w-1.5 -translate-y-0.5 rounded-full bg-coral" />
              10월 15일
              <br />
              <span className="text-white/45">목요일</span>
            </p>
          </div>

          <p className="mt-12 text-[25px] font-semibold leading-[1.45] md:text-[30px] tracking-[-0.035em] text-white/40">
            {name}님, 오늘은{" "}
            <Link href={`/lectures/${live.id}/live`} className="text-white underline decoration-white/25 underline-offset-[6px] hover:decoration-white">
              트랜스포머 강의
            </Link>{" "}
            <Sticker size={28} rotate={-8}>
              🤖
            </Sticker>{" "}
            를 진행하고,{" "}
            <Sticker size={28} rotate={8}>
              📄
            </Sticker>{" "}
            <Link href={`/lectures/${ready.id}`} className="text-white underline decoration-white/25 underline-offset-[6px] hover:decoration-white">
              DB 특강 교안
            </Link>
            을 다시 올리고,{" "}
            <Link href="/archive" className="text-white underline decoration-white/25 underline-offset-[6px] hover:decoration-white">
              요약 노트 {notes}개
            </Link>{" "}
            <Sticker size={28} rotate={-6}>
              📝
            </Sticker>{" "}
            를 확인할 차례예요.
          </p>

          <div className="mt-6 flex items-center gap-2 text-xs text-white/45">
            내 강의 · 보관함 기준
            <span className="flex -space-x-2">
              {["김", "박", "이"].map((n) => (
                <Avatar key={n} name={n} size={22} className="!ring-ink" />
              ))}
            </span>
          </div>
        </section>

        {/* 아래 흰 시트 */}
        <section className="flex-1 rounded-t-[34px] bg-paper px-5 pb-6 pt-6 text-ink md:px-8 md:pt-8 lg:flex-none lg:rounded-[34px] lg:px-7 lg:pb-7">
          <Link href="/join" className="flex items-center gap-4 rounded-[24px] bg-coral p-5 transition-transform hover:-translate-y-0.5">
            <div className="flex-1">
              <p className="text-[21px] font-extrabold leading-tight tracking-[-0.04em]">QR 찍고 질문하러 가기</p>
              <p className="mt-1 text-sm text-ink/60">입장 코드 5자리로도 들어갈 수 있어요</p>
            </div>
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-ink text-white">
              <Icon name="qr" />
            </span>
          </Link>

          <div className="mb-1 mt-7 flex items-center justify-between">
            <h2 className="text-[17px] font-bold">보관함에서:</h2>
            <Link href="/archive" className="flex items-center gap-1.5 text-sm">
              {recent.length}개 강의 <Icon name="right" size={15} />
            </Link>
          </div>
          <ul className="divide-y divide-line">
            {recent.map((a) => {
              const q = a.myQuestions[0];
              return (
                <li key={a.id}>
                  <Link href={`/archive/${a.id}`} className="flex items-center gap-3 py-4">
                    <Avatar name={a.speaker} size={46} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-bold">{a.speaker} 강의:</p>
                      <p className="line-clamp-2 text-sm leading-snug text-muted">
                        … {a.title.split("·")[1]?.trim() ?? a.title}
                        {q && (
                          <>
                            {" "}
                            에서 <span className="text-ink">‘{q.text}’</span> 질문을 남겼어요
                          </>
                        )}
                      </p>
                    </div>
                    <Sticker size={34} rotate={8}>
                      {a.emoji}
                    </Sticker>
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="mb-3 mt-6 flex items-center justify-between">
            <h2 className="text-[17px] font-bold">내 강의:</h2>
            <RoundButton href="/lectures/new" icon="plus" label="새 강의" />
          </div>
          <div className="space-y-2">
            {lectures
              .filter((l) => l.status !== "ended")
              .map((l) => (
                <Link
                  key={l.id}
                  href={l.status === "live" ? `/lectures/${l.id}/live` : `/lectures/${l.id}`}
                  className="flex items-center gap-3 rounded-[22px] p-4"
                  style={{ backgroundColor: tones[l.tone].hex }}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{l.title}</p>
                    <p className="text-xs text-ink/60">
                      {l.date} {l.time}
                    </p>
                  </div>
                  <span className="rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-white">{l.status === "live" ? "대시보드" : "준비하기"}</span>
                </Link>
              ))}
          </div>
        </section>
      </div>
    </Screen>
  );
}
