"use client";

import { useState } from "react";
import { AdminTitle, Dot, Panel } from "@/components/admin";
import { Avatar } from "@/components/Brand";
import { Icon } from "@/components/Icon";
import { Button, Empty, Field, Modal, Pill, Tabs, inputCls, useToast } from "@/components/ui";
import { members as initialMembers, suspendReasons, type Member, type MemberStatus } from "@/lib/admin";

const statusLabel: Record<MemberStatus, string> = { active: "정상", suspended: "정지", unverified: "미인증" };
const statusDot: Record<MemberStatus, string> = { active: "bg-mint", suspended: "bg-coral", unverified: "bg-honey" };

export default function AdminMembers() {
  const [list, setList] = useState(initialMembers);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"all" | MemberStatus>("all");
  const [target, setTarget] = useState<Member | null>(null);
  const [reason, setReason] = useState(suspendReasons[0]);
  const [detail, setDetail] = useState("");
  const toast = useToast();

  const query = q.trim().toLowerCase();
  const shown = list.filter((m) => (tab === "all" || m.status === tab) && (!query || m.name.toLowerCase().includes(query) || m.email.includes(query)));
  const count = (s: MemberStatus) => list.filter((m) => m.status === s).length;

  function update(id: string, patch: Partial<Member>) {
    setList((l) => l.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }

  function suspend() {
    if (!target) return;
    update(target.id, { status: "suspended", suspendReason: detail.trim() ? `${reason} — ${detail.trim()}` : reason });
    toast.show(`${target.name} 님을 정지했어요. 다음 로그인부터 막혀요.`, "coral");
    setTarget(null);
    setDetail("");
  }

  return (
    <>
      {toast.node}
      <AdminTitle desc="회원을 찾아 정지 · 해제해요">회원 관리</AdminTitle>

      <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative md:w-80">
          <Icon name="search" size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/35" />
          <input className={`${inputCls} pl-11`} value={q} onChange={(e) => setQ(e.target.value)} placeholder="이름 또는 이메일 검색" />
        </div>
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { value: "all", label: "전체", count: list.length },
            { value: "active", label: "정상", count: count("active") },
            { value: "suspended", label: "정지", count: count("suspended") },
            { value: "unverified", label: "미인증", count: count("unverified") },
          ]}
        />
      </div>

      <Panel className="mt-4">
        {shown.length === 0 ? (
          <Empty title="찾는 회원이 없어요" emoji="🔍" />
        ) : (
          <div className="-mx-5 overflow-x-auto px-5">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-xs text-muted">
                <tr className="border-b border-line">
                  <th className="pb-2 font-medium">회원</th>
                  <th className="pb-2 font-medium">가입일</th>
                  <th className="pb-2 text-right font-medium">만든 강의</th>
                  <th className="pb-2 text-right font-medium">질문</th>
                  <th className="pb-2 pl-4 font-medium">상태</th>
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody>
                {shown.map((m) => (
                  <tr key={m.id} className="border-b border-line align-middle last:border-0">
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={m.name} size={36} className="!ring-0" />
                        <div className="min-w-0">
                          <p className="font-semibold">{m.name}</p>
                          <p className="truncate text-xs text-muted">{m.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-ink/70">{m.joined}</td>
                    <td className="py-3 text-right">{m.lectures}</td>
                    <td className="py-3 text-right">{m.questions}</td>
                    <td className="py-3 pl-4">
                      <Pill className="bg-paper">
                        <Dot className={statusDot[m.status]} />
                        {statusLabel[m.status]}
                      </Pill>
                      {m.suspendReason && m.status === "suspended" && <p className="mt-1 max-w-56 text-xs text-muted">{m.suspendReason}</p>}
                    </td>
                    <td className="py-3 text-right">
                      {m.status === "suspended" ? (
                        <Button
                          size="sm"
                          variant="soft"
                          onClick={() => {
                            update(m.id, { status: "active", suspendReason: undefined });
                            toast.show(`${m.name} 님의 정지를 풀었어요.`, "mint");
                          }}
                        >
                          정지 해제
                        </Button>
                      ) : (
                        <Button size="sm" variant="ghost" onClick={() => setTarget(m)}>
                          정지
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Modal open={!!target} onClose={() => setTarget(null)} title={`${target?.name} 님을 정지할까요?`}>
        <p className="text-sm leading-relaxed text-muted">정지된 회원은 로그인할 수 없고, 진행 중인 강의는 그대로 유지돼요. 사유는 회원에게 안내돼요.</p>
        <div className="mt-5 space-y-4">
          <Field label="정지 사유">
            <div className="flex flex-wrap gap-1.5">
              {suspendReasons.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(r)}
                  className={`rounded-full px-3.5 py-2 text-sm font-semibold ${reason === r ? "bg-ink text-white" : "bg-white text-ink/60"}`}
                >
                  {r}
                </button>
              ))}
            </div>
          </Field>
          <Field label="상세 내용 (선택)">
            <textarea className={`${inputCls} h-24 resize-none`} value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="확인한 내용을 적어 주세요" />
          </Field>
        </div>
        <div className="mt-6 flex gap-2">
          <Button variant="soft" className="flex-1" onClick={() => setTarget(null)}>
            취소
          </Button>
          <Button variant="danger" className="flex-1" onClick={suspend}>
            정지하기
          </Button>
        </div>
      </Modal>
    </>
  );
}
