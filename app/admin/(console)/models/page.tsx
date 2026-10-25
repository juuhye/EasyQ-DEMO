"use client";

import { useEffect, useRef, useState } from "react";
import { AdminTitle, Dot, Panel } from "@/components/admin";
import { Sticker } from "@/components/Brand";
import { Icon } from "@/components/Icon";
import { Button, Modal, Pill, Progress, useToast } from "@/components/ui";
import { LLM_ONLY, baseline, lossCurve, modelVersions, retrainedVersion, rocPoints, servingConfig, targets, trainStages, type ModelVersion } from "@/lib/admin";
import { DEMO } from "@/lib/demo";
import { setDemo, useDemo } from "@/lib/store";

// 새 버전은 서빙 중인 버전보다 성능이 같거나 좋을 때만 전환할 수 있다 (F12-4)
function gate(v: ModelVersion, serving: ModelVersion) {
  const reasons: string[] = [];
  if (v.auc < serving.auc) reasons.push(`ROC-AUC가 ${serving.id}보다 낮아요 (${v.auc.toFixed(2)} < ${serving.auc.toFixed(2)})`);
  if (v.wrongRate > serving.wrongRate) reasons.push(`오답 즉답률이 ${serving.id}보다 높아요 (${v.wrongRate}% > ${serving.wrongRate}%)`);
  if (v.wrongRate > targets.wrongRate) reasons.push(`오답 즉답률 목표(${targets.wrongRate}% 이하)를 넘었어요`);
  return reasons;
}

const servingName = (id: string) => (id === LLM_ONLY ? "LLM_ONLY (Sonnet 단독 판정)" : `판정 모델 ${id}`);

export default function AdminModels() {
  const { servingVersion, retrained, mergedLabels, servedVersions } = useDemo();
  const versions = retrained ? [retrainedVersion, ...modelVersions] : modelVersions;
  const serving = versions.find((v) => v.id === servingVersion) ?? null;
  const [selected, setSelected] = useState(versions[0].id);
  const sel = versions.find((v) => v.id === selected) ?? versions[0];
  // 재학습 진행률(0~100). null이면 멈춰 있다
  const [progress, setProgress] = useState<number | null>(null);
  const [stopOpen, setStopOpen] = useState(false);
  const [confirm, setConfirm] = useState<{ kind: "switch" | "rollback"; id: string } | null>(null);
  const [rollbackOpen, setRollbackOpen] = useState(false);
  const [connected, setConnected] = useState(true);
  const toast = useToast();
  const showToast = toast.show;
  const finishing = useRef(false);

  // 재학습은 데이터 · 라벨 화면에서 병합한 확정 라벨로 한다
  const accepted = mergedLabels;
  const compareTo = serving ?? baseline;
  const everServed = (id: string) => servedVersions.includes(id);
  // 롤백 대상: 서빙한 적 있는 버전 + LLM_ONLY. 서빙한 적 없는 버전은 버전 비교를 거쳐 전환한다
  const rollbackTargets = [...versions.filter((v) => v.id !== servingVersion && everServed(v.id)).map((v) => v.id), ...(servingVersion !== LLM_ONLY ? [LLM_ONLY] : [])];
  const blocked = sel.id === servingVersion || sel.held || everServed(sel.id) ? [] : gate(sel, compareTo);
  const stage = progress === null ? -1 : Math.min(trainStages.length - 1, Math.floor(progress / 25));

  // 재학습 진행 시뮬레이션: 학습 → fp16 변환 → 평가 → 등록. 평가에서 목표 미달이면 HELD로 보류한다
  useEffect(() => {
    if (progress === null) return;
    if (progress >= 100) {
      if (finishing.current) return;
      finishing.current = true;
      setProgress(null);
      setDemo({ retrained: true });
      setSelected(retrainedVersion.id);
      showToast(retrainedVersion.held ? `${retrainedVersion.id} 평가 결과 HELD · 등록을 보류했어요` : `재학습 완료 · ${retrainedVersion.id}가 등록됐어요`, retrainedVersion.held ? "coral" : "mint");
      return;
    }
    const t = setTimeout(() => setProgress((p) => (p === null ? null : Math.min(100, p + 3))), 180);
    return () => clearTimeout(t);
  }, [progress, showToast]);

  function retrain() {
    finishing.current = false;
    setProgress(0);
  }

  // API-47: 진행 중인 재학습을 멈춘다. 새 버전은 만들어지지 않고 서빙 버전도 그대로다
  function stopTraining() {
    setProgress(null);
    setStopOpen(false);
    toast.show("재학습을 중단했어요. 서빙 중인 버전은 그대로예요", "coral");
  }

  function switchTo(id: string, kind: "switch" | "rollback") {
    setDemo((s) => ({ servingVersion: id, servedVersions: s.servedVersions.includes(id) ? s.servedVersions : [...s.servedVersions, id] }));
    setConfirm(null);
    setRollbackOpen(false);
    toast.show(kind === "rollback" ? `${servingName(id)}(으)로 롤백했어요` : `${id}로 전환했어요`, id === LLM_ONLY ? "coral" : "mint");
  }

  return (
    <>
      {toast.node}
      <AdminTitle desc="판정 모델 버전별 평가 결과를 보고, 재학습 · 전환 · 롤백을 해요">모델</AdminTitle>

      {/* F9-6 현재 서빙 버전 */}
      <div className="mt-6 flex flex-col gap-4 rounded-[24px] bg-ink p-5 text-white md:flex-row md:items-center">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-mint text-ink">
            <Icon name="cpu" size={22} />
          </span>
          <div>
            <p className="text-xs text-white/55">현재 서빙 중</p>
            <p className="text-[22px] font-extrabold tracking-[-0.04em]">{servingName(servingVersion)}</p>
          </div>
        </div>
        <div className="flex flex-1 flex-wrap gap-x-6 gap-y-1 text-sm md:justify-center">
          <span>
            <span className="text-white/55">ROC-AUC </span>
            <b>{compareTo.auc.toFixed(2)}</b>
          </span>
          <span>
            <span className="text-white/55">오답 즉답률 </span>
            <b>{compareTo.wrongRate}%</b>
          </span>
          <span>
            <span className="text-white/55">AI 처리율 </span>
            <b>{compareTo.aiRate}%</b>
          </span>
        </div>
        <Button variant="white" size="sm" icon="undo" disabled={rollbackTargets.length === 0} onClick={() => setRollbackOpen(true)}>
          롤백
        </Button>
      </div>

      {/* 서빙 설정 · 학습서버 연결 */}
      <Panel
        className="mt-3"
        title="서빙 설정"
        desc={`추론 경로: ${servingConfig.route} · 장애 시 ${servingConfig.fallback} → LLM_ONLY`}
        action={
          DEMO && (
            <button onClick={() => setConnected((c) => !c)} className="text-xs text-muted underline underline-offset-4">
              데모 · {connected ? "연결 끊김 보기" : "다시 연결"}
            </button>
          )
        }
      >
        {connected ? (
          <p className="flex items-center gap-2 text-sm">
            <Dot className="bg-mint" /> 학습서버 연결됨 · 학습 상태와 버전 목록을 실시간으로 받고 있어요
          </p>
        ) : (
          <div className="flex items-start gap-2 rounded-2xl bg-coral/15 p-3 text-sm">
            <Icon name="wifi" size={16} className="mt-0.5 shrink-0 text-coral-ink" />
            <div>
              <p className="font-bold text-coral-ink">학습서버 연결이 끊겼어요</p>
              <p className="mt-0.5 text-ink/70">
                마지막 동기화 <b>{servingConfig.lastSync}</b> · 아래 정보는 이 시각 기준이에요. 서빙 중인 모델은 그대로 동작해요.
              </p>
            </div>
          </div>
        )}
      </Panel>

      <div className="mt-3 grid gap-3 lg:grid-cols-[320px_1fr]">
        <div className="space-y-3">
          {/* F12-3 재학습 */}
          <Panel title="재학습" desc="검수한 라벨로 새 버전을 만들어요">
            {progress !== null ? (
              <div>
                <div className="flex items-baseline justify-between">
                  <p className="text-sm font-semibold">{trainStages[stage]} 중</p>
                  <p className="text-[22px] font-extrabold tabular-nums">{Math.round(progress)}%</p>
                </div>
                <Progress value={progress} className="mt-2" color="bg-mint" />
                <ol className="mt-3 flex items-center gap-1 text-[11px]">
                  {trainStages.map((s, i) => (
                    <li key={s} className={`flex flex-1 items-center gap-1 ${i > stage ? "text-ink/35" : i === stage ? "font-bold" : "text-ink/60"}`}>
                      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${i < stage ? "bg-mint" : i === stage ? "bg-ink text-white" : "bg-paper"}`}>
                        {i < stage ? <Icon name="check" size={11} /> : i + 1}
                      </span>
                      {s}
                    </li>
                  ))}
                </ol>
                <LossChart upto={stage === 0 ? Math.max(1, Math.ceil((progress / 25) * lossCurve.length)) : lossCurve.length} />
                <Button variant="ghost" size="sm" className="mt-3 w-full" icon="x" onClick={() => setStopOpen(true)}>
                  재학습 중단
                </Button>
              </div>
            ) : retrained ? (
              <div className="space-y-3">
                <p className="flex items-center gap-2 text-sm">
                  <Icon name="check" size={16} /> ds-v4로 {retrainedVersion.id} 학습을 마쳤어요
                </p>
                {retrainedVersion.held && (
                  <div className="rounded-2xl bg-coral/15 p-3 text-sm">
                    <p className="flex items-center gap-1.5 font-bold text-coral-ink">
                      <Icon name="lock" size={15} /> HELD · 등록 보류
                    </p>
                    <p className="mt-1 text-xs text-ink/70">{retrainedVersion.held}</p>
                  </div>
                )}
                <LossChart upto={lossCurve.length} />
              </div>
            ) : (
              <>
                <div className="rounded-2xl bg-paper p-3 text-sm">
                  <p className="font-semibold">ds-v3 + 검수 라벨 {accepted}건 → ds-v4</p>
                  <p className="mt-0.5 text-xs text-muted">학습 → fp16 변환 → 평가 → 등록 순서로 진행해요. 실패하면 기존 버전을 그대로 써요.</p>
                </div>
                <Button className="mt-3 w-full" icon="play" disabled={accepted === 0 || !connected} onClick={retrain}>
                  재학습 실행
                </Button>
                {!connected ? (
                  <p className="mt-2 text-center text-xs text-muted">학습서버에 다시 연결되면 실행할 수 있어요</p>
                ) : (
                  accepted === 0 && <p className="mt-2 text-center text-xs text-muted">데이터 · 라벨 화면에서 확정 라벨을 병합해 주세요</p>
                )}
              </>
            )}
          </Panel>

          {/* 버전 목록 */}
          <Panel title="버전">
            <div className="space-y-2">
              {versions.map((v) => {
                const on = selected === v.id;
                return (
                  <button key={v.id} onClick={() => setSelected(v.id)} className={`w-full rounded-[18px] p-3.5 text-left transition-colors ${on ? "bg-ink text-white" : "bg-paper hover:bg-sand"}`}>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="mr-auto font-bold">{v.id}</span>
                      {v.id === servingVersion && <Pill className="bg-mint text-ink">서빙 중</Pill>}
                      {v.id !== servingVersion && everServed(v.id) && <Pill className={on ? "bg-white/15" : "bg-white"}>서빙 이력</Pill>}
                      {v.held && <Pill className="bg-coral text-ink">HELD</Pill>}
                    </div>
                    <p className={`mt-0.5 text-xs ${on ? "text-white/60" : "text-muted"}`}>
                      {v.created} · {v.dataset} · AUC {v.auc.toFixed(2)}
                    </p>
                  </button>
                );
              })}
            </div>
          </Panel>
        </div>

        <div className="space-y-3">
          {/* F9-5 평가 결과 (오답 즉답률 · 정확도는 이 화면에만 둔다) */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Metric label="ROC-AUC" value={sel.auc.toFixed(2)} target={`목표 ${targets.auc} 이상`} ok={sel.auc >= targets.auc} />
            <Metric label="오답 즉답률" value={`${sel.wrongRate}%`} target={`목표 ${targets.wrongRate}% 이하`} ok={sel.wrongRate <= targets.wrongRate} />
            <Metric label="AI 처리율" value={`${sel.aiRate}%`} target={`목표 ${targets.aiRate}% 이상`} ok={sel.aiRate >= targets.aiRate} />
            <Metric label="판정 지연 p50" value={`${sel.latency}ms`} target={`LLM_ONLY ${baseline.latency}ms`} ok />
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
                  <Dot className="bg-[#b9b3aa]" /> LLM_ONLY
                </span>
              </div>
            </Panel>

            {/* F12-4 버전 비교 · 전환 판단 */}
            <Panel title="버전 비교" desc={`같은 시험셋 기준 · ${sel.id} vs ${compareTo.id}${serving ? " (서빙 중)" : ""}`}>
              <table className="w-full text-sm">
                <thead className="text-xs text-muted">
                  <tr className="border-b border-line">
                    <th className="pb-2 text-left font-medium">지표</th>
                    <th className="pb-2 text-right font-medium">{sel.id}</th>
                    <th className="pb-2 text-right font-medium">{compareTo.id}</th>
                    <th className="pb-2 text-right font-medium">LLM_ONLY</th>
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
                ) : sel.held ? (
                  <div className="rounded-2xl bg-coral/15 p-3 text-sm">
                    <p className="flex items-center gap-2 font-bold text-coral-ink">
                      <Icon name="lock" size={16} /> HELD · 전환할 수 없어요
                    </p>
                    <p className="mt-1.5 text-xs text-ink/70">{sel.held}</p>
                  </div>
                ) : everServed(sel.id) ? (
                  <div>
                    <p className="mb-2 text-xs text-muted">서빙한 적 있는 버전이라 바로 되돌릴 수 있어요</p>
                    <Button className="w-full" variant="soft" icon="undo" onClick={() => setConfirm({ kind: "rollback", id: sel.id })}>
                      {sel.id}로 롤백
                    </Button>
                  </div>
                ) : blocked.length ? (
                  <div className="rounded-2xl bg-coral/15 p-3 text-sm">
                    <p className="flex items-center gap-2 font-bold text-coral-ink">
                      <Icon name="lock" size={16} /> 전환 차단
                    </p>
                    <ul className="mt-1.5 space-y-0.5 text-xs text-ink/70">
                      {blocked.map((r) => (
                        <li key={r}>· {r}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <Button className="w-full" icon="upload" onClick={() => setConfirm({ kind: "switch", id: sel.id })}>
                    {sel.id}로 전환
                  </Button>
                )}
              </div>
            </Panel>
          </div>
        </div>
      </div>

      <Modal open={!!confirm} onClose={() => setConfirm(null)} title={confirm?.kind === "rollback" ? `${confirm.id}로 롤백할까요?` : `${confirm?.id}로 전환할까요?`}>
        <p className="text-sm leading-relaxed text-muted">
          서빙 어댑터가 {confirm ? servingName(confirm.id) : ""}(으)로 바뀌어요. 진행 중인 강연은 다음 질문부터 바뀐 버전으로 판정해요. 실패하면 지금 버전({servingName(servingVersion)})을 그대로 유지해요.
        </p>
        <div className="mt-6 flex gap-2">
          <Button variant="soft" className="flex-1" onClick={() => setConfirm(null)}>
            취소
          </Button>
          <Button className="flex-1" onClick={() => confirm && switchTo(confirm.id, confirm.kind)}>
            {confirm?.kind === "rollback" ? "롤백하기" : "전환하기"}
          </Button>
        </div>
      </Modal>

      <Modal open={stopOpen} onClose={() => setStopOpen(false)} title="재학습을 중단할까요?">
        <p className="text-sm leading-relaxed text-muted">학습서버의 작업을 멈추고 지금까지의 학습 결과는 버려요. 새 버전은 등록되지 않고, 서빙 중인 버전({servingName(servingVersion)})은 그대로예요. 검수한 라벨은 남아 있어 다시 실행할 수 있어요.</p>
        <div className="mt-6 flex gap-2">
          <Button variant="soft" className="flex-1" onClick={() => setStopOpen(false)}>
            계속 학습
          </Button>
          <Button variant="danger" className="flex-1" onClick={stopTraining}>
            중단하기
          </Button>
        </div>
      </Modal>

      <Modal open={rollbackOpen} onClose={() => setRollbackOpen(false)} title="어디로 되돌릴까요?">
        <p className="text-sm leading-relaxed text-muted">롤백은 서빙한 적 있는 버전과 LLM_ONLY로만 할 수 있어요. 서빙한 적 없는 버전은 버전 비교를 거쳐 전환해 주세요.</p>
        <div className="mt-5 space-y-2">
          {rollbackTargets.map((id) => {
            if (id === LLM_ONLY)
              return (
                <button key={id} onClick={() => switchTo(id, "rollback")} className="flex w-full items-center justify-between rounded-[18px] bg-coral/15 p-4 text-left">
                  <span>
                    <span className="font-bold">LLM_ONLY</span>
                    <span className="block text-xs text-muted">판정 모델을 끄고 Sonnet 단독 판정만 써요 · 비용 증가</span>
                  </span>
                  <Sticker size={24}>🛟</Sticker>
                </button>
              );
            const v = versions.find((x) => x.id === id)!;
            return (
              <button key={id} onClick={() => switchTo(id, "rollback")} className="flex w-full items-center justify-between gap-3 rounded-[18px] bg-white p-4 text-left hover:bg-white/70">
                <span>
                  <span className="font-bold">판정 모델 {v.id}</span>
                  <span className="block text-xs text-muted">
                    AUC {v.auc.toFixed(2)} · 오답 즉답률 {v.wrongRate}%
                  </span>
                </span>
                <Icon name="right" size={17} className="shrink-0" />
              </button>
            );
          })}
        </div>
      </Modal>
    </>
  );
}

// 학습 곡선: epoch별 학습 · 검증 손실. upto개까지만 그린다
function LossChart({ upto }: { upto: number }) {
  const pts = lossCurve.slice(0, upto);
  const max = 0.75;
  const x = (i: number) => (i / (lossCurve.length - 1)) * 100;
  const y = (v: number) => 50 - (v / max) * 46;
  const path = (key: "train" | "val") => pts.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(p[key]).toFixed(1)}`).join(" ");
  return (
    <div className="mt-3 rounded-2xl bg-paper p-3">
      <p className="text-xs font-semibold text-ink/70">학습 곡선</p>
      <svg viewBox="-2 0 104 54" className="mt-1 w-full" role="img" aria-label="학습 곡선">
        {[0, 25, 50].map((t) => (
          <line key={t} x1={0} x2={100} y1={t + 2} y2={t + 2} stroke="#e7e1d7" strokeWidth={0.4} />
        ))}
        <path d={path("train")} fill="none" stroke="#121212" strokeWidth={1.4} strokeLinecap="round" />
        <path d={path("val")} fill="none" stroke="#f4625a" strokeWidth={1.4} strokeDasharray="3 2" strokeLinecap="round" />
      </svg>
      <div className="mt-1 flex gap-3 text-[11px] text-muted">
        <span className="flex items-center gap-1">
          <Dot className="bg-ink" /> 학습 손실
        </span>
        <span className="flex items-center gap-1">
          <Dot className="bg-coral" /> 검증 손실
        </span>
        <span className="ml-auto">
          epoch {pts.length} / {lossCurve.length}
        </span>
      </div>
    </div>
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
