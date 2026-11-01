/**
 * 장터 — specs/07 장비 카테고리 위의 중고 거래 (Phase 2 플래그 뒤). 채팅 연결은 Phase 3.
 * 지금은 mock(찜만 이 탭의 sessionStorage). 백엔드가 생기면 같은 시그니처로
 * `GET /api/v1/market/listings?q&category&sido&price&trade&selling` · `GET /api/v1/market/listings/{id}` · `POST/DELETE .../like`.
 * 판매 상태(selling/reserved/sold)·조회 수·판매자 활동 수는 서버 값 — mock JSON을 그대로 돌려준다.
 */
import marketJson from "./market.json";
import { getMe } from "./auth";
import type {
  MarketFilter,
  MarketListing,
  MarketListingDetail,
  MarketSeller,
  PriceBand,
} from "./types";

export type {
  GearCategory,
  ListingCondition,
  ListingStatus,
  MarketFilter,
  MarketListing,
  MarketListingDetail,
  MarketSeller,
  PriceBand,
  TradeMethod,
} from "./types";

interface ListingRow extends Omit<MarketListingDetail, "seller" | "likedByMe"> {
  sellerId: string;
}
interface Mock {
  sellers: Record<string, Omit<MarketSeller, "id">>;
  listings: ListingRow[];
}
const MOCK = marketJson as Mock;

// ── 찜 (이 탭의 sessionStorage) ─────────────────────────
const SESSION_KEY = "starspud.mockMarketLikes";

function readLikes(): string[] {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

let liked = new Set<string>(readLikes());
const promises = new Map<string, Promise<unknown>>();
const listeners = new Set<() => void>();

/** 찜이 바뀌면 알림 (useSyncExternalStore용) */
export function subscribeMarket(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function changed(): void {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify([...liked]));
  } catch {
    // 저장이 막힌 환경에서는 메모리에서만 유지
  }
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

// ── 응답 모델 ──────────────────────────────────────────
function toListing(row: ListingRow): MarketListing {
  const mine = liked.has(row.id);
  return {
    id: row.id,
    title: row.title,
    price: row.price,
    category: row.category,
    condition: row.condition,
    sido: row.sido,
    trade: row.trade,
    status: row.status,
    createdAt: row.createdAt,
    // seed의 likeCount는 다른 사람들 수 — 내 찜은 더한다
    likeCount: row.likeCount + (mine ? 1 : 0),
    likedByMe: mine,
    viewCount: row.viewCount,
    photoCount: row.photoCount,
  };
}

function toDetail(row: ListingRow): MarketListingDetail {
  const seller = MOCK.sellers[row.sellerId];
  return {
    ...toListing(row),
    description: row.description,
    includes: row.includes,
    seller: { id: row.sellerId, ...seller },
  };
}

/** 가격 밴드(만원) — specs/07 `price_band` */
const BAND: Record<PriceBand, [number, number]> = {
  under_10: [0, 100_000],
  "10_30": [100_000, 300_000],
  "30_100": [300_000, 1_000_000],
  over_100: [1_000_000, Infinity],
};

function matches(row: ListingRow, f: MarketFilter): boolean {
  const q = f.q.trim().toLowerCase();
  if (q && !row.title.toLowerCase().includes(q) && !row.description.toLowerCase().includes(q)) {
    return false;
  }
  if (f.category && row.category !== f.category) return false;
  if (f.sido && row.sido !== f.sido) return false;
  if (f.price) {
    const [lo, hi] = BAND[f.price];
    if (row.price < lo || row.price >= hi) return false;
  }
  if (f.trade && row.trade !== "both" && row.trade !== f.trade) return false;
  if (f.sellingOnly && row.status !== "selling") return false;
  return true;
}

const filterKey = (f: MarketFilter) =>
  [
    f.q.trim(),
    f.category ?? "",
    f.sido ?? "",
    f.price ?? "",
    f.trade ?? "",
    f.sellingOnly ? 1 : 0,
  ].join("|");

/** 목록 — 최신순. TODO(Phase 2 백엔드): GET /api/v1/market/listings (mock은 한 페이지) */
export function getListings(filter: MarketFilter): Promise<MarketListing[]> {
  return cached(`list:${filterKey(filter)}`, () =>
    MOCK.listings
      .filter((r) => matches(r, filter))
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
      .map(toListing),
  );
}

/** 상품 상세 — TODO: GET /api/v1/market/listings/{id} (조회 수는 서버가 올린다). 없으면 null */
export function getListing(id: string): Promise<MarketListingDetail | null> {
  return cached(`listing:${id}`, () => {
    const row = MOCK.listings.find((r) => r.id === id);
    return row ? toDetail(row) : null;
  });
}

/** 찜 토글 — TODO: POST/DELETE /api/v1/market/listings/{id}/like. 로그인 + 온보딩 필요 */
export async function toggleListingLike(id: string): Promise<void> {
  const me = await getMe();
  if (!me || me.nickname === null) throw new Error("LOGIN_REQUIRED");
  if (!MOCK.listings.some((r) => r.id === id)) throw new Error("LISTING_NOT_FOUND");
  liked = new Set(liked);
  if (liked.has(id)) liked.delete(id);
  else liked.add(id);
  changed();
}
