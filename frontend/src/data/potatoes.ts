/**
 * 내 감자 — specs/04 모델. Phase 1: mock(메모리). Phase 2: `/api/v1/me/potatoes` · `/api/v1/potatoes/{id}` ·
 * `/api/v1/spots/{id}/potato/feeds` · `/api/v1/feeds/{id}`.
 *
 * 등급·상태·먹이 종류·정렬은 **서버가 결정**한다. 여기 있는 계산은 그 서버 로직의 mock이고, 컴포넌트는 값만 그린다.
 */
import potatoesJson from "./potatoes.json";
import spotsJson from "./spots.json";
import photoPlaceholder from "../assets/photo-of-month-placeholder.png";
import { illumFromLunAge, SYNODIC_MONTH } from "../lib/moon";
import { addDays, diffDays, todayYmd } from "../lib/time";
import { MOCK_EVENTS, nextMajorEvent } from "./astroEvents";
import { getMe } from "./auth";
import type {
  Feed,
  FeedInput,
  FeedPatch,
  Food,
  PlantResult,
  Potato,
  PotatoDetail,
  PotatoState,
} from "./types";

export type {
  Feed,
  FeedInput,
  FeedPatch,
  Food,
  PlantResult,
  Potato,
  PotatoDetail,
  PotatoState,
} from "./types";

const ASSET_URLS: Record<string, string> = {
  "photo-of-month-placeholder.png": photoPlaceholder,
};
const assetUrl = (name: string) => ASSET_URLS[name] ?? name;

/** 저장 모델 — 상세에서 계산하는 nextMajorEvent만 뺀 것 */
type StoredPotato = Omit<PotatoDetail, "nextMajorEvent">;

/** 명소 mock 중 먹이 결정·새 감자 생성에 필요한 부분 */
const SPOTS = spotsJson as {
  id: string;
  name: string;
  sido: string;
  bortle: number | null;
  lat: number;
  lng: number;
}[];

// ── 저장소 (이 탭에서만 유지 — 새로 고침해도 심은 감자가 남도록 sessionStorage에 둔다) ──
const SESSION_KEY = "starspud.mockPotatoes";

function readSession(): StoredPotato[] | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as StoredPotato[]) : null;
  } catch {
    return null;
  }
}

function writeSession(list: StoredPotato[]): void {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(list));
  } catch {
    // 저장이 막힌 환경(시크릿 창 등)에서는 메모리에서만 유지
  }
}

let potatoes: StoredPotato[] =
  readSession() ??
  (potatoesJson as StoredPotato[]).map((p) => ({
    ...p,
    feeds: p.feeds.map((f) => ({ ...f, photoUrls: f.photoUrls.map(assetUrl) })),
  }));

let listPromise: Promise<Potato[]> | null = null;
const detailPromises = new Map<string, Promise<PotatoDetail | null>>();
const listeners = new Set<() => void>();

/** 심기·먹이·수정·삭제로 바뀌면 알림 (useSyncExternalStore용) */
export function subscribeMyPotatoes(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function changed(): void {
  writeSession(potatoes);
  listPromise = null;
  detailPromises.clear();
  listeners.forEach((l) => l());
}

// ── 서버 규칙의 mock (specs/04) ──────────────────────────
const STATE_ORDER: Record<PotatoState, number> = { hungry: 0, sprouted: 0, normal: 1 };

/** 정렬: 상태 우선(hungry·sprouted) → 최근 방문 */
const sortPotatoes = (list: StoredPotato[]) =>
  [...list].sort(
    (a, b) =>
      STATE_ORDER[a.state] - STATE_ORDER[b.state] || b.lastVisitedOn.localeCompare(a.lastVisitedOn),
  );

/** 삭(신월) 기준일 — 2026-11-09. 방문일 밤의 달 조도(%)를 월령으로 어림한다 */
const NEW_MOON_REF = "2026-11-09";
function moonIllumOn(ymd: string): number {
  const age = diffDays(NEW_MOON_REF, ymd) % SYNODIC_MONTH;
  return illumFromLunAge(age < 0 ? age + SYNODIC_MONTH : age);
}

const FOOD_RANK: Record<"meteor" | "planet" | "moon", number> = { meteor: 0, planet: 1, moon: 2 };

/** 먹이 결정 — 우선순위: 방문일 이벤트(major 우선, meteor > planet > moon) → 달 ≥ 50% → 보틀 ≤ 3 → 별 */
function decideFood(visitedOn: string, bortle: number | null): { food: Food; eventId?: string } {
  const events = MOCK_EVENTS.filter((e) => e.date === visitedOn).sort(
    (a, b) => Number(b.isMajor) - Number(a.isMajor) || FOOD_RANK[a.type] - FOOD_RANK[b.type],
  );
  if (events[0]) return { food: events[0].type, eventId: events[0].id };
  if (moonIllumOn(visitedOn) >= 50) return { food: "moon" };
  if (bortle != null && bortle <= 3) return { food: "galaxy" };
  return { food: "star" };
}

/** 방치 판정 — T = 마지막 방문 다음 날 + 7일 유예, T~오늘 사이 지난 major 이벤트 수 N: 0 normal / 1 hungry / 2+ sprouted */
function evaluateState(lastVisitedOn: string, today: string): PotatoState {
  const t = addDays(lastVisitedOn, 8);
  const n = MOCK_EVENTS.filter((e) => e.isMajor && e.date >= t && e.date <= today).length;
  return n === 0 ? "normal" : n === 1 ? "hungry" : "sprouted";
}

/** 먹이 목록에서 등급·먹이 수·마지막 방문·최신 후기를 다시 계산 (상태는 호출한 쪽이 정한다) */
function recompute(p: StoredPotato, feeds: Feed[]): StoredPotato {
  const sorted = [...feeds].sort((a, b) => b.visitedOn.localeCompare(a.visitedOn));
  const latest = sorted[0];
  return {
    ...p,
    feeds: sorted,
    level: Math.min(4, sorted.length) as Potato["level"],
    foodCount: sorted.length,
    lastVisitedOn: latest.visitedOn,
    latestReview: latest.review,
  };
}

/**
 * 명소 좌표 → 5 km 격자 셀 — 서버가 저장 시 변환한다. mock은 지도 좌표계(경도 124~132 → x 0~132, 위도 39~33 → y 0~122)의 선형 근사.
 */
function cellFromLatLng(lat: number, lng: number): [number, number] {
  const x = Math.round(((lng - 124) / 8) * 132);
  const y = Math.round(((39 - lat) / 6) * 122);
  return [Math.max(0, Math.min(131, x)), Math.max(0, Math.min(121, y))];
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function requireOnboarded(): Promise<void> {
  const me = await getMe();
  if (!me) throw new Error("LOGIN_REQUIRED");
  if (me.nickname === null) throw new Error("ONBOARDING_REQUIRED");
}

function validateFeed(visitedOn: string, review: string, today: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(visitedOn)) throw new Error("VISIT_DATE_INVALID");
  if (visitedOn > today) throw new Error("VISIT_DATE_IN_FUTURE");
  if (visitedOn < "2000-01-01") throw new Error("VISIT_DATE_TOO_OLD");
  if (review.length < 2 || review.length > 2000) throw new Error("REVIEW_LENGTH");
}

// ── 조회 ───────────────────────────────────────────────
/** 내 감자 목록 — TODO(Phase 2): GET /api/v1/me/potatoes. 같은 Promise를 돌려주므로 `use()`로 읽어도 된다 */
export function getMyPotatoes(): Promise<Potato[]> {
  listPromise ??= Promise.resolve(sortPotatoes(potatoes));
  return listPromise;
}

/** 감자 상세(먹이 목록 최신순) — TODO(Phase 2): GET /api/v1/potatoes/{id}. 없으면 null */
export function getPotato(id: string): Promise<PotatoDetail | null> {
  let p = detailPromises.get(id);
  if (!p) {
    const found = potatoes.find((x) => x.id === id);
    const next = nextMajorEvent(todayYmd());
    p = Promise.resolve(
      found
        ? {
            ...found,
            nextMajorEvent: next
              ? { title: next.title, dday: diffDays(todayYmd(), next.date) }
              : null,
          }
        : null,
    );
    detailPromises.set(id, p);
  }
  return p;
}

/** 방치 상태(배고픔 숫자에 세는 것) — specs/04: hungry 또는 sprouted */
export const isNeglected = (p: Potato) => p.state !== "normal";

// ── 쓰기 ───────────────────────────────────────────────
/**
 * 감자 심기 / 먹이 주기 — TODO(Phase 2): POST /api/v1/spots/{id}/potato/feeds
 * 감자가 없으면 Lv1로 만들고, 있으면 먹이를 더해 등급을 다시 계산한다. 먹이를 주면 상태는 즉시 normal.
 * 오류: VISIT_DATE_IN_FUTURE · VISIT_DATE_TOO_OLD · REVIEW_LENGTH · TOO_MANY_PHOTOS · FEED_ALREADY_EXISTS(409) · SPOT_NOT_FOUND
 */
export async function plantOrFeed(spotId: string, input: FeedInput): Promise<PlantResult> {
  await delay(300); // 네트워크 흉내
  await requireOnboarded();
  const today = todayYmd();
  const review = input.review.trim();
  validateFeed(input.visitedOn, review, today);
  if (input.photoKeys.length > 5) throw new Error("TOO_MANY_PHOTOS");
  const spot = SPOTS.find((s) => s.id === spotId);
  if (!spot) throw new Error("SPOT_NOT_FOUND");

  const existing = potatoes.find((p) => p.spot.id === spotId);
  if (existing?.feeds.some((f) => f.visitedOn === input.visitedOn)) {
    throw new Error("FEED_ALREADY_EXISTS");
  }
  const { food, eventId } = decideFood(input.visitedOn, spot.bortle);
  const feed: Feed = {
    id: `f_${Date.now().toString(36)}`,
    visitedOn: input.visitedOn,
    food,
    review,
    photoUrls: [], // TODO(Phase 1 후반): presign 업로드 키 → URL
    ...(eventId ? { eventId } : {}),
  };

  let potato: StoredPotato;
  if (existing) {
    potato = {
      ...recompute(existing, [feed, ...existing.feeds]),
      state: "normal",
      isPublic: input.isPublic,
    };
    potatoes = potatoes.map((p) => (p.id === existing.id ? potato : p));
  } else {
    potato = recompute(
      {
        id: `p_${spotId}`,
        spot: {
          id: spot.id,
          name: spot.name,
          sido: spot.sido,
          cell: cellFromLatLng(spot.lat, spot.lng),
        },
        level: 1,
        state: "normal",
        foodCount: 1,
        lastVisitedOn: feed.visitedOn,
        latestReview: feed.review,
        isPublic: input.isPublic,
        feeds: [],
      },
      [feed],
    );
    potatoes = [...potatoes, potato];
  }
  changed();
  return {
    potato,
    feed,
    isNewPotato: !existing,
    levelUp: potato.level > (existing?.level ?? 0),
  };
}

/** 공개 여부 변경 — TODO(Phase 2): PATCH /api/v1/potatoes/{id} {isPublic} */
export async function updatePotato(id: string, patch: { isPublic: boolean }): Promise<void> {
  await delay(150);
  await requireOnboarded();
  if (!potatoes.some((p) => p.id === id)) throw new Error("POTATO_NOT_FOUND");
  potatoes = potatoes.map((p) => (p.id === id ? { ...p, isPublic: patch.isPublic } : p));
  changed();
}

/**
 * 기록 수정 — TODO(Phase 2): PATCH /api/v1/feeds/{id}
 * 방문일이 바뀌면 먹이 종류를 다시 정하고, 상태도 즉시 재평가한다 (specs/04 엣지 케이스).
 */
export async function updateFeed(feedId: string, patch: FeedPatch): Promise<void> {
  await delay(300);
  await requireOnboarded();
  const today = todayYmd();
  const owner = potatoes.find((p) => p.feeds.some((f) => f.id === feedId));
  if (!owner) throw new Error("FEED_NOT_FOUND");
  const cur = owner.feeds.find((f) => f.id === feedId)!;
  const visitedOn = patch.visitedOn ?? cur.visitedOn;
  const review = (patch.review ?? cur.review).trim();
  validateFeed(visitedOn, review, today);
  if (owner.feeds.some((f) => f.id !== feedId && f.visitedOn === visitedOn)) {
    throw new Error("FEED_ALREADY_EXISTS");
  }
  const spot = SPOTS.find((s) => s.id === owner.spot.id);
  const decided = visitedOn !== cur.visitedOn ? decideFood(visitedOn, spot?.bortle ?? null) : null;
  const next: Feed = {
    ...cur,
    visitedOn,
    review,
    ...(decided ? { food: decided.food, eventId: decided.eventId } : {}),
  };
  if (decided && !decided.eventId) delete next.eventId;
  const updated = recompute(
    owner,
    owner.feeds.map((f) => (f.id === feedId ? next : f)),
  );
  // 방치 상태 재평가는 방문일이 바뀐 경우에만 (specs/04). 후기만 고치면 상태는 그대로
  if (decided) updated.state = evaluateState(updated.lastVisitedOn, today);
  potatoes = potatoes.map((p) => (p.id === owner.id ? updated : p));
  changed();
}

/**
 * 기록 삭제 — TODO(Phase 2): DELETE /api/v1/feeds/{id}
 * 마지막 먹이를 지우면 감자도 삭제된다. 돌려주는 값: 감자가 남았으면 그 id, 사라졌으면 null.
 */
export async function deleteFeed(feedId: string): Promise<{ potatoId: string | null }> {
  await delay(300);
  await requireOnboarded();
  const owner = potatoes.find((p) => p.feeds.some((f) => f.id === feedId));
  if (!owner) throw new Error("FEED_NOT_FOUND");
  const rest = owner.feeds.filter((f) => f.id !== feedId);
  if (rest.length === 0) {
    potatoes = potatoes.filter((p) => p.id !== owner.id);
    changed();
    return { potatoId: null };
  }
  const updated = recompute(owner, rest);
  updated.state = evaluateState(updated.lastVisitedOn, todayYmd());
  potatoes = potatoes.map((p) => (p.id === owner.id ? updated : p));
  changed();
  return { potatoId: owner.id };
}
