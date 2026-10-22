"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Logo, Sticker } from "@/components/Brand";
import { Button, Field, Screen, inputCls } from "@/components/ui";
import { adminAccount } from "@/lib/admin";
import { setDemo } from "@/lib/store";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState(adminAccount.email);
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !pw) return setError("이메일과 비밀번호를 입력해 주세요.");
    if (email !== adminAccount.email) return setError("관리자 권한이 없는 계정이에요. 일반 회원은 관리자 화면에 들어올 수 없어요.");
    if (pw.length < 4) return setError("비밀번호가 맞지 않아요.");
    setDemo({ admin: email });
    router.push("/admin");
  }

  return (
    <Screen width="narrow">
      <form onSubmit={submit} className="flex flex-1 flex-col px-6">
        <div className="flex items-center gap-2 pt-10">
          <Logo className="text-[22px]" />
          <span className="rounded-full bg-ink px-2 py-0.5 text-[11px] font-bold text-white">ADMIN</span>
        </div>
        <div className="pt-10">
          <Sticker size={44} rotate={-10}>
            🛡️
          </Sticker>
          <h1 className="mt-4 text-[40px] font-extrabold leading-[1.05] tracking-[-0.05em]">
            관리자
            <br />
            로그인
          </h1>
          <p className="mt-3 text-[15px] text-muted">운영자 전용 계정만 들어올 수 있어요. 일반 회원가입으로는 만들 수 없어요.</p>
        </div>

        <div className="mt-8 space-y-4">
          <Field label="관리자 이메일">
            <input className={inputCls} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@easyq.kr" />
          </Field>
          <Field label="비밀번호" error={error}>
            <input className={inputCls} type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="비밀번호" autoFocus />
          </Field>
        </div>
        <p className="mt-3 text-xs text-muted">데모: {adminAccount.email} + 아무 비밀번호(4자 이상). 다른 이메일은 권한 없음으로 막혀요.</p>

        <div className="mt-auto pb-10 pt-8">
          <Button size="lg" className="w-full" type="submit" icon="shield">
            관리자 화면으로
          </Button>
        </div>
      </form>
    </Screen>
  );
}
