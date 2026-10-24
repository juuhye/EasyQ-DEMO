// 로그인 검증. 실제 인증 API 연동 전까지 목업 계정(members, adminAccount)으로 판정한다.
import { adminAccount, members } from "./admin";

// 목업 계정 공통 비밀번호
export const MOCK_PASSWORD = "easyq1234";
export const MOCK_ADMIN_PASSWORD = "admin1234";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type LoginField = "email" | "pw" | "form";
export type LoginResult =
  | { ok: true; name: string; email: string }
  | { ok: false; field: LoginField; message: string; unverified?: boolean };

// 가입 여부를 드러내지 않도록 없는 이메일과 틀린 비밀번호를 같은 문구로 안내
const wrong: LoginResult = { ok: false, field: "pw", message: "이메일 또는 비밀번호가 맞지 않아요." };

export async function login(rawEmail: string, pw: string, role: "user" | "admin"): Promise<LoginResult> {
  const email = rawEmail.trim().toLowerCase();
  if (!email) return { ok: false, field: "email", message: "이메일을 입력해 주세요." };
  if (!EMAIL_RE.test(email)) return { ok: false, field: "email", message: "이메일 형식이 올바르지 않아요." };
  if (!pw) return { ok: false, field: "pw", message: "비밀번호를 입력해 주세요." };
  if (typeof navigator !== "undefined" && !navigator.onLine) return { ok: false, field: "form", message: "인터넷 연결이 끊겼어요. 연결을 확인하고 다시 시도해 주세요." };

  // 서버 응답 대기
  await new Promise((r) => setTimeout(r, 600));

  if (role === "admin") {
    if (email !== adminAccount.email) {
      if (members.some((m) => m.email === email)) return { ok: false, field: "email", message: "관리자 권한이 없는 계정이에요. 일반 회원은 관리자 화면에 들어올 수 없어요." };
      return wrong;
    }
    if (pw !== MOCK_ADMIN_PASSWORD) return wrong;
    return { ok: true, name: adminAccount.name, email };
  }

  if (email === adminAccount.email) return { ok: false, field: "email", message: "관리자 계정은 관리자 로그인에서 들어와 주세요." };
  const member = members.find((m) => m.email === email);
  if (!member || pw !== MOCK_PASSWORD) return wrong;
  if (member.status === "unverified") return { ok: false, field: "form", message: "이메일 인증을 마치지 않은 계정이에요. 메일함의 인증 링크를 눌러 주세요.", unverified: true };
  if (member.status === "suspended") return { ok: false, field: "form", message: `이용이 정지된 계정이에요. 사유: ${member.suspendReason ?? "운영 정책 위반"}` };
  return { ok: true, name: member.name, email };
}
