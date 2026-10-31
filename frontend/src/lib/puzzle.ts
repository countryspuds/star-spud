/**
 * 광공해 퍼즐 조각 데이터 — 명세 §4.3
 * 셀 색은 cells-by-region-approx.json(전국 지도와 동일 팔레트)을 기준으로 하고,
 * 광역시 8곳과 경남 시·군 배정은 scripts/extract-map-data.mjs가 퍼즐 SVG에서 뽑은 JSON으로 덮어쓴다.
 * 경계는 모두 근사치 — 실제 구현 시 행정구역 GeoJSON으로 다시 매긴다.
 */
import approxJson from "../assets/maps/cells-by-region-approx.json";
import metroJson from "../data/regions/metro-cells.json";
import gyeongnamJson from "../data/regions/gyeongnam-sigungu.json";
import { SIDO, type SidoCode } from "../data/regions";
import { CELL_PITCH, CELL_SIZE, MAP_H, MAP_W } from "./grid";

export interface Cell {
  /** px (좌상단) */
  x: number;
  y: number;
  fill: string;
}

export interface Bounds {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface Piece {
  id: string;
  label: string;
  /** 클릭 시 이동할 시·도 코드 (울릉·독도 → 경북) */
  target: string;
  cells: Cell[];
  /** fill별 path d */
  paths: { fill: string; d: string }[];
  /** 셀 사이 틈까지 덮는 투명 히트 영역 */
  hitPath: string;
  /** 무게중심 (px) */
  cx: number;
  cy: number;
  bounds: Bounds;
}

const cellKey = (x: number, y: number) => `${x},${y}`;

function makePiece(id: string, label: string, target: string, cells: Cell[]): Piece {
  const byFill = new Map<string, string[]>();
  let sx = 0;
  let sy = 0;
  const b: Bounds = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
  for (const c of cells) {
    const list = byFill.get(c.fill) ?? [];
    list.push(`M${c.x} ${c.y}h${CELL_SIZE}v${CELL_SIZE}h-${CELL_SIZE}z`);
    byFill.set(c.fill, list);
    sx += c.x;
    sy += c.y;
    b.x0 = Math.min(b.x0, c.x);
    b.y0 = Math.min(b.y0, c.y);
    b.x1 = Math.max(b.x1, c.x + CELL_SIZE);
    b.y1 = Math.max(b.y1, c.y + CELL_SIZE);
  }
  return {
    id,
    label,
    target,
    cells,
    paths: [...byFill].map(([fill, ds]) => ({ fill, d: ds.join("") })),
    hitPath: cells
      .map((c) => `M${c.x - 0.5} ${c.y - 0.5}h${CELL_PITCH}v${CELL_PITCH}h-${CELL_PITCH}z`)
      .join(""),
    cx: sx / cells.length + CELL_SIZE / 2,
    cy: sy / cells.length + CELL_SIZE / 2,
    bounds: b,
  };
}

/** 근사 지역 JSON의 [x, y, "#hex"] → Cell */
function toCells(rows: (string | number)[][]): Cell[] {
  return rows.map(([x, y, fill]) => ({ x: Number(x), y: Number(y), fill: String(fill) }));
}

const approx = approxJson as Record<string, (string | number)[][]>;
const metro = metroJson as Record<string, number[][]>;

/** 셀 좌표 → 색 (전국 지도 팔레트) */
const fillAt = new Map<string, string>();
for (const rows of Object.values(approx)) {
  for (const c of toCells(rows)) fillAt.set(cellKey(c.x, c.y), c.fill);
}

function gridToCells(rows: number[][]): Cell[] {
  return rows
    .map(([gx, gy]) => ({ x: gx * CELL_PITCH, y: gy * CELL_PITCH }))
    .map((p) => ({ ...p, fill: fillAt.get(cellKey(p.x, p.y)) ?? "#2d3650" }));
}

let sidoCache: Piece[] | null = null;

/** 17 시·도 + 울릉·독도 조각 */
export function getSidoPieces(): Piece[] {
  if (sidoCache) return sidoCache;
  const metroCells = Object.fromEntries(
    Object.entries(metro).map(([code, rows]) => [code, gridToCells(rows)]),
  );
  const taken = new Set(
    Object.values(metroCells).flatMap((cs) => cs.map((c) => cellKey(c.x, c.y))),
  );
  const pieces: Piece[] = [];
  for (const [code, rows] of Object.entries(approx)) {
    const cells = toCells(rows).filter((c) => !taken.has(cellKey(c.x, c.y)));
    if (code === "ulleung") {
      pieces.push(makePiece("ulleung", "울릉·독도", "gyeongbuk", cells));
    } else if (code in SIDO) {
      pieces.push(makePiece(code, SIDO[code as SidoCode].short, code, cells));
    }
  }
  for (const [code, cells] of Object.entries(metroCells)) {
    if (code in SIDO && cells.length) {
      pieces.push(makePiece(code, SIDO[code as SidoCode].short, code, cells));
    }
  }
  sidoCache = pieces;
  return pieces;
}

const SIGUNGU_SUFFIX: Record<string, string> = {
  거창: "군",
  산청: "군",
  하동: "군",
  합천: "군",
  의령: "군",
  함안: "군",
  창녕: "군",
  고성: "군",
  사천: "시",
  진주: "시",
  밀양: "시",
  양산: "시",
  김해: "시",
  창원: "시",
  통영: "시",
  거제: "시",
};

/** 시·군 정식 이름 (거제 → 거제시) */
export const sigunguFullName = (short: string) => short + (SIGUNGU_SUFFIX[short] ?? "");

/** 시·도별 시·군·구 조각 — mock은 경남만 */
const SIGUNGU_DATA: Partial<Record<string, Record<string, number[][]>>> = {
  gyeongnam: gyeongnamJson as Record<string, number[][]>,
};

const sigunguCache = new Map<string, Piece[]>();

export function getSigunguPieces(sido: string): Piece[] | null {
  // 자체 키만 — "__proto__" 같은 상속 속성이 지역 데이터로 읽히지 않게
  const data = Object.hasOwn(SIGUNGU_DATA, sido) ? SIGUNGU_DATA[sido] : undefined;
  if (!data) return null;
  let pieces = sigunguCache.get(sido);
  if (!pieces) {
    pieces = Object.entries(data)
      .filter(([, rows]) => rows.length > 0)
      .map(([name, rows]) => {
        const full = sigunguFullName(name);
        return makePiece(full, full, sido, gridToCells(rows));
      });
    sigunguCache.set(sido, pieces);
  }
  return pieces;
}

/** 시·도 조각 하나 (울릉·독도는 경북에 합침) */
export function getSidoCells(sido: string): Piece | null {
  const parts = getSidoPieces().filter((p) => p.target === sido);
  if (parts.length === 0) return null;
  return makePiece(
    sido,
    parts[0].label,
    sido,
    parts.flatMap((p) => p.cells),
  );
}

export function unionBounds(pieces: Piece[]): Bounds {
  return pieces.reduce<Bounds>(
    (b, p) => ({
      x0: Math.min(b.x0, p.bounds.x0),
      y0: Math.min(b.y0, p.bounds.y0),
      x1: Math.max(b.x1, p.bounds.x1),
      y1: Math.max(b.y1, p.bounds.y1),
    }),
    { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity },
  );
}

/**
 * 조각을 중심에서 바깥으로 벌리는 오프셋: d·k + 방향·push
 * - 17 시·도: 명세 §4.3 (k 0.14, push 30px, 중심 = 지도 중심)
 * - 시·군: 에셋(gyeongnam-sigungu.svg)과 같은 값 (k 0.22, push 14px, 중심 = 시·도 바운딩박스 중심)
 */
export function explodeOffset(
  p: Piece,
  center: { x: number; y: number },
  k: number,
  push: number,
): { x: number; y: number } {
  const dx = p.cx - center.x;
  const dy = p.cy - center.y;
  const d = Math.hypot(dx, dy) || 1;
  return { x: dx * k + (dx / d) * push, y: dy * k + (dy / d) * push };
}

export const MAP_CENTER = { x: MAP_W / 2, y: MAP_H / 2 };
export const SIDO_EXPLODE = { k: 0.14, push: 30 };
export const SIGUNGU_EXPLODE = { k: 0.22, push: 14 };
/** 40셀 미만 조각(서울·광역시·세종)은 라벨을 위로 띄운다 */
export const SMALL_PIECE_CELLS = 40;
