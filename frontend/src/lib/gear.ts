import type { GearCategory } from "../data/types";

/** 장비 카테고리 7 — specs/07. 중고 거래 대상이 아닌 app은 뺐다 */
export const GEAR_CATEGORIES: { category: GearCategory; label: string }[] = [
  { category: "binoculars", label: "쌍안경" },
  { category: "telescope", label: "망원경" },
  { category: "mount", label: "가대" },
  { category: "camera", label: "카메라" },
  { category: "lens", label: "렌즈" },
  { category: "tripod", label: "삼각대" },
  { category: "accessory", label: "액세서리" },
];

export const GEAR_LABEL: Record<GearCategory, string> = Object.fromEntries(
  GEAR_CATEGORIES.map((c) => [c.category, c.label]),
) as Record<GearCategory, string>;

export const isGearCategory = (v: string | null): v is GearCategory =>
  v !== null && GEAR_CATEGORIES.some((c) => c.category === v);

/** 상품 사진 자리 — 장비 종류별 단순 svg 아이콘 (실제 제품 사진은 쓰지 않는다) */
const ICONS = import.meta.glob("../assets/gear/gear-*.svg", {
  eager: true,
  import: "default",
}) as Record<string, string>;

export function gearIconSrc(category: GearCategory): string {
  return ICONS[`../assets/gear/gear-${category}.svg`];
}
