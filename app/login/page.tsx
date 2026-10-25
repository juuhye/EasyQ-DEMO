"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Sticker } from "@/components/Brand";
import { Button, Field, Screen, TopBar, inputCls } from "@/components/ui";
import { login, type LoginField } from "@/lib/auth";
import { setDemo, useDemo } from "@/lib/store";

// useSearchParams는 Suspense 안에서만 쓸 수 있다
export default function LoginPage() {
  return (
    <Suspense>
      <Login />
    </Suspense>
  );
}

function Login() {
  const router = useRouter();
  const { signup } = useDemo();
  // QR 입장 중 회원을 고르면 로그인 뒤 그 강연으로 돌아간다. 내부 경로만 받는다
  const nextParam = useSearchParams().get("next");
  const next = nextParam?.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/home";
  const [email, setEmail] = useState(signup?.email ?? "juhye@gachon.ac.kr");
  const [pw, setPw] = useState("");
  const [error, setError] = useState<{ field: LoginField; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    const res = await login(email, pw, "user", signup).catch(() => ({ ok: false as const, field: "form" as const, message: "잠시 후 다시 시도해 주세요." }));
    setLoading(false);
    // 인증 전 계정은 코드 입력 화면으로 보낸다
    if (!res.ok && "unverified" in res && res.unverified) return router.push(`/verify?email=${encodeURIComponent(email.trim())}`);
    if (!res.ok) return setError(res);
    setError(null);
    setDemo({ name: res.name, authed: true, loginAt: Date.now() });
    router.push(next);
  }

  return (
    <Screen width="narrow">
      <TopBar back={true} />
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
          <Field label="이메일" error={error?.field === "email" ? error.message : undefined}>
            <input className={inputCls} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" />
          </Field>
          <Field label="비밀번호" error={error?.field === "pw" ? error.message : undefined}>
            <input className={inputCls} type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="비밀번호" autoFocus />
          </Field>
          <Link href="/password/forgot" className="block text-right text-sm font-semibold text-ink/60 underline underline-offset-4">
            비밀번호를 잊었어요
          </Link>
        </div>
        {error?.field === "form" && (
          <div role="alert" className="mt-4 rounded-2xl bg-coral/15 p-3.5 text-sm text-coral-ink">
            {error.message}
          </div>
        )}

        <div className="mt-auto space-y-3 pb-10 pt-8">
          <Button size="lg" className="w-full" type="submit" disabled={loading}>
            {loading ? "로그인 중…" : "로그인"}
          </Button>
          <p className="text-center text-sm text-muted">
            아직 계정이 없나요?{" "}
            <Link href="/signup" className="font-semibold text-ink underline underline-offset-4">
              회원가입
            </Link>
          </p>
          <p className="text-center text-xs text-muted">
            <Link href="/admin/login" className="underline underline-offset-4">
              관리자 로그인
            </Link>
          </p>
        </div>
      </form>
    </Screen>
  );
}
