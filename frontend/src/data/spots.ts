/**
 * 명소 상세 · 공개 감자 · 신고 — specs/01·02·04 모델, 명세 §18.1·§18.5. Phase 1: mock JSON.
 * Phase 2: `GET /api/v1/spots/{id}?date=` · `GET /api/v1/spots/{id}/potatoes?cursor=` · `POST /api/v1/spots/{id}/reports`.
 * 판정(condition·reason)·등급·상태는 서버 값이라는 전제 — mock JSON에 적힌 값을 그대로 돌려주고 여기서 계산하지 않는다.
 */
import spotsJson from "./spots.json";
import spotPotatoesJson from "./spotPotatoes.json";
import photoPlaceholder from "../assets/photo-of-month-placeholder.png";
import { getMe, subscribeMe } from "./auth";
import { getMyPotatoes, subscribeMyPotatoes } from "./potatoes";
import type {
  Condition,
  NightTimes,
  Spot,
  SpotDetail,
  SpotNight,
  SpotPotato,
  SpotPotatoPage,
  SpotReportReason,
} from "./types";

export type {
  Condition,
  Direction,
  Spot,
  SpotAccess,
  SpotDetail,
  SpotNight,
  SpotPotato,
  SpotPotatoPage,
  SpotReportReason,
  SpotType,
} from "./types";

const ASSET_URLS: Record<string, string> = {
  "photo-of-month-placeholder.png": photoPlaceholder,
};
const assetUrl = (name: string) => ASSET_URLS[name] ?? name;

/** mock JSON 한 줄 — 상세 모델 + 오늘·내일·모레 밤의 서버 판정 */
interface SpotRow extends Spot {
  nights: { condition: Condition; reason: string; cloudPct: number | null }[];
}
const ROWS = spotsJson as SpotRow[];

interface SpotPotatoRow extends SpotPotato {
  spotId: string;
}
const OTHERS = spotPotatoesJson as SpotPotatoRow[];

const cache = new Map<string, Promise<unknown>>();

function cached<T>(key: string, load: () => T | Promise<T>): Promise<T> {
  let p = cache.get(key) as Promise<T> | undefined;
  if (!p) {
    p = Promise.resolve().then(load);
    cache.set(key, p);
  }
  return p;
}

// ── 날짜 ────────────────────────────────────────────────
const TZ = "Asia/Seoul";
const DAY = 86_400_000;
const ymdFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const hourFmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: TZ,
  hour: "2-digit",
  hourCycle: "h23",
});

/** 오늘·내일·모레 "밤"의 날짜(KST, YYYY-MM-DD). specs/02: 새벽 4시 전이면 진행 중인 밤(전날)이 오늘 밤 */
export function nightDates(now: Date = new Date()): [string, string, string] {
  const hour = Number(hourFmt.format(now));
  const base = now.getTime() - (hour < 4 ? DAY : 0);
  return [0, 1, 2].map((d) => ymdFmt.format(new Date(base + d * DAY))) as [string, string, string];
}

// ── 밤 시각 (mock 공통) ────────────────────────────────
/** 출몰 시각 "HH:MM". 앞에 "+"가 붙으면 다음 날 */
const SUN = { sunset: "17:30", astroEnd: "19:03", astroStart: "+05:27", sunrise: "+06:58" };
/** 오늘 밤부터 3일치 달 — 기우는 하현 무렵, 모두 자정 전후에 떠서 밤 전반은 달이 없다 */
const MOON = [
  { moonIllum: 48, waxing: false, moonrise: "23:40", moonset: "+12:30" },
  { moonIllum: 38, waxing: false, moonrise: "+00:35", moonset: "+13:05" },
  { moonIllum: 28, waxing: false, moonrise: "+01:30", moonset: "+13:40" },
];

function iso(date: string, hm: string): string {
  const nextDay = hm.startsWith("+");
  const d = nextDay ? ymdFmt.format(new Date(Date.parse(`${date}T12:00:00+09:00`) + DAY)) : date;
  return `${d}T${nextDay ? hm.slice(1) : hm}:00+09:00`;
}

function nightTimes(date: string, offset: number, now: Date): NightTimes {
  const m = MOON[Math.min(Math.max(offset, 0), MOON.length - 1)];
  return {
    sunset: iso(date, SUN.sunset),
    astroEnd: iso(date, SUN.astroEnd),
    astroStart: iso(date, SUN.astroStart),
    sunrise: iso(date, SUN.sunrise),
    moonrise: iso(date, m.moonrise),
    moonset: iso(date, m.moonset),
    moonIllum: m.moonIllum,
    waxing: m.waxing,
    now: now.toISOString(),
  };
}

// ── 명소 상세 ───────────────────────────────────────────
/**
 * 명소 상세 + 그날 밤 조건 — TODO(Phase 2): GET /api/v1/spots/{id}?date=
 * 없는 id(또는 hidden 명소)는 null. 예보 범위(오늘~모레) 밖 날짜는 `unknown`.
 */
export function getSpot(id: string, date: string): Promise<SpotDetail | null> {
  return cached(`spot:${id}:${date}`, () => {
    const row = ROWS.find((s) => s.id === id);
    if (!row) return null;
    const { nights, ...spot } = row;
    const now = new Date();
    const offset = nightDates(now).indexOf(date);
    const n = offset >= 0 ? nights[offset] : undefined;
    const night: SpotNight = {
      date,
      condition: n?.condition ?? "unknown",
      reason: n?.reason ?? "예보가 아직 없어요",
      cloudPct: n?.cloudPct ?? null,
      times: nightTimes(date, offset, now),
    };
    return { ...spot, photos: spot.photos.map(assetUrl), night };
  });
}

// ── 공개 감자 ───────────────────────────────────────────
const PAGE_SIZE = 5;

/** 공개 감자 전체(최신 기록순) — 내 공개 감자도 서버 목록에 섞여 내려온다고 보고 합친다 */
async function allSpotPotatoes(spotId: string): Promise<SpotPotato[]> {
  const [me, mine] = await Promise.all([getMe(), getMyPotatoes()]);
  const nickname = me?.nickname;
  const own: SpotPotato[] = nickname
    ? mine
        .filter((p) => p.spot.id === spotId && p.isPublic)
        .map((p) => ({
          id: p.id,
          nickname,
          level: p.level,
          state: p.state,
          foodCount: p.foodCount,
          lastVisitedOn: p.lastVisitedOn,
          latestReview: p.latestReview,
          photos: [],
        }))
    : [];
  const others: SpotPotato[] = OTHERS.filter((o) => o.spotId === spotId).map((o) => ({
    id: o.id,
    nickname: o.nickname,
    level: o.level,
    state: o.state,
    foodCount: o.foodCount,
    lastVisitedOn: o.lastVisitedOn,
    latestReview: o.latestReview,
    photos: o.photos.map(assetUrl),
  }));
  return [...own, ...others].sort((a, b) => b.lastVisitedOn.localeCompare(a.lastVisitedOn));
}

/** 명소의 공개 감자 한 페이지 — TODO(Phase 2): GET /api/v1/spots/{id}/potatoes?cursor= */
export function getSpotPotatoes(
  spotId: string,
  cursor: string | null = null,
): Promise<SpotPotatoPage> {
  return cached(`spotPotatoes:${spotId}:${cursor ?? ""}`, async () => {
    const all = await allSpotPotatoes(spotId);
    const start = cursor ? Number(cursor) : 0;
    const items = all.slice(start, start + PAGE_SIZE);
    const end = start + items.length;
    return { items, nextCursor: end < all.length ? String(end) : null, total: all.length };
  });
}

/** 공개 감자 목록 캐시를 비운다 — 로그인 사용자가 바뀌거나 내 감자가 바뀌면 다음 조회가 다시 만든다 */
export function invalidateSpotPotatoes(): void {
  for (const key of cache.keys()) {
    if (key.startsWith("spotPotatoes:")) cache.delete(key);
  }
}
subscribeMe(invalidateSpotPotatoes);
subscribeMyPotatoes(invalidateSpotPotatoes);

// ── 신고 ───────────────────────────────────────────────
/** 이 탭에서 신고한 명소 → 사유 */
const reported = new Map<string, SpotReportReason>();

/** 명소 신고 — TODO(Phase 2): POST /api/v1/spots/{id}/reports. specs/01: 사용자당 명소당 1건, 재시도는 409 */
export async function reportSpot(spotId: string, reason: SpotReportReason): Promise<void> {
  await new Promise((r) => setTimeout(r, 300)); // 네트워크 흉내
  if (reported.has(spotId)) throw new Error("REPORT_ALREADY_EXISTS");
  reported.set(spotId, reason);
}
