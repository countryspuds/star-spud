/** 삭망월 (일) */
export const SYNODIC_MONTH = 29.53;

/** 월령(lunAge, 일) → 달 조도 % (0~100). 명세 §11.2: illum = (1 − cos(2π · lunAge / 29.53)) / 2 */
export function illumFromLunAge(lunAge: number): number {
  const frac = (1 - Math.cos((2 * Math.PI * lunAge) / SYNODIC_MONTH)) / 2;
  return Math.round(frac * 100);
}

/** 월령 → 차는 달인지. 명세 §11.2: waxing = lunAge < 14.77 */
export function isWaxing(lunAge: number): boolean {
  return ((lunAge % SYNODIC_MONTH) + SYNODIC_MONTH) % SYNODIC_MONTH < SYNODIC_MONTH / 2;
}

/** 명세 §4.4·§11.2 — 조도를 10% 단위로 반올림, 0 → moon-000, 100 → moon-100 */
export function moonFileName(illum: number, waxing: boolean): string {
  const step = Math.round(illum / 10) * 10;
  if (step <= 0) return "moon-000";
  if (step >= 100) return "moon-100";
  return `moon-${waxing ? "waxing" : "waning"}-${String(step).padStart(3, "0")}`;
}

/** 월령 하나로 조도·방향·아이콘 파일명까지 */
export function moonFromLunAge(lunAge: number): { illum: number; waxing: boolean; file: string } {
  const illum = illumFromLunAge(lunAge);
  const waxing = isWaxing(lunAge);
  return { illum, waxing, file: moonFileName(illum, waxing) };
}

export function moonPhaseLabel(illum: number, waxing: boolean): string {
  if (illum <= 2) return "삭";
  if (illum >= 98) return "보름";
  return waxing ? "차는 달" : "기우는 달";
}
