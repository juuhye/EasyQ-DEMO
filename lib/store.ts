"use client";

// 페이지 이동 사이에 유지되는 데모 상태 (새로고침하면 초기화, 관리자 로그인만 탭 단위로 유지).
import { useSyncExternalStore } from "react";
import { me } from "./mock";

type DemoState = {
  name: string;
  deletedArchives: string[];
  deletedLectures: string[];
  endedLectures: string[];
  created: { id: string; title: string; date: string; time: string; desc: string } | null;
  guestName: string | null;
  // 모두의 질문에 남긴 개인 메모 (질문 id → 메모)
  memos: Record<string, string>;
  // 재발급한 입장 코드 (강의 id → 새 코드). 이전 코드는 무효 (API-42)
  codes: Record<string, string>;
  // 회원 계정 단위 동의. 가입 때 받고 마이페이지에서 바꾼다 (API-48)
  consent: { keep: boolean; learn: boolean };
  // 이번 탭에서 입장 절차(동의 · 게스트 표시명)를 마친 강의 코드
  joinedCode: string | null;
  // 강연자가 지운 지난 강의 질문 기록
  deletedQuestions: string[];
  // 관리자 웹
  admin: string | null;
  servingVersion: string;
  retrained: boolean;
  labelDecisions: Record<string, "approve" | "flip" | "exclude">;
  // 답변 가능으로 확정한 라벨의 정답 근거 (후보 id → 근거)
  labelEvidence: Record<string, string>;
  // 한 번이라도 서빙했던 버전 (롤백 대상)
  servedVersions: string[];
};

let state: DemoState = {
  name: me.name,
  deletedArchives: [],
  deletedLectures: [],
  endedLectures: [],
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
  labelEvidence: {},
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
