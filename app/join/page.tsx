"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Bubble, Sticker } from "@/components/Brand";
import { Icon } from "@/components/Icon";
import { Button, PageTitle, Screen, StatusPill, TopBar, inputCls } from "@/components/ui";
import { lectures, resolveCode, statusOf, type Lecture } from "@/lib/mock";
import { setDemo, useDemo } from "@/lib/store";

// 회원은 가입 때 계정 단위로 동의했으니 바로 입장하고, 게스트만 입장할 때마다 동의를 받는다
type Step = "code" | "who" | "consent";

export default function Join() {
  const router = useRouter();
  const { name, codes, endedLectures } = useDemo();
  const [step, setStep] = useState<Step>("code");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [lecture, setLecture] = useState<Lecture | null>(null);
  const [agree, setAgree] = useState({ keep: false, learn: false });
  const [nick, setNick] = useState("");
  const [scanning, setScanning] = useState(false);

  function check(c: string) {
    const { lecture: l, expired } = resolveCode(c, codes);
    if (!l) return setError("입장 코드를 찾을 수 없어요. 다시 확인해 주세요.");
    if (expired) return setError("재발급돼서 더 이상 쓸 수 없는 코드예요. 강연자 화면의 새 코드를 입력해 주세요.");
    const status = statusOf(l, endedLectures);
    if (status === "ended") return setError("이미 끝난 강의예요. 보관함에서 기록을 볼 수 있어요.");
    if (status === "ready") return setError("아직 시작 전인 강의예요. 강연자가 시작하면 들어올 수 있어요.");
    setLecture(l);
    setStep("who");
  }

  function scan() {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      const live = codes[lectures[0].id] ?? lectures[0].code;
      setCode(live);
      check(live);
    }, 1400);
  }

  function enter(asGuest: boolean) {
    if (!lecture) return;
    setDemo({ guestName: asGuest ? nick.trim() || "익명의 청중" : null });
    router.push(`/s/${codes[lecture.id] ?? lecture.code}`);
  }

  return (
    <Screen nav={step === "code"}>
      {step === "code" ? (
        <PageTitle meta={<span className="text-muted">QR · 코드</span>}>입장</PageTitle>
      ) : (
        <TopBar back={undefined} title={step === "consent" ? "입장 전 확인" : "어떻게 들어갈까요?"} right={<button onClick={() => setStep(step === "consent" ? "who" : "code")} className="rounded-full bg-sand px-4 py-2 text-sm font-semibold">이전</button>} />
      )}

      {step === "code" && (
        <div className="flex flex-1 flex-col px-5 pt-6">
          <button onClick={scan} className="relative flex aspect-[1/0.9] w-full md:aspect-[16/8] items-center justify-center overflow-hidden rounded-[30px] bg-ink">
            {["left-6 top-6 border-l-[3px] border-t-[3px] rounded-tl-2xl", "right-6 top-6 border-r-[3px] border-t-[3px] rounded-tr-2xl", "bottom-6 left-6 border-b-[3px] border-l-[3px] rounded-bl-2xl", "bottom-6 right-6 border-b-[3px] border-r-[3px] rounded-br-2xl"].map((c) => (
              <span key={c} className={`absolute h-10 w-10 border-white/80 ${c}`} />
            ))}
            {scanning ? (
              <>
                <span className="absolute inset-x-10 top-1/2 h-0.5 animate-pulse rounded-full bg-coral shadow-[0_0_24px_#f4625a]" />
                <p className="font-semibold text-white">QR 읽는 중…</p>
              </>
            ) : (
              <div className="flex flex-col items-center text-white">
                <Sticker size={56} rotate={-8} float>
                  📷
                </Sticker>
                <p className="mt-4 text-lg font-bold">눌러서 QR 스캔하기</p>
              </div>
            )}
          </button>

          <form
            className="mt-6"
            onSubmit={(e) => {
              e.preventDefault();
              check(code);
            }}
          >
            <p className="mb-2 text-sm font-semibold text-ink/70">또는 입장 코드</p>
            <div className="flex gap-2">
              <input
                className={`${inputCls} min-w-0 flex-1 text-center text-2xl font-extrabold uppercase tracking-[0.4em]`}
                maxLength={5}
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  setError("");
                }}
                placeholder="QX7K2"
              />
              <Button size="lg" className="shrink-0" disabled={code.length < 5} type="submit">
                입장
              </Button>
            </div>
            {error && (
              <p className="mt-2 flex items-center gap-1 text-sm text-[#e5484d]">
                <Icon name="alert" size={15} /> {error}
              </p>
            )}
          </form>
          <p className="mt-4 text-xs leading-relaxed text-muted">예시 코드 · QX7K2 진행 중 · DB4M8 시작 전 · WB6R3 종료</p>
        </div>
      )}

      {step === "consent" && lecture && (
        <div className="flex flex-1 flex-col px-5 pb-8">
          <LectureCard lecture={lecture} />

          <p className="mt-10 text-[19px] font-bold tracking-[-0.03em]">게스트로 들어가기 전에 확인해 주세요</p>
          <div className="mt-3 space-y-2">
            <Consent
              on={agree.keep}
              onClick={() => setAgree((a) => ({ ...a, keep: !a.keep }))}
              title="질문 · 답변 기록 보관"
              required
              desc="질문과 답변은 강의가 끝난 뒤 정해진 기간 동안 보관되고 자동으로 지워져요. 음성 원본은 저장하지 않아요."
            />
            <Consent
              on={agree.learn}
              onClick={() => setAgree((a) => ({ ...a, learn: !a.learn }))}
              title="AI 개선을 위한 익명 활용"
              required={false}
              desc="이름 · 이메일을 뺀 질문 문장만 AI 판정 모델 개선에 쓰여요."
            />
          </div>
          <p className="mt-3 text-xs text-muted">필수 항목에 동의해야 입장할 수 있어요. 선택 항목은 동의하지 않아도 돼요.</p>

          <Button size="lg" className="mt-auto w-full" disabled={!agree.keep} onClick={() => enter(true)}>
            동의하고 입장
          </Button>
        </div>
      )}

      {step === "who" && lecture && (
        <div className="flex flex-1 flex-col px-5 pb-8">
          <LectureCard lecture={lecture} />
          <h2 className="mt-8 text-[34px] font-extrabold leading-[1.1] tracking-[-0.05em]">
            누구로
            <br />
            <span className="text-ink/35">들어갈까요?</span>
          </h2>
          <button onClick={() => enter(false)} className="mt-8 flex items-center gap-4 rounded-[24px] bg-ink p-5 text-left text-white transition-transform hover:-translate-y-0.5">
            <Sticker size={36} rotate={-6}>
              🙋
            </Sticker>
            <span className="flex-1">
              <span className="block text-lg font-bold">{name}님으로 입장</span>
              <span className="text-sm text-white/55">가입 때 동의한 내용으로 바로 들어가요. 질문과 요약 노트가 보관함에 남아요</span>
            </span>
            <Icon name="right" className="text-white/50" />
          </button>

          <div className="mt-3 rounded-[24px] bg-white p-5">
            <div className="flex items-center gap-4">
              <Sticker size={36} rotate={8}>
                🕶️
              </Sticker>
              <div>
                <p className="text-lg font-bold">게스트로 입장</p>
                <p className="text-sm text-muted">로그인 없이 질문해요. 입장할 때마다 동의를 받고, 보관함은 없어요.</p>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <input className={`${inputCls} min-w-0 flex-1 !bg-paper !py-3`} value={nick} onChange={(e) => setNick(e.target.value)} placeholder="닉네임 (선택)" maxLength={12} />
              <Button onClick={() => setStep("consent")} className="shrink-0">
                다음
              </Button>
            </div>
          </div>
        </div>
      )}
    </Screen>
  );
}

function Consent({ on, onClick, title, desc, required }: { on: boolean; onClick: () => void; title: string; desc: string; required: boolean }) {
  return (
    <button onClick={onClick} className={`flex w-full gap-3 rounded-[22px] bg-white p-4 text-left ring-inset transition-all ${on ? "ring-2 ring-ink" : "ring-0"}`}>
      <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${on ? "bg-ink" : "bg-ink/10"} text-white`}>
        <Icon name="check" size={14} stroke={3.2} />
      </span>
      <span>
        <span className="block font-bold">
          {title} <span className={`font-semibold ${required ? "text-coral-ink" : "text-muted"}`}>({required ? "필수" : "선택"})</span>
        </span>
        <span className="mt-1 block text-sm leading-relaxed text-muted">{desc}</span>
      </span>
    </button>
  );
}

function LectureCard({ lecture }: { lecture: Lecture }) {
  return (
    <Bubble tone={lecture.tone} className="mt-1">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <StatusPill status={lecture.status} onColor />
          <p className="mt-2.5 text-[22px] font-extrabold leading-tight tracking-[-0.04em]">{lecture.title}</p>
          <p className="mt-1 text-sm text-ink/60">
            {lecture.date} {lecture.time} · {lecture.audience}명 참여 중
          </p>
        </div>
        <Sticker size={44} rotate={10}>
          {lecture.emoji}
        </Sticker>
      </div>
    </Bubble>
  );
}
