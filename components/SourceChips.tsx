"use client";

import { useState } from "react";
import type { Source } from "@/lib/mock";
import { Icon } from "./Icon";

// AI 답변의 근거 위치 (교안 페이지 · 발화 시각). 누르면 인용 문장을 펼친다.
export function SourceChips({ sources }: { sources: Source[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="mt-3">
      <div className="flex flex-wrap gap-1.5">
        {sources.map((s, i) => (
          <button
            key={i}
            onClick={() => setOpen(open === i ? null : i)}
            className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${open === i ? "bg-ink text-white" : "bg-white text-ink"}`}
          >
            <Icon name={s.kind === "slide" ? "file" : "mic"} size={13} />
            {s.label}
          </button>
        ))}
      </div>
      {open !== null && sources[open] && <p className="mt-2 animate-rise rounded-2xl bg-white px-3.5 py-2.5 text-sm text-ink/65">“{sources[open].quote}”</p>}
    </div>
  );
}
