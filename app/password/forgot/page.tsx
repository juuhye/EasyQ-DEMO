"use client";

import { useState } from "react";
import { Sticker } from "@/components/Brand";
import { Button, Field, Screen, TopBar, inputCls, useToast } from "@/components/ui";
import { EMAIL_RE } from "@/lib/auth";

// 비밀번호 재설정 요청. 가입 여부를 드러내지 않도록 없는 이메일이어도 같은 안내를 보여준다
export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const toast = useToast();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!EMAIL_RE.test(email.trim())) return setError("이메일 형식이 올바르지 않아요.");
    setError("");
    setSent(true);
  }

  if (sent)
    return (
      <Screen width="narrow">
        {toast.node}
        <TopBar back="/login" />
        <div className="flex flex-1 flex-col items-center px-8 pt-10 text-center">
          <Sticker size={96} rotate={-8} float>
            📬
          </Sticker>
          <h1 className="mt-8 text-[34px] font-extrabold tracking-[-0.05em]">메일을 확인해 주세요</h1>
          <p className="mt-3 leading-relaxed text-muted">
            <b className="text-ink">{email.trim()}</b> 로 가입된 계정이 있으면
            <br />
            비밀번호 재설정 링크를 보냈어요. 링크는 30분 동안 쓸 수 있어요.
          </p>
          <div className="mt-auto w-full space-y-3 pb-10">
            {/* 데모: 메일 속 링크를 누른 것처럼 이동한다 */}
            <Button href={`/password/reset?token=demo&email=${encodeURIComponent(email.trim())}`} size="lg" className="w-full">
              메일의 링크 열기 (데모)
            </Button>
            <Button variant="white" size="lg" className="w-full" onClick={() => toast.show("재설정 메일을 다시 보냈어요")}>
              메일 다시 보내기
            </Button>
          </div>
        </div>
      </Screen>
    );

  return (
    <Screen width="narrow">
      <TopBar back="/login" title="비밀번호 찾기" />
      <form onSubmit={submit} className="flex flex-1 flex-col px-6">
        <div className="pt-2">
          <Sticker size={44} rotate={-10}>
            🔑
          </Sticker>
          <h1 className="mt-4 text-[36px] font-extrabold leading-[1.08] tracking-[-0.05em]">
            비밀번호를
            <br />
            잊으셨나요?
          </h1>
          <p className="mt-3 text-[15px] text-muted">가입한 이메일로 비밀번호 재설정 링크를 보내드려요.</p>
        </div>
        <div className="mt-8">
          <Field label="이메일" error={error}>
            <input
              className={inputCls}
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              placeholder="name@example.com"
              autoFocus
            />
          </Field>
        </div>
        <div className="mt-auto pb-10 pt-8">
          <Button size="lg" className="w-full" type="submit" disabled={!email.trim()}>
            재설정 링크 보내기
          </Button>
        </div>
      </form>
    </Screen>
  );
}
