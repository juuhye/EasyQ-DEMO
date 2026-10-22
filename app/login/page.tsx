"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Sticker } from "@/components/Brand";
import { Button, Field, Screen, TopBar, inputCls } from "@/components/ui";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("juhye@gachon.ac.kr");
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !pw) return setError("이메일과 비밀번호를 입력해 주세요.");
    if (email.startsWith("new")) return setError("이메일 인증을 마치지 않은 계정이에요. 메일함을 확인해 주세요.");
    if (pw.length < 4) return setError("비밀번호가 맞지 않아요.");
    router.push("/home");
  }

  return (
    <Screen width="narrow">
      <TopBar back="/" />
      <form onSubmit={submit} className="flex flex-1 flex-col px-6">
        <div className="pt-4">
          <Sticker size={44} rotate={-10}>👋</Sticker>
          <h1 className="mt-4 text-[40px] font-extrabold leading-[1.05] tracking-[-0.05em]">
            다시 만나서
            <br />
            반가워요
          </h1>
          <p className="mt-3 text-[15px] text-muted">계정 하나로 청중도, 강연자도 될 수 있어요.</p>
        </div>

        <div className="mt-8 space-y-4">
          <Field label="이메일">
            <input className={inputCls} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" />
          </Field>
          <Field label="비밀번호" error={error}>
            <input className={inputCls} type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="비밀번호" autoFocus />
          </Field>
        </div>
        <p className="mt-3 text-xs text-muted">데모: 아무 비밀번호(4자 이상)나 입력하면 로그인돼요.</p>

        <div className="mt-auto space-y-3 pb-10 pt-8">
          <Button size="lg" className="w-full" type="submit">
            로그인
          </Button>
          <p className="text-center text-sm text-muted">
            아직 계정이 없나요?{" "}
            <Link href="/signup" className="font-semibold text-ink underline underline-offset-4">
              회원가입
            </Link>
          </p>
        </div>
      </form>
    </Screen>
  );
}
