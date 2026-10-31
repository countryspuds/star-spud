/** 5 km 셀 격자 — 모든 지도 이미지가 공유하는 1056×976 좌표계 (명세 §4.1) */
export const MAP_W = 1056;
export const MAP_H = 976;
/** 셀 피치 8px, 사각형 7px */
export const CELL_PITCH = 8;
export const CELL_SIZE = 7;

/** 격자 인덱스 → px (좌상단) */
export const cellToPx = (i: number) => i * CELL_PITCH;
/** px → 격자 인덱스 */
export const pxToCell = (px: number) => Math.floor(px / CELL_PITCH);
