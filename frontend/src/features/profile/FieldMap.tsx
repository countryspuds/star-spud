import { useCallback, useLayoutEffect, useRef, useState, type SetStateAction } from "react";
import approxJson from "../../assets/maps/cells-by-region-approx.json";
import { MapCanvas } from "../../components/map/MapCanvas";
import { Card } from "../../components/ui/Card";
import { ExampleCaption, Label } from "../../components/ui/Label";
import type { Potato } from "../../data/potatoes";
import { CELL_PITCH, CELL_SIZE, MAP_H, MAP_W } from "../../lib/grid";
import { useElementSize } from "../../lib/useElementSize";
import { MAP_BOX, MIN_SCALE, fitView, type View } from "../../lib/view";
import styles from "./profile.module.css";

const SIDO_TOTAL = 17;
/** 아직 감자가 없는 육지 셀 색 (명세 §15) */
const EMPTY_FILL = "#2a3140";

const rect = (x: number, y: number) => `M${x} ${y}h${CELL_SIZE}v${CELL_SIZE}h-${CELL_SIZE}z`;

/** 전국 육지 셀(근사 지역 JSON, 4,144개) 전부를 한 path로 */
const LAND = (() => {
  const rows = Object.values(approxJson as Record<string, (string | number)[][]>).flat();
  return { count: rows.length, d: rows.map(([x, y]) => rect(Number(x), Number(y))).join("") };
})();

const LEVELS = [1, 2, 3, 4] as const;

/** 감자 있는 셀만 감자색 4톤(등급)으로 칠한 도트 지도 — MapCanvas 재사용, pan/zoom 가능 */
export function FieldMap({ potatoes }: { potatoes: Potato[] }) {
  const [areaRef, areaSize] = useElementSize<HTMLElement>();
  const [userView, setUserView] = useState<View | null>(null);
  const fit = fitView(areaSize, MAP_BOX);
  const view = userView ?? fit;
  const fitRef = useRef(fit);
  useLayoutEffect(() => {
    fitRef.current = fit;
  });
  const updateView = useCallback((u: SetStateAction<View>) => {
    setUserView((prev) => (typeof u === "function" ? u(prev ?? fitRef.current) : u));
  }, []);

  const planted = new Set(potatoes.map((p) => p.spot.cell.join(","))).size;
  const sidos = new Set(potatoes.map((p) => p.spot.sido)).size;
  const pct = LAND.count ? ((planted / LAND.count) * 100).toFixed(2) : "0";

  const byLevel = LEVELS.map((lv) => ({
    lv,
    d: potatoes
      .filter((p) => p.level === lv)
      .map((p) => rect(p.spot.cell[0] * CELL_PITCH, p.spot.cell[1] * CELL_PITCH))
      .join(""),
  }));

  return (
    <Card ref={areaRef} variant="glass" className={styles.fieldMap}>
      <MapCanvas
        view={view}
        onViewChange={updateView}
        minScale={Math.min(MIN_SCALE, fit.scale)}
        smooth={userView == null}
      >
        <svg
          width={MAP_W}
          height={MAP_H}
          viewBox={`0 0 ${MAP_W} ${MAP_H}`}
          shapeRendering="crispEdges"
          role="img"
          aria-label="전국 감자밭 도트 지도"
        >
          <path d={LAND.d} fill={EMPTY_FILL} />
          {byLevel.map(({ lv, d }) => d && <path key={lv} d={d} fill={`var(--potato-${lv})`} />)}
        </svg>
      </MapCanvas>

      <div className={styles.fieldHead}>
        <Label>전국 감자밭</Label>
        <span className={styles.fieldCount}>
          {LAND.count.toLocaleString("ko-KR")}셀 중 <strong>{planted}</strong> · {pct}%
        </span>
      </div>
      <div className={styles.fieldLegend}>
        <span>
          <i style={{ background: "var(--potato-2)" }} /> 심은 셀
        </span>
        <span>
          <i style={{ background: EMPTY_FILL }} /> 아직
        </span>
        <span>
          시·도 {sidos}/{SIDO_TOTAL} 밟음
        </span>
        <ExampleCaption />
      </div>
    </Card>
  );
}
