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
  // 강연자가 지운 지난 강의 질문 기록
  deletedQuestions: string[];
  // 관리자 웹
  admin: string | null;
  servingVersion: string;
  retrained: boolean;
  labelDecisions: Record<string, "approve" | "flip" | "exclude">;
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
  deletedQuestions: [],
  admin: null,
  servingVersion: "v1.1",
  retrained: false,
  labelDecisions: {},
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
