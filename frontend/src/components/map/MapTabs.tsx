import { Link } from "react-router-dom";
import type { MapTab } from "../../lib/mapRoute";
import styles from "./map.module.css";

/** 탭 순서는 명세 §10: [별보기][광공해][날씨][지형고도][내 감자밭] */
const TABS: { tab: MapTab; label: string; to: string }[] = [
  { tab: "star", label: "별보기", to: "/map" },
  { tab: "lp", label: "광공해", to: "/map/lp" },
  { tab: "weather", label: "날씨", to: "/map/weather" },
  { tab: "terrain", label: "지형고도", to: "/map/terrain" },
  { tab: "field", label: "내 감자밭", to: "/map/field" },
];

/** 지도 위 탭 — 레이어가 아니라 지도 자체를 바꾼다 (라우트 전환) */
export function MapTabs({ active }: { active: MapTab }) {
  return (
    <nav className={styles.tabs} aria-label="지도 종류">
      {TABS.map((t) => (
        <Link
          key={t.tab}
          to={t.to}
          className={t.tab === active ? styles.tabActive : styles.tab}
          aria-current={t.tab === active ? "page" : undefined}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
