import type { Food } from "../data/types";

const URLS = import.meta.glob<string>("../assets/food/*.svg", {
  eager: true,
  query: "?url",
  import: "default",
});

/** 먹이 이름 — specs/04 (도감·통계용, 등급에는 영향 없음) */
export const FOOD_LABEL: Record<Food, string> = {
  star: "별",
  moon: "달",
  planet: "행성",
  galaxy: "은하수",
  meteor: "유성",
};

/** 먹이 아이콘 5종 (assets/food) */
export function foodIconSrc(food: Food): string {
  return URLS[`../assets/food/food-${food}.svg`];
}
