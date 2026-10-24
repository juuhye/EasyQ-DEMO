"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Avatar, Sticker } from "@/components/Brand";
import { Icon, type IconName } from "@/components/Icon";
import { Button, Field, Modal, Screen, inputCls, useToast } from "@/components/ui";
import { MOCK_PASSWORD } from "@/lib/auth";
import { archive, inquiries, lectures, me, notices } from "@/lib/mock";
import { setDemo, useDemo } from "@/lib/store";

type Sheet = null | "name" | "pw" | "notice" | "inquiry" | "leave";

export default function Me() {
  const router = useRouter();
  const toast = useToast();
  const { name } = useDemo();
  const [sheet, setSheet] = useState<Sheet>(null);
  const [draftName, setDraftName] = useState(name);
  const [pw, setPw] = useState({ cur: "", next: "" });
  const [pwError, setPwError] = useState("");
  const [openNotice, setOpenNotice] = useState<string | null>(null);
  const [inq, setInq] = useState({ title: "", body: "" });
  const hasLive = lectures.some((l) => l.status === "live");

  const menu: { icon: IconName; label: string; sheet: Sheet; badge?: string }[] = [
    { icon: "pen", label: "표시명 변경", sheet: "name" },
    { icon: "lock", label: "비밀번호 변경", sheet: "pw" },
    { icon: "megaphone", label: "공지사항", sheet: "notice", badge: "N" },
    { icon: "chat", label: "1:1 문의", sheet: "inquiry" },
  ];

  return (
    <Screen nav>
      {toast.node}
      <div className="flex flex-col items-center px-5 pt-10">
        <div className="relative">
          <Avatar name={name} size={96} className="!ring-4" />
          <button onClick={() => setSheet("name")} className="absolute -right-1 bottom-0 flex h-8 w-8 items-center justify-center rounded-full bg-ink text-white" aria-label="표시명 변경">
            <Icon name="pen" size={14} />
          </button>
        </div>
        <p className="mt-3 text-[26px] font-extrabold tracking-[-0.04em]">{name}</p>
        <p className="text-sm text-muted">{me.email}</p>
        <p className="mt-1.5 text-sm">🔥 {me.streak}주 연속 참여 중</p>
      </div>

      <div className="px-5">
        <div className="mt-6 grid grid-cols-3 rounded-[24px] bg-white py-4 text-center">
          {[
            [archive.length, "참여 강의"],
            [archive.reduce((s, a) => s + a.myQuestions.length, 0), "내 질문"],
            [lectures.length, "만든 강의"],
          ].map(([n, l]) => (
            <div key={l}>
              <p className="text-[26px] font-extrabold tracking-[-0.04em]">{n}</p>
              <p className="text-xs text-muted">{l}</p>
            </div>
          ))}
        </div>

        <p className="mb-3 mt-8 text-[19px] font-bold tracking-[-0.03em]">배지 보관함</p>
        <div className="grid grid-cols-4 gap-2 md:max-w-md md:gap-3">
          {[
            ["🏅", "첫 질문"],
            ["🔥", "4주 연속"],
            ["💛", "공감 50"],
            ["🔒", "???"],
          ].map(([e, l]) => (
            <div key={l} className="flex flex-col items-center gap-1.5">
              <span className={`flex aspect-square w-full items-center justify-center rounded-[20px] text-3xl ${l === "???" ? "bg-sand" : "bg-white"}`}>
                <span className={l === "???" ? "opacity-40" : "sticker"}>{e}</span>
              </span>
              <span className="text-[11px] text-muted">{l}</span>
            </div>
          ))}
        </div>

        <div className="mt-7 space-y-2">
          {menu.map((m) => (
            <button key={m.label} onClick={() => setSheet(m.sheet)} className="flex w-full items-center gap-3 rounded-[20px] bg-white px-4 py-4 text-left">
              <Icon name={m.icon} size={19} className="text-muted" />
              <span className="flex-1">{m.label}</span>
              {m.badge && <span className="h-2 w-2 rounded-full bg-coral" />}
              <Icon name="right" size={16} className="text-muted" />
            </button>
          ))}
          <button onClick={() => router.push("/")} className="flex w-full items-center gap-3 rounded-[20px] bg-white px-4 py-4 text-left">
            <Icon name="logout" size={19} className="text-muted" />
            <span className="flex-1">로그아웃</span>
          </button>
        </div>
        <button onClick={() => setSheet("leave")} className="mx-auto mb-6 mt-6 block text-sm text-muted underline underline-offset-4">
          회원 탈퇴
        </button>
      </div>

      {/* 표시명 */}
      <Modal open={sheet === "name"} onClose={() => setSheet(null)} title="표시명 변경">
        <input className={inputCls} value={draftName} onChange={(e) => setDraftName(e.target.value)} maxLength={12} />
        <Button
          className="mt-4 w-full"
          disabled={!draftName.trim()}
          onClick={() => {
            setDemo({ name: draftName.trim() });
            setSheet(null);
            toast.show("표시명을 바꿨어요", "mint");
          }}
        >
          저장
        </Button>
      </Modal>

      {/* 비밀번호 */}
      <Modal open={sheet === "pw"} onClose={() => setSheet(null)} title="비밀번호 변경">
        <div className="space-y-3">
          <Field label="현재 비밀번호" error={pwError}>
            <input type="password" className={inputCls} value={pw.cur} onChange={(e) => setPw({ ...pw, cur: e.target.value })} />
          </Field>
          <Field label="새 비밀번호" hint="8자 이상, 영문 · 숫자 포함">
            <input type="password" className={inputCls} value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
          </Field>
        </div>
        <Button
          className="mt-4 w-full"
          onClick={() => {
            if (pw.cur !== MOCK_PASSWORD) return setPwError("현재 비밀번호가 맞지 않아요.");
            if (!(pw.next.length >= 8 && /[a-zA-Z]/.test(pw.next) && /\d/.test(pw.next))) return setPwError("새 비밀번호 규칙을 확인해 주세요.");
            setPwError("");
            setPw({ cur: "", next: "" });
            setSheet(null);
            toast.show("비밀번호를 바꿨어요", "mint");
          }}
        >
          변경하기
        </Button>
      </Modal>

      {/* 공지 */}
      <Modal open={sheet === "notice"} onClose={() => setSheet(null)} title="공지사항">
        <ul className="space-y-2">
          {notices.map((n) => (
            <li key={n.id} className="rounded-[20px] bg-white">
              <button onClick={() => setOpenNotice(openNotice === n.id ? null : n.id)} className="flex w-full items-center gap-2 p-4 text-left">
                <span className="flex-1">
                  <span className="block font-bold">{n.title}</span>
                  <span className="text-xs text-muted">{n.date}</span>
                </span>
                <Icon name="right" size={16} className={`text-muted transition-transform ${openNotice === n.id ? "rotate-90" : ""}`} />
              </button>
              {openNotice === n.id && <p className="animate-rise border-t border-line px-4 pb-4 pt-3 text-sm leading-relaxed text-muted">{n.body}</p>}
            </li>
          ))}
        </ul>
      </Modal>

      {/* 문의 */}
      <Modal open={sheet === "inquiry"} onClose={() => setSheet(null)} title="1:1 문의">
        <div className="space-y-2">
          {inquiries.map((q) => (
            <div key={q.id} className="rounded-[20px] bg-white p-4">
              <div className="flex items-center gap-2">
                <p className="flex-1 font-bold">{q.title}</p>
                <span className="rounded-full bg-mint px-2.5 py-1 text-xs font-semibold">{q.status}</span>
              </div>
              <p className="mt-2 rounded-xl bg-paper p-3 text-sm text-muted">↳ {q.answer}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 space-y-2">
          <input className={inputCls} placeholder="문의 제목" value={inq.title} onChange={(e) => setInq({ ...inq, title: e.target.value })} />
          <textarea className={`${inputCls} resize-none`} rows={3} placeholder="어떤 점이 궁금하신가요?" value={inq.body} onChange={(e) => setInq({ ...inq, body: e.target.value })} />
        </div>
        <Button
          className="mt-3 w-full"
          disabled={!inq.title.trim() || !inq.body.trim()}
          onClick={() => {
            setInq({ title: "", body: "" });
            setSheet(null);
            toast.show("문의를 보냈어요. 답변이 오면 알려드릴게요", "mint");
          }}
        >
          문의 보내기
        </Button>
      </Modal>

      {/* 탈퇴 */}
      <Modal open={sheet === "leave"} onClose={() => setSheet(null)}>
        <div className="flex flex-col items-center text-center">
          <Sticker size={56} rotate={-8}>
            🥲
          </Sticker>
          <p className="mt-4 text-[22px] font-extrabold tracking-[-0.04em]">정말 떠나시나요?</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">탈퇴하면 내 질문, 답변, 요약 노트가 모두 지워지고 되돌릴 수 없어요.</p>
          {hasLive && (
            <p className="mt-3 flex items-center gap-1.5 rounded-2xl bg-coral/20 px-3 py-2.5 text-left text-sm">
              <Icon name="alert" size={16} className="shrink-0" />
              진행 중인 강의가 있어요. 강의를 먼저 종료해야 탈퇴할 수 있어요.
            </p>
          )}
        </div>
        <div className="mt-6 flex gap-2">
          <Button variant="soft" className="flex-1" onClick={() => setSheet(null)}>
            더 써볼게요
          </Button>
          <Button variant="danger" className="flex-1" disabled={hasLive} onClick={() => router.push("/")}>
            탈퇴하기
          </Button>
        </div>
      </Modal>
    </Screen>
  );
}
