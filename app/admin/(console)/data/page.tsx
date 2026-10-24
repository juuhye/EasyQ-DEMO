"use client";

import { useState } from "react";
import { AdminTitle, Dot, Panel } from "@/components/admin";
import { Icon } from "@/components/Icon";
import { Button, Pill, Progress, Tabs } from "@/components/ui";
import { datasets, forwardKinds, judgeThreshold, labelCandidates, labelText, type LabelCandidate, type LabelKind } from "@/lib/admin";
import { setDemo, useDemo } from "@/lib/store";

const flip = (k: LabelKind): LabelKind => (k === "answerable" ? "forward" : "answerable");
const originTone = { 철회: "bg-coral/20", 이관: "bg-ocean/15", "피드백 👎": "bg-honey/40" };

export default function AdminData() {
  const [tab, setTab] = useState<"dataset" | "review">("dataset");
  const { labelDecisions } = useDemo();
  const pending = labelCandidates.filter((c) => !labelDecisions[c.id]).length;

  return (
    <>
      <AdminTitle desc="판정 모델 학습 데이터와, 서비스에서 모인 라벨 후보를 관리해요">데이터 · 라벨</AdminTitle>
      <Tabs
        className="mt-6"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "dataset", label: "데이터셋 현황" },
          { value: "review", label: "라벨 검수", count: pending },
        ]}
      />
      {tab === "dataset" ? <DatasetView /> : <ReviewView />}
    </>
  );
}

// F9-4 데이터셋 현황
function DatasetView() {
  const [selected, setSelected] = useState(datasets[0].id);
  const ds = datasets.find((d) => d.id === selected)!;
  const answerRate = Math.round((ds.answerable / ds.total) * 100);
  const maxKind = Math.max(...forwardKinds.map((k) => k.count));

  return (
    <div className="mt-4 grid animate-rise gap-3 lg:grid-cols-[300px_1fr]">
      <Panel title="버전">
        <div className="space-y-2">
          {datasets.map((d, i) => (
            <button
              key={d.id}
              onClick={() => setSelected(d.id)}
              className={`w-full rounded-[18px] p-3.5 text-left transition-colors ${selected === d.id ? "bg-ink text-white" : "bg-paper hover:bg-sand"}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold">{d.id}</span>
                {i === 0 && <span className={`text-xs font-semibold ${selected === d.id ? "text-white/60" : "text-muted"}`}>최신</span>}
              </div>
              <p className={`mt-0.5 text-xs ${selected === d.id ? "text-white/60" : "text-muted"}`}>
                {d.created} · {d.total.toLocaleString()}건
              </p>
            </button>
          ))}
        </div>
      </Panel>

      <div className="space-y-3">
        <Panel title={`${ds.id} 라벨 분포`} desc={`${ds.note} · 분할 ${ds.split}`}>
          <div className="flex h-4 gap-1 overflow-hidden">
            <div className="rounded-full bg-mint" style={{ width: `${answerRate}%` }} />
            <div className="flex-1 rounded-full bg-coral" />
          </div>
          <div className="mt-2.5 flex justify-between text-sm">
            <span className="flex items-center gap-1.5">
              <Dot className="bg-mint" /> AI 답변 가능 <b>{ds.answerable.toLocaleString()}</b>
              <span className="text-muted">({answerRate}%)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Dot className="bg-coral" /> 강연자 이관 <b>{ds.forward.toLocaleString()}</b>
              <span className="text-muted">({100 - answerRate}%)</span>
            </span>
          </div>
        </Panel>

        <div className="grid gap-3 md:grid-cols-2">
          <Panel title="데이터 출처">
            <div className="space-y-3">
              {ds.sources.map((s) => (
                <div key={s.label}>
                  <div className="flex justify-between text-sm">
                    <span className="text-ink/70">{s.label}</span>
                    <b>{s.count.toLocaleString()}</b>
                  </div>
                  <Progress value={(s.count / ds.total) * 100} className="mt-1.5" />
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="이관 질문 유형" desc="ds-v3 기준">
            <div className="flex h-32 items-end gap-3">
              {forwardKinds.map((k) => (
                <div key={k.label} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                  <span className="text-xs font-bold">{k.count}</span>
                  <div className="w-full rounded-t-xl bg-coral" style={{ height: `${(k.count / maxKind) * 75}%` }} />
                </div>
              ))}
            </div>
            <div className="mt-2 flex gap-3">
              {forwardKinds.map((k) => (
                <span key={k.label} className="flex-1 text-center text-[11px] leading-tight text-muted">
                  {k.label}
                </span>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

// F12-2 라벨 검수
type Decision = "approve" | "flip" | "exclude";

// 임계값 바로 아래 점수부터, 임계값에서 가까운 순서로 검수한다
const reviewOrder = [...labelCandidates].sort((a, b) => {
  const below = (c: LabelCandidate) => (c.score < judgeThreshold ? 0 : 1);
  return below(a) - below(b) || Math.abs(a.score - judgeThreshold) - Math.abs(b.score - judgeThreshold);
});

function ReviewView() {
  const { labelDecisions, labelEvidence } = useDemo();
  const [choosing, setChoosing] = useState<Record<string, { d: Decision; evidence: string | null }>>({});
  const decided = Object.values(labelDecisions);
  const accepted = decided.filter((d) => d !== "exclude").length;

  function decide(id: string, d: Decision | null, evidence?: string) {
    setDemo((s) => {
      const next = { ...s.labelDecisions };
      const ev = { ...s.labelEvidence };
      if (d) next[id] = d;
      else delete next[id];
      if (evidence) ev[id] = evidence;
      else delete ev[id];
      return { labelDecisions: next, labelEvidence: ev };
    });
    closeChoice(id);
  }

  function closeChoice(id: string) {
    setChoosing((m) => {
      const next = { ...m };
      delete next[id];
      return next;
    });
  }

  // 답변 가능으로 확정할 때는 검수자가 정답 근거를 먼저 고른다
  function pick(c: LabelCandidate, d: Decision) {
    const final = d === "approve" ? c.suggested : d === "flip" ? flip(c.suggested) : null;
    if (final === "answerable") return setChoosing((m) => ({ ...m, [c.id]: { d, evidence: null } }));
    decide(c.id, d);
  }

  return (
    <div className="mt-4 animate-rise">
      <div className="flex flex-wrap items-center gap-3 rounded-[24px] bg-ink p-4 text-white">
        <div className="min-w-0 flex-1 text-sm">
          <p className="text-base font-bold">
            검수 {decided.length} / {labelCandidates.length}
          </p>
          <p className="text-white/55">
            철회 · 이관 · 👎 피드백이 익명 라벨 후보로 모였어요. 판정 임계값 {judgeThreshold.toFixed(2)} 바로 아래 점수부터 보여줘요. 승인 · 수정한 {accepted}건은 다음 데이터셋 ds-v4에 들어가요.
          </p>
        </div>
        <Progress value={(decided.length / labelCandidates.length) * 100} className="w-full !bg-white/15 md:w-48" color="bg-mint" />
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {reviewOrder.map((c) => {
          const d = labelDecisions[c.id];
          const final = d === "approve" ? c.suggested : d === "flip" ? flip(c.suggested) : null;
          const ch = choosing[c.id];
          return (
            <div key={c.id} className={`flex flex-col rounded-[24px] bg-white p-5 transition-opacity ${d ? "opacity-60" : ""}`}>
              <div className="flex flex-wrap items-center gap-1.5">
                <Pill className={originTone[c.origin]}>{c.origin}</Pill>
                <span className="text-xs text-muted">{c.lecture}</span>
              </div>
              <p className="mt-3 text-[16px] font-semibold leading-snug">{c.question}</p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-2xl bg-paper p-3">
                  <p className="text-muted">모델 판정</p>
                  <p className="mt-0.5 font-bold">
                    {labelText[c.predicted]} <span className="font-normal text-muted">({c.score.toFixed(2)})</span>
                  </p>
                </div>
                <div className={`rounded-2xl p-3 ${c.suggested === "answerable" ? "bg-mint/18" : "bg-coral/15"}`}>
                  <p className="text-muted">제안 라벨</p>
                  <p className="mt-0.5 font-bold">{labelText[c.suggested]}</p>
                </div>
              </div>
              {c.evidence && <p className="mt-3 text-xs leading-relaxed text-ink/60">검수 메모: {c.evidence}</p>}

              <div className="mt-auto pt-4">
                {d ? (
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-sm font-semibold">
                        <Icon name={d === "exclude" ? "x" : "check"} size={16} />
                        {d === "exclude" ? "학습에서 제외" : `${withParticle(labelText[final!])} 확정${d === "flip" ? " · 수정" : ""}`}
                      </span>
                      <button onClick={() => decide(c.id, null)} className="flex items-center gap-1 text-xs text-muted underline underline-offset-4">
                        <Icon name="undo" size={13} /> 되돌리기
                      </button>
                    </div>
                    {labelEvidence[c.id] && <p className="mt-1.5 text-xs text-ink/60">정답 근거: {labelEvidence[c.id]}</p>}
                  </div>
                ) : ch ? (
                  <div className="rounded-2xl bg-paper p-3">
                    <p className="text-xs font-semibold text-ink/70">AI 답변 가능으로 확정하려면 정답 근거를 골라 주세요</p>
                    <div role="radiogroup" aria-label="정답 근거" className="mt-2 space-y-1.5">
                      {c.evidenceOptions.map((ev) => (
                        <button
                          key={ev}
                          role="radio"
                          aria-checked={ch.evidence === ev}
                          onClick={() => setChoosing((m) => ({ ...m, [c.id]: { ...ch, evidence: ev } }))}
                          className={`flex w-full items-start gap-2 rounded-xl bg-white p-2.5 text-left text-xs ring-inset ${ch.evidence === ev ? "ring-2 ring-ink" : ""}`}
                        >
                          <span className={`mt-px flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-white ${ch.evidence === ev ? "bg-ink" : "bg-ink/10"}`}>
                            <Icon name="check" size={10} stroke={3.2} />
                          </span>
                          {ev}
                        </button>
                      ))}
                    </div>
                    <div className="mt-2.5 flex gap-2">
                      <Button size="sm" className="flex-1" icon="check" disabled={!ch.evidence} onClick={() => ch.evidence && decide(c.id, ch.d, ch.evidence)}>
                        근거와 함께 확정
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => closeChoice(c.id)}>
                        취소
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1" icon="check" onClick={() => pick(c, "approve")}>
                      승인
                    </Button>
                    <Button size="sm" variant="soft" className="flex-1" icon="pen" onClick={() => pick(c, "flip")}>
                      {withParticle(labelText[flip(c.suggested)])} 수정
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => pick(c, "exclude")}>
                      제외
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 받침에 맞춰 ‘로’/‘으로’를 붙인다 (ㄹ 받침은 ‘로’)
function withParticle(word: string) {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  const jong = code >= 0 && code <= 11171 ? code % 28 : 0;
  return `${word}${jong === 0 || jong === 8 ? "로" : "으로"}`;
}
