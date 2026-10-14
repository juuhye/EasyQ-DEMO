"use client";

import { FakeQR } from "./FakeQR";
import { Logo, Sticker } from "./Brand";
import { Icon } from "./Icon";

// 강의실 화면에 띄우는 전체 화면 QR
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
