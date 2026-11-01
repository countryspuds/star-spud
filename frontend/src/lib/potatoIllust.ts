import type { PotatoState } from "../data/types";

const URLS = import.meta.glob<string>("../assets/potato/levels/*.svg", {
  eager: true,
  query: "?url",
  import: "default",
});

export type PotatoLevel = 1 | 2 | 3 | 4;

const FILE: Record<PotatoLevel, string> = {
  1: "lv1-jorang",
  2: "lv2-gamja",
  3: "lv3-wang",
  4: "lv4-byeol",
};

/** 등급명 — specs/04 */
export const LEVEL_NAME: Record<PotatoLevel, string> = {
  1: "조랭이감자",
  2: "감자",
  3: "왕감자",
  4: "별감자",
};

/**
 * 등급 4 × 상태 2 일러스트(specs/04 표시 규칙). `hungry`는 normal 일러스트에 말풍선을 얹는다.
 * 등급·상태 값은 서버가 정한 것을 그대로 받는다.
 */
export function potatoIllustSrc(level: PotatoLevel, state: PotatoState): string {
  const variant = state === "sprouted" ? "sprouted" : "normal";
  return URLS[`../assets/potato/levels/potato-${FILE[level]}-${variant}.svg`];
}
