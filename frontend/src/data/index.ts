/**
 * 데이터 접근 단일 창구.
 * Phase 1: 전부 mock JSON. Phase 2: 같은 시그니처로 백엔드 API 호출로 교체한다.
 * 컴포넌트는 React 19 `use(getXxx())` + <Suspense>로 읽는다 — 같은 인자에는 같은 Promise를 돌려준다.
 */
import photoJson from "./photoOfMonth.json";
import tonightJson from "./tonight.json";
import index10dJson from "./index10d.json";
import eventsJson from "./events.json";
import spotsJson from "./spots.json";
import fieldJson from "./field.json";
import photoPlaceholder from "../assets/photo-of-month-placeholder.png";
import { buildIndexDays } from "./starIndex";
import type { AstroEvent, Field, Index10d, PhotoOfMonth, Spot, Tonight } from "./types";

export type * from "./types";

const cache = new Map<string, Promise<unknown>>();

function cached<T>(key: string, load: () => T): Promise<T> {
  let p = cache.get(key) as Promise<T> | undefined;
  if (!p) {
    p = Promise.resolve().then(load);
    cache.set(key, p);
  }
  return p;
}

const ASSET_URLS: Record<string, string> = {
  "photo-of-month-placeholder.png": photoPlaceholder,
};

/** 이달의 사진 — TODO(Phase 2): GET /api/photos/month */
export function getPhotoOfMonth(): Promise<PhotoOfMonth> {
  return cached("photo", () => ({
    ...photoJson,
    src: ASSET_URLS[photoJson.src] ?? photoJson.src,
  }));
}

/** 오늘 밤 세부값 + 게이지 입력 — TODO(Phase 2): GET /api/tonight?lat&lng */
export function getTonight(): Promise<Tonight> {
  return cached("tonight", () => tonightJson);
}

/** 별보기 지수 10일 — TODO(Phase 2): GET /api/index10d?lat&lng */
export function getIndex10d(): Promise<Index10d> {
  return cached("index10d", () => ({
    days: buildIndexDays(index10dJson.days, index10dJson.events),
    events: index10dJson.events,
  }));
}

/** 다가오는 천체 이벤트 — TODO(Phase 2): GET /api/events?upcoming */
export function getEvents(): Promise<AstroEvent[]> {
  return cached("events", () => eventsJson);
}

/** 관측 명소 — sido(시·도 코드)·sigungu(이름)로 거르고 거리순 정렬. TODO(Phase 2): GET /api/spots */
export function getSpots(sido?: string, sigungu?: string): Promise<Spot[]> {
  return cached(`spots:${sido ?? "*"}:${sigungu ?? "*"}`, () =>
    (spotsJson as Spot[])
      .filter(
        (s) => (sido == null || s.sido === sido) && (sigungu == null || s.sigungu === sigungu),
      )
      .sort((a, b) => a.distanceKm - b.distanceKm),
  );
}

/** 내 감자밭 — 심은 셀 목록. TODO(Phase 2): GET /api/me/field */
export function getField(): Promise<Field> {
  return cached("field", () => fieldJson as Field);
}
