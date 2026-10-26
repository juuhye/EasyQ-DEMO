"use client";

import { useEffect } from "react";
import { restoreMember } from "@/lib/store";

// 앱이 뜰 때 회원 로그인 상태를 복구한다 (관리자는 AdminShell에서 복구)
export function SessionRestore() {
  useEffect(() => {
    restoreMember();
  }, []);
  return null;
}
