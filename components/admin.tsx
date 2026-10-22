"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Logo } from "./Brand";
import { Icon, type IconName } from "./Icon";
import { setDemo, useDemo } from "@/lib/store";

// ── 관리자 화면 틀 ────────────────────────────────

const adminNav: { href: string; label: string; icon: IconName }[] = [
  { href: "/admin", label: "운영 지표", icon: "gauge" },
  { href: "/admin/members", label: "회원", icon: "users" },
  { href: "/admin/sessions", label: "세션", icon: "board" },
  { href: "/admin/data", label: "데이터 · 라벨", icon: "layers" },
  { href: "/admin/models", label: "모델", icon: "cpu" },
  { href: "/admin/notices", label: "공지 · 문의", icon: "megaphone" },
];

// 데스크톱은 왼쪽 사이드바, 모바일은 상단 가로 탭. 관리자 로그인 전이면 로그인 화면으로 보낸다 (F9-1).
export function AdminShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const { admin, servingVersion } = useDemo();

  useEffect(() => {
    if (!admin) router.replace("/admin/login");
  }, [admin, router]);

  if (!admin) return null;

  const isActive = (href: string) => (href === "/admin" ? path === "/admin" : path.startsWith(href));

  return (
    <div className="flex min-h-dvh bg-paper text-ink">
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-line px-4 py-6 md:flex">
        <Link href="/admin" className="flex items-center gap-2 px-2">
          <Logo className="text-[22px]" />
          <span className="rounded-full bg-ink px-2 py-0.5 text-[11px] font-bold text-white">ADMIN</span>
        </Link>
        <nav className="mt-8 flex flex-col gap-1">
          {adminNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex h-11 items-center gap-2.5 rounded-full px-4 text-sm font-semibold transition-colors ${
                isActive(item.href) ? "bg-ink text-white" : "text-ink/55 hover:bg-white hover:text-ink"
              }`}
            >
              <Icon name={item.icon} size={18} />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto space-y-3">
          <div className="rounded-[20px] bg-white p-3.5 text-xs">
            <p className="text-muted">현재 서빙 모델</p>
            <p className="mt-0.5 text-[15px] font-bold">{servingVersion === "sonnet" ? "Sonnet 단독 판정" : `판정 모델 ${servingVersion}`}</p>
          </div>
          <button
            onClick={() => {
              setDemo({ admin: null });
              router.push("/admin/login");
            }}
            className="flex w-full items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-ink/55 hover:bg-white hover:text-ink"
          >
            <Icon name="logout" size={17} />
            로그아웃
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-line bg-paper/90 backdrop-blur md:hidden">
          <div className="flex h-14 items-center justify-between px-4">
            <span className="flex items-center gap-2">
              <Logo className="text-[20px]" />
              <span className="rounded-full bg-ink px-2 py-0.5 text-[11px] font-bold text-white">ADMIN</span>
            </span>
            <button onClick={() => setDemo({ admin: null })} className="text-sm font-semibold text-ink/55" aria-label="로그아웃">
              <Icon name="logout" size={19} />
            </button>
          </div>
          <nav className="no-scrollbar flex gap-1.5 overflow-x-auto px-4 pb-3">
            {adminNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold ${isActive(item.href) ? "bg-ink text-white" : "bg-white text-ink/55"}`}
              >
                <Icon name={item.icon} size={15} />
                {item.label}
              </Link>
            ))}
          </nav>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 pt-6 md:px-8 md:pt-10">{children}</main>
      </div>
    </div>
  );
}

// ── 관리자 공통 요소 ──────────────────────────────

export function AdminTitle({ children, desc, action }: { children: React.ReactNode; desc?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-[32px] font-extrabold leading-none tracking-[-0.05em] md:text-[38px]">{children}</h1>
        {desc && <p className="mt-2 text-sm text-muted">{desc}</p>}
      </div>
      {action}
    </div>
  );
}

export function Stat({ label, value, sub, tone = "white", warn = false }: { label: string; value: React.ReactNode; sub?: React.ReactNode; tone?: string; warn?: boolean }) {
  return (
    <div className="rounded-[24px] p-4 pb-5" style={{ backgroundColor: tone === "white" ? "#ffffff" : tone }}>
      <p className="text-sm font-medium text-ink/60">{label}</p>
      <p className="mt-2 text-[30px] font-extrabold leading-none tracking-[-0.04em]">{value}</p>
      {sub && <p className={`mt-2 text-xs ${warn ? "font-semibold text-coral-ink" : "text-ink/55"}`}>{sub}</p>}
    </div>
  );
}

export function Panel({ title, desc, action, children, className = "" }: { title?: string; desc?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-[24px] bg-white p-5 ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            {title && <h2 className="font-bold">{title}</h2>}
            {desc && <p className="mt-0.5 text-xs text-muted">{desc}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Dot({ className }: { className: string }) {
  return <span className={`inline-block h-1.5 w-1.5 rounded-full ${className}`} />;
}
