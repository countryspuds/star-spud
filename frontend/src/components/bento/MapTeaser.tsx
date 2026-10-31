import { Link } from "react-router-dom";
import lpMap from "../../assets/maps/lightpollution-5km.svg";
import { Card } from "../ui/Card";
import { Label } from "../ui/Label";
import styles from "./bento.module.css";

/** 홈 광공해 지도 위젯 — 카드 전체가 /map 링크 */
export function MapTeaser({ className }: { className?: string }) {
  return (
    <Card variant="glass" className={[styles.teaser, className].filter(Boolean).join(" ")}>
      <div className={styles.teaserHead}>
        <Label>LIGHT POLLUTION · 5 KM GRID</Label>
        <h2 className={styles.teaserTitle}>광공해 지도</h2>
      </div>
      <span className={styles.arrow} aria-hidden="true">
        ↗
      </span>
      <img
        src={lpMap}
        alt="대한민국 5 km 광공해 도트 지도"
        className={`pixelated ${styles.teaserMap}`}
        draggable={false}
      />
      <Link to="/map" className={styles.cover} aria-label="광공해 지도 열기" />
    </Card>
  );
}
