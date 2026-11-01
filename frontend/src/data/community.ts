/**
 * 커뮤니티 — specs/06 디자인 메모(글 종류 5 · 명소 태그 지수 · 투표 · 모임 · (수정됨) · 30일 소프트 삭제). Phase 2 플래그 뒤.
 * 지금은 mock(이 탭의 sessionStorage). 백엔드가 생기면 같은 시그니처로
 * `GET/POST /api/v1/posts` · `GET/PATCH/DELETE /api/v1/posts/{id}` · `POST .../like|save|vote|join|comments` · `GET /api/v1/community/rail`.
 * 오늘 밤 지수·모임 상태·추천 순서 같은 판정은 서버 값이라는 전제 — 여기(mock) 안에서만 만들고 컴포넌트는 그대로 보여준다.
 */
import communityJson from "./community.json";
import spotsJson from "./spots.json";
import photoPlaceholder from "../assets/photo-of-month-placeholder.png";
import { monthKst } from "../lib/time";
import { getMe } from "./auth";
import type {
  CommunityRail,
  FeedTab,
  Post,
  PostAuthor,
  PostComment,
  PostDetail,
  PostDraft,
  PostInput,
  PostNightMeta,
  PostType,
  Spot,
} from "./types";

export type {
  CommunityRail,
  FeedTab,
  MeetupInfo,
  PollInfo,
  Post,
  PostAuthor,
  PostComment,
  PostDetail,
  PostDraft,
  PostFacilities,
  PostInput,
  PostNightMeta,
  PostSpotTag,
  PostType,
  ReviewInfo,
} from "./types";

export const BODY_MAX = 2000;
export const PHOTO_MAX = 10;
export const COMMENT_MAX = 500;
export const POLL_OPTIONS_MIN = 2;
export const POLL_OPTIONS_MAX = 4;
export const MEETUP_CAPACITY = { min: 2, max: 20 } as const;
/** 이달의 사진 응모 — 한 달 2장 (삭제한 글의 응모도 센다: 응모는 글과 독립) */
export const CONTEST_MONTHLY_LIMIT = 2;

const ASSET_URLS: Record<string, string> = {
  "photo-of-month-placeholder.png": photoPlaceholder,
};
const assetUrl = (name: string) => ASSET_URLS[name] ?? name;

/** 저장된 글 한 줄 — 응답 모델에서 서버가 붙이는 값(spot·commentCount)을 뺀 형태 */
interface PostRow extends Omit<Post, "spot" | "commentCount"> {
  spotId: string | null;
  night: PostNightMeta | null;
  comments: PostComment[];
  /** 소프트 삭제 시각 — specs/06: 30일 뒤 정리, 그동안 복구 가능 */
  deletedAt?: string;
  /** 이달의 사진에 응모한 시각 — 월별 제한·응모 기록은 글 작성일이 아니라 이 값으로 센다 */
  contestEnteredAt?: string | null;
}

interface Mock {
  spotIndex: Record<string, number>;
  storeNearby: Record<string, boolean>;
  posts: PostRow[];
  rail: Pick<CommunityRail, "news" | "photoContest" | "moon">;
}
const MOCK = communityJson as Mock;
const SPOTS = spotsJson as Spot[];

// ── 저장 (이 탭의 sessionStorage) ──────────────────────
const SESSION_KEY = "starspud.mockCommunity";
const DRAFT_KEY = "starspud.communityDraft";

function readSession(): PostRow[] | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as PostRow[]) : null;
  } catch {
    return null;
  }
}

function writeSession(rows: PostRow[]): void {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(rows));
  } catch {
    // 저장이 막힌 환경에서는 메모리에서만 유지
  }
}

let posts: PostRow[] = readSession() ?? MOCK.posts;
const promises = new Map<string, Promise<unknown>>();
const listeners = new Set<() => void>();

/** 글·댓글·좋아요·투표·참여가 바뀌면 알림 (useSyncExternalStore용) */
export function subscribeCommunity(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function changed(): void {
  writeSession(posts);
  promises.clear();
  listeners.forEach((l) => l());
}

function cached<T>(key: string, load: () => T): Promise<T> {
  let p = promises.get(key) as Promise<T> | undefined;
  if (!p) {
    p = Promise.resolve().then(load);
    promises.set(key, p);
  }
  return p;
}

// ── 응답 모델 만들기 (서버가 붙이는 값) ──────────────────
function spotTag(spotId: string | null) {
  if (!spotId) return null;
  const s = SPOTS.find((x) => x.id === spotId);
  return s ? { id: s.id, name: s.name, tonightIndex: MOCK.spotIndex[s.id] ?? 50 } : null;
}

/** 모임 상태 — 서버 판정: 시각이 지나면 ended, 정원이 차면 full */
function meetupOf(row: PostRow, now: number) {
  if (!row.meetup) return null;
  const m = row.meetup;
  const status = Date.parse(m.at) < now ? "ended" : m.joined >= m.capacity ? "full" : "open";
  return { ...m, status } as const;
}

function toPost(row: PostRow, now = Date.now()): Post {
  return {
    id: row.id,
    type: row.type,
    author: row.author,
    spot: spotTag(row.spotId),
    body: row.body,
    photos: row.photos.map(assetUrl),
    likeCount: row.likeCount,
    commentCount: row.comments.length,
    likedByMe: row.likedByMe,
    spotSavedByMe: row.spotSavedByMe,
    createdAt: row.createdAt,
    editedAt: row.editedAt,
    meetup: meetupOf(row, now),
    poll: row.poll,
    reviewInfo: row.reviewInfo,
    photoContest: row.photoContest,
  };
}

function toDetail(row: PostRow): PostDetail {
  const spot = row.spotId ? SPOTS.find((s) => s.id === row.spotId) : undefined;
  return {
    ...toPost(row),
    night: row.night,
    facilities: spot
      ? {
          parking: spot.flags.parking,
          toilet: spot.flags.toilet,
          carCamping: spot.flags.carCamping,
          storeNearby: MOCK.storeNearby[spot.id] ?? false,
        }
      : null,
    comments: row.comments.map((c) => ({ ...c })),
  };
}

const live = () => posts.filter((p) => !p.deletedAt);
// 시각 문자열은 seed(+09:00)와 새 글(Z)의 표기가 달라 문자열 비교로는 순서가 틀린다 — 항상 파싱해서 비교
const byLatest = (a: PostRow, b: PostRow) => Date.parse(b.createdAt) - Date.parse(a.createdAt);
/** 추천 — mock 점수: 좋아요 + 댓글×2 (서버가 정하는 순서라는 전제) */
const byRecommended = (a: PostRow, b: PostRow) =>
  b.likeCount + b.comments.length * 2 - (a.likeCount + a.comments.length * 2) || byLatest(a, b);

const TAB_TYPE: Partial<Record<FeedTab, PostType>> = {
  meetup: "meetup",
  question: "question",
  chat: "chat",
  photo: "photo",
};

// ── 읽기 ────────────────────────────────────────────────
/** 피드 — TODO(Phase 2 백엔드): GET /api/v1/posts?tab= (mock은 한 페이지) */
export function getFeed(tab: FeedTab): Promise<Post[]> {
  return cached(`feed:${tab}`, () => {
    const type = TAB_TYPE[tab];
    const rows = live().filter((p) => (type ? p.type === type : true));
    rows.sort(tab === "recommended" ? byRecommended : byLatest);
    const now = Date.now();
    return rows.map((r) => toPost(r, now));
  });
}

/** 글 상세 — TODO: GET /api/v1/posts/{id}. 없거나 삭제된 글은 null */
export function getPost(id: string): Promise<PostDetail | null> {
  return cached(`post:${id}`, () => {
    const row = posts.find((p) => p.id === id && !p.deletedAt);
    return row ? toDetail(row) : null;
  });
}

/** 우측 레일 — TODO: GET /api/v1/community/rail */
export function getRail(): Promise<CommunityRail> {
  return cached("rail", () => {
    const now = Date.now();
    const weekEnd = now + 7 * 86_400_000;
    const tonightSpots = SPOTS.map((s) => ({
      id: s.id,
      name: s.name,
      index: MOCK.spotIndex[s.id] ?? 0,
    }))
      .sort((a, b) => b.index - a.index)
      .slice(0, 5);
    const weekMeetups = live()
      .filter(
        (p) => p.meetup && Date.parse(p.meetup.at) >= now && Date.parse(p.meetup.at) <= weekEnd,
      )
      .sort((a, b) => Date.parse(a.meetup!.at) - Date.parse(b.meetup!.at))
      .map((p) => ({
        postId: p.id,
        title: p.body.length > 40 ? `${p.body.slice(0, 40)}…` : p.body,
        at: p.meetup!.at,
        spotName: spotTag(p.spotId)?.name ?? "장소 미정",
        joined: p.meetup!.joined,
        capacity: p.meetup!.capacity,
      }));
    return {
      tonightSpots,
      weekMeetups,
      news: MOCK.rail.news,
      photoContest: {
        ...MOCK.rail.photoContest,
        entries: MOCK.rail.photoContest.entries.map((e) => ({ ...e, src: assetUrl(e.src) })),
      },
      moon: MOCK.rail.moon,
    };
  });
}

/** 명소 id → 이름 (임시저장 복원용). 없으면 null */
export function spotNameOf(id: string): string | null {
  return SPOTS.find((s) => s.id === id)?.name ?? null;
}

/** 명소 태그 검색 — 이름·시군구 부분 일치, 최대 6개. TODO: GET /api/v1/spots?q= */
export function searchSpotTags(q: string): { id: string; name: string; sigungu: string }[] {
  const needle = q.trim();
  if (!needle) return [];
  return SPOTS.filter((s) => s.name.includes(needle) || s.sigungu.includes(needle))
    .slice(0, 6)
    .map((s) => ({ id: s.id, name: s.name, sigungu: s.sigungu }));
}

// ── 쓰기 ────────────────────────────────────────────────
async function requireMe(): Promise<PostAuthor> {
  const me = await getMe();
  if (!me || me.nickname === null) throw new Error("LOGIN_REQUIRED");
  return {
    id: me.id,
    nickname: me.nickname,
    avatarUrl: me.avatarUrl,
    potatoAvatar: me.potatoAvatar,
  };
}

/** 응모 기록 한 줄 — 글이 삭제돼도 남는다 (specs/06 삭제 모달 안내와 같은 규칙) */
export interface ContestEntry {
  postId: string;
  /** 응모 시각 (글 작성일이 아니다) */
  createdAt: string;
  /** YYYY-MM */
  month: string;
  title: string;
  src: string;
  likeCount: number;
  commentCount: number;
  /** 글이 삭제됐으면 true — 상세 링크 대신 "글 삭제됨" */
  postDeleted: boolean;
}

// 응모 달은 한국 시각 기준 — UTC로 자르면 매월 1일 00:00~08:59 KST 응모가 지난달로 간다
const monthOf = (iso: string) => monthKst(iso);
/** 응모 시각 — 예전 저장분(필드 없음)은 글 작성일로 본다 */
const enteredAtOf = (p: PostRow) => p.contestEnteredAt ?? p.createdAt;

/** 내 응모 기록 — 삭제된 글 포함, 최신순. TODO: GET /api/v1/me/contest-entries */
export function getContestEntries(authorId: string): ContestEntry[] {
  return posts
    .filter((p) => p.photoContest && p.author.id === authorId)
    .sort((a, b) => Date.parse(enteredAtOf(b)) - Date.parse(enteredAtOf(a)))
    .map((p) => ({
      postId: p.id,
      createdAt: enteredAtOf(p),
      month: monthOf(enteredAtOf(p)),
      title: p.body.length > 30 ? `${p.body.slice(0, 30)}…` : p.body,
      src: p.photos.map(assetUrl)[0] ?? "",
      likeCount: p.likeCount,
      commentCount: p.comments.length,
      postDeleted: !!p.deletedAt,
    }));
}

/**
 * 작성·수정 공통 검증. `existing`은 수정 중인 글 — 이미 등록된 모임 시각·응모는 그대로 두면 다시 검사하지 않는다
 * (지난 모임의 후기를 고칠 수 있어야 하므로).
 */
function validate(input: PostInput, authorId: string, existing?: PostRow): void {
  const body = input.body.trim();
  if (body.length === 0 || body.length > BODY_MAX) throw new Error("BODY_LENGTH");
  if (input.spotId && !SPOTS.some((s) => s.id === input.spotId)) throw new Error("SPOT_NOT_FOUND");
  if (input.type === "meetup") {
    const m = input.meetup;
    if (!m || !m.at || !m.meetPoint.trim()) throw new Error("MEETUP_REQUIRED");
    if (
      !Number.isInteger(m.capacity) ||
      m.capacity < MEETUP_CAPACITY.min ||
      m.capacity > MEETUP_CAPACITY.max
    )
      throw new Error("MEETUP_CAPACITY");
    if (!input.spotId) throw new Error("MEETUP_SPOT_REQUIRED");
    // 날짜가 깨졌거나 이미 지난 시각이면 거절 — 폼이 noValidate라 여기서 본다
    const at = Date.parse(m.at);
    if (Number.isNaN(at)) throw new Error("MEETUP_REQUIRED");
    if (at <= Date.now() && existing?.meetup?.at !== m.at) throw new Error("MEETUP_PAST");
  }
  if (input.poll) {
    const opts = input.poll.options.map((o) => o.trim()).filter(Boolean);
    if (opts.length < POLL_OPTIONS_MIN || opts.length > POLL_OPTIONS_MAX)
      throw new Error("POLL_OPTIONS");
  }
  if (input.photoContest && input.type !== "photo") throw new Error("PHOTO_CONTEST_TYPE");
  // 월 2장 제한 — 새로 응모할 때만, 응모하는 달(지금) 기준 (지난달 글을 지금 응모해도 이번 달로 센다)
  if (input.photoContest && !existing?.photoContest) {
    const month = monthKst();
    const used = getContestEntries(authorId).filter((e) => e.month === month).length;
    if (used >= CONTEST_MONTHLY_LIMIT) throw new Error("CONTEST_LIMIT");
  }
}

const newId = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`;

/** 글 작성 — TODO: POST /api/v1/posts. 사진 업로드(presign)는 TODO라 photos는 비어 있다 */
export async function createPost(input: PostInput): Promise<Post> {
  const author = await requireMe();
  validate(input, author.id);
  const row: PostRow = {
    id: newId("p"),
    type: input.type,
    author,
    spotId: input.spotId,
    body: input.body.trim(),
    photos: [],
    likeCount: 0,
    likedByMe: false,
    spotSavedByMe: input.spotId
      ? posts.some((p) => p.spotId === input.spotId && p.spotSavedByMe)
      : false,
    createdAt: new Date().toISOString(),
    editedAt: null,
    meetup:
      input.type === "meetup" && input.meetup
        ? {
            ...input.meetup,
            meetPoint: input.meetup.meetPoint.trim(),
            joined: 1,
            joinedByMe: true,
            status: "open",
          }
        : null,
    poll: input.poll
      ? {
          options: input.poll.options
            .map((o) => o.trim())
            .filter(Boolean)
            .map((label, i) => ({ id: `o${i + 1}`, label, votes: 0 })),
          total: 0,
          myVote: null,
        }
      : null,
    reviewInfo: input.reviewInfo,
    // 그날 밤 메타는 서버가 붙인다 — mock은 없음
    night: null,
    photoContest: input.photoContest,
    contestEnteredAt: input.photoContest ? new Date().toISOString() : null,
    comments: [],
  };
  posts = [row, ...posts];
  changed();
  return toPost(row);
}

function ownRow(id: string, meId: string): PostRow {
  const row = posts.find((p) => p.id === id && !p.deletedAt);
  if (!row) throw new Error("POST_NOT_FOUND");
  if (row.author.id !== meId) throw new Error("FORBIDDEN");
  return row;
}

/** 글 수정 — TODO: PATCH /api/v1/posts/{id}. 저장하면 editedAt이 찍혀 "(수정됨)" */
export async function updatePost(id: string, input: PostInput): Promise<Post> {
  const me = await requireMe();
  const row = ownRow(id, me.id);
  validate(input, me.id, row);
  const next: PostRow = {
    ...row,
    type: input.type,
    spotId: input.spotId,
    body: input.body.trim(),
    reviewInfo: input.reviewInfo,
    photoContest: input.photoContest,
    // 새로 켜면 지금 시각으로 응모, 끄면 응모 취소, 그대로면 유지
    contestEnteredAt: input.photoContest
      ? row.photoContest
        ? enteredAtOf(row)
        : new Date().toISOString()
      : null,
    editedAt: new Date().toISOString(),
    meetup:
      input.type === "meetup" && input.meetup
        ? {
            ...(row.meetup ?? { joined: 1, joinedByMe: true, status: "open" as const }),
            ...input.meetup,
            meetPoint: input.meetup.meetPoint.trim(),
          }
        : null,
    // 투표는 선택지 글자만 고친다 — 표는 유지 (선택지 수가 바뀌면 새로 만든다)
    poll: input.poll
      ? (() => {
          const labels = input.poll.options.map((o) => o.trim()).filter(Boolean);
          if (row.poll && row.poll.options.length === labels.length) {
            return {
              ...row.poll,
              options: row.poll.options.map((o, i) => ({ ...o, label: labels[i] })),
            };
          }
          return {
            options: labels.map((label, i) => ({ id: `o${i + 1}`, label, votes: 0 })),
            total: 0,
            myVote: null,
          };
        })()
      : null,
  };
  posts = posts.map((p) => (p.id === id ? next : p));
  changed();
  return toPost(next);
}

/** 글 삭제 — TODO: DELETE /api/v1/posts/{id}. specs/06: 30일 소프트 삭제(감자·응모는 유지), 댓글·좋아요는 함께 사라진다 */
export async function deletePost(id: string): Promise<void> {
  const me = await requireMe();
  ownRow(id, me.id);
  const now = new Date().toISOString();
  posts = posts.map((p) => (p.id === id ? { ...p, deletedAt: now } : p));
  changed();
}

function liveRow(id: string): PostRow {
  const row = posts.find((p) => p.id === id && !p.deletedAt);
  if (!row) throw new Error("POST_NOT_FOUND");
  return row;
}

function patchRow(id: string, patch: (row: PostRow) => PostRow): void {
  posts = posts.map((p) => (p.id === id ? patch(p) : p));
  changed();
}

/** 좋아요 토글 — TODO: POST/DELETE /api/v1/posts/{id}/like */
export async function toggleLike(id: string): Promise<void> {
  await requireMe();
  liveRow(id);
  patchRow(id, (p) => ({
    ...p,
    likedByMe: !p.likedByMe,
    likeCount: p.likeCount + (p.likedByMe ? -1 : 1),
  }));
}

/** 명소 저장 토글 — 명소 단위라 같은 명소를 태그한 글 모두 바뀐다. TODO: POST/DELETE /api/v1/me/saved-spots/{spotId} */
export async function toggleSaveSpot(postId: string): Promise<void> {
  await requireMe();
  const row = liveRow(postId);
  if (!row.spotId) throw new Error("NO_SPOT");
  const saved = !row.spotSavedByMe;
  posts = posts.map((p) => (p.spotId === row.spotId ? { ...p, spotSavedByMe: saved } : p));
  changed();
}

/** 투표 — TODO: POST /api/v1/posts/{id}/vote. 다른 선택지를 고르면 옮긴다 */
export async function vote(postId: string, optionId: string): Promise<void> {
  await requireMe();
  const row = liveRow(postId);
  if (!row.poll) throw new Error("NO_POLL");
  if (!row.poll.options.some((o) => o.id === optionId)) throw new Error("OPTION_NOT_FOUND");
  patchRow(postId, (p) => {
    const poll = p.poll!;
    const prev = poll.myVote;
    if (prev === optionId) return p;
    const options = poll.options.map((o) => ({
      ...o,
      votes: o.votes + (o.id === optionId ? 1 : 0) - (o.id === prev ? 1 : 0),
    }));
    return { ...p, poll: { options, total: poll.total + (prev ? 0 : 1), myVote: optionId } };
  });
}

/** 모임 참여/취소 — TODO: POST/DELETE /api/v1/posts/{id}/join. specs/06: 정원 초과는 거절, 지난 모임은 신청 불가 */
export async function toggleJoinMeetup(postId: string): Promise<void> {
  await requireMe();
  const row = liveRow(postId);
  const m = meetupOf(row, Date.now());
  if (!m) throw new Error("NO_MEETUP");
  if (m.status === "ended") throw new Error("MEETUP_ENDED");
  if (!m.joinedByMe && m.status === "full") throw new Error("MEETUP_FULL");
  patchRow(postId, (p) => ({
    ...p,
    meetup: { ...p.meetup!, joinedByMe: !m.joinedByMe, joined: m.joined + (m.joinedByMe ? -1 : 1) },
  }));
}

/** 댓글 작성 — TODO: POST /api/v1/posts/{id}/comments (≤500자) */
export async function addComment(postId: string, body: string): Promise<PostComment> {
  const author = await requireMe();
  const text = body.trim();
  if (text.length === 0 || text.length > COMMENT_MAX) throw new Error("COMMENT_LENGTH");
  liveRow(postId);
  const comment: PostComment = {
    id: newId("c"),
    author,
    body: text,
    likeCount: 0,
    likedByMe: false,
    createdAt: new Date().toISOString(),
  };
  patchRow(postId, (p) => ({ ...p, comments: [...p.comments, comment] }));
  return comment;
}

/** 댓글 좋아요 토글 — TODO: POST/DELETE /api/v1/comments/{id}/like */
export async function toggleCommentLike(postId: string, commentId: string): Promise<void> {
  await requireMe();
  liveRow(postId);
  patchRow(postId, (p) => ({
    ...p,
    comments: p.comments.map((c) =>
      c.id === commentId
        ? { ...c, likedByMe: !c.likedByMe, likeCount: c.likeCount + (c.likedByMe ? -1 : 1) }
        : c,
    ),
  }));
}

// ── 임시저장 (이 브라우저의 localStorage, 사진 제외) ──────
export function loadDraft(): PostDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as PostDraft) : null;
  } catch {
    return null;
  }
}

export function saveDraft(input: PostInput): PostDraft {
  const draft: PostDraft = { ...input, photoKeys: [], savedAt: new Date().toISOString() };
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // 저장이 막힌 환경에서는 그냥 넘어간다
  }
  return draft;
}

export function clearDraft(): void {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    // 무시
  }
}
