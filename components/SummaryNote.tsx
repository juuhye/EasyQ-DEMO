import { Sticker } from "./Brand";
import { type ArchiveItem, type Tone, tones } from "@/lib/mock";

export function SummaryNote({ note, tone }: { note: NonNullable<ArchiveItem["note"]>; tone: Tone }) {
  return (
    <div className="space-y-3">
      <div className="relative rounded-[26px] p-5" style={{ backgroundColor: tones[tone].hex }}>
        <p className="mb-1.5 text-xs font-semibold text-ink/55">한 줄 요약</p>
        <p className="pr-8 text-[20px] font-extrabold leading-snug tracking-[-0.04em]">{note.headline}</p>
        <Sticker size={34} rotate={12} className="absolute -right-1 -top-3">
          📝
        </Sticker>
      </div>
      {note.sections.map((s) => (
        <div key={s.title} className="rounded-[24px] bg-white p-5">
          <p className="mb-3 font-bold">{s.title}</p>
          <ul className="space-y-2.5">
            {s.points.map((p, i) => (
              <li key={p} className="flex gap-3 text-[15px] leading-relaxed">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sand text-[11px] font-bold">{i + 1}</span>
                {p}
              </li>
            ))}
          </ul>
        </div>
      ))}
      <div className="flex flex-wrap gap-1.5">
        {note.keywords.map((k) => (
          <span key={k} className="rounded-full bg-white px-3 py-1.5 text-sm font-semibold">
            #{k}
          </span>
        ))}
      </div>
      <p className="pt-1 text-xs text-muted">강연 발화와 교안을 바탕으로 AI가 강연 종료 후 한 번 만들었어요.</p>
    </div>
  );
}
