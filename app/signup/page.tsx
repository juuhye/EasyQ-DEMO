"use client";

import { useState } from "react";
import { Sticker } from "@/components/Brand";
import { Icon } from "@/components/Icon";
import { Button, Field, Screen, TopBar, inputCls, useToast } from "@/components/ui";
import { setDemo } from "@/lib/store";

const rules = [
  { label: "8자 이상", test: (p: string) => p.length >= 8 },
  { label: "영문 포함", test: (p: string) => /[a-zA-Z]/.test(p) },
  { label: "숫자 포함", test: (p: string) => /\d/.test(p) },
];

const consents = [
  { key: "terms", label: "서비스 이용약관 동의", required: true },
  { key: "privacy", label: "개인정보 수집 · 이용 동의", required: true },
  { key: "keep", label: "질문 · 답변 기록 보관 동의", required: true },
  { key: "learn", label: "AI 개선을 위한 익명 활용 동의", required: false },
];

export default function Signup() {
  const toast = useToast();
  const [step, setStep] = useState<"form" | "sent">("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [agree, setAgree] = useState<Record<string, boolean>>({});
  const [emailError, setEmailError] = useState("");

  const pwOk = rules.every((r) => r.test(pw));
  const allAgree = consents.every((c) => agree[c.key]);
  const requiredAgree = consents.every((c) => !c.required || agree[c.key]);
  const valid = name.trim() && email.includes("@") && pwOk && requiredAgree;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (email === "juhye@gachon.ac.kr") return setEmailError("이미 가입된 이메일이에요.");
    // 동의는 계정 단위로 저장하고, 입장할 때 다시 묻지 않는다
    setDemo({ consent: { keep: true, learn: !!agree.learn } });
    setStep("sent");
  }

  if (step === "sent")
    return (
      <Screen width="narrow">
        {toast.node}
        <TopBar back="/" />
        <div className="flex flex-1 flex-col items-center px-8 pt-10 text-center">
          <Sticker size={96} rotate={-8} float>
            💌
          </Sticker>
          <h1 className="mt-8 text-[34px] font-extrabold tracking-[-0.05em]">인증 메일을 보냈어요</h1>
          <p className="mt-3 leading-relaxed text-muted">
            <b className="text-ink">{email}</b> 로 보낸
            <br />
            링크를 누르면 가입이 끝나요.
          </p>
          <div className="mt-auto w-full space-y-3 pb-10">
            <Button href="/login" size="lg" className="w-full">
              로그인하러 가기
            </Button>
            <Button variant="white" size="lg" className="w-full" onClick={() => toast.show("인증 메일을 다시 보냈어요")}>
              메일 다시 보내기
            </Button>
          </div>
        </div>
      </Screen>
    );

  return (
    <Screen width="narrow">
      <TopBar back="/" title="회원가입" />
      <form onSubmit={submit} className="flex flex-1 flex-col px-6 pb-10">
        <h1 className="pt-2 text-[40px] font-extrabold leading-[1.05] tracking-[-0.05em]">
          반가워요! <Sticker size={34} rotate={12}>🌱</Sticker>
          <br />
          <span className="text-ink/35">이름부터 알려주세요</span>
        </h1>

        <div className="mt-8 space-y-4">
          <Field label="이름 (표시명)">
            <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 심주혜" />
          </Field>
          <Field label="이메일" error={emailError}>
            <input
              className={inputCls}
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError("");
              }}
              placeholder="name@example.com"
            />
          </Field>
          <Field label="비밀번호">
            <input className={inputCls} type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="비밀번호" />
            <div className="mt-2 flex gap-2">
              {rules.map((r) => {
                const ok = r.test(pw);
                return (
                  <span key={r.label} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs ${ok ? "bg-ink text-white" : "bg-white text-muted"}`}>
                    <Icon name="check" size={12} stroke={3} />
                    {r.label}
                  </span>
                );
              })}
            </div>
          </Field>
        </div>

        <div className="mt-6 rounded-[24px] bg-white p-4">
          <button
            type="button"
            onClick={() => setAgree(allAgree ? {} : Object.fromEntries(consents.map((c) => [c.key, true])))}
            className="flex w-full items-center gap-3 border-b border-line pb-3 font-bold"
          >
            <Check on={allAgree} />
            전체 동의
          </button>
          {consents.map((c) => (
            <button key={c.key} type="button" onClick={() => setAgree((a) => ({ ...a, [c.key]: !a[c.key] }))} className="flex w-full items-center gap-3 pt-3 text-left text-sm">
              <Check on={!!agree[c.key]} small />
              <span className="flex-1">
                <span className={c.required ? "font-semibold text-coral-ink" : "text-muted"}>{c.required ? "(필수)" : "(선택)"}</span> {c.label}
              </span>
              <Icon name="right" size={16} className="text-muted" />
            </button>
          ))}
          <p className="mt-3 rounded-2xl bg-paper p-3 text-xs leading-relaxed text-muted">
            음성 원본은 저장하지 않아요. 세션 데이터는 강의가 끝나고 3개월이 지나면 자동으로 지워지고, 학습에는 개인정보를 뺀 익명 데이터만 써요. 여기서 동의한 내용은 강의에 입장할 때마다 다시 묻지 않고, 마이페이지에서 바꿀 수 있어요.
          </p>
        </div>

        <Button size="lg" className="mt-8 w-full" disabled={!valid} type="submit">
          가입하기
        </Button>
      </form>
    </Screen>
  );
}

function Check({ on, small }: { on: boolean; small?: boolean }) {
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-full transition-colors ${small ? "h-5 w-5" : "h-6 w-6"} ${on ? "bg-ink text-white" : "bg-ink/10 text-white"}`}>
      <Icon name="check" size={small ? 12 : 14} stroke={3.2} />
    </span>
  );
}
