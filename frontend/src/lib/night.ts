import type { NightTimes } from "../data/types";
import { clamp, pct, toMs } from "./time";

const HALF_HOUR = 30 * 60 * 1000;

export interface Span {
  from: number;
  to: number;
}

/** 게이지 가로축: 일몰−30분 ~ 일출+30분 */
export function gaugeAxis(t: NightTimes): Span {
  return { from: toMs(t.sunset) - HALF_HOUR, to: toMs(t.sunrise) + HALF_HOUR };
}

/** 달이 떠 있는 구간들 (월몰이 월출보다 앞이면 두 조각) — 축 범위로 자른다 */
export function moonSpans(t: NightTimes, axis: Span): Span[] {
  const rise = toMs(t.moonrise);
  const set = toMs(t.moonset);
  const raw: Span[] =
    rise <= set
      ? [{ from: rise, to: set }]
      : [
          { from: -Infinity, to: set },
          { from: rise, to: Infinity },
        ];
  return raw
    .map((s) => ({ from: Math.max(s.from, axis.from), to: Math.min(s.to, axis.to) }))
    .filter((s) => s.to > s.from);
}

/**
 * 달 없는 완전한 밤 — 천문박명 끝 ~ 박명 시작 구간에서 달이 떠 있는 시간을 뺀 가장 긴 조각.
 * (명세: 천문박명 끝 ~ min(월출, 박명 시작). 달이 먼저 떠 있는 경우까지 일반화)
 */
export function darkWindow(t: NightTimes): Span | null {
  let free: Span[] = [{ from: toMs(t.astroEnd), to: toMs(t.astroStart) }];
  for (const m of moonSpans(t, { from: -Infinity, to: Infinity })) {
    free = free.flatMap((f) =>
      [
        { from: f.from, to: Math.min(f.to, m.from) },
        { from: Math.max(f.from, m.to), to: f.to },
      ].filter((s) => s.to > s.from),
    );
  }
  if (free.length === 0) return null;
  return free.reduce((a, b) => (b.to - b.from > a.to - a.from ? b : a));
}

/** 축 위 위치 % (0~100으로 자름) */
export function axisPct(ms: number, axis: Span): number {
  return clamp(pct(ms, axis.from, axis.to), 0, 100);
}
