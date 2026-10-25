"use client";

// 페이지 이동 사이에 유지되는 데모 상태 (새로고침하면 초기화, 관리자 로그인만 탭 단위로 유지).
import { useSyncExternalStore } from "react";
import { me, type EndReason } from "./mock";
import type { LabelKind } from "./admin";

// 라벨 검수 결과: 고른 정답 근거(없으면 null)와 그에 따른 라벨, 또는 학습 제외
export type LabelDecision = { label: LabelKind | "exclude"; evidence: string | null };

type DemoState = {
  name: string;
  // 회원 로그인 여부와 마지막 로그인 시각. 탈퇴는 최근 10분 안에 로그인한 상태여야 한다
  authed: boolean;
  loginAt: number;
  // 가입했지만 아직 인증 코드를 입력하지 않은 계정. 인증 전에 로그인하면 코드 입력 화면으로 보낸다
  signup: { name: string; email: string; pw: string; verified: boolean } | null;
  deletedArchives: string[];
  deletedLectures: string[];
  endedLectures: string[];
  // 강연자가 시작한 강연 (DRAFT → LIVE). 대기 화면의 청중은 이 값이 바뀌면 질문 화면으로 넘어간다
  startedLectures: string[];
  // 이번 데모에서 종료된 강연의 종료 사유
  endReasons: Record<string, EndReason>;
  created: { id: string; title: string; date: string; time: string; desc: string } | null;
  // 게스트로 입장했을 때의 닉네임. null이면 회원으로 입장
  guestName: string | null;
  // 공개 질문에 남긴 내 필기 (질문 id → 필기)
  memos: Record<string, string>;
  // 재발급한 입장 코드 (강연 id → 새 코드). 이전 코드는 무효 (API-42)
  codes: Record<string, string>;
  // 회원 계정 단위 동의. 가입 때 받고 마이페이지에서 바꾼다 (API-48)
  consent: { keep: boolean; learn: boolean };
  // 이번 탭에서 입장 절차(동의 · 게스트 표시명)를 마친 강연 코드
  joinedCode: string | null;
  // 강연자가 지운 지난 강연 질문 기록
  deletedQuestions: string[];
  // 관리자 웹
  admin: string | null;
  servingVersion: string;
  retrained: boolean;
  labelDecisions: Record<string, LabelDecision>;
  // 데이터셋(ds-v4)에 병합한 확정 라벨 수. 재학습은 병합된 라벨로 한다 (설계 7장 병합 API)
  mergedLabels: number;
  // 한 번이라도 서빙했던 버전 (롤백 대상)
  servedVersions: string[];
};

let state: DemoState = {
  name: me.name,
  authed: false,
  loginAt: 0,
  signup: null,
  deletedArchives: [],
  deletedLectures: [],
  endedLectures: [],
  startedLectures: [],
  endReasons: {},
  created: null,
  guestName: null,
  memos: {},
  codes: {},
  consent: { keep: true, learn: true },
  joinedCode: null,
  deletedQuestions: [],
  admin: null,
  servingVersion: "v1.1",
  retrained: false,
  labelDecisions: {},
  mergedLabels: 0,
  servedVersions: ["v1.0", "v1.1"],
};

const listeners = new Set<() => void>();

export function setDemo(patch: Partial<DemoState> | ((s: DemoState) => Partial<DemoState>)) {
  state = { ...state, ...(typeof patch === "function" ? patch(state) : patch) };
  listeners.forEach((l) => l());
}

// 관리자 로그인은 새로고침해도 풀리지 않도록 sessionStorage에 남긴다
const ADMIN_KEY = "easyq-admin";

export function setAdmin(email: string | null) {
  try {
    if (email) sessionStorage.setItem(ADMIN_KEY, email);
    else sessionStorage.removeItem(ADMIN_KEY);
  } catch {}
  setDemo({ admin: email });
}

export function restoreAdmin() {
  try {
    const email = sessionStorage.getItem(ADMIN_KEY);
    if (email) setDemo({ admin: email });
    return email;
  } catch {
    return null;
  }
}

export function useDemo() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
    () => state,
  );
}
