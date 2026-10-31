import { MAP_H, MAP_W } from "./grid";
import { clamp } from "./time";

/** 지도 pan/zoom 상태 — 명세 §4.2 */
export interface View {
  scale: number;
  tx: number;
  ty: number;
}

export const HOME_VIEW: View = { scale: 1, tx: 0, ty: 0 };

export interface Box {
  width: number;
  height: number;
}

/** 지도 한 장(1056×976) */
export const MAP_BOX: Box = { width: MAP_W, height: MAP_H };
/** 17 시·도 퍼즐이 벌어진 범위 — lightpollution-17sido-exploded.svg의 viewBox(−100 −100 1256 1176)와 같다 */
export const PUZZLE_BOX: Box = { width: MAP_W + 200, height: MAP_H + 200 };

/** box가 영역(area)에 꼭 들어가는 배율 — 기본 화면과 ⌂ 리셋에 쓴다 */
export function fitView(area: Box, box: Box = MAP_BOX): View {
  if (!area.width || !area.height) return HOME_VIEW;
  return { scale: Math.min(area.width / box.width, area.height / box.height), tx: 0, ty: 0 };
}
export const MIN_SCALE = 0.6;
export const MAX_SCALE = 8;
export const BUTTON_STEP = 1.3;

/**
 * (mx, my) 지점(영역 중심 기준 px)을 고정한 채 배율을 ns로 바꾼다.
 * f = ns/scale; tx' = mx − (mx − tx)·f
 */
export function zoomAt(v: View, ns: number, mx = 0, my = 0, minScale = MIN_SCALE): View {
  const scale = clamp(ns, minScale, MAX_SCALE);
  const f = scale / v.scale;
  return { scale, tx: mx - (mx - v.tx) * f, ty: my - (my - v.ty) * f };
}
