import type { FeedTab, PostType } from "../../data/community";
import { fmtHM, fmtMDW } from "../../lib/time";

/** "10.30 (금) 22:10" */
export const fmtWhen = (iso: string) => `${fmtMDW(iso)} ${fmtHM(iso)}`;

/** 글 종류 5 — 태그 색 (specs/06 디자인 메모) */
export const POST_TYPES: { type: PostType; label: string; color: string }[] = [
  { type: "review", label: "후기", color: "var(--sprout)" },
  { type: "question", label: "질문", color: "#7fb0ff" },
  { type: "meetup", label: "모임", color: "var(--lime)" },
  { type: "photo", label: "사진 응모", color: "#e5c33d" },
  { type: "chat", label: "잡담", color: "var(--fg-2)" },
];

export const POST_TYPE_LABEL: Record<PostType, string> = Object.fromEntries(
  POST_TYPES.map((t) => [t.type, t.label]),
) as Record<PostType, string>;

export const POST_TYPE_COLOR: Record<PostType, string> = Object.fromEntries(
  POST_TYPES.map((t) => [t.type, t.color]),
) as Record<PostType, string>;

/** 피드 탭 6 — 추천 · 최신 · 모임 · 질문 · 잡담 · 이달의 사진 */
export const TABS: { tab: FeedTab; label: string }[] = [
  { tab: "recommended", label: "추천" },
  { tab: "latest", label: "최신" },
  { tab: "meetup", label: "모임" },
  { tab: "question", label: "질문" },
  { tab: "chat", label: "잡담" },
  { tab: "photo", label: "이달의 사진" },
];

export const isFeedTab = (v: string | null): v is FeedTab =>
  v !== null && TABS.some((t) => t.tab === v);

/** 오늘 밤 지수 색 — 홈 10일 지수와 같은 띠 (80 좋음 · 60 보통 · 그 아래 흐림) */
export function indexColor(index: number): string {
  if (index >= 80) return "var(--lime)";
  if (index >= 60) return "var(--sprout)";
  if (index >= 40) return "#e5c33d";
  return "#ff8a8a";
}

/** 글 작성·수정 오류 코드 → 문구 */
export const POST_ERROR_TEXT: Record<string, string> = {
  BODY_LENGTH: `본문은 1~2,000자예요`,
  SPOT_NOT_FOUND: "명소를 찾을 수 없어요. 다시 골라 주세요",
  MEETUP_REQUIRED: "모임 글은 날짜와 집결 장소가 필요해요",
  MEETUP_CAPACITY: "정원은 2~20명이에요",
  MEETUP_SPOT_REQUIRED: "모임 글은 명소를 태그해 주세요",
  MEETUP_PAST: "모임 시각은 지금보다 뒤여야 해요",
  CONTEST_LIMIT: "이달의 사진 응모는 한 달에 2장까지예요",
  POLL_OPTIONS: "투표 선택지는 2~4개예요",
  PHOTO_CONTEST_TYPE: "이달의 사진 응모는 '사진 응모' 글만 할 수 있어요",
  LOGIN_REQUIRED: "로그인이 필요해요",
  FORBIDDEN: "내 글만 고칠 수 있어요",
  POST_NOT_FOUND: "글이 없어요. 삭제됐을 수 있어요",
};
