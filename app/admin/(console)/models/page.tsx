"use client";

import { useState } from "react";
import { AdminTitle, Dot, Panel } from "@/components/admin";
import { Sticker } from "@/components/Brand";
import { Icon } from "@/components/Icon";
import { Button, Modal, Pill, Progress, useToast } from "@/components/ui";
import { baseline, modelVersions, retrainedVersion, rocPoints, targets, type ModelVersion } from "@/lib/admin";
import { setDemo, useDemo } from "@/lib/store";

const trainSteps = ["ds-v4 불러오기", "판정 모델 파인튜닝", "같은 시험셋으로 평가", "경량화 · 버전 등록"];

// 새 버전은 서빙 중인 버전보다 성능이 같거나 좋을 때만 배포할 수 있다 (F12-4)
function gate(v: ModelVersion, serving: ModelVersion) {
  const reasons: string[] = [];
  if (v.auc < serving.auc) reasons.push(`ROC-AUC가 ${serving.id}보다 낮아요 (${v.auc.toFixed(2)} < ${serving.auc.toFixed(2)})`);
  if (v.wrongRate > serving.wrongRate) reasons.push(`오답 즉답률이 ${serving.id}보다 높아요 (${v.wrongRate}% > ${serving.wrongRate}%)`);
  if (v.wrongRate > targets.wrongRate) reasons.push(`오답 즉답률 목표(${targets.wrongRate}% 이하)를 넘었어요`);
  return reasons;
}

export default function AdminModels() {
  const { servingVersion, retrained, merged, servedVersions } = useDemo();
  const versions = retrained ? [retrainedVersion, ...modelVersions] : modelVersions;
  const serving = versions.find((v) => v.id === servingVersion) ?? null;
  const [selected, setSelected] = useState(versions[0].id);
  const sel = versions.find((v) => v.id === selected) ?? versions[0];
  const [training, setTraining] = useState<number | null>(null);
  const [deploy, setDeploy] = useState<ModelVersion | null>(null);
  const [rollback, setRollback] = useState(false);
  const toast = useToast();

  // 롤백은 이전에 서빙했던 버전으로만 (설계 2.4.3). 한 번도 서빙하지 않은 버전은 배포 관문을 거쳐야 한다
  const rollbackTargets = versions.filter((v) => v.id !== servingVersion && servedVersions.includes(v.id));
  const compareTo = serving ?? baseline;
  const blocked = sel.id === servingVersion ? [] : gate(sel, compareTo);

  function retrain() {
    setTraining(0);
    trainSteps.forEach((_, i) =>
      setTimeout(() => {
        if (i < trainSteps.length - 1) return setTraining(i + 1);
        setTraining(null);
        setDemo({ retrained: true });
        setSelected(retrainedVersion.id);
        toast.show(`재학습 완료 · ${retrainedVersion.id}가 등록됐어요`, "mint");
      }, (i + 1) * 1300),
    );
  }

  function switchTo(id: string) {
    setDemo((s) => ({ servingVersion: id, servedVersions: s.servedVersions.includes(id) ? s.servedVersions : [...s.servedVersions, id] }));
    setDeploy(null);
    setRollback(false);
    toast.show(id === "sonnet" ? "Sonnet 단독 판정으로 전환했어요" : `${id}로 서빙 버전을 바꿨어요`, id === "sonnet" ? "coral" : "mint");
  }

  return (
    <>
      {toast.node}
      <AdminTitle desc="판정 모델 버전별 성능을 보고, 재학습 · 배포 · 롤백을 해요">모델</AdminTitle>

      {/* F9-6 현재 서빙 버전 */}
      <div className="mt-6 flex flex-col gap-4 rounded-[24px] bg-ink p-5 text-white md:flex-row md:items-center">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-mint text-ink">
            <Icon name="cpu" size={22} />
          </span>
          <div>
            <p className="text-xs text-white/55">현재 서빙 중</p>
            <p className="text-[22px] font-extrabold tracking-[-0.04em]">{serving ? `판정 모델 ${serving.id}` : "Sonnet 단독 판정"}</p>
          </div>
        </div>
        <div className="flex flex-1 flex-wrap gap-x-6 gap-y-1 text-sm md:justify-center">
          {(() => {
            const v = serving ?? baseline;
            return (
              <>
                <span>
                  <span className="text-white/55">ROC-AUC </span>
                  <b>{v.auc.toFixed(2)}</b>
                </span>
                <span>
                  <span className="text-white/55">오답 즉답률 </span>
                  <b>{v.wrongRate}%</b>
                </span>
                <span>
                  <span className="text-white/55">AI 처리율 </span>
                  <b>{v.aiRate}%</b>
                </span>
              </>
            );
          })()}
        </div>
        <Button variant="white" size="sm" icon="undo" onClick={() => setRollback(true)}>
          롤백
        </Button>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[300px_1fr]">
        <div className="space-y-3">
          {/* F12-3 재학습 */}
          <Panel title="재학습" desc="검수한 라벨로 새 버전을 만들어요">
            {training !== null ? (
              <div className="space-y-2.5">
                {trainSteps.map((s, i) => (
                  <div key={s} className={`flex items-center gap-2.5 text-sm ${i > training ? "text-ink/35" : ""}`}>
                    <span className={`flex h-6 w-6 items-center justify-center rounded-full ${i < training ? "bg-mint" : i === training ? "bg-ink text-white" : "bg-paper"}`}>
                      {i < training ? <Icon name="check" size={13} /> : i === training ? <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> : null}
                    </span>
                    {s}
                  </div>
                ))}
                <Progress value={((training + 0.5) / trainSteps.length) * 100} className="mt-3" color="bg-mint" />
              </div>
            ) : retrained ? (
              <p className="flex items-center gap-2 text-sm">
                <Icon name="check" size={16} /> ds-v4로 {retrainedVersion.id}를 만들었어요
              </p>
            ) : (
              <>
                <div className="rounded-2xl bg-paper p-3 text-sm">
                  <p className="font-semibold">{merged ? "ds-v4로 재학습" : "병합된 새 데이터셋이 없어요"}</p>
                  <p className="mt-0.5 text-xs text-muted">학습서버 API로 요청해요. 실패하면 기존 버전을 그대로 써요.</p>
                </div>
                <Button className="mt-3 w-full" icon="play" disabled={!merged} onClick={retrain}>
                  재학습 실행
                </Button>
                {!merged && <p className="mt-2 text-center text-xs text-muted">데이터 · 라벨 화면에서 검수 라벨을 병합해 주세요</p>}
              </>
            )}
          </Panel>

          {/* 버전 목록 */}
          <Panel title="버전">
            <div className="space-y-2">
              {versions.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setSelected(v.id)}
                  className={`w-full rounded-[18px] p-3.5 text-left transition-colors ${selected === v.id ? "bg-ink text-white" : "bg-paper hover:bg-sand"}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold">{v.id}</span>
                    {v.id === servingVersion && <Pill className="bg-mint text-ink">서빙 중</Pill>}
                    {v.id === retrainedVersion.id && v.id !== servingVersion && <Pill className={selected === v.id ? "bg-white/15" : "bg-honey/40"}>NEW</Pill>}
                  </div>
                  <p className={`mt-0.5 text-xs ${selected === v.id ? "text-white/60" : "text-muted"}`}>
                    {v.created} · {v.dataset} · AUC {v.auc.toFixed(2)}
                  </p>
                </button>
              ))}
            </div>
          </Panel>
        </div>

        <div className="space-y-3">
          {/* F9-5 학습 결과 */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Metric label="ROC-AUC" value={sel.auc.toFixed(2)} target={`목표 ${targets.auc} 이상`} ok={sel.auc >= targets.auc} />
            <Metric label="오답 즉답률" value={`${sel.wrongRate}%`} target={`목표 ${targets.wrongRate}% 이하`} ok={sel.wrongRate <= targets.wrongRate} />
            <Metric label="AI 처리율" value={`${sel.aiRate}%`} target={`목표 ${targets.aiRate}% 이상`} ok={sel.aiRate >= targets.aiRate} />
            <Metric label="판정 지연 p50" value={`${sel.latency}ms`} target={`Sonnet 단독 ${baseline.latency}ms`} ok />
          </div>

          <div className="grid gap-3 md:grid-cols-[1fr_1.1fr]">
            <Panel title="ROC 곡선" desc={`${sel.id} vs 베이스라인`}>
              <Roc lines={[{ v: baseline, color: "#b9b3aa", dash: true }, ...(serving && serving.id !== sel.id ? [{ v: serving, color: "#3dbf6e" }] : []), { v: sel, color: "#121212" }]} />
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                <span className="flex items-center gap-1.5">
                  <Dot className="bg-ink" /> {sel.id}
                </span>
                {serving && serving.id !== sel.id && (
                  <span className="flex items-center gap-1.5">
                    <Dot className="bg-mint" /> {serving.id} (서빙 중)
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Dot className="bg-[#b9b3aa]" /> Sonnet 단독
                </span>
              </div>
            </Panel>

            {/* F12-4 버전 비교 · 배포 판단 */}
            <Panel title="버전 비교" desc={`같은 시험셋 기준 · ${sel.id} vs ${compareTo.id}${serving ? " (서빙 중)" : ""}`}>
              <table className="w-full text-sm">
                <thead className="text-xs text-muted">
                  <tr className="border-b border-line">
                    <th className="pb-2 text-left font-medium">지표</th>
                    <th className="pb-2 text-right font-medium">{sel.id}</th>
                    <th className="pb-2 text-right font-medium">{compareTo.id}</th>
                    <th className="pb-2 text-right font-medium">Sonnet 단독</th>
                  </tr>
                </thead>
                <tbody>
                  <Row label="ROC-AUC" a={sel.auc} b={compareTo.auc} c={baseline.auc} fmt={(n) => n.toFixed(2)} higher />
                  <Row label="오답 즉답률" a={sel.wrongRate} b={compareTo.wrongRate} c={baseline.wrongRate} fmt={(n) => `${n}%`} />
                  <Row label="AI 처리율" a={sel.aiRate} b={compareTo.aiRate} c={baseline.aiRate} fmt={(n) => `${n}%`} higher />
                  <Row label="판정 지연" a={sel.latency} b={compareTo.latency} c={baseline.latency} fmt={(n) => `${n}ms`} />
                </tbody>
              </table>
              <p className="mt-2 text-right text-[11px] text-muted">
                <span className="text-mint-ink">▲ 개선</span> · <span className="text-coral-ink">▼ 악화</span> ({compareTo.id} 대비)
              </p>

              <div className="mt-4">
                {sel.id === servingVersion ? (
                  <p className="flex items-center gap-2 rounded-2xl bg-mint/18 p-3 text-sm font-semibold">
                    <Icon name="check" size={16} /> 지금 서빙 중인 버전이에요
                  </p>
                ) : blocked.length ? (
                  <div className="rounded-2xl bg-coral/15 p-3 text-sm">
                    <p className="flex items-center gap-2 font-bold text-coral-ink">
                      <Icon name="lock" size={16} /> 배포 차단
                    </p>
                    <ul className="mt-1.5 space-y-0.5 text-xs text-ink/70">
                      {blocked.map((r) => (
                        <li key={r}>· {r}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <Button className="w-full" icon="upload" onClick={() => setDeploy(sel)}>
                    {sel.id} 배포
                  </Button>
                )}
              </div>
            </Panel>
          </div>
        </div>
      </div>

      <Modal open={!!deploy} onClose={() => setDeploy(null)} title={`${deploy?.id}를 배포할까요?`}>
        <p className="text-sm leading-relaxed text-muted">
          서빙 어댑터가 새 버전으로 바뀌어요. 진행 중인 세션은 다음 질문부터 새 버전으로 판정해요. 전환에 실패하면 지금 버전({serving?.id ?? "Sonnet 단독"})을 그대로 유지해요.
        </p>
        <div className="mt-6 flex gap-2">
          <Button variant="soft" className="flex-1" onClick={() => setDeploy(null)}>
            취소
          </Button>
          <Button className="flex-1" onClick={() => deploy && switchTo(deploy.id)}>
            배포하기
          </Button>
        </div>
      </Modal>

      <Modal open={rollback} onClose={() => setRollback(false)} title="어디로 되돌릴까요?">
        <p className="text-sm leading-relaxed text-muted">지표가 나빠졌을 때 이전에 서빙했던 버전이나 Sonnet 단독 판정으로 바로 돌아가요. 서빙한 적 없는 버전은 버전 비교를 거쳐 배포해 주세요.</p>
        <div className="mt-5 space-y-2">
          {rollbackTargets.map((v) => {
            const warn = v.wrongRate > targets.wrongRate;
            return (
              <button key={v.id} onClick={() => switchTo(v.id)} className="flex w-full items-center justify-between gap-3 rounded-[18px] bg-white p-4 text-left hover:bg-white/70">
                <span>
                  <span className="font-bold">판정 모델 {v.id}</span>
                  <span className="block text-xs text-muted">
                    AUC {v.auc.toFixed(2)} · 오답 즉답률 <span className={warn ? "font-semibold text-coral-ink" : ""}>{v.wrongRate}%</span>
                  </span>
                  {warn && (
                    <span className="mt-1 flex items-center gap-1 text-xs font-semibold text-coral-ink">
                      <Icon name="alert" size={12} /> 오답 즉답률이 목표({targets.wrongRate}% 이하)를 넘어요
                    </span>
                  )}
                </span>
                <Icon name="right" size={17} className="shrink-0" />
              </button>
            );
          })}
          {servingVersion !== "sonnet" && (
            <button onClick={() => switchTo("sonnet")} className="flex w-full items-center justify-between rounded-[18px] bg-coral/15 p-4 text-left">
              <span>
                <span className="font-bold">Sonnet 단독 판정</span>
                <span className="block text-xs text-muted">판정 모델을 끄고 대체 판정 경로만 써요 · 비용 증가</span>
              </span>
              <Sticker size={24}>🛟</Sticker>
            </button>
          )}
        </div>
      </Modal>
    </>
  );
}

function Metric({ label, value, target, ok }: { label: string; value: string; target: string; ok: boolean }) {
  return (
    <div className="rounded-[24px] bg-white p-4">
      <p className="text-sm font-medium text-ink/60">{label}</p>
      <p className="mt-2 text-[28px] font-extrabold leading-none tracking-[-0.04em]">{value}</p>
      <p className={`mt-2 flex items-center gap-1 text-xs ${ok ? "text-mint-ink" : "font-semibold text-coral-ink"}`}>
        <Icon name={ok ? "check" : "alert"} size={12} />
        {target}
      </p>
    </div>
  );
}

function Row({ label, a, b, c, fmt, higher = false }: { label: string; a: number; b: number; c: number; fmt: (n: number) => string; higher?: boolean }) {
  const better = a === b ? null : higher ? a > b : a < b;
  return (
    <tr className="border-b border-line last:border-0">
      <td className="py-2.5 text-ink/70">{label}</td>
      <td className={`py-2.5 text-right font-bold ${better === null ? "" : better ? "text-mint-ink" : "text-coral-ink"}`}>
        {fmt(a)}
        {better !== null && (
          <span className="ml-0.5 text-[10px]" aria-label={better ? "개선" : "악화"}>
            {better ? "▲" : "▼"}
          </span>
        )}
      </td>
      <td className="py-2.5 text-right">{fmt(b)}</td>
      <td className="py-2.5 text-right text-muted">{fmt(c)}</td>
    </tr>
  );
}

function Roc({ lines }: { lines: { v: ModelVersion; color: string; dash?: boolean }[] }) {
  const toPath = (auc: number) =>
    rocPoints(auc)
      .map(([x, y], i) => `${i ? "L" : "M"}${(x * 100).toFixed(1)} ${(100 - y * 100).toFixed(1)}`)
      .join(" ");
  return (
    <div className="relative">
      <svg viewBox="-8 -4 112 116" className="w-full" role="img" aria-label="ROC 곡선">
        {[0, 25, 50, 75, 100].map((t) => (
          <g key={t}>
            <line x1={0} x2={100} y1={t} y2={t} stroke="#e7e1d7" strokeWidth={0.4} />
            <line x1={t} x2={t} y1={0} y2={100} stroke="#e7e1d7" strokeWidth={0.4} />
          </g>
        ))}
        <line x1={0} y1={100} x2={100} y2={0} stroke="#d5cfc5" strokeWidth={0.6} strokeDasharray="2 2" />
        {lines.map((l) => (
          <path key={l.v.id} d={toPath(l.v.auc)} fill="none" stroke={l.color} strokeWidth={l.dash ? 1 : 1.8} strokeDasharray={l.dash ? "3 2" : undefined} strokeLinecap="round" />
        ))}
        <text x={50} y={110} textAnchor="middle" fontSize={4.5} fill="#8b867f">
          거짓 양성률 (넘겨야 할 질문에 AI가 답함)
        </text>
        <text x={-5} y={50} textAnchor="middle" fontSize={4.5} fill="#8b867f" transform="rotate(-90 -5 50)">
          참 양성률
        </text>
      </svg>
    </div>
  );
}
