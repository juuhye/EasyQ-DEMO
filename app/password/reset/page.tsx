"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Sticker } from "@/components/Brand";
import { Icon } from "@/components/Icon";
import { Button, Empty, Field, Screen, TopBar, inputCls } from "@/components/ui";
import { pwRules, pwValid } from "@/lib/auth";
import { setDemo, useDemo } from "@/lib/store";

// useSearchParams는 Suspense 안에서만 쓸 수 있다
export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPassword />
    </Suspense>
  );
}

// 새 비밀번호 설정. 메일 링크(token)로만 들어온다. 바꾼 뒤에는 로그인 화면으로 보낸다
function ResetPassword() {
  const params = useSearchParams();
  const token = params.get("token");
  const email = params.get("email") ?? "";
  const { signup } = useDemo();
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);
  const mismatch = confirm.length > 0 && pw !== confirm;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!pwValid(pw) || pw !== confirm) return;
    // 이번 데모에서 가입한 계정이면 바뀐 비밀번호로 로그인할 수 있게 한다
    if (signup && signup.email === email) setDemo({ signup: { ...signup, pw } });
    setDone(true);
  }

  if (!token)
    return (
      <Screen width="narrow">
        <TopBar back="/login" />
        <Empty emoji="⌛" title="링크가 만료됐거나 올바르지 않아요" desc="비밀번호 찾기에서 재설정 메일을 다시 받아 주세요.">
          <Button href="/password/forgot">재설정 메일 다시 받기</Button>
        </Empty>
      </Screen>
    );

  if (done)
    return (
      <Screen width="narrow">
        <div className="flex flex-1 flex-col items-center px-8 pt-24 text-center">
          <Sticker size={96} rotate={-8} float>
            🔐
          </Sticker>
          <h1 className="mt-8 text-[34px] font-extrabold tracking-[-0.05em]">비밀번호를 바꿨어요</h1>
          <p className="mt-3 leading-relaxed text-muted">새 비밀번호로 다시 로그인해 주세요.</p>
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
      <TopBar back="/login" title="새 비밀번호" />
      <form onSubmit={submit} className="flex flex-1 flex-col px-6">
        <h1 className="pt-2 text-[36px] font-extrabold leading-[1.08] tracking-[-0.05em]">
          새 비밀번호를
          <br />
          정해 주세요
        </h1>
        {email && <p className="mt-3 text-[15px] text-muted">{email}</p>}
        <div className="mt-8 space-y-4">
          <Field label="새 비밀번호">
            <input className={inputCls} type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="새 비밀번호" autoFocus />
            <div className="mt-2 flex gap-2">
              {pwRules.map((r) => {
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
          <Field label="새 비밀번호 확인" error={mismatch ? "비밀번호가 서로 달라요." : undefined}>
            <input className={inputCls} type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="한 번 더 입력" />
          </Field>
        </div>
        <div className="mt-auto pb-10 pt-8">
          <Button size="lg" className="w-full" type="submit" disabled={!pwValid(pw) || pw !== confirm}>
            비밀번호 바꾸기
          </Button>
        </div>
      </form>
    </Screen>
  );
}
