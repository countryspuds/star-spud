export type MapTab = "lp" | "weather" | "terrain" | "field";

export interface MapRoute {
  tab: MapTab;
  /** 광공해 탭 드릴다운 중인 시·도 코드 (없으면 전국) */
  sido: string | null;
}

const TAB_SEGMENTS: Record<string, MapTab> = {
  weather: "weather",
  terrain: "terrain",
  field: "field",
};

/** `/map/*`의 나머지 경로 → 탭 + 시·도 */
export function parseMapRoute(splat: string | undefined): MapRoute {
  const seg = (splat ?? "").split("/").filter(Boolean)[0];
  if (!seg) return { tab: "lp", sido: null };
  // 자체 키만 인정 — "constructor"·"__proto__" 같은 프로토타입 키가 탭으로 해석되지 않게
  if (Object.hasOwn(TAB_SEGMENTS, seg)) return { tab: TAB_SEGMENTS[seg], sido: null };
  return { tab: "lp", sido: seg };
}

/** 탭별 지도 바탕색 — 명세 §4.1 */
export const MAP_BG: Record<MapTab, string> = {
  lp: "#1b2130",
  weather: "#dbe7f0",
  terrain: "#d6e5f0",
  field: "#161b24",
};
