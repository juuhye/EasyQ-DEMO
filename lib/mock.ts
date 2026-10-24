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

export const me = {
  name: "주혜",
  email: "juhye@gachon.ac.kr",
};

// ── 강연자: 내 강의 ───────────────────────────────

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
  file: { name: string; pages: number; chunks: number; state: FileState; failReason?: string } | null;
  audience: number;
  glossary: string[];
  stats?: { questions: number; ai: number; forwarded: number; likes: number; retracted: number };
};

export const lectures: Lecture[] = [
  {
    id: "l1",
    title: "인공지능 개론 7주차 · 트랜스포머",
    date: "2026.10.15 (목)",
    time: "14:00",
    desc: "셀프 어텐션부터 인코더-디코더 구조까지",
    status: "live",
    code: "QX7K2",
    tone: "ocean",
    emoji: "🤖",
    file: { name: "07_transformer.pdf", pages: 42, chunks: 186, state: "done" },
    audience: 128,
    glossary: ["Transformer", "Self-Attention", "Query", "Key", "Value", "Multi-Head", "Positional Encoding", "Encoder", "Decoder", "Softmax", "Layer Norm", "Residual"],
  },
  {
    id: "l2",
    title: "데이터베이스 설계 특강",
    date: "2026.10.21 (수)",
    time: "10:30",
    desc: "정규화와 인덱스 설계 실습",
    status: "ready",
    code: "DB4M8",
    tone: "mint",
    emoji: "🗄️",
    file: { name: "db_design_special.pptx", pages: 36, chunks: 0, state: "failed", failReason: "임베딩 API 응답이 지연돼 인덱싱을 마치지 못했어요." },
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
    audience: 94,
    glossary: ["useState", "useReducer", "Context", "Props", "Re-render"],
    stats: { questions: 57, ai: 34, forwarded: 23, likes: 212, retracted: 2 },
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
    audience: 61,
    glossary: ["Pull Request", "Issue", "License", "Fork"],
    stats: { questions: 31, ai: 15, forwarded: 16, likes: 88, retracted: 0 },
  },
];

export function findLecture(id: string) {
  return lectures.find((l) => l.id === id);
}

// 세션 정원 (N-08 동시 접속 목표)
export const SESSION_CAPACITY = 300;

export function findLectureByCode(code: string) {
  return lectures.find((l) => l.code === code.trim().toUpperCase());
}

// 강연자 · 관리자가 종료한 강의까지 반영한 상태
export function statusOf(l: Lecture, endedLectures: string[]): LectureStatus {
  return endedLectures.includes(l.id) ? "ended" : l.status;
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
      { kind: "slide", label: "교안 12p", quote: "Attention(Q, K, V) = softmax(QKᵀ / √dₖ) V" },
      { kind: "speech", label: "발화 14:16", quote: "도서관에서 검색어가 쿼리고, 책 제목이 키, 책 내용이 밸류라고 생각하시면 돼요." },
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
    sources: [{ kind: "slide", label: "교안 16p", quote: "Multi-Head: h = 8, dₖ = d_model / h = 64" }],
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
      { kind: "slide", label: "교안 13p", quote: "Scaled dot-product: 큰 dₖ에서 softmax 기울기 소실 방지" },
      { kind: "speech", label: "발화 14:19", quote: "나누지 않으면 소프트맥스가 거의 원-핫처럼 돼 버려요." },
    ],
    at: "14:20",
    score: 0.91,
    route: "판정 모델",
  },
  {
    id: "a4",
    text: "Layer Norm은 어디에 들어가요?",
    answer: "각 서브층(어텐션, 피드포워드) 뒤에서 residual 연결과 합친 다음 Layer Norm을 적용해요. 교안 그림에서 ‘Add & Norm’ 상자가 그 위치예요.",
    sources: [{ kind: "slide", label: "교안 22p", quote: "Add & Norm: LayerNorm(x + Sublayer(x))" }],
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

export const initialTranscript = [
  { at: "14:31", text: "인코더 블록은 이렇게 여섯 번 쌓습니다. N은 6이에요." },
  { at: "14:32", text: "각 블록 안에 multi-head attention이랑 feed-forward가 있고요." },
  { at: "14:33", text: "residual connection 덕분에 깊게 쌓아도 학습이 잘 됩니다." },
];

// 청중이 새 질문을 냈을 때 데모 판정: 교안 용어가 들어 있으면 AI 답변, 아니면 강연자에게 이관
export const cannedAnswers: { keys: string[]; answer: string; sources: Source[] }[] = [
  {
    keys: ["마스킹", "mask", "마스크"],
    answer: "디코더의 마스킹은 아직 생성하지 않은 미래 토큰을 보지 못하게 어텐션 점수를 -∞로 가리는 거예요. 학습 때는 정답을 한 번에 넣으니 꼭 필요하고, 생성 때도 같은 구조를 그대로 써요.",
    sources: [
      { kind: "slide", label: "교안 26p", quote: "Masked Multi-Head Attention: 위치 i는 i 이전만 참조" },
      { kind: "speech", label: "발화 방금", quote: "미래 토큰을 못 보게 가리는 거죠." },
    ],
  },
  {
    keys: ["인코더", "디코더", "encoder", "decoder"],
    answer: "인코더는 입력 문장 전체를 보고 문맥 표현을 만들고, 디코더는 그 표현과 지금까지 만든 출력을 보고 다음 토큰을 만들어요. 둘 사이는 cross-attention으로 연결돼요.",
    sources: [
      { kind: "slide", label: "교안 21p", quote: "Encoder × 6 → Decoder × 6, cross-attention으로 연결" },
      { kind: "speech", label: "발화 14:32", quote: "Query는 디코더, Key와 Value는 인코더 출력에서 와요." },
    ],
  },
  {
    keys: ["어텐션", "attention", "softmax", "소프트맥스"],
    answer: "어텐션은 문장 안 단어끼리 얼마나 관련 있는지 점수를 매기고, softmax로 확률처럼 바꾼 다음 그 비율로 정보를 섞는 연산이에요.",
    sources: [{ kind: "slide", label: "교안 12p", quote: "Attention(Q, K, V) = softmax(QKᵀ / √dₖ) V" }],
  },
  {
    keys: ["포지셔널", "positional", "위치"],
    answer: "트랜스포머는 단어를 한꺼번에 보기 때문에 순서 정보가 없어요. 그래서 각 위치마다 고유한 벡터(sin/cos 패턴)를 단어 임베딩에 더해 순서를 알려줘요.",
    sources: [{ kind: "slide", label: "교안 14p", quote: "PE(pos, 2i) = sin(pos / 10000^(2i/d))" }],
  },
];

// ── 청중: 내 보관함 ───────────────────────────────

export type ArchiveItem = {
  id: string;
  title: string;
  speaker: string;
  date: string;
  tone: Tone;
  emoji: string;
  summary: "ready" | "generating" | "failed" | "none";
  note?: { headline: string; sections: { title: string; points: string[] }[]; keywords: string[] };
  myQuestions: { id: string; text: string; kind: "ai" | "forwarded"; answer?: string; sources?: Source[]; status?: "waiting" | "done"; retracted?: boolean }[];
  // 강연자에게 전달된 전체 질문. liked는 내가 공감한 질문, memo는 강의 중 남긴 개인 메모
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
      sections: [
        { title: "핵심 개념", points: ["Forward 과정: 이미지에 가우시안 노이즈를 T단계에 걸쳐 더한다", "Reverse 과정: 신경망이 각 단계의 노이즈를 예측해 제거한다", "U-Net이 노이즈 예측기로 주로 쓰인다 (교안 11p)"] },
        { title: "강연에서 강조한 점", points: ["GAN보다 학습이 안정적이지만 샘플링이 느리다", "DDIM으로 단계 수를 줄여 속도를 높일 수 있다", "텍스트 조건은 cross-attention으로 넣는다"] },
      ],
      keywords: ["DDPM", "U-Net", "Noise Schedule", "DDIM", "Classifier-free Guidance"],
    },
    myQuestions: [
      { id: "m1", text: "노이즈 스케줄은 선형 말고 다른 것도 있나요?", kind: "ai", answer: "선형 외에 cosine 스케줄이 자주 쓰여요. 초반에 노이즈를 천천히 더해 이미지 정보가 더 오래 남게 해 줘요.", sources: [{ kind: "slide", label: "교안 9p", quote: "β schedule: linear vs cosine" }] },
      { id: "m2", text: "Stable Diffusion은 왜 latent 공간에서 하나요?", kind: "forwarded", status: "done" },
      { id: "m3", text: "guidance scale을 너무 올리면 어떻게 되나요?", kind: "ai", answer: "조건을 더 강하게 따르지만, 지나치면 색이 과포화되고 다양성이 줄어요.", sources: [{ kind: "speech", label: "발화 15:42", quote: "7에서 8 정도가 무난하고 너무 올리면 그림이 타요." }], retracted: true },
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
      sections: [
        { title: "핵심 개념", points: ["최적 부분 구조 + 중복 부분 문제가 있으면 DP를 쓴다", "Top-down(메모이제이션)과 Bottom-up(테이블) 두 방식", "점화식을 먼저 세우고 기저 사례를 정한다"] },
        { title: "예제", points: ["피보나치 O(2ⁿ) → O(n)", "배낭 문제: dp[i][w] = max(포함, 미포함)", "LCS: 두 문자열 표를 채워 길이를 구한다"] },
      ],
      keywords: ["Memoization", "Tabulation", "Knapsack", "LCS"],
    },
    myQuestions: [
      { id: "m4", text: "메모이제이션이랑 그리디는 어떻게 구분하나요?", kind: "ai", answer: "그리디는 매 순간 최선만 고르고 되돌아보지 않지만, DP는 모든 부분 문제의 답을 저장해 비교해요. 그리디가 최적임이 증명될 때만 그리디를 써요.", sources: [{ kind: "slide", label: "교안 5p", quote: "Greedy vs DP: 선택의 되돌림 여부" }] },
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
      sections: [{ title: "핵심 개념", points: ["폴더 = URL 경로, page.tsx가 화면", "layout.tsx는 하위 페이지에서 유지된다", "[id] 폴더로 동적 경로를 만든다"] }],
      keywords: ["App Router", "Layout", "Dynamic Route"],
    },
    myQuestions: [],
    questions: [
      { id: "k11", text: "layout이랑 template은 뭐가 달라요?", likes: 12, status: "done", liked: false, memo: "template은 이동할 때마다 새로 마운트됨" },
      { id: "k4", text: "pages 라우터 프로젝트도 계속 써도 되나요?", likes: 8, status: "done", liked: true },
    ],
  },
];

// 진행 중인 강의(l1)가 끝나면 청중 보관함에 생기는 기록
export const transformerNote = {
  headline: "단어끼리 서로를 바라보는 셀프 어텐션으로 RNN 없이 문맥을 읽는 트랜스포머",
  sections: [
    { title: "핵심 개념", points: ["Q · K 내적으로 관련도를 구하고 softmax 가중치로 V를 섞는다 (교안 12p)", "√dₖ로 나눠 softmax 쏠림과 기울기 소실을 막는다", "멀티헤드로 여러 관계를 동시에 본다 (h = 8)"] },
    { title: "구조", points: ["인코더 · 디코더 각각 6층, 층마다 Add & Norm", "디코더는 미래 토큰을 가리는 masked self-attention을 쓴다", "cross-attention: Query는 디코더, Key · Value는 인코더 출력"] },
    { title: "청중이 많이 물은 것", points: ["포지셔널 인코딩: 고정(sin/cos) vs 학습형", "학습 시 병렬화가 가능한 이유 (teacher forcing)"] },
  ],
  keywords: ["Self-Attention", "Multi-Head", "Positional Encoding", "Masking", "Cross-Attention"],
};

const liveArchive: ArchiveItem = {
  id: "r0",
  title: lectures[0].title,
  speaker: "주혜",
  date: lectures[0].date.slice(0, 10),
  tone: lectures[0].tone,
  emoji: lectures[0].emoji,
  // 강의가 막 끝나 요약 노트를 만드는 중. 상세 화면에서 잠시 뒤 완성된다
  summary: "generating",
  note: transformerNote,
  myQuestions: [
    // a2는 강의 중 강연자가 철회한 답변
    ...liveAiQuestions.filter((q) => q.mine).map((q) => ({ id: q.id, text: q.text, kind: "ai" as const, answer: q.answer, sources: q.sources, retracted: q.id === "a2" })),
    ...livePublicQuestions.filter((q) => q.mine).map((q) => ({ id: q.id, text: q.text, kind: "forwarded" as const, status: q.status })),
  ],
  questions: livePublicQuestions.map((q) => ({ id: q.id, text: q.text, likes: q.likes, status: q.status, liked: !!q.liked })),
};

// 종료된 강의를 반영한 보관함 목록
export function archiveWith(endedLectures: string[]) {
  return endedLectures.includes(lectures[0].id) ? [liveArchive, ...archive] : archive;
}

// 지난 강의 리포트용 질문 기록
export const pastQuestionLog = [
  { text: "useReducer는 언제 useState 대신 쓰나요?", kind: "ai" as const, likes: 0, page: 12 },
  { text: "Context를 쓰면 리렌더가 너무 많이 일어나지 않나요?", kind: "forwarded" as const, likes: 27, page: 18 },
  { text: "상태 관리 라이브러리는 실무에서 뭘 많이 쓰나요?", kind: "forwarded" as const, likes: 21, page: 29 },
  { text: "setState가 비동기라는 게 정확히 무슨 뜻인가요?", kind: "ai" as const, likes: 0, page: 7 },
  { text: "props drilling이 몇 단계부터 문제인가요?", kind: "forwarded" as const, likes: 12, page: 16 },
  { text: "key prop을 index로 쓰면 왜 안 되나요?", kind: "ai" as const, likes: 0, page: 9 },
];

export const pageHistogram = [
  { page: "1–5", count: 4 },
  { page: "6–10", count: 11 },
  { page: "11–15", count: 9 },
  { page: "16–20", count: 15 },
  { page: "21–25", count: 6 },
  { page: "26–31", count: 12 },
];

export const notices = [
  { id: "n1", title: "EasyQ 베타 오픈 안내", date: "2026.10.01", body: "가천대 실무프로젝트 EasyQ 베타가 열렸어요. 강의를 만들고 QR로 청중을 초대해 보세요." },
  { id: "n3", title: "10/20 새벽 점검", date: "2026.10.12", body: "10월 20일 02:00~04:00 서버 점검이 있어요. 이 시간에는 강의를 진행할 수 없어요." },
];

export const inquiries = [
  { id: "i1", title: "교안 PPTX 업로드가 실패해요", date: "2026.10.09", status: "답변 완료" as const, answer: "PPTX 안의 이미지가 커서 용량 제한(50MB)을 넘었어요. PDF로 저장해 올려 주세요." },
];
