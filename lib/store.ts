"use client";

// 페이지 이동 사이에 유지되는 데모 상태 (새로고침하면 초기화).
import { useSyncExternalStore } from "react";
import { me } from "./mock";

type DemoState = {
  name: string;
  deletedArchives: string[];
  deletedLectures: string[];
  endedLectures: string[];
  created: { id: string; title: string; date: string; time: string; desc: string } | null;
  guestName: string | null;
  // 관리자 웹
  admin: string | null;
  servingVersion: string;
  retrained: boolean;
  labelDecisions: Record<string, "approve" | "flip" | "exclude">;
};

let state: DemoState = {
  name: me.name,
  deletedArchives: [],
  deletedLectures: [],
  endedLectures: [],
  created: null,
  guestName: null,
  admin: null,
  servingVersion: "v1.1",
  retrained: false,
  labelDecisions: {},
};

const listeners = new Set<() => void>();

export function setDemo(patch: Partial<DemoState> | ((s: DemoState) => Partial<DemoState>)) {
  state = { ...state, ...(typeof patch === "function" ? patch(state) : patch) };
  listeners.forEach((l) => l());
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
