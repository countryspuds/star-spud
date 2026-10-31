import { clamp } from "./time";

/** 지도 pan/zoom 상태 — 명세 §4.2 */
export interface View {
  scale: number;
  tx: number;
  ty: number;
}

export const HOME_VIEW: View = { scale: 1, tx: 0, ty: 0 };
export const MIN_SCALE = 0.6;
export const MAX_SCALE = 8;
export const BUTTON_STEP = 1.3;

/**
 * (mx, my) 지점(영역 중심 기준 px)을 고정한 채 배율을 ns로 바꾼다.
 * f = ns/scale; tx' = mx − (mx − tx)·f
 */
export function zoomAt(v: View, ns: number, mx = 0, my = 0): View {
  const scale = clamp(ns, MIN_SCALE, MAX_SCALE);
  const f = scale / v.scale;
  return { scale, tx: mx - (mx - v.tx) * f, ty: my - (my - v.ty) * f };
}
