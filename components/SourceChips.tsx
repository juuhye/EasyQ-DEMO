"use client";

import { useState } from "react";
import type { Source } from "@/lib/mock";
import { Icon } from "./Icon";
import { Modal } from "./ui";

// AI 답변의 근거 위치 (교안 p.9 · 발화 21:05). 칩을 누르면 인용 구절을 펼치고, 원문 보기로 근거 원문을 연다.
// 강연 후 90일이 지난 기록(originalExpired)은 원문이 지워져 위치와 인용 구절만 보여준다.
export function SourceChips({ sources, originalExpired = false }: { sources: Source[]; originalExpired?: boolean }) {
  const [open, setOpen] = useState<number | null>(null);
  const [viewing, setViewing] = useState<Source | null>(null);
  const cur = open !== null ? sources[open] : null;
  return (
    <div className="mt-3">
      <div className="flex flex-wrap gap-1.5">
        {sources.map((s, i) => (
          <button
            key={i}
            onClick={() => setOpen(open === i ? null : i)}
            aria-expanded={open === i}
            className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${open === i ? "bg-ink text-white" : "bg-white text-ink"}`}
          >
            <Icon name={s.kind === "slide" ? "file" : "mic"} size={13} />
            {s.label}
          </button>
        ))}
      </div>
      {cur && (
        <div className="mt-2 animate-rise rounded-2xl bg-white px-3.5 py-2.5 text-sm text-ink/65">
          “{cur.quote}”
          {originalExpired ? (
            <p className="mt-1.5 text-xs text-muted">강연 후 90일이 지나 원문은 지워졌어요. 위치와 인용 구절만 남아 있어요.</p>
          ) : (
            <button onClick={() => setViewing(cur)} className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-ink underline underline-offset-4">
              <Icon name="expand" size={12} /> 원문 보기
            </button>
          )}
        </div>
      )}
      <Modal open={!!viewing} onClose={() => setViewing(null)} title={viewing ? `${viewing.label} 원문` : undefined}>
        {viewing && (
          <>
            <p className="flex items-center gap-1.5 text-xs font-semibold text-muted">
              <Icon name={viewing.kind === "slide" ? "file" : "mic"} size={14} />
              {viewing.kind === "slide" ? "강연 교안" : "강연 발화 (앞뒤 30초)"}
            </p>
            <div className="mt-2 space-y-2 rounded-[20px] bg-white p-4 text-[15px] leading-relaxed">
              {viewing.kind === "speech" && <p className="text-ink/40">… 앞부분 발화 …</p>}
              <p>
                <mark className="rounded bg-honey/50 px-0.5 text-ink">{viewing.quote}</mark>
              </p>
              {viewing.kind === "speech" && <p className="text-ink/40">… 뒷부분 발화 …</p>}
            </div>
            <p className="mt-3 text-xs leading-relaxed text-muted">AI 답변이 근거로 쓴 부분을 표시했어요. 원문은 강연 후 90일 동안 볼 수 있어요.</p>
          </>
        )}
      </Modal>
    </div>
  );
}
