// 관리자 웹(F9 · F12 · F13) 데모용 목업 데이터.

import type { EndReason } from "./mock";

export const adminAccount = { email: "admin@easyq.kr", name: "운영자" };

// ── F9-7 운영 지표 ────────────────────────────────

export type Period = "today" | "week" | "month";

// 응답 시간 3종 (초, p50): 질문 제출 → 진행 상태 표시 · AI 답변 첫 글자 · 최종 확정(답변 완료 또는 강연자에게 전달).
// 표본이 없으면 null이고 화면에는 "–"로 보여준다
export type Latency = { status: number | null; first: number | null; final: number | null };

export const opsMetrics: Record<Period, { questions: number; aiRate: number; forwardRate: number; latency: Latency; cost: number; sessions: number }> = {
  today: { questions: 214, aiRate: 56, forwardRate: 44, latency: { status: 0.3, first: 1.6, final: 2.4 }, cost: 3180, sessions: 3 },
  week: { questions: 1342, aiRate: 54, forwardRate: 46, latency: { status: 0.3, first: 1.8, final: 2.6 }, cost: 18920, sessions: 14 },
  month: { questions: 4870, aiRate: 52, forwardRate: 48, latency: { status: 0.4, first: 1.9, final: 2.7 }, cost: 41200, sessions: 38 },
};

// 응답 시간 목표 (N-01: 최종 확정 p50 3초 이내)
export const latencyTarget = { final: 3 };

// 월 API 비용 한도. 80%를 넘으면 알림 (N-15)
export const costBudget = { limit: 50000, alertAt: 0.8, perLectureTarget: 1700 };

export const dailyMetrics = [
  { day: "10.16", questions: 182, ai: 97, cost: 2410 },
  { day: "10.17", questions: 241, ai: 128, cost: 3020 },
  { day: "10.18", questions: 66, ai: 37, cost: 890 },
  { day: "10.19", questions: 31, ai: 15, cost: 420 },
  { day: "10.20", questions: 0, ai: 0, cost: 0 },
  { day: "10.21", questions: 287, ai: 151, cost: 3560 },
  { day: "10.22", questions: 214, ai: 120, cost: 3180 },
];

// ── F9-2 회원 관리 ────────────────────────────────

export type MemberStatus = "active" | "suspended" | "unverified";

export type Member = {
  id: string;
  name: string;
  email: string;
  joined: string;
  lectures: number; // 만든 강연 수
  questions: number;
  status: MemberStatus;
  suspendReason?: string;
};

export const members: Member[] = [
  { id: "u1", name: "주혜", email: "juhye@gachon.ac.kr", joined: "2026.09.18", lectures: 4, questions: 12, status: "active" },
  { id: "u2", name: "김서연", email: "seoyeon.k@gachon.ac.kr", joined: "2026.09.20", lectures: 5, questions: 3, status: "active" },
  { id: "u3", name: "박도윤", email: "doyoon@gachon.ac.kr", joined: "2026.09.21", lectures: 3, questions: 0, status: "active" },
  { id: "u4", name: "이하준", email: "hajun@startup.kr", joined: "2026.09.25", lectures: 1, questions: 7, status: "active" },
  { id: "u5", name: "최민지", email: "minji.c@gachon.ac.kr", joined: "2026.09.26", lectures: 2, questions: 1, status: "active" },
  { id: "u6", name: "정우진", email: "woojin@example.com", joined: "2026.10.03", lectures: 0, questions: 46, status: "suspended", suspendReason: "같은 강연에서 욕설이 담긴 질문을 반복 제출" },
  { id: "u7", name: "한지수", email: "jisu.h@gachon.ac.kr", joined: "2026.10.11", lectures: 0, questions: 0, status: "unverified" },
  { id: "u8", name: "오세훈", email: "sehoon.o@gachon.ac.kr", joined: "2026.10.14", lectures: 1, questions: 22, status: "active" },
];

export const suspendReasons = ["부적절한 질문 반복 제출", "다중 계정으로 악용", "타인 사칭", "기타"];

// ── F9-3 세션 관리 ────────────────────────────────

export type AdminSession = {
  id: string;
  title: string;
  speaker: string;
  status: "ready" | "live" | "ended";
  date: string;
  audience: number;
  questions: number;
  code: string;
  issue?: string;
  // 평가용 강연: 처리 로그를 평가셋으로 따로 모은다. 시작 전에만 바꿀 수 있다
  evaluation?: boolean;
  endReason?: EndReason;
};

export const adminSessions: AdminSession[] = [
  { id: "l1", title: "인공지능 개론 7주차 · 트랜스포머", speaker: "주혜", status: "live", date: "2026.10.22 14:00", audience: 128, questions: 10, code: "QX7K2" },
  { id: "s2", title: "경영학원론 · 마케팅 믹스", speaker: "오세훈", status: "live", date: "2026.10.22 13:30", audience: 212, questions: 141, code: "MK4P2", issue: "부적절한 질문 신고 5건 · 분당 질문 38건 급증" },
  { id: "s3", title: "컴퓨터 비전 특강 · NeRF", speaker: "김서연", status: "live", date: "2026.10.22 15:00", audience: 47, questions: 9, code: "CV9N1", issue: "STT 재연결 4회 (10분 제한)" },
  { id: "l2", title: "데이터베이스 설계 특강", speaker: "주혜", status: "ready", date: "2026.10.23 10:30", audience: 0, questions: 0, code: "DB4M8", evaluation: true },
  { id: "s5", title: "알고리즘 10주차 · 그래프 탐색", speaker: "박도윤", status: "ready", date: "2026.10.24 09:00", audience: 0, questions: 0, code: "AL0G5" },
  { id: "l3", title: "웹 프로그래밍 6주차 · React 상태 관리", speaker: "주혜", status: "ended", date: "2026.10.08 13:00", audience: 94, questions: 12, code: "WB6R3", endReason: "manual" },
  { id: "s7", title: "창업 세미나 · MVP 검증하기", speaker: "이하준", status: "ended", date: "2026.09.30 16:00", audience: 73, questions: 38, code: "SU3M7", endReason: "auto" },
];

// 세션별 운영 지표 (F9-7, 세션 단위 집계)
// 첫 글자 응답 시간은 AI가 답한 질문에서만 잰다. AI 답변이 없는 강연은 표본이 없어 null
export const sessionMetrics: { id: string; title: string; questions: number; aiRate: number; latency: Latency; cost: number }[] = [
  { id: "s2", title: "경영학원론 · 마케팅 믹스", questions: 141, aiRate: 61, latency: { status: 0.3, first: 1.5, final: 2.2 }, cost: 1980 },
  { id: "l1", title: "인공지능 개론 7주차 · 트랜스포머", questions: 10, aiRate: 40, latency: { status: 0.3, first: 1.7, final: 2.5 }, cost: 1240 },
  { id: "s3", title: "컴퓨터 비전 특강 · NeRF", questions: 9, aiRate: 33, latency: { status: 0.5, first: 2.9, final: 3.9 }, cost: 310 },
  { id: "l3", title: "웹 프로그래밍 6주차 · React 상태 관리", questions: 12, aiRate: 50, latency: { status: 0.3, first: 1.8, final: 2.6 }, cost: 1420 },
  { id: "s7", title: "창업 세미나 · MVP 검증하기", questions: 38, aiRate: 39, latency: { status: 0.4, first: 2.0, final: 2.9 }, cost: 1760 },
  { id: "s8", title: "교양 글쓰기 · 첫 문단 쓰기", questions: 4, aiRate: 0, latency: { status: 0.3, first: null, final: 1.1 }, cost: 40 },
];

// ── F9-4 데이터셋 ─────────────────────────────────

export type Dataset = {
  id: string;
  created: string;
  total: number;
  answerable: number;
  forward: number;
  sources: { label: string; count: number }[];
  split: string;
  note: string;
};

export const datasets: Dataset[] = [
  {
    id: "ds-v3",
    created: "2026.10.14",
    total: 6420,
    answerable: 3530,
    forward: 2890,
    sources: [
      { label: "수작업 라벨", count: 2400 },
      { label: "LLM 생성 질문-근거 쌍", count: 3600 },
      { label: "피드백 재학습", count: 420 },
    ],
    split: "8 : 1 : 1 (강연 단위)",
    note: "1차 피드백 라벨 420건 반영",
  },
  {
    id: "ds-v2",
    created: "2026.09.30",
    total: 6000,
    answerable: 3240,
    forward: 2760,
    sources: [
      { label: "수작업 라벨", count: 2400 },
      { label: "LLM 생성 질문-근거 쌍", count: 3600 },
    ],
    split: "8 : 1 : 1 (강연 단위)",
    note: "생성 쌍 품질 필터 적용",
  },
  {
    id: "ds-v1",
    created: "2026.09.16",
    total: 3800,
    answerable: 2150,
    forward: 1650,
    sources: [
      { label: "수작업 라벨", count: 1600 },
      { label: "LLM 생성 질문-근거 쌍", count: 2200 },
    ],
    split: "8 : 1 : 1 (무작위)",
    note: "예비 학습용",
  },
];

// 이관 질문 세부 유형 (ds-v3 기준)
export const forwardKinds = [
  { label: "근거 없음 (교안 · 발화 밖)", count: 1240 },
  { label: "운영 · 일정 (과제, 시험 범위)", count: 860 },
  { label: "의견 · 심화 토론", count: 790 },
];

// ── F12 라벨 후보 ─────────────────────────────────

export type LabelKind = "answerable" | "forward";

// 검색이 찾은 근거 후보 (교안 · 발화). 검수자가 이 중에서 정답 근거를 고른다
export type RetrievalHit = { source: string; score: number };

export type LabelCandidate = {
  id: string;
  question: string;
  lecture: string;
  origin: "철회" | "이관" | "피드백 👎";
  // 기본 라벨: 서비스에서 처리된 결과로 붙은 라벨
  base: LabelKind;
  // 모델 버전별 판정 점수
  scores: Record<string, number>;
  hits: RetrievalHit[];
  // 다른 검수자의 결과. 내 검수를 마치기 전에는 보여주지 않는다 (evidence null = 정답 근거 없음)
  other: { reviewer: string; label: LabelKind | "exclude"; evidence: string | null } | null;
};

// 버전별 판정 임계값. 검수는 고른 버전의 임계값에 가까운 점수부터 본다
export const judgeThresholds: Record<string, number> = { "v1.2": 0.7, "v1.1": 0.68, "v1.0": 0.65 };

export const labelCandidates: LabelCandidate[] = [
  {
    id: "c1",
    question: "멀티헤드 어텐션은 헤드 수가 많을수록 항상 좋아지나요?",
    lecture: "인공지능 개론 7주차",
    origin: "철회",
    base: "answerable",
    scores: { "v1.2": 0.72, "v1.1": 0.81, "v1.0": 0.84 },
    hits: [
      { source: "교안 p.16 · Multi-Head: h = 8, dₖ = d_model / h = 64", score: 0.72 },
      { source: "발화 14:23 · 헤드를 나누면 서로 다른 관계를 동시에 볼 수 있어요", score: 0.64 },
      { source: "교안 p.17 · 헤드별 어텐션 시각화", score: 0.41 },
    ],
    other: { reviewer: "검수자 B", label: "forward", evidence: null },
  },
  {
    id: "c2",
    question: "어텐션 시각화한 그림에서 왜 대각선이 유독 진한가요?",
    lecture: "인공지능 개론 7주차",
    origin: "이관",
    base: "forward",
    scores: { "v1.2": 0.66, "v1.1": 0.42, "v1.0": 0.38 },
    hits: [
      { source: "발화 14:26 · 자기 자신과의 유사도가 가장 높아서 대각선이 진해요", score: 0.66 },
      { source: "교안 p.19 · 어텐션 가중치 시각화 그림", score: 0.58 },
    ],
    other: { reviewer: "검수자 B", label: "answerable", evidence: "발화 14:26 · 자기 자신과의 유사도가 가장 높아서 대각선이 진해요" },
  },
  {
    id: "c3",
    question: "setState가 비동기라는 게 정확히 무슨 뜻인가요?",
    lecture: "웹 프로그래밍 6주차",
    origin: "피드백 👎",
    base: "answerable",
    scores: { "v1.2": 0.77, "v1.1": 0.77, "v1.0": 0.7 },
    hits: [
      { source: "교안 p.7 · setState는 바로 반영되지 않고 배치로 모아 업데이트해요", score: 0.77 },
      { source: "발화 13:22 · 다음 렌더에서 새 값이 보여요", score: 0.69 },
      { source: "교안 p.8 · 함수형 업데이트 setCount(c => c + 1)", score: 0.52 },
    ],
    other: { reviewer: "검수자 B", label: "answerable", evidence: "교안 p.7 · setState는 바로 반영되지 않고 배치로 모아 업데이트해요" },
  },
  {
    id: "c4",
    question: "4P 중에 요즘 제일 중요한 건 뭐라고 보세요?",
    lecture: "경영학원론 · 마케팅 믹스",
    origin: "이관",
    base: "forward",
    scores: { "v1.2": 0.18, "v1.1": 0.21, "v1.0": 0.3 },
    hits: [{ source: "교안 p.5 · 마케팅 믹스 4P 정의", score: 0.31 }],
    other: null,
  },
  {
    id: "c5",
    question: "NeRF 학습에 GPU 몇 장 쓰셨어요?",
    lecture: "컴퓨터 비전 특강 · NeRF",
    origin: "피드백 👎",
    base: "answerable",
    scores: { "v1.2": 0.63, "v1.1": 0.71, "v1.0": 0.74 },
    hits: [
      { source: "교안 p.3 · NeRF 학습 과정 개요", score: 0.63 },
      { source: "발화 15:12 · 학습은 하루 정도 걸려요", score: 0.55 },
    ],
    other: { reviewer: "검수자 B", label: "forward", evidence: null },
  },
  {
    id: "c6",
    question: "Context를 쓰면 리렌더가 너무 많이 일어나지 않나요?",
    lecture: "웹 프로그래밍 6주차",
    origin: "이관",
    base: "forward",
    scores: { "v1.2": 0.68, "v1.1": 0.47, "v1.0": 0.44 },
    hits: [
      { source: "교안 p.18 · Context 값이 바뀌면 구독 컴포넌트 전체가 리렌더돼요", score: 0.68 },
      { source: "발화 13:41 · 값을 쪼개 Provider를 나누면 리렌더를 줄일 수 있어요", score: 0.61 },
    ],
    other: { reviewer: "검수자 B", label: "answerable", evidence: "발화 13:41 · 값을 쪼개 Provider를 나누면 리렌더를 줄일 수 있어요" },
  },
];

export const labelText: Record<LabelKind, string> = { answerable: "AI 답변 가능", forward: "강연자 이관" };

// ── F9-5 · F9-6 · F12-3 · F12-4 모델 버전 ─────────

export type ModelVersion = {
  id: string;
  created: string;
  dataset: string;
  auc: number;
  wrongRate: number; // 오답 즉답률 %
  aiRate: number; // AI 처리율 %
  latency: number; // 판정 p50 ms
  // HELD: 평가 단계에서 목표에 못 미쳐 등록이 보류된 버전. 배포할 수 없다
  held?: string;
};

export const modelVersions: ModelVersion[] = [
  { id: "v1.2", created: "2026.10.16", dataset: "ds-v3", auc: 0.88, wrongRate: 4.1, aiRate: 55, latency: 180 },
  { id: "v1.1", created: "2026.10.02", dataset: "ds-v2", auc: 0.86, wrongRate: 4.9, aiRate: 52, latency: 170 },
  { id: "v1.0", created: "2026.09.20", dataset: "ds-v1", auc: 0.81, wrongRate: 7.8, aiRate: 41, latency: 165 },
];

// 재학습 결과로 새로 생기는 버전 (데모: 오답 즉답률이 목표를 넘어 배포가 막힌다)
export const retrainedVersion: ModelVersion = {
  id: "v1.3",
  created: "2026.10.22",
  dataset: "ds-v4",
  auc: 0.87,
  wrongRate: 5.4,
  aiRate: 58,
  latency: 182,
  held: "오답 즉답률 5.4%가 목표(5% 이하)를 넘어 등록을 보류했어요",
};

// 베이스라인: 판정 모델 없이 Sonnet 단독 판정 (LLM_ONLY)
export const LLM_ONLY = "LLM_ONLY";
export const baseline: ModelVersion = { id: LLM_ONLY, created: "—", dataset: "—", auc: 0.79, wrongRate: 6.2, aiRate: 47, latency: 1900 };

// 재학습 단계와 학습 곡선 (epoch별 학습 · 검증 손실)
export const trainStages = ["학습", "fp16 변환", "평가", "등록"];
export const lossCurve = [
  { train: 0.69, val: 0.68 },
  { train: 0.52, val: 0.55 },
  { train: 0.41, val: 0.46 },
  { train: 0.34, val: 0.41 },
  { train: 0.29, val: 0.39 },
  { train: 0.25, val: 0.38 },
  { train: 0.22, val: 0.38 },
  { train: 0.2, val: 0.39 },
];

// 서빙 설정: 판정 모델 추론 위치와 학습서버 연결 (F8-8)
export const servingConfig = { route: "학과 서버 추론 API (SSH 터널)", fallback: "EC2 로컬 ONNX", lastSync: "2026.10.22 14:32" };

// 목표치 (N-02 · N-03 · N-05)
export const targets = { auc: 0.85, wrongRate: 5, aiRate: 50 };

// AUC 값으로 그럴듯한 ROC 곡선 점을 만든다: y = 1 - (1 - x)^k, AUC = k / (k + 1)
export function rocPoints(auc: number, n = 24) {
  const k = auc / (1 - auc);
  return Array.from({ length: n + 1 }, (_, i) => {
    const x = i / n;
    return [x, 1 - Math.pow(1 - x, k)] as const;
  });
}

// ── F13 공지 · 문의 ───────────────────────────────

export const adminInquiries = [
  { id: "i1", title: "교안 PPTX 업로드가 실패해요", from: "주혜", date: "2026.10.09", body: "40MB 정도 되는 PPTX를 올렸는데 계속 실패라고 떠요.", answer: "PPTX 안의 이미지가 커서 용량 제한(50MB)을 넘었어요. PDF로 저장해 올려 주세요." },
  { id: "i2", title: "지난 강연을 복사해서 새로 만들 수 있나요?", from: "김서연", date: "2026.10.18", body: "매주 같은 교안 구성으로 강연을 여는데, 용어 사전까지 다시 만들어야 해서 번거로워요." },
  { id: "i3", title: "AI 답변이 교안과 다른 말을 해요", from: "오세훈", date: "2026.10.21", body: "마케팅 믹스 강연에서 4P 설명이 교안 정의와 조금 달랐어요. 철회는 했는데 다른 청중도 봤을까 걱정돼요." },
];
