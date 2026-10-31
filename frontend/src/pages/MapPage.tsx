import { Suspense, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Breadcrumb, type Crumb } from "../components/map/Breadcrumb";
import { FieldSummary } from "../components/map/FieldSummary";
import { MapCanvas } from "../components/map/MapCanvas";
import { MapLegend } from "../components/map/MapLegend";
import { MapTabs } from "../components/map/MapTabs";
import { NaverMap } from "../components/map/NaverMap";
import { SidoPuzzle, SigunguPuzzle } from "../components/map/RegionPuzzle";
import { SpotList } from "../components/map/SpotList";
import { ZoomControls } from "../components/map/ZoomControls";
import { TonightGauge } from "../components/gauge/TonightGauge";
import { Card } from "../components/ui/Card";
import { PillButton } from "../components/ui/Pill";
import { SIDO, isSidoCode } from "../data/regions";
import { getLayerSrc, isPixelLayer } from "../lib/lod";
import { MAP_BG, parseMapRoute, type MapTab } from "../lib/mapRoute";
import { getSidoCells, getSigunguPieces } from "../lib/puzzle";
import { useElementSize } from "../lib/useElementSize";
import { HOME_VIEW, type View } from "../lib/view";
import styles from "../components/map/map.module.css";

function hintFor(tab: MapTab, sido: string | null, puzzle: boolean, hasSigungu: boolean): string {
  if (tab !== "lp") return "드래그로 이동 · 휠로 확대";
  if (puzzle) return "조각을 눌러 시·도로 들어가요";
  if (sido) return hasSigungu ? "시·군을 눌러 명소를 걸러요" : "드래그로 이동 · 휠로 확대";
  return "지도를 클릭하면 시·도로 나뉘어요 · 드래그 이동 · 휠 확대";
}

export function MapPage() {
  const { "*": splat } = useParams();
  const { tab, sido } = parseMapRoute(splat);
  const location = useLocation();
  const navigate = useNavigate();

  // 탭·시도 전환은 같은 MapPage 안의 라우트 변경 → view 상태가 그대로 유지된다
  const [view, setView] = useState<View>(HOME_VIEW);
  const [areaRef, areaSize] = useElementSize<HTMLElement>();
  // 17 시·도 퍼즐은 그것을 연 위치(location.key)에서만 유지 — 다른 곳으로 이동하면 자동으로 닫힘
  const [puzzleKey, setPuzzleKey] = useState<string | null>(null);
  const puzzle = tab === "lp" && sido == null && puzzleKey === location.key;
  // 선택한 시·군·구 — 시·도가 바뀌면 무효
  const [pick, setPick] = useState<{ sido: string; id: string } | null>(null);
  const sigungu = sido != null && pick?.sido === sido ? pick.id : null;

  const knownSido = sido != null && isSidoCode(sido);
  const sigunguPieces = sido ? getSigunguPieces(sido) : null;
  const sidoPiece = knownSido ? getSidoCells(sido) : null;

  const crumbs: Crumb[] = [{ label: "전국", to: "/map" }];
  if (sido) {
    crumbs.push({ label: knownSido ? SIDO[sido].name : "알 수 없는 지역", to: `/map/${sido}` });
  }
  if (sigungu) crumbs.push({ label: sigungu });

  const goSido = (code: string) => {
    setView(HOME_VIEW);
    navigate(`/map/${code}`);
  };
  const goNational = () => {
    setView(HOME_VIEW);
    setPuzzleKey(null);
    if (sido) navigate("/map");
  };
  const toggleSigungu = (id: string) => {
    if (!sido) return;
    setPick(sigungu === id ? null : { sido, id });
  };

  let content;
  if (tab === "lp" && sido) {
    const pieces = sigunguPieces ?? (sidoPiece ? [sidoPiece] : []);
    content = (
      <SigunguPuzzle
        key={sido}
        pieces={pieces}
        selected={sigungu}
        onSelect={sigunguPieces ? toggleSigungu : undefined}
        viewport={areaSize}
      />
    );
  } else if (puzzle) {
    content = <SidoPuzzle onPick={goSido} />;
  } else if (tab === "weather" || tab === "terrain") {
    content = <NaverMap mapType={tab} scale={view.scale} />;
  } else {
    content = (
      <img
        src={getLayerSrc(tab, view.scale)}
        alt=""
        width={1056}
        height={976}
        className={isPixelLayer(tab) ? "pixelated" : undefined}
        draggable={false}
      />
    );
  }

  const canOpenPuzzle = tab === "lp" && sido == null && !puzzle;

  return (
    <div className={styles.page}>
      <Card className={styles.panel}>
        <Breadcrumb items={crumbs} />
        <MapLegend tab={tab} />
        <Suspense fallback={null}>
          {tab === "field" && <FieldSummary />}
          <SpotList sido={sido ?? undefined} sigungu={sigungu ?? undefined} />
        </Suspense>
      </Card>

      <div className={styles.right}>
        <Card
          ref={areaRef}
          variant="glass"
          className={styles.mapArea}
          style={{ background: MAP_BG[tab] }}
        >
          <MapCanvas
            view={view}
            onViewChange={setView}
            onMapClick={canOpenPuzzle ? () => setPuzzleKey(location.key) : undefined}
          >
            {content}
          </MapCanvas>

          <div className={styles.overlayTop}>
            <MapTabs active={tab} />
            <ZoomControls view={view} onViewChange={setView} />
          </div>

          {(puzzle || sido) && (
            <PillButton size="sm" className={styles.backBtn} onClick={goNational}>
              ← 전국
            </PillButton>
          )}

          {sido && !sigunguPieces && (
            <div className={styles.emptyState} role="status">
              <strong>
                {knownSido
                  ? `${SIDO[sido].name} 시·군·구 퍼즐은 준비 중이에요`
                  : "알 수 없는 지역이에요"}
              </strong>
              <span>지금은 경상남도만 예시 데이터로 볼 수 있어요.</span>
              <PillButton size="sm" tone="primary" onClick={() => goSido("gyeongnam")}>
                경상남도 보기
              </PillButton>
            </div>
          )}

          <span className={styles.hint}>
            {hintFor(tab, sido, puzzle, sigunguPieces != null)} · ×{view.scale.toFixed(1)}
          </span>
        </Card>
        <Suspense fallback={null}>
          <TonightGauge />
        </Suspense>
      </div>
    </div>
  );
}
