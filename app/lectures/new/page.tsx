"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Sticker } from "@/components/Brand";
import { Button, Field, Screen, TopBar, inputCls } from "@/components/ui";
import { freeUsage } from "@/lib/mock";
import { setDemo, useDemo } from "@/lib/store";
import { Empty } from "@/components/ui";

export default function NewLecture() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("2026-10-22");
  const [time, setTime] = useState("13:00");
  const [desc, setDesc] = useState("");
  const [touched, setTouched] = useState(false);
  const { created } = useDemo();
  const used = freeUsage.used + (created ? 1 : 0);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!title.trim() || !date || !time) return;
    const d = new Date(date);
    const label = `${date.replaceAll("-", ".")} (${"일월화수목금토"[d.getDay()]})`;
    setDemo({ created: { id: "new-lecture", title: title.trim(), date: label, time, desc } });
    router.push("/lectures/new-lecture");
  }

  if (used >= freeUsage.limit)
    return (
      <Screen>
        <TopBar back="/lectures" />
        <Empty emoji="🔒" title="무료 사용 한도를 모두 썼어요" desc={`베타 기간에는 강의를 ${freeUsage.limit}개까지 만들 수 있어요. 지난 강의를 삭제해도 한도는 돌아오지 않아요.`}>
          <Button href="/lectures" variant="ghost">
            내 강의로 돌아가기
          </Button>
        </Empty>
      </Screen>
    );

  return (
    <Screen>
      <TopBar back="/lectures" />
      <form onSubmit={submit} className="flex flex-1 flex-col px-6 pb-10">
        <h1 className="pt-2 text-[38px] font-extrabold leading-[1.08] tracking-[-0.05em]">
          새 강의 <Sticker size={34} rotate={10}>🎤</Sticker>
          <br />
          <span className="text-ink/35">승인 없이 바로 만들어요</span>
        </h1>
        <p className="mt-3 text-sm text-muted">무료로 {freeUsage.limit - used}개 더 만들 수 있어요.</p>

        <div className="mt-6 space-y-4">
          <Field label="강의명" error={touched && !title.trim() ? "강의명을 입력해 주세요." : undefined}>
            <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예: 인공지능 개론 8주차 · GPT" maxLength={40} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="날짜">
              <input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
            <Field label="시작 시각">
              <input type="time" className={inputCls} value={time} onChange={(e) => setTime(e.target.value)} />
            </Field>
          </div>
          <Field label="설명 (선택)" hint="청중 입장 화면에 보여요">
            <textarea className={`${inputCls} resize-none`} rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="이번 강의에서 다룰 내용" />
          </Field>
        </div>

        <div className="mt-auto pt-8">
          <Button size="lg" className="w-full" type="submit">
            만들고 교안 올리기
          </Button>
        </div>
      </form>
    </Screen>
  );
}
