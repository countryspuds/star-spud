/** 명세 §4.4 — 10% 반올림, 0 → moon-000, 100 → moon-100 */
export function moonFileName(illum: number, waxing: boolean): string {
  const step = Math.round(illum / 10) * 10;
  if (step <= 0) return "moon-000";
  if (step >= 100) return "moon-100";
  return `moon-${waxing ? "waxing" : "waning"}-${String(step).padStart(3, "0")}`;
}

export function moonPhaseLabel(illum: number, waxing: boolean): string {
  if (illum <= 2) return "삭";
  if (illum >= 98) return "보름";
  return waxing ? "차는 달" : "기우는 달";
}
