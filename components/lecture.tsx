"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";
import { Button, Modal, Progress, useToast } from "./ui";
import { endReasonText, type EndReason, type FileState } from "@/lib/mock";

// ── 강연자 화면 공통 요소 ─────────────────────────

export const MAX_MB = 50;

// 교안 파일 검사. 확장자만 바꾼 파일이나 깨진 파일: PDF는 %PDF, PPTX는 ZIP(PK) 헤더로 시작해야 한다
export async function validateDeck(f: File): Promise<string | null> {
  const ext = f.name.split(".").pop()?.toLowerCase();
  if (!ext || !["pdf", "pptx"].includes(ext)) return "PDF 또는 PPTX 파일만 올릴 수 있어요.";
  if (f.size > MAX_MB * 1024 * 1024) return `${MAX_MB}MB 이하 파일만 올릴 수 있어요.`;
  const head = new Uint8Array(await f.slice(0, 4).arrayBuffer());
  const ok = ext === "pdf" ? String.fromCharCode(...head) === "%PDF" : head[0] === 0x50 && head[1] === 0x4b;
  return ok ? null : "파일이 손상됐거나 열 수 없어요. 원본 파일을 다시 저장해서 올려 주세요.";
}

export function FileStatePill({ state }: { state: FileState }) {
  if (state === "none") return null;
  const [cls, label] = { processing: ["bg-honey/40", "처리 중"], done: ["bg-mint/25", "완료"], failed: ["bg-[#e5484d]/12 text-[#e5484d]", "실패"] }[state];
  return <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}>{label}</span>;
}

export function EndReasonPill({ reason }: { reason: EndReason }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${reason === "admin" ? "bg-coral/20 text-coral-ink" : "bg-white text-ink/60"}`}>
      <Icon name={reason === "auto" ? "clock" : reason === "admin" ? "shield" : "check"} size={12} />
      {endReasonText[reason]}
    </span>
  );
}

// 강연 시작 시 음성 인식(STT) 동의
export function SttConsentModal({ open, onClose, onConfirm, noFile = false }: { open: boolean; onClose: () => void; onConfirm: () => void; noFile?: boolean }) {
  const [agree, setAgree] = useState(false);
  const close = () => {
    setAgree(false);
    onClose();
  };
  return (
    <Modal open={open} onClose={close} title="음성 인식에 동의해 주세요">
      <p className="text-sm leading-relaxed text-muted">강연을 시작하면 마이크 음성을 실시간으로 인식해 AI 답변의 근거로 써요.</p>
      <ul className="mt-4 space-y-2 rounded-[20px] bg-white p-4 text-sm leading-relaxed">
        {[
          ["🎙️", "강연 음성은 실시간으로 외부 음성 인식 서비스(Google Gemini)에 보내 텍스트로 바꿔요. 원본 파일은 저장하지 않아요."],
          ["📝", "인식된 발화 텍스트는 강연이 끝나고 90일 뒤 자동으로 지워져요."],
          ["⏸️", "강연 중 언제든 인식을 일시정지할 수 있어요."],
        ].map(([e, t]) => (
          <li key={t} className="flex gap-2.5">
            <span aria-hidden>{e}</span>
            {t}
          </li>
        ))}
      </ul>
      {noFile && (
        <p className="mt-3 flex items-start gap-1.5 rounded-2xl bg-honey/30 px-3 py-2.5 text-sm">
          <Icon name="alert" size={16} className="mt-0.5 shrink-0" />
          교안 없이 시작해요. AI는 발화만 근거로 답하고, 진행 중에 교안을 추가로 올릴 수 있어요.
        </p>
      )}
      <button type="button" role="checkbox" aria-checked={agree} onClick={() => setAgree((a) => !a)} className="mt-4 flex w-full items-center gap-3 text-left text-sm font-semibold">
        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white ${agree ? "bg-ink" : "bg-ink/10"}`}>
          <Icon name="check" size={14} stroke={3.2} />
        </span>
        위 내용을 확인했고 음성 인식에 동의해요
      </button>
      <div className="mt-6 flex gap-2">
        <Button variant="soft" className="flex-1" onClick={close}>
          취소
        </Button>
        <Button className="flex-1" icon="play" disabled={!agree} onClick={onConfirm}>
          동의하고 시작
        </Button>
      </div>
    </Modal>
  );
}

// ── 교안 목록 ─────────────────────────────────────

export type DeckFile = { id: string; name: string; pages: number; state: FileState; failReason?: string; progress?: number };

// LIVE: 추가 업로드만 (삭제 없음) · ENDED: 삭제만. 처리 상태는 처리 중 / 완료 / 실패로 보여준다
export function TeachingFiles({ initial, canUpload, canDelete }: { initial: DeckFile[]; canUpload: boolean; canDelete: boolean }) {
  const [files, setFiles] = useState(initial);
  const [error, setError] = useState("");
  const [removing, setRemoving] = useState<DeckFile | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const replacing = useRef<string | null>(null);
  const toast = useToast();
  const showToast = toast.show;

  // 처리 진행 시뮬레이션. 데모: 이름에 fail이 들어간 파일은 실패한다
  const processing = files.some((f) => f.state === "processing");
  useEffect(() => {
    if (!processing) return;
    const t = setTimeout(() => {
      const finished: string[] = [];
      setFiles(
        files.map((f) => {
          if (f.state !== "processing") return f;
          const progress = Math.min(100, (f.progress ?? 0) + 8 + Math.random() * 10);
          if (progress < 100) return { ...f, progress };
          if (/fail/i.test(f.name)) return { ...f, progress, state: "failed", failReason: "텍스트를 추출하지 못했어요. 스캔한 PDF일 수 있어요." };
          finished.push(f.name);
          return { ...f, progress, state: "done" };
        }),
      );
      finished.forEach((name) => showToast(`${name} 처리가 끝났어요`, "mint"));
    }, 400);
    return () => clearTimeout(t);
  }, [files, processing, showToast]);

  async function pick(f: File) {
    const err = await validateDeck(f);
    if (err) return setError(err);
    setError("");
    const next: DeckFile = { id: crypto.randomUUID(), name: f.name, pages: 20 + Math.floor(Math.random() * 20), state: "processing", progress: 0 };
    const target = replacing.current;
    replacing.current = null;
    setFiles((list) => (target ? list.map((x) => (x.id === target ? next : x)) : [...list, next]));
  }

  return (
    <div className="rounded-[24px] bg-white p-4">
      {files.length === 0 && <p className="py-2 text-center text-sm text-muted">올린 교안이 없어요</p>}
      <ul className="space-y-3">
        {files.map((f) => (
          <li key={f.id}>
            <div className="flex items-center gap-3">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${f.state === "failed" ? "bg-[#e5484d]/12 text-[#e5484d]" : "bg-sand"}`}>
                <Icon name="file" size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{f.name}</p>
                <p className="text-xs text-muted">{f.state === "processing" ? "AI가 교안을 읽는 중이에요" : f.state === "failed" ? "처리 실패" : `${f.pages}쪽`}</p>
              </div>
              <FileStatePill state={f.state} />
              {canDelete && f.state !== "processing" && (
                <button onClick={() => setRemoving(f)} className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-ink/5" aria-label={`${f.name} 삭제`}>
                  <Icon name="trash" size={16} />
                </button>
              )}
            </div>
            {f.state === "processing" && <Progress value={f.progress ?? 0} className="mt-2" />}
            {f.state === "failed" && (
              <div className="mt-2 rounded-2xl bg-[#e5484d]/8 p-3 text-xs">
                <p className="text-ink/70">{f.failReason}</p>
                {canUpload && (
                  <>
                    <p className="mt-1 text-ink/70">텍스트가 있는 PDF · PPTX로 교체해 주세요. 교체하면 처음부터 다시 처리해요.</p>
                    <Button
                      size="sm"
                      variant="ghost"
                      icon="upload"
                      className="mt-2"
                      onClick={() => {
                        replacing.current = f.id;
                        inputRef.current?.click();
                      }}
                    >
                      파일 교체
                    </Button>
                  </>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>

      {canUpload && (
        <button
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files[0];
            if (f) pick(f);
          }}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-ink/15 px-4 py-4 text-sm font-semibold text-ink/70 transition-colors hover:border-ink/40"
        >
          <Icon name="upload" size={17} /> 교안 추가로 올리기
          <span className="font-normal text-muted">PDF · PPTX · {MAX_MB}MB</span>
        </button>
      )}
      <input ref={inputRef} type="file" accept=".pdf,.pptx" className="hidden" onChange={(e) => (e.target.files?.[0] && pick(e.target.files[0]), (e.target.value = ""))} />
      {error && <p className="mt-2 text-center text-sm text-[#e5484d]">{error}</p>}
      {toast.node}

      <Modal open={!!removing} onClose={() => setRemoving(null)} title="교안을 삭제할까요?">
        <p className="rounded-2xl bg-white p-3.5 font-bold">{removing?.name}</p>
        <p className="mt-3 text-sm leading-relaxed text-muted">교안 파일과 검색 인덱스가 지워지고 되돌릴 수 없어요. 이미 만든 요약 노트와 질문 기록은 남아요.</p>
        <div className="mt-6 flex gap-2">
          <Button variant="soft" className="flex-1" onClick={() => setRemoving(null)}>
            취소
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            onClick={() => {
              setFiles((list) => list.filter((x) => x.id !== removing?.id));
              setRemoving(null);
              showToast("교안을 삭제했어요");
            }}
          >
            삭제하기
          </Button>
        </div>
      </Modal>
    </div>
  );
}
