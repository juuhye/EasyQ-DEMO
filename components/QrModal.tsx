"use client";

import { useState } from "react";
import { FakeQR } from "./FakeQR";
import { Logo, Sticker } from "./Brand";
import { Icon } from "./Icon";
import { Button, Modal } from "./ui";
import { newCode } from "@/lib/mock";
import { setDemo } from "@/lib/store";

// 입장 QR · 코드 재발급 (API-42). 이전 QR과 코드는 바로 무효가 된다
export function QrReissue({ lectureId, onDone }: { lectureId: string; onDone: (code: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="sm" variant="ghost" icon="undo" onClick={() => setOpen(true)}>
        재발급
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="입장 QR을 재발급할까요?">
        <p className="text-sm leading-relaxed text-muted">새 QR과 입장 코드가 만들어지고, 이전 QR · 코드 · 링크로는 더 이상 들어올 수 없어요. 이미 입장한 청중은 그대로 참여해요.</p>
        <div className="mt-6 flex gap-2">
          <Button variant="soft" className="flex-1" onClick={() => setOpen(false)}>
            취소
          </Button>
          <Button
            className="flex-1"
            onClick={() => {
              const code = newCode();
              setDemo((s) => ({ codes: { ...s.codes, [lectureId]: code } }));
              setOpen(false);
              onDone(code);
            }}
          >
            재발급하기
          </Button>
        </div>
      </Modal>
    </>
  );
}

// 강연장 화면에 띄우는 전체 화면 QR
export function QrModal({ open, onClose, code, title }: { open: boolean; onClose: () => void; code: string; title: string }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex animate-pop flex-col items-center justify-center bg-ink p-6 text-white" onClick={onClose}>
      <button className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full bg-white/12" aria-label="닫기">
        <Icon name="x" />
      </button>
      <Logo light className="absolute left-6 top-6 text-2xl" />
      <p className="max-w-3xl text-center text-3xl font-extrabold tracking-[-0.04em] md:text-5xl">{title}</p>
      <p className="mt-3 text-white/55">QR을 찍고 질문을 남겨주세요</p>
      <div className="relative mt-10">
        <div className="rounded-[36px] bg-white p-6">
          <FakeQR code={code} size={280} />
        </div>
        <Sticker size={64} rotate={-12} float className="absolute -bottom-6 -left-10">
          🙋
        </Sticker>
        <Sticker size={56} rotate={14} float className="absolute -right-8 -top-6">
          💬
        </Sticker>
      </div>
      <p className="mt-10 text-6xl font-extrabold tracking-[0.25em] md:text-8xl">{code}</p>
      <p className="mt-3 text-white/55">easyq.app 에서 코드 입력</p>
    </div>
  );
}
