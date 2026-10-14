import Link from "next/link";
import { Avatar, Bubble, Logo, Sticker } from "@/components/Brand";
import { Button, Screen } from "@/components/ui";

export default function Splash() {
  return (
    <Screen>
      <div className="flex flex-1 flex-col px-5 pb-8 pt-10">
        <div className="flex items-center justify-between">
          <Logo className="text-[22px]" />
          <span className="text-right text-sm leading-tight">
            <span className="mr-1 inline-block h-1.5 w-1.5 -translate-y-0.5 rounded-full bg-coral" />
            강연 질문 서비스
            <br />
            <span className="text-muted">가천대 실무프로젝트</span>
          </span>
        </div>

        <h1 className="mt-10 text-[34px] font-bold leading-[1.22] tracking-[-0.045em] text-ink/35">
          손 들기 애매한 질문,
          <br />
          <span className="text-ink">
            QR 찍고 <Sticker size={30} rotate={-8}>📱</Sticker> 바로
          </span>
          <br />
          <span className="text-ink">물어보세요.</span> AI가
          <br />
          먼저 <span className="text-ink">답해줄게요</span> <Sticker size={30} rotate={10}>✨</Sticker>
        </h1>

        {/* 시안의 Chats 말풍선 */}
        <div className="relative mt-8 space-y-1">
          <Bubble tone="coral" className="z-30 mr-8 animate-rise">
            <div className="flex items-center gap-3">
              <Avatar name="민" size={40} />
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-bold">
                  익명의 청중 <span className="text-xs font-normal text-ink/55">14:21</span>
                </p>
                <p className="truncate text-sm text-ink/80">포지셔널 인코딩은 왜 sin/cos를 써요?</p>
              </div>
              <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-ink px-1.5 text-xs font-bold text-white">23</span>
            </div>
          </Bubble>
          <Bubble tone="honey" tail="right" className="z-20 ml-8 animate-rise [animation-delay:120ms]">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-lg text-white">✦</span>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-bold">
                  AI 답변 <span className="text-xs font-normal text-ink/55">교안 14p 근거</span>
                </p>
                <p className="truncate text-sm text-ink/80">순서 정보를 더해주기 위해서예요…</p>
              </div>
            </div>
          </Bubble>
        </div>

        <div className="mt-auto space-y-2.5 pt-10">
          <Button href="/join" size="lg" icon="qr" className="w-full">
            입장 코드로 참여하기
          </Button>
          <Button href="/login" variant="white" size="lg" className="w-full">
            로그인
          </Button>
          <p className="pt-2 text-center text-sm text-muted">
            처음이신가요?{" "}
            <Link href="/signup" className="font-semibold text-ink underline underline-offset-4">
              회원가입
            </Link>
          </p>
        </div>
      </div>
    </Screen>
  );
}
