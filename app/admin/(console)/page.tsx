"use client";

import { useState } from "react";
import { AdminTitle, Dot, Panel, Stat } from "@/components/admin";
import { Icon } from "@/components/Icon";
import { Progress, Tabs } from "@/components/ui";
import { costBudget, dailyMetrics, opsMetrics, sessionMetrics, type Period } from "@/lib/admin";

const won = (n: number) => `${n.toLocaleString()}원`;

export default function AdminDashboard() {
  const [period, setPeriod] = useState<Period>("week");
  const m = opsMetrics[period];
  const monthCost = opsMetrics.month.cost;
  const costRatio = monthCost / costBudget.limit;
  const perLecture = Math.round(m.cost / m.sessions);
  const maxQ = Math.max(...dailyMetrics.map((d) => d.questions));

  return (
    <>
      <AdminTitle
        desc="처리 로그(F4-7)를 세션 · 일 단위로 모았어요"
        action={
          <Tabs
            value={period}
            onChange={setPeriod}
            tabs={[
              { value: "today", label: "오늘" },
              { value: "week", label: "최근 7일" },
              { value: "month", label: "이번 달" },
            ]}
          />
        }
      >
        운영 지표
      </AdminTitle>

      {costRatio >= costBudget.alertAt && (
        <div className="mt-6 flex animate-pop items-center gap-3 rounded-[24px] bg-ink p-4 text-white">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-coral text-ink">
            <Icon name="alert" size={19} />
          </span>
          <div className="min-w-0 flex-1 text-sm">
            <p className="text-base font-bold">이번 달 API 비용이 한도의 {Math.round(costRatio * 100)}%에 도달했어요</p>
            <p className="text-white/55">
              {won(monthCost)} / {won(costBudget.limit)} · {Math.round(costBudget.alertAt * 100)}%를 넘으면 알림을 보내요
            </p>
          </div>
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="AI 처리율" value={`${m.aiRate}%`} sub={`질문 ${m.questions.toLocaleString()}건 중 · 목표 50% 이상`} tone="#3dbf6e" />
        <Stat label="강연자 이관 비율" value={`${m.forwardRate}%`} sub={`${Math.round((m.questions * m.forwardRate) / 100).toLocaleString()}건 이관`} tone="#f4625a" />
        <Stat label="응답 시간 p50 / p95" value={`${m.p50}s`} sub={`p95 ${m.p95}초 · 목표 3초 / 6초 이내`} warn={m.p95 > 6} />
        <Stat
          label="API 비용"
          value={won(m.cost)}
          sub={`강연 1회 평균 ${won(perLecture)} · 목표 ${won(costBudget.perLectureTarget)}`}
          warn={perLecture > costBudget.perLectureTarget}
          tone="#ffc830"
        />
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[1.4fr_1fr]">
        <Panel title="일별 질문 처리" desc="최근 7일 · 막대 위쪽이 AI가 답한 질문">
          <div className="flex h-48 items-end gap-2 md:gap-3">
            {dailyMetrics.map((d) => (
              <div key={d.day} className="flex h-full flex-1 flex-col items-center gap-1">
                <div className="flex w-full flex-1 flex-col items-center justify-end">
                  <span className="mb-1 text-xs font-bold">{d.questions || "–"}</span>
                  <div className="flex w-full flex-col overflow-hidden rounded-t-xl" style={{ height: `${(d.questions / maxQ) * 80}%` }}>
                    <div className="bg-mint" style={{ height: `${d.questions ? (d.ai / d.questions) * 100 : 0}%` }} />
                    <div className="flex-1 bg-coral" />
                  </div>
                </div>
                <span className="text-[10px] text-muted">{d.day}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-4 text-xs text-muted">
            <span className="flex items-center gap-1.5">
              <Dot className="bg-mint" /> AI 답변
            </span>
            <span className="flex items-center gap-1.5">
              <Dot className="bg-coral" /> 강연자 이관
            </span>
          </div>
        </Panel>

        <Panel title="이번 달 비용 한도" desc="Sonnet · 임베딩 · STT 호출 합계">
          <p className="text-[30px] font-extrabold leading-none tracking-[-0.04em]">
            {won(monthCost)}
            <span className="text-base font-semibold text-muted"> / {won(costBudget.limit)}</span>
          </p>
          <Progress value={costRatio * 100} className="mt-4 !h-3" color={costRatio >= costBudget.alertAt ? "bg-coral" : "bg-ink"} />
          <div className="mt-5 space-y-2.5 text-sm">
            {[
              ["Sonnet 답변 · 대체 판정", 0.62],
              ["임베딩 · 검색", 0.14],
              ["실시간 STT", 0.21],
              ["요약 노트", 0.03],
            ].map(([label, r]) => (
              <div key={label as string} className="flex items-center justify-between">
                <span className="text-ink/70">{label}</span>
                <span className="font-semibold">{won(Math.round(monthCost * (r as number)))}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="세션별 지표" desc="AI 처리율이 낮거나 응답이 느린 세션을 먼저 확인하세요" className="mt-3">
        <div className="-mx-5 overflow-x-auto px-5">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="text-xs text-muted">
              <tr className="border-b border-line">
                <th className="pb-2 font-medium">세션</th>
                <th className="pb-2 text-right font-medium">질문</th>
                <th className="pb-2 pl-4 font-medium">AI 처리율</th>
                <th className="pb-2 text-right font-medium">p50</th>
                <th className="pb-2 text-right font-medium">비용</th>
              </tr>
            </thead>
            <tbody>
              {sessionMetrics.map((s) => (
                <tr key={s.id} className="border-b border-line last:border-0">
                  <td className="py-3 pr-3 font-semibold">{s.title}</td>
                  <td className="py-3 text-right">{s.questions}</td>
                  <td className="w-40 py-3 pl-4">
                    <div className="flex items-center gap-2">
                      <Progress value={s.aiRate} className="flex-1" color={s.aiRate < 50 ? "bg-coral" : "bg-mint"} />
                      <span className={`w-9 text-right text-xs font-semibold ${s.aiRate < 50 ? "text-coral-ink" : ""}`}>{s.aiRate}%</span>
                    </div>
                  </td>
                  <td className={`py-3 text-right ${s.p50 > 3 ? "font-semibold text-coral-ink" : ""}`}>{s.p50}s</td>
                  <td className={`py-3 text-right ${s.cost > costBudget.perLectureTarget ? "font-semibold text-coral-ink" : ""}`}>{won(s.cost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
