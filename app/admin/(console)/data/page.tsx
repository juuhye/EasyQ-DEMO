"use client";

import { useState } from "react";
import { AdminTitle, Dot, Panel } from "@/components/admin";
import { Icon } from "@/components/Icon";
import { Button, Pill, Progress, Tabs, useToast } from "@/components/ui";
import { datasets, forwardKinds, judgeThresholds, labelCandidates, labelText, type LabelCandidate } from "@/lib/admin";
import { setDemo, useDemo, type LabelDecision } from "@/lib/store";
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

// F12-2 라벨 검수: 질문 · 기본 라벨 · 검색 후보를 보고 정답 근거를 고른다. 근거가 없으면 강연자 이관 라벨이 된다
const NONE = "__none__";

function sameDecision(a: LabelDecision, b: NonNullable<LabelCandidate["other"]>) {
  return a.label === b.label && (a.label !== "answerable" || a.evidence === b.evidence);
}

function ReviewView() {
  const { labelDecisions, mergedLabels } = useDemo();
  const toast = useToast();
  const versions = Object.keys(judgeThresholds);
  const [version, setVersion] = useState(versions[0]);
  const [picked, setPicked] = useState<Record<string, string>>({});
  const threshold = judgeThresholds[version];
  // 고른 모델 버전의 임계값에 가까운 점수부터 검수한다
  const order = [...labelCandidates].sort((a, b) => Math.abs(a.scores[version] - threshold) - Math.abs(b.scores[version] - threshold));
  const decided = labelCandidates.filter((c) => labelDecisions[c.id]);
  const accepted = decided.filter((c) => labelDecisions[c.id].label !== "exclude").length;

  // 확정 라벨을 다음 데이터셋에 병합한다 (설계 7장 병합 API). 재학습은 병합된 라벨로 한다
  function merge() {
    setDemo({ mergedLabels: accepted });
    toast.show(`확정 ${accepted}건을 ds-v4에 병합했어요`, "mint");
  }
  const conflicts = decided.filter((c) => c.other && !sameDecision(labelDecisions[c.id], c.other)).length;

  function decide(id: string, d: LabelDecision | null) {
    setDemo((s) => {
      const next = { ...s.labelDecisions };
      if (d) next[id] = d;
      else delete next[id];
      return { labelDecisions: next };
    });
  }

  function confirm(c: LabelCandidate) {
    const p = picked[c.id];
    if (!p) return;
    decide(c.id, p === NONE ? { label: "forward", evidence: null } : { label: "answerable", evidence: p });
  }

  return (
    <div className="mt-4 animate-rise">
      {toast.node}
      <div className="flex flex-wrap items-center gap-3 rounded-[24px] bg-ink p-4 text-white">
        <div className="min-w-0 flex-1 text-sm">
          <p className="text-base font-bold">
            검수 {decided.length} / {labelCandidates.length}
            {conflicts > 0 && <span className="ml-2 rounded-full bg-coral px-2 py-0.5 text-xs text-ink">불일치 {conflicts}</span>}
          </p>
          <p className="text-white/55">철회 · 이관 · 👎 피드백이 익명 라벨 후보로 모였어요. 확정한 {accepted}건을 병합하면 다음 데이터셋 ds-v4에 들어가요{mergedLabels > 0 && ` · 병합됨 ${mergedLabels}건`}.</p>
        </div>
        <Progress value={(decided.length / labelCandidates.length) * 100} className="w-full !bg-white/15 md:w-48" color="bg-mint" />
        <Button size="sm" variant="white" icon="layers" disabled={accepted === 0} onClick={merge}>
          확정 라벨 병합
        </Button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-ink/70">모델 버전</span>
        <Tabs value={version} onChange={setVersion} tabs={versions.map((v) => ({ value: v, label: v }))} />
        <span className="text-xs text-muted">임계값 {threshold.toFixed(2)}에 가까운 순</span>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {order.map((c) => {
          const d = labelDecisions[c.id];
          const score = c.scores[version];
          const conflict = d && c.other && !sameDecision(d, c.other);
          return (
            <div key={c.id} className={`flex flex-col rounded-[24px] bg-white p-5 ${conflict ? "ring-2 ring-coral" : ""}`}>
              <div className="flex flex-wrap items-center gap-1.5">
                <Pill className={originTone[c.origin]}>{c.origin}</Pill>
                <span className="text-xs text-muted">{c.lecture}</span>
                {conflict && <Pill className="ml-auto bg-coral text-ink">불일치</Pill>}
              </div>
              <p className="mt-3 text-[16px] font-semibold leading-snug">{c.question}</p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className={`rounded-2xl p-3 ${c.base === "answerable" ? "bg-mint/18" : "bg-coral/15"}`}>
                  <p className="text-muted">기본 라벨</p>
                  <p className="mt-0.5 font-bold">{labelText[c.base]}</p>
                </div>
                <div className="rounded-2xl bg-paper p-3">
                  <p className="text-muted">{version} 판정 점수</p>
                  <p className="mt-0.5 font-bold">
                    {score.toFixed(2)}{" "}
                    <span className="font-normal text-muted">
                      (임계값 {score >= threshold ? "+" : ""}
                      {(score - threshold).toFixed(2)})
                    </span>
                  </p>
                </div>
              </div>

              {d ? (
                <div className="mt-4 space-y-2 text-sm">
                  <div className="rounded-2xl bg-paper p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 font-semibold">
                        <Icon name={d.label === "exclude" ? "x" : "check"} size={16} />내 검수 · {d.label === "exclude" ? "학습에서 제외" : labelText[d.label]}
                      </span>
                      <button onClick={() => decide(c.id, null)} className="flex items-center gap-1 text-xs text-muted underline underline-offset-4">
                        <Icon name="undo" size={13} /> 되돌리기
                      </button>
                    </div>
                    {d.label !== "exclude" && <p className="mt-1 text-xs text-ink/60">정답 근거: {d.evidence ?? "없음"}</p>}
                  </div>
                  <div className={`rounded-2xl p-3 ${conflict ? "bg-coral/15" : "bg-paper"}`}>
                    {c.other ? (
                      <>
                        <p className="font-semibold">
                          {c.other.reviewer} · {c.other.label === "exclude" ? "학습에서 제외" : labelText[c.other.label]}
                        </p>
                        {c.other.label !== "exclude" && <p className="mt-1 text-xs text-ink/60">정답 근거: {c.other.evidence ?? "없음"}</p>}
                        {conflict && <p className="mt-1 text-xs font-semibold text-coral-ink">두 검수 결과가 달라요. 다시 검토해 주세요.</p>}
                      </>
                    ) : (
                      <p className="text-xs text-muted">다른 검수자가 아직 검수하지 않았어요</p>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <p className="mt-4 text-xs font-semibold text-ink/70">검색 후보 중 정답 근거를 골라 주세요</p>
                  <div role="radiogroup" aria-label="정답 근거" className="mt-2 space-y-1.5">
                    {[...c.hits.map((h) => ({ key: h.source, label: h.source, score: h.score as number | null })), { key: NONE, label: "정답 근거 없음 → 강연자 이관", score: null }].map((o) => {
                      const on = picked[c.id] === o.key;
                      return (
                        <button
                          key={o.key}
                          role="radio"
                          aria-checked={on}
                          onClick={() => setPicked((m) => ({ ...m, [c.id]: o.key }))}
                          className={`flex w-full items-start gap-2 rounded-xl bg-paper p-2.5 text-left text-xs ring-inset ${on ? "ring-2 ring-ink" : ""}`}
                        >
                          <span className={`mt-px flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-white ${on ? "bg-ink" : "bg-ink/10"}`}>
                            <Icon name="check" size={10} stroke={3.2} />
                          </span>
                          <span className="flex-1">{o.label}</span>
                          {o.score !== null && <span className="shrink-0 text-muted tabular-nums">{o.score.toFixed(2)}</span>}
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-3 flex items-center gap-1.5 text-xs text-muted">
                    <Icon name="lock" size={12} /> 다른 검수자의 결과는 내 검수를 마친 뒤에 보여요
                  </p>
                  <div className="mt-auto flex gap-2 pt-3">
                    <Button size="sm" className="flex-1" icon="check" disabled={!picked[c.id]} onClick={() => confirm(c)}>
                      확정
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => decide(c.id, { label: "exclude", evidence: null })}>
                      학습에서 제외
                    </Button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
