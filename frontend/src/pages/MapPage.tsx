import { Suspense } from "react";
import { useParams } from "react-router-dom";
import lpMap from "../assets/maps/lightpollution-5km.svg";
import { Breadcrumb, type Crumb } from "../components/map/Breadcrumb";
import { MapLegend } from "../components/map/MapLegend";
import { MapTabs } from "../components/map/MapTabs";
import { SpotList } from "../components/map/SpotList";
import { TonightGauge } from "../components/gauge/TonightGauge";
import { Card } from "../components/ui/Card";
import { SIDO, isSidoCode } from "../data/regions";
import { MAP_BG, parseMapRoute } from "../lib/mapRoute";
import styles from "../components/map/map.module.css";

export function MapPage() {
  const { "*": splat } = useParams();
  const { tab, sido } = parseMapRoute(splat);

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
          <img src={lpMap} alt="" width={1056} height={976} className="pixelated" />
          <div className={styles.overlayTop}>
            <MapTabs active={tab} />
          </div>
        </Card>
        <Suspense fallback={null}>
          <TonightGauge />
        </Suspense>
      </div>
    </div>
  );
}
