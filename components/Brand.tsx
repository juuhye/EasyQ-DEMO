import { type Tone, tones } from "@/lib/mock";

export function Logo({ className = "", light = false }: { className?: string; light?: boolean }) {
  return (
    <span className={`inline-flex items-start font-extrabold tracking-[-0.05em] ${light ? "text-white" : "text-ink"} ${className}`}>
      EasyQ
      <span className="ml-0.5 mt-[0.18em] h-[0.2em] w-[0.2em] rounded-full bg-coral" />
    </span>
  );
}

const avatarBg = ["bg-[#f3d9c4]", "bg-[#d6e4f5]", "bg-[#dcefd8]", "bg-[#ebe0f7]", "bg-[#f8e3b0]", "bg-[#f6d2d6]"];

export function Avatar({ name, size = 40, className = "" }: { name: string; size?: number; className?: string }) {
  const code = [...name].reduce((s, c) => s + c.charCodeAt(0), 0);
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold text-ink/80 ring-2 ring-white ${avatarBg[code % avatarBg.length]} ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      aria-hidden
    >
      {name.slice(0, 1)}
    </span>
  );
}

// 시안의 3D 오브젝트 대신 쓰는 이모지 스티커
export function Sticker({ children, size = 40, rotate = 0, className = "", float = false }: { children: React.ReactNode; size?: number; rotate?: number; className?: string; float?: boolean }) {
  return (
    <span
      className={`sticker inline-block select-none leading-none ${float ? "animate-float" : ""} ${className}`}
      style={{ fontSize: size, transform: `rotate(${rotate}deg)`, ["--r" as string]: `${rotate}deg` }}
      aria-hidden
    >
      {children}
    </span>
  );
}

// 꼬리 달린 말풍선 블록
export function Bubble({
  tone,
  tail = "left",
  className = "",
  style,
  children,
  muted = false,
}: {
  tone: Tone;
  tail?: "left" | "right" | "none";
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
  muted?: boolean;
}) {
  const color = muted ? "#e3ded5" : tones[tone].hex;
  return (
    <div className={`relative rounded-[30px] px-5 py-4 text-ink ${className}`} style={{ backgroundColor: color, ...style }}>
      {children}
      {tail !== "none" && (
        <svg
          viewBox="0 0 30 24"
          width={30}
          height={24}
          className={`absolute -bottom-[19px] ${tail === "left" ? "left-12" : "right-12 -scale-x-100"}`}
          aria-hidden
        >
          <path d="M0 0 H30 C24 7 22 15 25 24 C15 20 6 11 0 0 Z" fill={color} />
        </svg>
      )}
    </div>
  );
}

// 시안의 폴더 카드 — 안에 종이(스티커)가 꽂혀 있다
export function Folder({ tone, title, sub, stickers, corner }: { tone: Tone; title: string; sub: string; stickers: string[]; corner?: React.ReactNode }) {
  const hex = tones[tone].hex;
  return (
    <div className="relative h-[156px]">
      {/* 뒷판 + 탭 */}
      <div className="absolute inset-x-0 bottom-0 top-5 rounded-[18px] brightness-[0.88]" style={{ backgroundColor: hex }} />
      <div className="absolute left-0 top-2 h-6 w-[46%] rounded-t-[14px] brightness-[0.88]" style={{ backgroundColor: hex }} />
      {/* 꽂힌 종이 */}
      <div className="absolute inset-x-3 top-0 flex justify-center gap-1">
        {stickers.slice(0, 3).map((s, i) => (
          <span
            key={i}
            className="flex h-16 w-12 items-center justify-center rounded-lg bg-white text-2xl shadow-sm transition-transform group-hover:-translate-y-1.5"
            style={{ transform: `rotate(${(i - 1) * 8}deg) translateY(${i === 1 ? -6 : 0}px)` }}
          >
            {s}
          </span>
        ))}
      </div>
      {/* 앞판 */}
      <div className="absolute inset-x-0 bottom-0 flex h-[62%] flex-col justify-end rounded-[18px] p-3.5 shadow-[0_-2px_0_rgba(255,255,255,0.25)_inset]" style={{ backgroundColor: hex }}>
        <p className="line-clamp-2 pr-7 text-[15px] font-bold leading-tight tracking-[-0.03em]">{title}</p>
        <p className="mt-0.5 text-xs text-ink/60">{sub}</p>
        {corner && <span className="absolute bottom-3 right-3">{corner}</span>}
      </div>
    </div>
  );
}
