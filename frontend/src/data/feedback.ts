/**
 * 문의 — 명세 §16. Phase 1: mock. Phase 2: `/api/v1/feedback`, `/api/v1/me/feedback`.
 */
import type { FeedbackInput, FeedbackReceipt, MyFeedback, RecentChange } from "./types";

export type {
  Diagnostics,
  FeedbackInput,
  FeedbackReceipt,
  FeedbackStatus,
  FeedbackType,
  MyFeedback,
  RecentChange,
} from "./types";

/** 내가 보낸 요청 (예시 2건) */
let myFeedback: MyFeedback[] = [
  {
    id: "F-1077",
    type: "bug",
    title: "캘린더에서 달 아이콘이 안 보여요",
    status: "reviewing",
    createdAt: "2026-10-28",
  },
  {
    id: "F-1041",
    type: "spot_fix",
    title: "황매산 주차장 진입로가 바뀌었어요",
    status: "applied",
    createdAt: "2026-10-12",
  },
];

/** 최근 반영된 요청 — 정적 목록 3개 (예시) */
const RECENT_CHANGES: RecentChange[] = [
  { date: "2026-10-30", title: "캘린더에 촬영 적기 띠 추가" },
  { date: "2026-10-24", title: "황매산 주차장 진입로 안내 수정" },
  { date: "2026-10-17", title: "지도 탭을 바꿔도 확대 상태 유지" },
];

let myFeedbackPromise: Promise<MyFeedback[]> | null = null;
const listeners = new Set<() => void>();

/** 제출로 목록이 바뀌면 알림 (useSyncExternalStore용) */
export function subscribeMyFeedback(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** 내 요청 목록 — TODO(Phase 2): GET /api/v1/me/feedback */
export function getMyFeedback(): Promise<MyFeedback[]> {
  myFeedbackPromise ??= Promise.resolve(myFeedback);
  return myFeedbackPromise;
}

// `use()`는 같은 Promise를 돌려받아야 하므로 한 번 만든 것을 재사용한다
const recentChangesPromise = Promise.resolve(RECENT_CHANGES);

export function getRecentChanges(): Promise<RecentChange[]> {
  return recentChangesPromise;
}

let nextId = 1100;

/**
 * 문의 제출 — TODO(Phase 2): POST /api/v1/feedback {type, title, body, screenshots[], diagnostics?, replyByEmail}
 * mock: 접수 번호를 만들고 내 요청 목록 맨 앞에 "접수" 상태로 넣는다 (로그인 여부와 무관하게 이 탭에서만).
 */
export async function submitFeedback(input: FeedbackInput): Promise<FeedbackReceipt> {
  await new Promise((r) => setTimeout(r, 300)); // 네트워크 흉내
  const id = `F-${nextId++}`;
  myFeedback = [
    {
      id,
      type: input.type,
      title: input.title,
      status: "received",
      createdAt: new Date().toISOString().slice(0, 10),
    },
    ...myFeedback,
  ];
  myFeedbackPromise = Promise.resolve(myFeedback);
  listeners.forEach((l) => l());
  return { id };
}
