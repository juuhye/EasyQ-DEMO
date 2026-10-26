"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { Sticker } from "@/components/Brand";
import { Icon } from "@/components/Icon";
import { Button, Screen, TopBar, useToast } from "@/components/ui";
import { MOCK_VERIFY_CODE } from "@/lib/auth";
import { DEMO } from "@/lib/demo";
import { setDemo, useDemo } from "@/lib/store";

const LENGTH = 6;
const RESEND_SEC = 60;
// 재발송은 시간당 5회까지 (API-02)
const RESEND_MAX = 5;

// useSearchParams는 Suspense 안에서만 쓸 수 있다
export default function VerifyPage() {
  return (
    <Suspense>
      <Verify />
    </Suspense>
  );
}

// 이메일 인증 코드 입력 (F1-1). 가입 직후 · 인증 전 로그인 시도 때 온다. 인증이 끝나도 자동 로그인하지 않는다
function Verify() {
  const { signup } = useDemo();
  const email = useSearchParams().get("email") ?? signup?.email ?? "";
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [left, setLeft] = useState(RESEND_SEC);
  const [resent, setResent] = useState(0);
  const resendBlocked = resent >= RESEND_MAX;
  const inputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  // 재발송 카운트다운
  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (code.length < LENGTH) return;
    if (code !== MOCK_VERIFY_CODE) {
      setError("인증 코드가 맞지 않아요. 메일의 6자리 코드를 다시 확인해 주세요.");
      return;
    }
    if (signup && signup.email === email) setDemo({ signup: { ...signup, verified: true } });
    setDone(true);
  }

  function resend() {
    if (resendBlocked) return;
    setResent((n) => n + 1);
    setLeft(RESEND_SEC);
    setCode("");
    setError("");
    toast.show("인증 코드를 다시 보냈어요");
    inputRef.current?.focus();
  }

  if (done)
    return (
      <Screen width="narrow">
        <div className="flex flex-1 flex-col items-center px-8 pt-24 text-center">
          <Sticker size={96} rotate={-8} float>
            🎉
          </Sticker>
          <h1 className="mt-8 text-[34px] font-extrabold tracking-[-0.05em]">인증이 끝났어요</h1>
          <p className="mt-3 leading-relaxed text-muted">
            가입이 완료됐어요.
            <br />
            가입한 이메일과 비밀번호로 로그인해 주세요.
          </p>
          <div className="mt-auto w-full pb-10">
            <Button href="/login" size="lg" className="w-full">
              로그인하러 가기
            </Button>
          </div>
        </div>
      </Screen>
    );

  return (
    <Screen width="narrow">
      {toast.node}
      <TopBar back="/login" title="이메일 인증" />
      <form onSubmit={submit} className="flex flex-1 flex-col px-6">
        <div className="pt-2">
          <Sticker size={44} rotate={-10}>
            💌
          </Sticker>
          <h1 className="mt-4 text-[36px] font-extrabold leading-[1.08] tracking-[-0.05em]">
            인증 코드를
            <br />
            입력해 주세요
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-muted">
            {email ? <b className="text-ink">{email}</b> : "가입한 이메일"} 로 보낸 6자리 코드를 입력하면 가입이 끝나요.
          </p>
        </div>

        {/* 숫자 6칸. 실제 입력은 숨긴 input 하나로 받는다 */}
        <div className="relative mt-8" onClick={() => inputRef.current?.focus()}>
          <div className="flex justify-between gap-2" aria-hidden>
            {Array.from({ length: LENGTH }, (_, i) => (
              <span
                key={i}
                className={`flex h-14 flex-1 items-center justify-center rounded-2xl bg-white text-2xl font-extrabold ring-inset ${
                  error ? "ring-2 ring-[#e5484d]" : i === code.length ? "ring-2 ring-ink" : "ring-1 ring-line"
                }`}
              >
                {code[i] ?? ""}
              </span>
            ))}
          </div>
          <input
            ref={inputRef}
            value={code}
            onChange={(e) => {
              setCode(e.target.value.replace(/\D/g, "").slice(0, LENGTH));
              setError("");
            }}
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            aria-label="인증 코드 6자리"
            className="absolute inset-0 h-full w-full opacity-0"
          />
        </div>
        {error && (
          <p role="alert" className="mt-3 flex items-center gap-1 text-sm text-[#e5484d]">
            <Icon name="alert" size={15} /> {error}
          </p>
        )}

        <div className="mt-5 flex items-center justify-between rounded-2xl bg-white px-4 py-3 text-sm">
          <span className="text-muted">메일이 오지 않았나요?</span>
          <button type="button" onClick={resend} disabled={left > 0 || resendBlocked} className="font-semibold underline underline-offset-4 disabled:text-muted disabled:no-underline">
            {resendBlocked ? "1시간 뒤 다시 보낼 수 있어요" : left > 0 ? `${left}초 후 다시 보내기` : `코드 다시 보내기 (${RESEND_MAX - resent}회 남음)`}
          </button>
        </div>
        {DEMO && <p className="mt-3 text-xs text-muted">데모 인증 코드 · {MOCK_VERIFY_CODE}</p>}

        <div className="mt-auto pb-10 pt-8">
          <Button size="lg" className="w-full" type="submit" disabled={code.length < LENGTH}>
            인증하기
          </Button>
        </div>
      </form>
    </Screen>
  );
}
