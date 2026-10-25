"use client";

import { useState } from "react";
import { AdminTitle, Panel } from "@/components/admin";
import { Icon } from "@/components/Icon";
import { Button, Field, Modal, Pill, Tabs, inputCls, useToast } from "@/components/ui";
import { adminInquiries } from "@/lib/admin";
import { notices as initialNotices } from "@/lib/mock";

export default function AdminNotices() {
  const [tab, setTab] = useState<"notice" | "inquiry">("notice");
  const [notices, setNotices] = useState(initialNotices);
  const [inquiries, setInquiries] = useState(adminInquiries);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  // 수정 중인 공지 id. null이면 새 공지를 쓴다
  const [editing, setEditing] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(inquiries.find((i) => !i.answer)?.id ?? null);
  const [reply, setReply] = useState("");
  const toast = useToast();
  const waiting = inquiries.filter((i) => !i.answer).length;

  function post(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    if (editing) {
      setNotices((n) => n.map((x) => (x.id === editing ? { ...x, title: title.trim(), body: body.trim() } : x)));
      toast.show("공지를 수정했어요", "mint");
    } else {
      setNotices((n) => [{ id: `n${Date.now()}`, title: title.trim(), body: body.trim(), date: "2026.10.22" }, ...n]);
      toast.show("공지를 올렸어요. 회원 홈에 바로 보여요.", "mint");
    }
    cancelEdit();
  }

  function startEdit(id: string) {
    const n = notices.find((x) => x.id === id);
    if (!n) return;
    setEditing(id);
    setTitle(n.title);
    setBody(n.body);
  }

  function cancelEdit() {
    setEditing(null);
    setTitle("");
    setBody("");
  }

  function remove() {
    setNotices((n) => n.filter((x) => x.id !== removing));
    if (editing === removing) cancelEdit();
    setRemoving(null);
    toast.show("공지를 삭제했어요");
  }

  function answer(id: string) {
    if (!reply.trim()) return;
    setInquiries((l) => l.map((i) => (i.id === id ? { ...i, answer: reply.trim() } : i)));
    setReply("");
    setOpen(null);
    toast.show("답변을 보냈어요. 회원에게 알림이 가요.", "mint");
  }

  return (
    <>
      {toast.node}
      <AdminTitle desc="회원에게 보일 공지를 올리고, 들어온 문의에 답해요">공지 · 문의</AdminTitle>
      <Tabs
        className="mt-6"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "notice", label: "공지", count: notices.length },
          { value: "inquiry", label: `문의 · 대기 ${waiting}` },
        ]}
      />

      {tab === "notice" ? (
        <div className="mt-4 grid animate-rise gap-3 lg:grid-cols-[1fr_1.2fr]">
          <Panel title={editing ? "공지 수정" : "새 공지"}>
            <form onSubmit={post} className="space-y-4">
              <Field label="제목">
                <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예: 11/3 서버 점검 안내" />
              </Field>
              <Field label="내용">
                <textarea className={`${inputCls} h-36 resize-none`} value={body} onChange={(e) => setBody(e.target.value)} placeholder="회원에게 보일 내용을 적어 주세요" />
              </Field>
              <div className="flex gap-2">
                {editing && (
                  <Button type="button" variant="soft" className="flex-1" onClick={cancelEdit}>
                    취소
                  </Button>
                )}
                <Button type="submit" className="flex-1" icon={editing ? "check" : "megaphone"} disabled={!title.trim() || !body.trim()}>
                  {editing ? "수정 저장" : "공지 올리기"}
                </Button>
              </div>
            </form>
          </Panel>
          <Panel title="올린 공지">
            <div className="space-y-2">
              {notices.map((n) => (
                <div key={n.id} className={`animate-rise rounded-[18px] bg-paper p-4 ${editing === n.id ? "ring-2 ring-ink" : ""}`}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold">{n.title}</p>
                    <span className="shrink-0 text-xs text-muted">{n.date}</span>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-ink/70">{n.body}</p>
                  <div className="mt-3 flex justify-end gap-1.5">
                    <Button size="sm" variant="ghost" icon="pen" onClick={() => startEdit(n.id)}>
                      수정
                    </Button>
                    <Button size="sm" variant="ghost" icon="trash" onClick={() => setRemoving(n.id)}>
                      삭제
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      ) : (
        <div className="mt-4 animate-rise space-y-2.5">
          {inquiries.map((i) => (
            <div key={i.id} className="rounded-[24px] bg-white p-5">
              <button className="flex w-full items-start gap-3 text-left" onClick={() => setOpen(open === i.id ? null : i.id)}>
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${i.answer ? "bg-mint" : "bg-honey"}`}>
                  <Icon name={i.answer ? "check" : "chat"} size={17} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold">{i.title}</p>
                  <p className="text-xs text-muted">
                    {i.from} · {i.date}
                  </p>
                </div>
                <Pill className={i.answer ? "bg-mint/18" : "bg-honey/40"}>{i.answer ? "답변 완료" : "답변 대기"}</Pill>
              </button>
              {open === i.id && (
                <div className="mt-4 animate-rise border-t border-line pt-4">
                  <p className="text-sm leading-relaxed">{i.body}</p>
                  {i.answer ? (
                    <div className="mt-3 rounded-2xl bg-paper p-3.5 text-sm leading-relaxed">
                      <p className="mb-1 text-xs font-semibold text-muted">운영자 답변</p>
                      {i.answer}
                    </div>
                  ) : (
                    <div className="mt-3 space-y-2">
                      <textarea className={`${inputCls} h-28 resize-none`} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="답변을 적어 주세요" />
                      <div className="flex justify-end">
                        <Button size="sm" icon="send" disabled={!reply.trim()} onClick={() => answer(i.id)}>
                          답변 보내기
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={!!removing} onClose={() => setRemoving(null)} title="이 공지를 삭제할까요?">
        <p className="rounded-2xl bg-white p-3.5 font-bold">{notices.find((n) => n.id === removing)?.title}</p>
        <p className="mt-3 text-sm leading-relaxed text-muted">회원 화면의 공지사항에서 바로 사라지고 되돌릴 수 없어요.</p>
        <div className="mt-6 flex gap-2">
          <Button variant="soft" className="flex-1" onClick={() => setRemoving(null)}>
            취소
          </Button>
          <Button variant="danger" className="flex-1" onClick={remove}>
            삭제하기
          </Button>
        </div>
      </Modal>
    </>
  );
}
