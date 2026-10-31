export type MapTab = "star" | "lp" | "weather" | "terrain" | "field";

export interface MapRoute {
  tab: MapTab;
  /** 광공해 탭 드릴다운 중인 시·도 코드 (없으면 전국) */
  sido: string | null;
}

const TAB_SEGMENTS: Record<string, MapTab> = {
  lp: "lp",
  weather: "weather",
  terrain: "terrain",
  field: "field",
};

/**
 * `/map/*`의 나머지 경로 → 탭 + 시·도 (명세 §2·§10)
 * `/map` = 별보기(첫 탭) · `/map/lp` = 광공해 전국 · `/map/lp/:sido` = 광공해 드릴다운
 */
export function parseMapRoute(splat: string | undefined): MapRoute {
  const [seg, sub] = (splat ?? "").split("/").filter(Boolean);
  if (!seg) return { tab: "star", sido: null };
  // 자체 키만 인정 — "constructor"·"__proto__" 같은 프로토타입 키가 탭으로 해석되지 않게
  if (!Object.hasOwn(TAB_SEGMENTS, seg)) return { tab: "star", sido: null };
  const tab = TAB_SEGMENTS[seg];
  return { tab, sido: tab === "lp" && sub ? sub : null };
}

/** 광공해 탭 경로 — 전국 또는 시·도 드릴다운 */
export const lpPath = (sido?: string | null) => (sido ? `/map/lp/${sido}` : "/map/lp");

/** 탭별 지도 바탕색 — 명세 §4.1 (별보기는 팔레트 최저색보다 한 단계 어둡게) */
export const MAP_BG: Record<MapTab, string> = {
  star: "#12161f",
  lp: "#1b2130",
  weather: "#dbe7f0",
  terrain: "#d6e5f0",
  field: "#161b24",
};
