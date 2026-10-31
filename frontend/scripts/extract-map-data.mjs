// 디자인 에셋(SVG)에서 퍼즐·감자밭 mock 데이터를 뽑아 src/data/ 아래 JSON으로 저장한다.
// 실행: npm run extract:maps  (에셋이 바뀌었을 때만 다시 돌리면 된다)
//
// 왜 필요한가
// - cells-by-region-approx.json에는 10개 지역(도 단위 + 울릉)만 있고 광역시·특별시 8곳이 도에 합쳐져 있다.
//   → 17 시·도 퍼즐을 위해 lightpollution-17sido-exploded.svg의 광역시 조각 셀만 꺼내 덮어쓴다.
// - 시·군 단위 셀 정보는 lightpollution-gyeongnam-sigungu.svg에만 있다 → 조각별 셀을 그대로 꺼낸다.
// - 내 감자밭(field.json)은 myfield-5km.svg의 감자색 셀에서 뽑는다.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const maps = join(root, "src/assets/maps");
const out = join(root, "src/data/regions");
const PITCH = 8;

const readSvg = (name) =>
  readFileSync(join(maps, name), "utf8").replace(/<metadata>[\s\S]*?<\/metadata>/g, "");

/** <path fill d="M x yh7v7h-7z…"> → [{x, y, fill}] */
function cellsOf(svgPart) {
  const cells = [];
  for (const [, fill, d] of svgPart.matchAll(/<path fill="(#[0-9a-f]+)" d="([^"]+)"/g)) {
    for (const [, x, y] of d.matchAll(/M(\d+) (\d+)h/g)) cells.push({ x: +x, y: +y, fill });
  }
  return cells;
}

/** <g data-region="…"> 조각별 셀 */
function groupsOf(svg) {
  const groups = {};
  for (const [, region, body] of svg.matchAll(/<g data-region="([^"]+)"[^>]*>([\s\S]*?)<\/g>/g)) {
    groups[region] = cellsOf(body);
  }
  return groups;
}

const key = (x, y) => `${x},${y}`;

// ── 17 시·도: 광역시 셀 ─────────────────────────────
const METROS = ["seoul", "busan", "daegu", "incheon", "gwangju", "daejeon", "ulsan", "sejong"];
const sidoGroups = groupsOf(readSvg("lightpollution-17sido-exploded.svg"));
const metroCells = Object.fromEntries(
  METROS.map((code) => [code, (sidoGroups[code] ?? []).map((c) => [c.x / PITCH, c.y / PITCH])]),
);
writeFileSync(join(out, "metro-cells.json"), JSON.stringify(metroCells) + "\n");

// ── 경남 시·군 ──────────────────────────────────────
// 근사 JSON의 경남 경계는 시·군 SVG와 많이 달라(거창 셀이 전북·경북으로 감) 시·군 퍼즐은 SVG 셀을 그대로 쓴다.
const sigunguGroups = groupsOf(readSvg("lightpollution-gyeongnam-sigungu.svg"));
const sigungu = Object.fromEntries(
  Object.entries(sigunguGroups).map(([name, cells]) => [
    name,
    cells.map((c) => [c.x / PITCH, c.y / PITCH]),
  ]),
);
writeFileSync(join(out, "gyeongnam-sigungu.json"), JSON.stringify(sigungu) + "\n");

// ── 내 감자밭 ───────────────────────────────────────
const POTATO = { "#f0d08a": 1, "#d9a95e": 2, "#b98545": 3, "#8a5a2e": 4 };
const field = cellsOf(readSvg("myfield-5km.svg"))
  .filter((c) => POTATO[c.fill])
  .map((c) => ({ x: c.x / PITCH, y: c.y / PITCH, stage: POTATO[c.fill] }))
  .sort((a, b) => a.y - b.y || a.x - b.x);
writeFileSync(join(root, "src/data/field.json"), JSON.stringify({ cells: field }, null, 2) + "\n");

console.log(
  `metro ${METROS.map((m) => `${m}:${metroCells[m].length}`).join(" ")}\n` +
    `gyeongnam ${Object.values(sigungu).flat().length} cells → ${Object.keys(sigungu).length} 시·군\n` +
    `field ${field.length} cells`,
);
