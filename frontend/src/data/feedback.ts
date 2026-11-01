/**
 * 문의 — 명세 §16. Phase 1: mock. Phase 2: `/api/v1/feedback`, `/api/v1/me/feedback`.
 */
import type { MyFeedback } from "./types";

export type { FeedbackStatus, FeedbackType, MyFeedback } from "./types";

/** 내가 보낸 요청 (예시 2건) */
const MOCK_MY_FEEDBACK: MyFeedback[] = [
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

let myFeedbackPromise: Promise<MyFeedback[]> | null = null;

/** 내 요청 목록 — TODO(Phase 2): GET /api/v1/me/feedback */
export function getMyFeedback(): Promise<MyFeedback[]> {
  myFeedbackPromise ??= Promise.resolve(MOCK_MY_FEEDBACK);
  return myFeedbackPromise;
}
