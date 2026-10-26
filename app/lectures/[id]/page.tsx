"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { FakeQR } from "@/components/FakeQR";
import { Bubble, Sticker } from "@/components/Brand";
import { Icon } from "@/components/Icon";
import { QrModal, QrReissue } from "@/components/QrModal";
import { Button, Empty, Modal, Progress, Screen, StatusPill, TopBar, inputCls, useToast } from "@/components/ui";
import { FileStatePill, MAX_MB, SttConsentModal, validateDeck } from "@/components/lecture";
import { findLecture, statusOf, type FileState, type Lecture } from "@/lib/mock";
import { setDemo, useDemo } from "@/lib/store";

const stages = ["업로드", "텍스트 추출 · 청킹", "임베딩 · 색인", "용어 추출"];
// 전문용어 사전: 최대 100개, 용어당 1~40자 (API-25)
const TERMS_MAX = 100;
const TERM_LEN = 40;

export default function LectureDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const { created, endedLectures, startedLectures, codes } = useDemo();

  const base: Lecture | undefined =
    id === "new-lecture" && created
      ? { id, title: created.title, date: created.date, time: created.time, desc: created.desc, status: "ready", code: "NW3Q8", tone: "berry", emoji: "✨", file: null, audience: 0, glossary: [] }
      : findLecture(id);

  const [file, setFile] = useState(base?.file ?? null);
  const [progress, setProgress] = useState(file?.state === "done" ? 100 : 0);
  const [fileError, setFileError] = useState("");
  const [terms, setTerms] = useState(base?.glossary ?? []);
  const [newTerm, setNewTerm] = useState("");
  const [qrOpen, setQrOpen] = useState(false);
  const [warn, setWarn] = useState(false);
  const [sttOpen, setSttOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // 교안 처리 진행 시뮬레이션
  const processing = file?.state === "processing";
  const showToast = toast.show;
  useEffect(() => {
    if (!processing) return;
    const t = setTimeout(() => {
      if (progress < 100) return setProgress(Math.min(100, progress + 4 + Math.random() * 6));
      setFile((f) => (f ? { ...f, state: "done", chunks: f.chunks || 128 } : f));
      setTerms((ts) => (ts.length ? ts : ["정규화", "Normal Form", "Index", "B-Tree", "Primary Key", "Foreign Key", "Join", "Transaction"]));
      showToast("교안 준비가 끝났어요!", "mint");
    }, 350);
    return () => clearTimeout(t);
  }, [processing, progress, showToast]);

  // 준비 화면은 시작 전 강연만. 진행 중이면 대시보드, 끝났으면 리포트로 보낸다
  const status = base ? statusOf(base, endedLectures, startedLectures) : null;
  useEffect(() => {
    if (status === "ended") router.replace(`/lectures/${id}/report`);
    if (status === "live") router.replace(`/lectures/${id}/live`);
  }, [status, id, router]);

  if (!base)
    return (
      <Screen>
        <TopBar back="/lectures" />
        <Empty title="강연을 찾을 수 없어요" />
      </Screen>
    );
  if (status !== "ready") return <Screen>{null}</Screen>;

  const lecture = base;
  const code = codes[lecture.id] ?? lecture.code;
  const stageIdx = Math.min(stages.length - 1, Math.floor(progress / 25));

  async function pick(f: File) {
    const err = await validateDeck(f);
    if (err) return setFileError(err);
    setFileError("");
    start({ name: f.name, pages: 30 + Math.floor(Math.random() * 15), chunks: 0, state: "processing" });
  }

  function start(f: NonNullable<Lecture["file"]>) {
    setProgress(0);
    setFile({ ...f, state: "processing", failReason: undefined });
  }

  // 교안이 없어도 시작할 수 있다. 처리 중 · 실패면 경고만 하고, 시작 전에 음성 인식 동의를 받는다
  function begin(force = false) {
    if (file && file.state !== "done" && !force) return setWarn(true);
    setWarn(false);
    setSttOpen(true);
  }

  function startLecture() {
    // 데모: 새로 만든 강연은 진행 중 데모 강연(l1) 대시보드로 보낸다
    const target = lecture.id === "new-lecture" ? "l1" : lecture.id;
    setDemo((s) => ({ startedLectures: [...s.startedLectures, lecture.id] }));
    router.push(`/lectures/${target}/live`);
  }

  return (
    <Screen>
      {toast.node}
      <TopBar back="/lectures" title="강연 준비" />

      <div className="flex-1 px-5 pb-32">
        <Bubble tone={lecture.tone}>
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <StatusPill status={lecture.status} onColor />
              <p className="mt-2.5 text-[24px] font-extrabold leading-tight tracking-[-0.04em]">{lecture.title}</p>
              <p className="mt-1 text-sm text-ink/60">
                {lecture.date} {lecture.time}
              </p>
              {lecture.desc && <p className="mt-2 text-sm text-ink/75">{lecture.desc}</p>}
            </div>
            <Sticker size={44} rotate={10}>
              {lecture.emoji}
            </Sticker>
          </div>
        </Bubble>

        {/* 1. 교안 */}
        <Step n={1} title="교안 올리기" done={file?.state === "done"} desc="교안 없이도 강연을 시작할 수 있어요. 진행 중에도 교안을 추가로 올릴 수 있어요.">
          {!file && (
            <>
              <button
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const f = e.dataTransfer.files[0];
                  if (f) pick(f);
                }}
                className="flex w-full flex-col items-center rounded-[24px] border-2 border-dashed border-ink/15 bg-white px-4 py-8 transition-colors hover:border-ink/40"
              >
                <Sticker size={44} rotate={-8}>
                  📄
                </Sticker>
                <p className="mt-3 font-bold">PDF · PPTX 교안을 끌어오거나 눌러서 선택</p>
                <p className="mt-1 text-xs text-muted">최대 {MAX_MB}MB · 텍스트가 없는 스캔 PDF는 읽을 수 없어요</p>
              </button>
            </>
          )}
          <input ref={inputRef} type="file" accept=".pdf,.pptx" className="hidden" onChange={(e) => e.target.files?.[0] && pick(e.target.files[0])} />
          {fileError && <p className="mt-2 text-center text-sm text-[#e5484d]">{fileError}</p>}

          {file && (
            <div className="rounded-[24px] bg-white p-4">
              <div className="flex items-center gap-3">
                <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${file.state === "failed" ? "bg-[#e5484d]/12 text-[#e5484d]" : "bg-sand text-ink"}`}>
                  <Icon name="file" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{file.name}</p>
                  <p className="text-xs text-muted">{fileLabel(file.state, file.pages, file.chunks)}</p>
                </div>
                <FileStatePill state={file.state} />
                {/* 교안 삭제는 시작 전(DRAFT)과 종료 후에만 할 수 있다 */}
                {file.state !== "processing" && (
                  <button
                    onClick={() => {
                      setFile(null);
                      setProgress(0);
                      setTerms([]);
                      toast.show("교안을 삭제했어요");
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-ink/5"
                    aria-label="교안 삭제"
                  >
                    <Icon name="trash" size={16} />
                  </button>
                )}
              </div>

              {file.state === "processing" && (
                <div className="mt-4">
                  <Progress value={progress} />
                  <ol className="mt-3 grid grid-cols-4 gap-1 text-center text-[11px]">
                    {stages.map((s, i) => (
                      <li key={s} className={i < stageIdx ? "text-ink/60" : i === stageIdx ? "font-bold text-ink" : "text-ink/30"}>
                        <span className={`mx-auto mb-1 flex h-6 w-6 items-center justify-center rounded-full ${i < stageIdx ? "bg-mint text-ink" : i === stageIdx ? "bg-ink text-white" : "bg-ink/8"}`}>
                          {i < stageIdx ? <Icon name="check" size={13} stroke={3} /> : i + 1}
                        </span>
                        {s}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {file.state === "failed" && (
                <div className="mt-4 rounded-2xl bg-[#e5484d]/8 p-3">
                  <p className="flex items-center gap-1.5 text-sm font-bold text-[#e5484d]">
                    <Icon name="alert" size={16} /> 처리에 실패했어요
                  </p>
                  <p className="mt-1 text-sm text-muted">{file.failReason}</p>
                  <p className="mt-1 text-sm text-muted">{file.retryable ? "다시 시도해도 안 되면 파일을 교체해 주세요." : "같은 파일로는 처리할 수 없어요. 파일을 교체해 주세요."} 교체하면 처음부터 다시 처리해요.</p>
                  <div className="mt-3 flex gap-2">
                    {/* 다시 시도는 일시적인 실패(retryable)일 때만 */}
                    {file.retryable && (
                      <Button size="sm" icon="undo" onClick={() => start(file)}>
                        다시 시도
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" icon="upload" onClick={() => inputRef.current?.click()}>
                      파일 교체
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </Step>

        {/* 2. 용어 사전 */}
        <Step n={2} title="전문용어 사전" done={terms.length > 0} desc="음성 인식이 한영 혼용 용어를 더 잘 알아듣도록 힌트로 써요.">
          <div className="rounded-[24px] bg-white p-4">
            {terms.length === 0 ? (
              <p className="py-2 text-center text-sm text-muted">{processing ? "교안에서 용어를 뽑는 중이에요..." : "교안을 올리면 자동으로 만들어져요."}</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {terms.map((term) => (
                  <span key={term} className="inline-flex items-center gap-1 rounded-full bg-grape/35 py-1 pl-3 pr-1.5 text-sm font-medium">
                    {term}
                    <button onClick={() => setTerms((ts) => ts.filter((x) => x !== term))} className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-ink/10" aria-label={`${term} 삭제`}>
                      <Icon name="x" size={12} stroke={3} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const v = newTerm.trim();
                if (v && v.length <= TERM_LEN && terms.length < TERMS_MAX && !terms.includes(v)) setTerms((ts) => [...ts, v]);
                setNewTerm("");
              }}
              className="mt-3 flex gap-2 border-t border-line pt-3"
            >
              <input className={`${inputCls} min-w-0 flex-1 !py-2`} placeholder="용어 직접 추가 (40자 이내)" value={newTerm} onChange={(e) => setNewTerm(e.target.value)} maxLength={TERM_LEN} />
              <Button size="sm" variant="soft" icon="plus" type="submit" className="!h-auto" disabled={terms.length >= TERMS_MAX}>
                추가
              </Button>
            </form>
            <p className="mt-2 text-right text-xs text-muted">{terms.length} / {TERMS_MAX}개 · 강연을 시작하면 고칠 수 없어요</p>
          </div>
        </Step>

        {/* 3. QR */}
        <Step n={3} title="청중 입장 QR" done desc="강연을 시작하면 청중이 이 QR로 들어와요.">
          <div className="flex items-center gap-4 rounded-[24px] bg-white p-4">
            <FakeQR code={code} size={112} />
            <div className="flex-1">
              <p className="text-xs text-muted">입장 코드</p>
              <p className="text-3xl font-extrabold tracking-[0.2em]">{code}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button size="sm" variant="soft" icon="expand" onClick={() => setQrOpen(true)}>
                  크게 보기
                </Button>
                <Button size="sm" variant="ghost" icon="copy" onClick={() => toast.show("입장 링크를 복사했어요")}>
                  링크
                </Button>
                <QrReissue lectureId={lecture.id} onDone={(c) => toast.show(`새 입장 코드 ${c}를 만들었어요. 이전 QR은 꺼졌어요`, "mint")} />
              </div>
            </div>
          </div>
        </Step>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-paper via-paper to-transparent pb-7 pt-8">
        <div className="mx-auto px-5 md:max-w-3xl">
          <Button size="lg" icon="play" className="w-full" onClick={() => begin()}>
            강연 시작
          </Button>
        </div>
      </div>

      <QrModal open={qrOpen} onClose={() => setQrOpen(false)} code={code} title={lecture.title} />

      {/* [강연 시작] 경고: 교안 처리 중 / 처리 실패 */}
      <Modal open={warn} onClose={() => setWarn(false)}>
        <div className="flex flex-col items-center text-center">
          <Sticker size={56} rotate={-8}>
            {file?.state === "failed" ? "⚠️" : "⏳"}
          </Sticker>
          <p className="mt-4 text-[22px] font-extrabold tracking-[-0.04em]">{file?.state === "failed" ? "교안 처리에 실패했어요" : "교안을 아직 처리하고 있어요"}</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">지금 시작하면 AI가 교안을 근거로 쓰지 못해 더 많은 질문이 강연자에게 넘어올 수 있어요.</p>
        </div>
        <div className="mt-6 flex gap-2">
          {/* 처리 실패는 기다려도 끝나지 않으니 다시 시도를 권한다 */}
          {file?.state === "failed" ? (
            file.retryable ? (
              <Button
                variant="soft"
                className="flex-1"
                icon="undo"
                onClick={() => {
                  setWarn(false);
                  start(file);
                }}
              >
                다시 시도
              </Button>
            ) : (
              <Button
                variant="soft"
                className="flex-1"
                icon="upload"
                onClick={() => {
                  setWarn(false);
                  inputRef.current?.click();
                }}
              >
                파일 교체
              </Button>
            )
          ) : (
            <Button variant="soft" className="flex-1" onClick={() => setWarn(false)}>
              기다릴게요
            </Button>
          )}
          <Button className="flex-1" onClick={() => begin(true)}>
            그래도 시작
          </Button>
        </div>
      </Modal>

      <SttConsentModal open={sttOpen} onClose={() => setSttOpen(false)} onConfirm={startLecture} noFile={!file} />
    </Screen>
  );
}

function fileLabel(state: FileState, pages: number, chunks: number) {
  if (state === "processing") return "AI가 교안을 읽는 중이에요";
  if (state === "failed") return "처리 실패";
  return `${pages}쪽 · 검색 조각 ${chunks}개`;
}

function Step({ n, title, desc, done, children }: { n: number; title: string; desc?: string; done?: boolean; children: React.ReactNode }) {
  return (
    <section className="mt-7">
      <div className="mb-3 flex items-center gap-2">
        <span className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold ${done ? "bg-mint text-ink" : "bg-ink text-white"}`}>{done ? <Icon name="check" size={15} stroke={3} /> : n}</span>
        <h2 className="text-[19px] font-bold tracking-[-0.03em]">{title}</h2>
      </div>
      {desc && <p className="-mt-1 mb-3 text-sm text-muted">{desc}</p>}
      {children}
    </section>
  );
}
