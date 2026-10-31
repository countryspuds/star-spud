import { Suspense, useState } from "react";
import { useParams } from "react-router-dom";
import { Breadcrumb, type Crumb } from "../components/map/Breadcrumb";
import { MapCanvas } from "../components/map/MapCanvas";
import { MapLegend } from "../components/map/MapLegend";
import { MapTabs } from "../components/map/MapTabs";
import { SpotList } from "../components/map/SpotList";
import { ZoomControls } from "../components/map/ZoomControls";
import { TonightGauge } from "../components/gauge/TonightGauge";
import { Card } from "../components/ui/Card";
import { SIDO, isSidoCode } from "../data/regions";
import { getLayerSrc, isPixelLayer } from "../lib/lod";
import { MAP_BG, parseMapRoute } from "../lib/mapRoute";
import { HOME_VIEW, type View } from "../lib/view";
import styles from "../components/map/map.module.css";

export function MapPage() {
  const { "*": splat } = useParams();
  const { tab, sido } = parseMapRoute(splat);
  // 탭 전환은 같은 MapPage 안의 라우트 변경 → view 상태가 그대로 유지된다
  const [view, setView] = useState<View>(HOME_VIEW);

  const crumbs: Crumb[] = [{ label: "전국", to: "/map" }];
  if (sido) {
    crumbs.push({
      label: isSidoCode(sido) ? SIDO[sido].name : "알 수 없는 지역",
      to: `/map/${sido}`,
    });
  }

  return (
    <div className={styles.page}>
      <Card className={styles.panel}>
        <Breadcrumb items={crumbs} />
        <MapLegend tab={tab} />
        <Suspense fallback={null}>
          <SpotList sido={sido ?? undefined} />
        </Suspense>
      </Card>

      <div className={styles.right}>
        <Card variant="glass" className={styles.mapArea} style={{ background: MAP_BG[tab] }}>
          <MapCanvas view={view} onViewChange={setView}>
            <img
              src={getLayerSrc(tab, view.scale)}
              alt=""
              width={1056}
              height={976}
              className={isPixelLayer(tab) ? "pixelated" : undefined}
              draggable={false}
            />
          </MapCanvas>
          <div className={styles.overlayTop}>
            <MapTabs active={tab} />
            <ZoomControls view={view} onViewChange={setView} />
          </div>
          <span className={styles.hint}>드래그로 이동 · 휠로 확대 · ×{view.scale.toFixed(1)}</span>
        </Card>
        <Suspense fallback={null}>
          <TonightGauge />
        </Suspense>
      </div>
    </div>
  );
}
