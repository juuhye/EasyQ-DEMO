"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Avatar } from "./Brand";
import { Icon, type IconName } from "./Icon";
import { useDemo } from "@/lib/store";

// ── 화면 틀 ───────────────────────────────────────

// 모바일 웹 우선: 데스크톱에서는 가운데 폰 크기 화면으로 보여준다.
export function Screen({ children, className = "", nav = false, dark = false, grid = true }: { children: React.ReactNode; className?: string; nav?: boolean; dark?: boolean; grid?: boolean }) {
  return (
    <div className="flex min-h-dvh items-center justify-center md:py-8">
      <div
        className={`relative flex h-dvh w-full max-w-[440px] flex-col overflow-hidden md:h-[min(900px,calc(100dvh-4rem))] md:rounded-[52px] md:border-[10px] md:border-ink md:shadow-2xl ${
          dark ? "bg-ink text-white" : `bg-paper ${grid ? "grid-paper" : ""}`
        } ${className}`}
      >
        <div className={`no-scrollbar flex flex-1 flex-col overflow-y-auto ${nav ? "pb-28" : ""}`}>{children}</div>
        {nav && <BottomNav />}
      </div>
    </div>
  );
}

const navItems: { href: string; label: string; icon: IconName }[] = [
  { href: "/home", label: "홈", icon: "home" },
  { href: "/archive", label: "보관함", icon: "box" },
  { href: "/join", label: "입장", icon: "qr" },
  { href: "/lectures", label: "내 강의", icon: "board" },
];

// 시안의 떠 있는 알약 내비게이션 + 프로필 동그라미
export function BottomNav() {
  const path = usePathname();
  const { name } = useDemo();
  return (
    <nav className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex justify-center gap-2 bg-gradient-to-t from-paper via-paper/80 to-transparent px-4 pb-6 pt-8">
      <ul className="pointer-events-auto flex items-center gap-1 rounded-full bg-white p-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.10)]">
        {navItems.map((item) => {
          const active = path.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-label={item.label}
                className={`flex h-12 items-center justify-center rounded-full transition-all ${active ? "w-16 bg-ink text-white" : "w-12 text-ink/45 hover:text-ink"}`}
              >
                <Icon name={item.icon} size={21} />
              </Link>
            </li>
          );
        })}
      </ul>
      <Link
        href="/me"
        aria-label="내 정보"
        className={`pointer-events-auto flex h-[60px] w-[60px] items-center justify-center rounded-full bg-white shadow-[0_8px_24px_rgba(0,0,0,0.10)] ${path.startsWith("/me") ? "ring-2 ring-ink" : ""}`}
      >
        <Avatar name={name} size={48} className="!ring-0" />
      </Link>
    </nav>
  );
}

export function TopBar({ title, back, right, light = false }: { title?: string; back?: string | true; right?: React.ReactNode; light?: boolean }) {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 px-5">
      {back && (
        <button
          onClick={() => (back === true ? router.back() : router.push(back))}
          className={`flex h-10 w-10 items-center justify-center rounded-full ${light ? "bg-white/15 text-white" : "bg-sand/80 backdrop-blur hover:bg-sand"}`}
          aria-label="뒤로"
        >
          <Icon name="back" size={19} />
        </button>
      )}
      <h1 className="flex-1 truncate text-[17px] font-bold">{title}</h1>
      {right}
    </header>
  );
}

// 시안의 "Today / Saved / Chats" 같은 큰 제목
export function PageTitle({ children, meta, action, className = "" }: { children: React.ReactNode; meta?: React.ReactNode; action?: React.ReactNode; className?: string }) {
  return (
    <div className={`flex items-end justify-between gap-3 px-5 pt-8 ${className}`}>
      <h1 className="text-[42px] font-extrabold leading-none tracking-[-0.05em]">{children}</h1>
      <div className="flex items-center gap-2.5 pb-1">
        {meta && <span className="text-sm">{meta}</span>}
        {action}
      </div>
    </div>
  );
}

export function RoundButton({ icon, onClick, href, label, dark = false }: { icon: IconName; onClick?: () => void; href?: string; label: string; dark?: boolean }) {
  const cls = `flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors ${dark ? "bg-ink text-white hover:bg-ink/85" : "bg-sand hover:bg-[#ddd6ca]"}`;
  if (href)
    return (
      <Link href={href} className={cls} aria-label={label}>
        <Icon name={icon} size={19} />
      </Link>
    );
  return (
    <button onClick={onClick} className={cls} aria-label={label}>
      <Icon name={icon} size={19} />
    </button>
  );
}

// ── 기본 요소 ─────────────────────────────────────

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "accent" | "soft" | "white" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  icon?: IconName;
  href?: string;
};

const variants = {
  primary: "bg-ink text-white hover:bg-ink/85",
  accent: "bg-coral text-ink hover:brightness-95",
  soft: "bg-sand text-ink hover:bg-[#ddd6ca]",
  white: "bg-white text-ink hover:bg-white/85",
  ghost: "bg-transparent text-ink ring-1 ring-inset ring-ink/15 hover:bg-ink/5",
  danger: "bg-[#e5484d] text-white hover:bg-[#cf3f44]",
};
const sizes = { sm: "h-9 px-4 text-sm", md: "h-12 px-5 text-[15px]", lg: "h-14 px-6 text-base" };

export function Button({ variant = "primary", size = "md", icon, href, className = "", children, ...rest }: ButtonProps) {
  const cls = `inline-flex items-center justify-center gap-1.5 rounded-full font-semibold transition-all active:scale-[0.98] disabled:pointer-events-none disabled:opacity-35 ${variants[variant]} ${sizes[size]} ${className}`;
  const inner = (
    <>
      {icon && <Icon name={icon} size={size === "sm" ? 16 : 18} />}
      {children}
    </>
  );
  if (href && !rest.disabled)
    return (
      <Link href={href} className={cls}>
        {inner}
      </Link>
    );
  return (
    <button className={cls} {...rest}>
      {inner}
    </button>
  );
}

export function Pill({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}>{children}</span>;
}

export function StatusPill({ status, onColor = false }: { status: "ready" | "live" | "ended"; onColor?: boolean }) {
  const base = onColor ? "bg-ink/10" : "bg-white";
  if (status === "live")
    return (
      <Pill className={base}>
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-coral" />
        진행 중
      </Pill>
    );
  if (status === "ready")
    return (
      <Pill className={base}>
        <span className="h-1.5 w-1.5 rounded-full bg-honey" />
        준비
      </Pill>
    );
  return (
    <Pill className={`${base} text-ink/60`}>
      <span className="h-1.5 w-1.5 rounded-full bg-ink/30" />
      종료
    </Pill>
  );
}

export function Card({ children, className = "", ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`rounded-[24px] bg-white p-4 ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-3 mt-8 flex items-end justify-between">
      <h2 className="text-[19px] font-bold tracking-[-0.03em]">{children}</h2>
      {action}
    </div>
  );
}

export function Progress({ value, className = "", color = "bg-ink" }: { value: number; className?: string; color?: string }) {
  return (
    <div className={`h-1.5 overflow-hidden rounded-full bg-ink/8 ${className}`}>
      <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export function Tabs<T extends string>({ tabs, value, onChange, className = "" }: { tabs: { value: T; label: string; count?: number }[]; value: T; onChange: (v: T) => void; className?: string }) {
  return (
    <div className={`no-scrollbar flex gap-1.5 overflow-x-auto ${className}`} role="tablist">
      {tabs.map((t) => (
        <button
          key={t.value}
          role="tab"
          aria-selected={value === t.value}
          onClick={() => onChange(t.value)}
          className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold transition-all ${
            value === t.value ? "bg-ink text-white" : "bg-white text-ink/55 hover:text-ink"
          }`}
        >
          {t.label}
          {t.count !== undefined && <span className={`text-xs ${value === t.value ? "text-white/60" : "text-ink/35"}`}>{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-ink/70">{label}</span>
      {children}
      {error ? <span className="mt-1.5 block text-xs text-[#e5484d]">{error}</span> : hint ? <span className="mt-1.5 block text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

export const inputCls =
  "w-full rounded-2xl bg-white px-4 py-3.5 text-[15px] outline-none ring-1 ring-inset ring-line transition-shadow placeholder:text-ink/30 focus:ring-2 focus:ring-ink";

export function Modal({ open, onClose, children, title }: { open: boolean; onClose: () => void; children: React.ReactNode; title?: string }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/35 backdrop-blur-[2px] sm:items-center sm:p-4" onClick={onClose}>
      <div className="w-full max-w-[420px] animate-pop rounded-t-[32px] bg-paper p-6 text-ink sm:rounded-[32px]" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal>
        {title && (
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-[22px] font-extrabold tracking-[-0.04em]">{title}</h3>
            <RoundButton icon="x" label="닫기" onClick={onClose} />
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

// ── 토스트 ────────────────────────────────────────

export function useToast() {
  const [msg, setMsg] = useState<{ text: string; tone: "ink" | "coral" | "mint"; key: number } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const show = useCallback((text: string, tone: "ink" | "coral" | "mint" = "ink") => {
    if (timer.current) clearTimeout(timer.current);
    setMsg({ text, tone, key: Date.now() });
    timer.current = setTimeout(() => setMsg(null), 2600);
  }, []);
  const node = msg ? (
    <div className="pointer-events-none fixed inset-x-0 top-6 z-[60] flex justify-center px-4">
      <div key={msg.key} className="flex animate-pop items-center gap-2 rounded-full bg-ink py-3 pl-4 pr-5 text-[15px] font-medium text-white shadow-lg">
        <span className={`h-2 w-2 rounded-full ${msg.tone === "coral" ? "bg-coral" : msg.tone === "mint" ? "bg-mint" : "bg-white/50"}`} />
        {msg.text}
      </div>
    </div>
  ) : null;
  return { show, node };
}

export function Empty({ title, desc, emoji = "🗂️", children }: { title: string; desc?: string; emoji?: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <span className="sticker mb-4 text-5xl">{emoji}</span>
      <p className="text-lg font-bold">{title}</p>
      {desc && <p className="mt-1 text-sm text-muted">{desc}</p>}
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}
