// 데모용 목업 데이터. 실제 API 연동 전까지 화면이 이 값을 사용한다.

export type Tone = "coral" | "ocean" | "mint" | "grape" | "berry" | "honey" | "leaf";

export const tones: Record<Tone, { hex: string; bg: string; soft: string; text: string }> = {
  coral: { hex: "#f4625a", bg: "bg-coral", soft: "bg-coral/15", text: "text-coral-ink" },
  ocean: { hex: "#3a82f7", bg: "bg-ocean", soft: "bg-ocean/15", text: "text-ocean-ink" },
  mint: { hex: "#3dbf6e", bg: "bg-mint", soft: "bg-mint/18", text: "text-mint-ink" },
  grape: { hex: "#c2b0f4", bg: "bg-grape", soft: "bg-grape/30", text: "text-grape-ink" },
  berry: { hex: "#f59ac0", bg: "bg-berry", soft: "bg-berry/25", text: "text-[#c93b78]" },
  honey: { hex: "#ffc830", bg: "bg-honey", soft: "bg-honey/30", text: "text-[#a67800]" },
  leaf: { hex: "#f7961f", bg: "bg-leaf", soft: "bg-leaf/20", text: "text-[#b86400]" },
};

// 말풍선 · 블록을 번갈아 칠할 때 쓰는 순서 (시안의 Chats 화면 순서)
export const toneCycle: Tone[] = ["coral", "honey", "leaf", "ocean", "grape", "mint"];

// 선택 동의(AI 개선을 위한 익명 활용) 설명. 게스트 입장 · 회원가입 · 내 정보에서 같이 쓴다
export const LEARN_CONSENT_TEXT = "이름 · 이메일 · 닉네임 같은 개인정보를 뺀 질문 문장만 AI 판정 모델 개선에 쓰여요.";

export const me = {
  name: "주혜",
  email: "juhye@gachon.ac.kr",
};

// ── 강연자: 내 강연 ───────────────────────────────

export type LectureStatus = "ready" | "live" | "ended";
export type FileState = "none" | "processing" | "failed" | "done";

export type Lecture = {
  id: string;
  title: string;
  date: string;
  time: string;
  desc: string;
  status: LectureStatus;
  code: string;
  tone: Tone;
  emoji: string;
  // retryable: 실패 원인이 일시적이라 같은 파일로 다시 시도할 수 있음. 아니면 파일 교체만
  file: { name: string; pages: number; chunks: number; state: FileState; failReason?: string; retryable?: boolean } | null;
  audience: number;
  glossary: string[];
  endReason?: EndReason;
  // 강연자 표시명. 없으면 로그인한 데모 회원(주혜)이 연 강연
  host?: string;
  // 회원 · 게스트 참가자 수 (리포트 통계)
  participants?: { members: number; guests: number };
};

// 강연 종료 사유. 강연자가 직접 끝내거나, 시작 후 12시간이 지나 자동으로 끝나거나, 관리자가 강제로 끝낸다
export type EndReason = "manual" | "auto" | "admin";

export const endReasonText: Record<EndReason, string> = { manual: "직접 종료", auto: "12시간 자동 종료", admin: "관리자 종료" };

export const lectures: Lecture[] = [
  {
    id: "l1",
    title: "인공지능 개론 7주차 · 트랜스포머",
    date: "2026.10.22 (목)",
    time: "14:00",
    desc: "셀프 어텐션부터 인코더-디코더 구조까지",
    status: "live",
    code: "QX7K2",
    tone: "ocean",
    emoji: "🤖",
    file: { name: "07_transformer.pdf", pages: 42, chunks: 186, state: "done" },
    audience: 42,
    participants: { members: 25, guests: 17 },
    glossary: ["Transformer", "Self-Attention", "Query", "Key", "Value", "Multi-Head", "Positional Encoding", "Encoder", "Decoder", "Softmax", "Layer Norm", "Residual"],
  },
  {
    id: "l2",
    title: "데이터베이스 설계 특강",
    date: "2026.10.23 (금)",
    time: "10:30",
    desc: "정규화와 인덱스 설계 실습",
    status: "ready",
    code: "DB4M8",
    tone: "mint",
    emoji: "🗄️",
    file: { name: "db_design_special.pptx", pages: 36, chunks: 0, state: "failed", retryable: true, failReason: "임베딩 API 응답이 지연돼 인덱싱을 마치지 못했어요." },
    audience: 0,
    glossary: ["정규화", "Normal Form", "Index", "B-Tree"],
  },
  {
    id: "l3",
    title: "웹 프로그래밍 6주차 · React 상태 관리",
    date: "2026.10.08 (목)",
    time: "13:00",
    desc: "useState, useReducer, Context 비교",
    status: "ended",
    code: "WB6R3",
    tone: "grape",
    emoji: "⚛️",
    file: { name: "06_react_state.pdf", pages: 31, chunks: 142, state: "done" },
    audience: 44,
    participants: { members: 27, guests: 17 },
    glossary: ["useState", "useReducer", "Context", "Props", "Re-render"],
    endReason: "manual",
  },
  {
    id: "l4",
    title: "오픈소스 SW 세미나",
    date: "2026.10.01 (수)",
    time: "16:00",
    desc: "첫 기여까지의 여정",
    status: "ended",
    code: "OS1S9",
    tone: "honey",
    emoji: "🌱",
    file: { name: "opensource_seminar.pdf", pages: 24, chunks: 97, state: "done" },
    audience: 38,
    participants: { members: 22, guests: 16 },
    glossary: ["Pull Request", "Issue", "License", "Fork"],
    endReason: "auto",
  },
  {
    id: "l6",
    title: "컴퓨터 네트워크 특강 · TCP 혼잡 제어",
    date: "2026.09.24 (목)",
    time: "15:00",
    desc: "슬로 스타트와 혼잡 회피",
    status: "ended",
    code: "NT2C5",
    tone: "coral",
    emoji: "🌐",
    file: { name: "tcp_congestion.pdf", pages: 22, chunks: 88, state: "done" },
    audience: 41,
    participants: { members: 24, guests: 17 },
    glossary: ["TCP", "Slow Start", "cwnd", "AIMD"],
    endReason: "admin",
  },
];

export function findLecture(id: string) {
  return lectures.find((l) => l.id === id);
}

// 데모 시계. 새 질문 시각을 실제 시계 대신 진행 중 목업 강연 시간대(14:34부터)로 찍는다
const demoStart = Date.now();
export function demoClock() {
  const min = 14 * 60 + 34 + Math.floor((Date.now() - demoStart) / 60_000);
  return `${String(Math.floor(min / 60) % 24).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}

// 세션 정원 (N-08 동시 접속 목표)
export const SESSION_CAPACITY = 50;

// 입장 코드로 강연을 찾는다. 재발급된 강연의 이전 코드는 expired로 돌려준다
// 다른 회원의 강연. 내 강의 목록에는 없고 청중 입장 코드로만 찾는다 (종료 예시 코드 SU3M7)
export const otherLectures: Lecture[] = [
  {
    id: "s7",
    title: "창업 세미나 · MVP 검증하기",
    date: "2026.09.30 (수)",
    time: "16:00",
    desc: "인터뷰와 랜딩 페이지로 가설 검증하기",
    status: "ended",
    code: "SU3M7",
    tone: "leaf",
    emoji: "🚀",
    file: { name: "mvp_validation.pdf", pages: 26, chunks: 104, state: "done" },
    audience: 46,
    participants: { members: 29, guests: 17 },
    glossary: [],
    endReason: "auto",
    host: "이하준",
  },
  {
    // 정원(50명)이 가득 찬 진행 중 강연 (SESSION_FULL 안내 확인용)
    id: "s2",
    title: "경영학원론 · 마케팅 믹스",
    date: "2026.10.22 (목)",
    time: "13:30",
    desc: "4P와 STP",
    status: "live",
    code: "MK4P2",
    tone: "coral",
    emoji: "📈",
    file: { name: "marketing_mix.pdf", pages: 30, chunks: 120, state: "done" },
    audience: 50,
    glossary: [],
    host: "오세훈",
  },
];

export function resolveCode(code: string, codes: Record<string, string>) {
  const c = code.trim().toUpperCase();
  const lecture = [...lectures, ...otherLectures].find((l) => (codes[l.id] ?? l.code) === c);
  if (lecture) return { lecture, expired: false };
  const old = lectures.find((l) => codes[l.id] && l.code === c);
  return { lecture: old, expired: !!old };
}

// 입장 코드 재발급용. 헷갈리는 글자(0 · O · 1 · I)는 뺀다
export function newCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

// 강연자가 시작했거나, 강연자 · 관리자가 종료한 강연까지 반영한 상태
export function statusOf(l: Lecture, endedLectures: string[], startedLectures: string[] = []): LectureStatus {
  if (endedLectures.includes(l.id)) return "ended";
  return startedLectures.includes(l.id) ? "live" : l.status;
}

// 데모 기준 오늘. 강연 후 90일이 지나면 근거 원문 대신 위치와 인용 구절만 보여준다
export const DEMO_TODAY = "2026.10.22";
export const ORIGINAL_KEEP_DAYS = 90;

export function daysSince(date: string) {
  const toTime = (d: string) => new Date(d.slice(0, 10).replaceAll(".", "-")).getTime();
  return Math.floor((toTime(DEMO_TODAY) - toTime(date)) / 86_400_000);
}

// ── 질문 ──────────────────────────────────────────

export type Source = { kind: "slide" | "speech"; label: string; quote: string };

export type PublicQuestion = {
  id: string;
  text: string;
  page: number | null;
  likes: number;
  liked?: boolean;
  status: "waiting" | "done";
  at: string;
  mine?: boolean;
  isNew?: boolean;
};

export type AiQuestion = {
  id: string;
  text: string;
  answer: string;
  sources: Source[];
  at: string;
  score: number;
  route: "판정 모델" | "Sonnet 대체 판정";
  retracted?: boolean;
  feedback?: "up" | "down" | null;
  mine?: boolean;
};

export const livePublicQuestions: PublicQuestion[] = [
  { id: "p1", text: "포지셔널 인코딩을 sin/cos 말고 학습 가능한 벡터로 써도 성능 차이가 크지 않나요? 실제로는 어떤 걸 더 많이 쓰나요?", page: 14, likes: 23, status: "waiting", at: "14:21" },
  { id: "p2", text: "과제 3번 제출 기한이 연장되나요?", page: null, likes: 17, status: "waiting", at: "14:18", mine: true },
  { id: "p3", text: "어텐션 시각화한 그림에서 색이 진할수록 관련도가 높다는 건 알겠는데, 왜 대각선이 유독 진한가요?", page: 19, likes: 12, status: "waiting", at: "14:27" },
  { id: "p4", text: "BERT랑 GPT가 둘 다 트랜스포머인데 왜 하나는 인코더만, 하나는 디코더만 쓰는지 설계 이유가 궁금해요.", page: 31, likes: 9, status: "waiting", at: "14:30" },
  { id: "p5", text: "중간고사 범위에 트랜스포머가 포함되나요?", page: null, likes: 31, status: "done", at: "14:09" },
  { id: "p6", text: "RNN 대비 병렬화가 된다고 했는데 학습할 때만인가요, 추론할 때도인가요?", page: 8, likes: 6, status: "waiting", at: "14:33" },
];

export const liveAiQuestions: AiQuestion[] = [
  {
    id: "a1",
    text: "셀프 어텐션에서 Query, Key, Value는 각각 뭘 의미하나요?",
    answer:
      "Query는 ‘지금 내가 찾고 싶은 정보’, Key는 ‘각 단어가 가진 꼬리표’, Value는 ‘실제로 가져올 내용’이에요. Query와 Key의 내적으로 관련도를 계산하고, 그 가중치로 Value를 섞어 새 표현을 만들어요.",
    sources: [
      { kind: "slide", label: "교안 p.12", quote: "Attention(Q, K, V) = softmax(QKᵀ / √dₖ) V" },
      { kind: "speech", label: "발화 16:06", quote: "도서관에서 검색어가 쿼리고, 책 제목이 키, 책 내용이 밸류라고 생각하시면 돼요." },
    ],
    at: "14:17",
    score: 0.94,
    route: "판정 모델",
    mine: true,
  },
  {
    id: "a2",
    text: "멀티헤드 어텐션은 헤드 수가 많을수록 항상 좋아지나요?",
    answer: "헤드 수를 늘리면 다양한 관계를 볼 수 있어 일반적으로 성능이 좋아지며, 많을수록 항상 유리합니다.",
    sources: [{ kind: "slide", label: "교안 p.16", quote: "Multi-Head: h = 8, dₖ = d_model / h = 64" }],
    at: "14:24",
    score: 0.81,
    route: "판정 모델",
    mine: true,
  },
  {
    id: "a3",
    text: "√dₖ로 나누는 이유가 뭔가요?",
    answer: "dₖ가 커지면 내적 값의 분산이 커져 softmax가 한쪽으로 쏠리고 기울기가 아주 작아져요. √dₖ로 나눠 값의 크기를 맞춰 학습을 안정시키는 거예요.",
    sources: [
      { kind: "slide", label: "교안 p.13", quote: "Scaled dot-product: 큰 dₖ에서 softmax 기울기 소실 방지" },
      { kind: "speech", label: "발화 19:45", quote: "나누지 않으면 소프트맥스가 거의 원-핫처럼 돼 버려요." },
    ],
    at: "14:20",
    score: 0.91,
    route: "판정 모델",
  },
  {
    id: "a4",
    text: "Layer Norm은 어디에 들어가요?",
    answer: "각 서브층(어텐션, 피드포워드) 뒤에서 residual 연결과 합친 다음 Layer Norm을 적용해요. 교안 그림에서 ‘Add & Norm’ 상자가 그 위치예요.",
    sources: [{ kind: "slide", label: "교안 p.22", quote: "Add & Norm: LayerNorm(x + Sublayer(x))" }],
    at: "14:29",
    score: 0.88,
    route: "Sonnet 대체 판정",
  },
];

// 강연자 화면에 새로 들어오는 이관 질문 (실시간 시뮬레이션)
export const incomingQuestions: Omit<PublicQuestion, "id" | "at">[] = [
  { text: "디코더의 마스킹은 학습할 때만 쓰나요? 생성할 때는 어떻게 되나요?", page: 26, likes: 1, status: "waiting" },
  { text: "실습 코드는 어디서 받을 수 있나요?", page: null, likes: 2, status: "waiting" },
  { text: "피드포워드 층 차원이 2048로 커지는 이유가 있나요?", page: 23, likes: 1, status: "waiting" },
  { text: "Vision Transformer도 이번 시간에 다루나요?", page: 40, likes: 3, status: "waiting" },
];

export const transcriptScript = [
  "자, 이제 디코더 쪽을 보겠습니다.",
  "디코더는 인코더랑 거의 같은데 masked self-attention이 하나 더 들어가요.",
  "미래 토큰을 못 보게 가리는 거죠. 시험에 자주 나옵니다.",
  "그다음 cross-attention에서 Query는 디코더, Key와 Value는 인코더 출력에서 와요.",
  "여기 그림 26페이지 보시면 화살표가 두 갈래로 들어오는 게 보이실 거예요.",
  "학습할 때는 teacher forcing으로 정답 토큰을 한 번에 넣습니다.",
  "그래서 RNN이랑 다르게 학습 시에는 병렬화가 가능한 거예요.",
  "질문 들어온 것 중에 포지셔널 인코딩 얘기가 많네요. 잠깐 짚고 갈게요.",
];

// 인식 텍스트 시각은 강연 시작 기준 경과 시간(mm:ss)
export const initialTranscript = [
  { at: "31:05", text: "인코더 블록은 이렇게 여섯 번 쌓습니다. N은 6이에요." },
  { at: "32:18", text: "각 블록 안에 multi-head attention이랑 feed-forward가 있고요." },
  { at: "33:40", text: "residual connection 덕분에 깊게 쌓아도 학습이 잘 됩니다." },
];

// 청중이 새 질문을 냈을 때 데모 판정: 교안 용어가 들어 있으면 AI 답변, 아니면 강연자에게 이관
// 판정은 통과했지만 답변을 쓰다가 근거가 부족해 폐기되는 질문 (answer.discarded). 작성 중이던 글자를 지우고 강연자에게 전달한다
export const discardedDrafts: { keys: string[]; draft: string }[] = [
  { keys: ["시험", "범위", "과제"], draft: "이번 강의에서 다룬 트랜스포머 구조는 교안 기준으로" },
];

export const cannedAnswers: { keys: string[]; answer: string; sources: Source[] }[] = [
  {
    keys: ["마스킹", "mask", "마스크"],
    answer: "디코더의 마스킹은 아직 생성하지 않은 미래 토큰을 보지 못하게 어텐션 점수를 -∞로 가리는 거예요. 학습 때는 정답을 한 번에 넣으니 꼭 필요하고, 생성 때도 같은 구조를 그대로 써요.",
    sources: [
      { kind: "slide", label: "교안 p.26", quote: "Masked Multi-Head Attention: 위치 i는 i 이전만 참조" },
      { kind: "speech", label: "발화 33:40", quote: "미래 토큰을 못 보게 가리는 거죠." },
    ],
  },
  {
    keys: ["인코더", "디코더", "encoder", "decoder"],
    answer: "인코더는 입력 문장 전체를 보고 문맥 표현을 만들고, 디코더는 그 표현과 지금까지 만든 출력을 보고 다음 토큰을 만들어요. 둘 사이는 cross-attention으로 연결돼요.",
    sources: [
      { kind: "slide", label: "교안 p.21", quote: "Encoder × 6 → Decoder × 6, cross-attention으로 연결" },
      { kind: "speech", label: "발화 32:34", quote: "Query는 디코더, Key와 Value는 인코더 출력에서 와요." },
    ],
  },
  {
    keys: ["어텐션", "attention", "softmax", "소프트맥스"],
    answer: "어텐션은 문장 안 단어끼리 얼마나 관련 있는지 점수를 매기고, softmax로 확률처럼 바꾼 다음 그 비율로 정보를 섞는 연산이에요.",
    sources: [{ kind: "slide", label: "교안 p.12", quote: "Attention(Q, K, V) = softmax(QKᵀ / √dₖ) V" }],
  },
  {
    keys: ["포지셔널", "positional", "위치"],
    answer: "트랜스포머는 단어를 한꺼번에 보기 때문에 순서 정보가 없어요. 그래서 각 위치마다 고유한 벡터(sin/cos 패턴)를 단어 임베딩에 더해 순서를 알려줘요.",
    sources: [{ kind: "slide", label: "교안 p.14", quote: "PE(pos, 2i) = sin(pos / 10000^(2i/d))" }],
  },
];

// 웹 프로그래밍 6주차(l3) 리포트 요약 노트
export const reactStateNote = {
  headline: "React 상태를 어디에 둘지 고르는 기준: 지역 상태, 리듀서, Context",
  concepts: ["지역 상태는 useState로 두고, 여러 컴포넌트가 쓰면 가까운 부모로 끌어올린다", "상태 변경 로직이 복잡하면 useReducer로 액션별 처리를 한곳에 모은다 (교안 p.12)", "Context 값이 바뀌면 구독하는 컴포넌트가 모두 리렌더된다 (교안 p.18)"],
  emphasis: ["setState는 바로 반영되지 않고 배치로 업데이트된다", "자주 바뀌는 값과 드물게 바뀌는 값은 Context를 나눠 담는다", "상태는 불변으로 다뤄야 변경을 감지할 수 있다"],
  keywords: ["useState", "useReducer", "Context"],
};

export type SummaryNoteData = { headline: string; concepts: string[]; emphasis: string[]; keywords: string[] };

// ── 청중: 내 보관함 ───────────────────────────────

export type ArchiveItem = {
  id: string;
  // 이 기록이 나온 강연 (입장 코드로 들어왔을 때 보관함 상세로 보내는 데 쓴다)
  lectureId?: string;
  title: string;
  speaker: string;
  date: string;
  tone: Tone;
  emoji: string;
  summary: "ready" | "generating" | "failed" | "none";
  // 요약 노트 4구역 = JSON 필드와 1:1 (한 줄 요약 · 핵심 개념 · 강조한 점 · 키워드)
  note?: SummaryNoteData;
  myQuestions: { id: string; text: string; kind: "ai" | "forwarded"; answer?: string; sources?: Source[]; status?: "waiting" | "done"; retracted?: boolean }[];
  // 강연자에게 전달된 전체 질문. liked는 내가 공감한 질문, memo는 강연 중 남긴 내 필기
  questions: { id: string; text: string; likes: number; status: "waiting" | "done"; liked: boolean; memo?: string }[];
};

export const archive: ArchiveItem[] = [
  {
    id: "r1",
    title: "컴퓨터 비전 특강 · Diffusion 모델",
    speaker: "김서연 교수",
    date: "2026.10.10",
    tone: "berry",
    emoji: "🎨",
    summary: "ready",
    note: {
      headline: "노이즈를 조금씩 지우며 이미지를 만드는 확산 모델의 원리와 학습 방법",
      concepts: ["Forward 과정: 이미지에 가우시안 노이즈를 T단계에 걸쳐 더한다", "Reverse 과정: 신경망이 각 단계의 노이즈를 예측해 제거한다", "U-Net이 노이즈 예측기로 주로 쓰인다 (교안 p.11)"],
      emphasis: ["GAN보다 학습이 안정적이지만 샘플링이 느리다", "DDIM으로 단계 수를 줄여 속도를 높일 수 있다", "텍스트 조건은 cross-attention으로 넣는다"],
      keywords: ["DDPM", "U-Net", "Noise Schedule", "DDIM", "Classifier-free Guidance"],
    },
    myQuestions: [
      { id: "m1", text: "노이즈 스케줄은 선형 말고 다른 것도 있나요?", kind: "ai", answer: "선형 외에 cosine 스케줄이 자주 쓰여요. 초반에 노이즈를 천천히 더해 이미지 정보가 더 오래 남게 해 줘요.", sources: [{ kind: "slide", label: "교안 p.9", quote: "β schedule: linear vs cosine" }] },
      { id: "m2", text: "Stable Diffusion은 왜 latent 공간에서 학습하나요?", kind: "forwarded", status: "done" },
      { id: "m3", text: "guidance scale을 너무 올리면 어떻게 되나요?", kind: "ai", answer: "조건을 더 강하게 따르지만, 지나치면 색이 과포화되고 다양성이 줄어요.", sources: [{ kind: "speech", label: "발화 42:51", quote: "7에서 8 정도가 무난하고 너무 올리면 그림이 타요." }], retracted: true },
    ],
    questions: [
      { id: "k1", text: "GAN이랑 비교했을 때 단점은 뭔가요?", likes: 19, status: "done", liked: true, memo: "샘플링이 느린 게 가장 큰 단점. 기말 비교 문제로 나올 듯" },
      { id: "k2", text: "과제에서 사전학습 모델 써도 되나요?", likes: 14, status: "done", liked: true },
      { id: "k5", text: "Stable Diffusion은 왜 latent 공간에서 학습하나요?", likes: 11, status: "done", liked: false, memo: "VAE로 압축한 공간에서 학습 → 연산량 감소. 논문 찾아보기" },
      { id: "k6", text: "샘플링 단계를 줄이면 품질이 얼마나 떨어지나요?", likes: 7, status: "done", liked: false, memo: "DDIM 쓰면 50단계로도 괜찮다고 함" },
      { id: "k7", text: "중간고사 범위에 이번 특강 내용도 들어가나요?", likes: 3, status: "waiting", liked: false },
    ],
  },
  {
    id: "r2",
    title: "알고리즘 9주차 · 동적 계획법",
    speaker: "박도윤 교수",
    date: "2026.10.07",
    tone: "honey",
    emoji: "🧩",
    summary: "ready",
    note: {
      headline: "부분 문제의 답을 저장해 다시 쓰는 동적 계획법의 두 가지 방식",
      concepts: ["최적 부분 구조 + 중복 부분 문제가 있으면 DP를 쓴다", "Top-down(메모이제이션)과 Bottom-up(테이블) 두 방식", "점화식을 먼저 세우고 기저 사례를 정한다"],
      emphasis: ["피보나치 O(2ⁿ) → O(n)", "배낭 문제: dp[i][w] = max(포함, 미포함)", "LCS: 두 문자열 표를 채워 길이를 구한다"],
      keywords: ["Memoization", "Tabulation", "Knapsack", "LCS"],
    },
    myQuestions: [
      { id: "m4", text: "메모이제이션이랑 그리디는 어떻게 구분하나요?", kind: "ai", answer: "그리디는 매 순간 최선만 고르고 되돌아보지 않지만, DP는 모든 부분 문제의 답을 저장해 비교해요. 그리디가 최적임이 증명될 때만 그리디를 써요.", sources: [{ kind: "slide", label: "교안 p.5", quote: "Greedy vs DP: 선택의 되돌림 여부" }] },
      { id: "m5", text: "코딩테스트에서 재귀 깊이 제한 걸리면 어떻게 하나요?", kind: "forwarded", status: "done" },
    ],
    questions: [
      { id: "k3", text: "배낭 문제 공간 복잡도 줄이는 방법도 시험에 나오나요?", likes: 22, status: "done", liked: true },
      { id: "k8", text: "점화식 세우는 연습은 어떤 문제로 하면 좋을까요?", likes: 15, status: "done", liked: false, memo: "추천: 계단 오르기 → LIS → 배낭 순서로 풀기" },
      { id: "k9", text: "그리디랑 DP는 어떻게 구분하나요?", likes: 9, status: "done", liked: false },
    ],
  },
  {
    id: "r3",
    lectureId: "s7",
    title: "창업 세미나 · MVP 검증하기",
    speaker: "이하준 대표",
    date: "2026.09.30",
    tone: "leaf",
    emoji: "🚀",
    summary: "none",
    myQuestions: [{ id: "m6", text: "인터뷰 대상자는 몇 명 정도가 적당한가요?", kind: "forwarded", status: "done" }],
    questions: [
      { id: "m6", text: "인터뷰 대상자는 몇 명 정도가 적당한가요?", likes: 6, status: "done", liked: false },
      { id: "k10", text: "랜딩 페이지 테스트는 광고비를 얼마나 써야 하나요?", likes: 4, status: "done", liked: false },
    ],
  },
  {
    id: "r4",
    title: "웹 프로그래밍 5주차 · Next.js 라우팅",
    speaker: "최민지 교수",
    date: "2026.09.24",
    tone: "grape",
    emoji: "🧭",
    summary: "ready",
    note: {
      headline: "App Router의 폴더 기반 라우팅과 레이아웃 중첩",
      concepts: ["폴더 = URL 경로, page.tsx가 화면", "layout.tsx는 하위 페이지에서 유지된다", "[id] 폴더로 동적 경로를 만든다"],
      emphasis: ["Server Component가 기본이고, 상호작용이 필요한 곳만 'use client'로 나눈다", "같은 레이아웃을 쓰는 페이지끼리는 이동해도 레이아웃이 다시 그려지지 않는다"],
      keywords: ["App Router", "Layout", "Dynamic Route"],
    },
    myQuestions: [],
    questions: [
      { id: "k11", text: "layout이랑 template은 뭐가 달라요?", likes: 12, status: "done", liked: false, memo: "template은 이동할 때마다 새로 마운트됨" },
      { id: "k4", text: "pages 라우터 프로젝트도 계속 써도 되나요?", likes: 8, status: "done", liked: true },
    ],
  },
  {
    // 강연 후 90일이 지난 기록: 근거 원문 보기 없이 위치와 인용 구절만 남는다
    id: "r5",
    title: "자료구조 특강 · 해시 테이블",
    speaker: "박도윤 교수",
    date: "2026.07.08",
    tone: "ocean",
    emoji: "🗃️",
    summary: "ready",
    note: {
      headline: "키를 해시 함수로 바꿔 평균 O(1)에 찾는 해시 테이블과 충돌 처리",
      concepts: ["해시 함수가 키를 버킷 번호로 바꾼다", "충돌은 체이닝 또는 개방 주소법으로 처리한다", "적재율이 높아지면 리해싱한다"],
      emphasis: ["적재율이 높아지기 전에 리해싱 비용을 고려한다", "키 비교가 비싸면 해시값을 함께 저장해 비교를 줄인다"],
      keywords: ["Hash", "Chaining", "Open Addressing", "Load Factor"],
    },
    myQuestions: [
      { id: "m7", text: "체이닝이랑 개방 주소법 중에 뭘 더 많이 쓰나요?", kind: "ai", answer: "언어 표준 라이브러리는 체이닝을 많이 쓰고, 캐시 효율이 중요한 곳은 개방 주소법을 써요.", sources: [{ kind: "slide", label: "교안 p.14", quote: "Chaining vs Open Addressing: 메모리 · 캐시 효율 비교" }, { kind: "speech", label: "발화 10:42", quote: "자바 HashMap은 체이닝이에요." }] },
    ],
    questions: [{ id: "k12", text: "리해싱할 때 시간이 오래 걸리면 서비스가 멈추나요?", likes: 9, status: "done", liked: true, memo: "점진적 리해싱으로 나눠서 처리" }],
  },
];

// 컴퓨터 네트워크 특강(l6) 리포트 요약 노트
export const tcpNote = {
  headline: "패킷 손실을 신호로 전송량을 조절하는 TCP 혼잡 제어",
  concepts: ["슬로 스타트: cwnd를 RTT마다 두 배로 늘린다", "임계값을 넘으면 혼잡 회피로 1씩 늘린다 (AIMD)", "손실이 감지되면 cwnd를 줄이고 다시 늘린다"],
  emphasis: ["패킷 손실을 혼잡의 신호로 본다", "대역폭이 큰 환경에서는 BBR 같은 다른 방식도 쓴다"],
  keywords: ["Slow Start", "cwnd", "AIMD"],
};

// 인공지능 개론 7주차(l1) 리포트 요약 노트
export const transformerNote = {
  headline: "단어끼리 서로를 바라보는 셀프 어텐션으로 RNN 없이 문맥을 읽는 트랜스포머",
  concepts: ["Q · K 내적으로 관련도를 구하고 softmax 가중치로 V를 섞는다 (교안 p.12)", "√dₖ로 나눠 softmax 쏠림과 기울기 소실을 막는다", "멀티헤드로 여러 관계를 동시에 본다 (h = 8)"],
  emphasis: ["인코더 · 디코더 각각 6층, 층마다 Add & Norm", "디코더는 미래 토큰을 가리는 masked self-attention을 쓴다", "cross-attention: Query는 디코더, Key · Value는 인코더 출력", "포지셔널 인코딩: 고정(sin/cos) vs 학습형", "학습 시 병렬화가 가능한 이유 (teacher forcing)"],
  keywords: ["Self-Attention", "Multi-Head", "Positional Encoding", "Masking", "Cross-Attention"],
};

// 종료된 강연에 회원으로 들어오면 갈 곳: 그 강연의 보관함 상세, 없으면 보관함 목록.
// 본인이 연 강연은 보관함에 나오지 않는다 (내 강연에만)
export function archiveHrefFor(lectureId: string) {
  const item = archive.find((a) => a.lectureId === lectureId);
  return item ? `/archive/${item.id}` : "/archive";
}

// 지난 강연 리포트용 질문 기록. 리포트 통계 · 내 강연 목록의 숫자는 모두 여기서 계산한다
// done: 강연자가 답변 완료로 표시한 공개 질문
export type LogEntry = { text: string; kind: "ai" | "forwarded"; likes: number; page: number | null; retracted?: boolean; done?: boolean };

export const questionLogs: Record<string, LogEntry[]> = {
  // 진행 중인 강연(l1)는 끝나면 라이브 화면의 질문으로 리포트를 만든다
  l1: [
    ...liveAiQuestions.map((q) => ({ text: q.text, kind: "ai" as const, likes: 0, page: Number(q.sources.find((s) => s.kind === "slide")?.label.match(/\d+/)?.[0]) || null, retracted: q.id === "a2" })),
    ...livePublicQuestions.map((q) => ({ text: q.text, kind: "forwarded" as const, likes: q.likes, page: q.page, done: q.status === "done" })),
  ],
  l3: [
    { text: "useReducer는 언제 useState 대신 쓰나요?", kind: "ai", likes: 0, page: 12 },
    { text: "Context를 쓰면 리렌더가 너무 많이 일어나지 않나요?", kind: "forwarded", likes: 27, page: 18, done: true },
    { text: "상태 관리 라이브러리는 실무에서 뭘 많이 쓰나요?", kind: "forwarded", likes: 21, page: 29, done: true },
    { text: "setState가 비동기라는 게 정확히 무슨 뜻인가요?", kind: "ai", likes: 0, page: 7, retracted: true },
    { text: "props drilling이 몇 단계부터 문제인가요?", kind: "forwarded", likes: 12, page: 16, done: true },
    { text: "key prop을 index로 쓰면 왜 안 되나요?", kind: "ai", likes: 0, page: 9 },
    { text: "useState 초기값에 함수를 넘기는 이유가 뭔가요?", kind: "ai", likes: 0, page: 5 },
    { text: "리듀서 안에서 API 호출해도 되나요?", kind: "forwarded", likes: 9, page: 14 },
    { text: "Context Provider를 여러 개 겹쳐도 성능 문제 없나요?", kind: "ai", likes: 0, page: 19 },
    { text: "과제에서 Redux를 써도 감점 없나요?", kind: "forwarded", likes: 15, page: null, done: true },
    { text: "상태를 URL에 두는 경우는 언제인가요?", kind: "forwarded", likes: 6, page: 27 },
    { text: "불변성을 지켜야 하는 이유가 뭔가요?", kind: "ai", likes: 0, page: 11 },
  ],
  l4: [
    { text: "첫 기여로 문서 수정만 해도 괜찮나요?", kind: "forwarded", likes: 14, page: 6, done: true },
    { text: "Fork와 Clone은 뭐가 달라요?", kind: "ai", likes: 0, page: 9 },
    { text: "MIT랑 Apache 라이선스 차이가 뭔가요?", kind: "ai", likes: 0, page: 17 },
    { text: "PR이 몇 주째 리뷰가 안 되면 어떻게 하나요?", kind: "forwarded", likes: 11, page: 21, done: true },
    { text: "good first issue는 어디서 찾나요?", kind: "ai", likes: 0, page: 12 },
    { text: "회사 코드를 오픈소스로 공개할 때 주의할 점은요?", kind: "forwarded", likes: 7, page: null },
  ],
  l6: [
    { text: "슬로 스타트는 왜 지수적으로 늘리나요?", kind: "ai", likes: 0, page: 6 },
    { text: "cwnd랑 rwnd 중 작은 값을 쓰는 이유가 뭔가요?", kind: "ai", likes: 0, page: 9 },
    { text: "QUIC도 같은 혼잡 제어를 쓰나요?", kind: "forwarded", likes: 13, page: 18, done: true },
    { text: "BBR은 시험 범위에 들어가나요?", kind: "forwarded", likes: 8, page: null },
  ],
};

// 철회된 AI 답변은 공개 목록으로 옮겨지므로 '강연자에게 온 질문'에 함께 센다
export function logStats(log: LogEntry[]) {
  const ai = log.filter((q) => q.kind === "ai" && !q.retracted).length;
  return {
    questions: log.length,
    ai,
    forwarded: log.length - ai,
    done: log.filter((q) => q.done).length,
    likes: log.reduce((s, q) => s + q.likes, 0),
    retracted: log.filter((q) => q.retracted).length,
  };
}

// 교안 페이지별 질문 수. 교안 페이지가 없는 질문은 "일반 질문"으로 묶는다
export function pageCounts(log: LogEntry[]) {
  const pages = [...new Set(log.map((q) => q.page))].sort((a, b) => (a ?? 9999) - (b ?? 9999));
  return pages.map((page) => ({ page: page === null ? "일반 질문" : `p.${page}`, count: log.filter((q) => q.page === page).length }));
}

export const notices = [
  { id: "n1", title: "EasyQ 베타 오픈 안내", date: "2026.10.01", body: "가천대 실무프로젝트 EasyQ 베타가 열렸어요. 강연을 만들고 QR로 청중을 초대해 보세요." },
  { id: "n3", title: "10/20 새벽 점검", date: "2026.10.12", body: "10월 20일 02:00~04:00 서버 점검이 있어요. 이 시간에는 강연을 진행할 수 없어요." },
];

export const inquiries = [
  { id: "i1", title: "교안 PPTX 업로드가 실패해요", date: "2026.10.09", status: "답변 완료" as const, answer: "PPTX 안의 이미지가 커서 용량 제한(50MB)을 넘었어요. PDF로 저장해 올려 주세요." },
];
