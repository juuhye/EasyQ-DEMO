"use client";

import { useState } from "react";
import { AdminTitle, Panel } from "@/components/admin";
import { Icon } from "@/components/Icon";
import { Button, Empty, Modal, StatusPill, Tabs, useToast } from "@/components/ui";
import { adminSessions, type AdminSession } from "@/lib/admin";
import { setDemo } from "@/lib/store";

export default function AdminSessions() {
  const [list, setList] = useState(adminSessions);
  const [tab, setTab] = useState<"all" | AdminSession["status"]>("all");
  const [target, setTarget] = useState<AdminSession | null>(null);
  const toast = useToast();

  const shown = list.filter((s) => tab === "all" || s.status === tab);
  const count = (st: AdminSession["status"]) => list.filter((s) => s.status === st).length;
  const issues = list.filter((s) => s.status === "live" && s.issue);

  function forceEnd() {
    if (!target) return;
    setList((l) => l.map((s) => (s.id === target.id ? { ...s, status: "ended", issue: undefined } : s)));
    // 데모 강연자 화면(내 강의)에도 종료가 반영되도록
    setDemo((s) => ({ endedLectures: [...s.endedLectures, target.id] }));
    toast.show("세션을 강제 종료했어요. 질문이 마감되고 QR이 꺼졌어요.", "coral");
    setTarget(null);
  }

  return (
    <>
      {toast.node}
      <AdminTitle desc="모든 회원의 세션을 보고, 문제가 생긴 세션을 강제로 종료해요">세션 관리</AdminTitle>

      {issues.length > 0 && (
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {issues.map((s) => (
            <div key={s.id} className="flex items-start gap-3 rounded-[24px] bg-coral/15 p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-coral">
                <Icon name="alert" size={19} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-bold">{s.title}</p>
                <p className="mt-0.5 text-sm text-coral-ink">{s.issue}</p>
              </div>
              <Button size="sm" variant="danger" onClick={() => setTarget(s)}>
                강제 종료
              </Button>
            </div>
          ))}
        </div>
      )}

      <Tabs
        className="mt-6"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "all", label: "전체", count: list.length },
          { value: "live", label: "진행 중", count: count("live") },
          { value: "ready", label: "준비", count: count("ready") },
          { value: "ended", label: "종료", count: count("ended") },
        ]}
      />

      <Panel className="mt-4">
        {shown.length === 0 ? (
          <Empty title="해당하는 세션이 없어요" />
        ) : (
          <div className="-mx-5 overflow-x-auto px-5">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="text-xs text-muted">
                <tr className="border-b border-line">
                  <th className="pb-2 font-medium">세션</th>
                  <th className="pb-2 font-medium">강연자</th>
                  <th className="pb-2 font-medium">일시</th>
                  <th className="pb-2 text-right font-medium">청중</th>
                  <th className="pb-2 text-right font-medium">질문</th>
                  <th className="pb-2 pl-4 font-medium">상태</th>
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody>
                {shown.map((s) => (
                  <tr key={s.id} className="border-b border-line last:border-0">
                    <td className="py-3 pr-3">
                      <p className="font-semibold">{s.title}</p>
                      <p className="text-xs text-muted">
                        입장 코드 {s.code}
                        {s.issue && <span className="ml-1.5 font-semibold text-coral-ink">· 확인 필요</span>}
                      </p>
                    </td>
                    <td className="py-3 text-ink/70">{s.speaker}</td>
                    <td className="py-3 text-ink/70">{s.date}</td>
                    <td className="py-3 text-right">{s.audience}</td>
                    <td className="py-3 text-right">{s.questions}</td>
                    <td className="py-3 pl-4">
                      <StatusPill status={s.status} onColor />
                    </td>
                    <td className="py-3 text-right">
                      {s.status !== "ended" && (
                        <Button size="sm" variant="ghost" onClick={() => setTarget(s)}>
                          강제 종료
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

      <Modal open={!!target} onClose={() => setTarget(null)} title="세션을 강제 종료할까요?">
        <p className="font-semibold">{target?.title}</p>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          강연자가 종료한 것과 같이 처리돼요. 질문 접수가 마감되고 QR · 입장 링크가 꺼지며, 강연자와 청중 {target?.audience ?? 0}명에게 종료 안내가 가요.
        </p>
        <div className="mt-6 flex gap-2">
          <Button variant="soft" className="flex-1" onClick={() => setTarget(null)}>
            취소
          </Button>
          <Button variant="danger" className="flex-1" onClick={forceEnd}>
            강제 종료
          </Button>
        </div>
      </Modal>
    </>
  );
}
