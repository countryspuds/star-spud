import type { IndexDay, IndexDayInput, IndexEvent } from "./types";

/**
 * 별보기 지수 (0~100) — 명세 §3 mock 공식
 * 0.4·(1−구름) + 0.3·(달 어두움) + 0.15·시정 + 0.15·이벤트보너스
 */
export function computeStarIndex(day: IndexDayInput, hasEvent: boolean): number {
  const moonDark = 1 - day.moonIllum / 100;
  const raw =
    0.4 * (1 - day.cloud) + 0.3 * moonDark + 0.15 * day.visibility + (hasEvent ? 0.15 : 0);
  return Math.round(Math.min(1, Math.max(0, raw)) * 100);
}

export function buildIndexDays(days: IndexDayInput[], events: IndexEvent[]): IndexDay[] {
  return days.map((d) => {
    const event = events.find((e) => e.date === d.date)?.label;
    return { ...d, score: computeStarIndex(d, event != null), event };
  });
}
