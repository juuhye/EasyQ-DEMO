import type { Metadata, Viewport } from "next";
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "EasyQ — 강연 실시간 질문",
  description: "강연 중 생긴 질문을 AI가 먼저 답하고, 필요한 질문만 강연자에게 전달합니다.",
};

export const viewport: Viewport = {
  themeColor: "#f6f3ee",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}
