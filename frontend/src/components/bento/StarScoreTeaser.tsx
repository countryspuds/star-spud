import { Link } from "react-router-dom";
import starScoreMap from "../../assets/maps/starscore-5km.svg";
import { Card } from "../ui/Card";
import { ExampleCaption, Label } from "../ui/Label";
import styles from "./bento.module.css";

/** 범례 5칸 — §10 8단계 팔레트 중 양 끝과 중간 (나쁨 → 좋음) */
const LEGEND = ["#1a2030", "#2f4668", "#5f9a85", "#b9e258", "#d9fc46"];

/**
 * 홈 별보기 지도 위젯 — 카드 전체가 /map 링크 (명세 §3 우상단 칸 + §10).
 * 점수 셀은 백엔드가 계산해 내려주고(getStarScoreGrid), Phase 1은 mock SVG 이미지를 그대로 보여준다.
 */
export function StarScoreTeaser({ className }: { className?: string }) {
  return (
    <Card variant="glass" className={[styles.teaser, className].filter(Boolean).join(" ")}>
      <div className={styles.teaserHead}>
        <Label>STAR SCORE · 5 KM GRID</Label>
        <h2 className={styles.teaserTitle}>별보기 지도</h2>
      </div>
      <span className={styles.arrow} aria-hidden="true">
        ↗
      </span>
      <img
        src={starScoreMap}
        alt="대한민국 5 km 별보기 점수 도트 지도"
        className={`pixelated ${styles.teaserMap}`}
        draggable={false}
      />
      <div className={styles.scoreLegend}>
        <div className={styles.scoreSwatches} aria-hidden="true">
          {LEGEND.map((c) => (
            <span key={c} style={{ background: c }} />
          ))}
        </div>
        <span className={styles.scoreLegendText}>
          나쁨 → 좋음 · 광공해 50 · 명소 20 · 접근 15 · 고도 10 · 편의 5
        </span>
        <ExampleCaption />
      </div>
      <Link to="/map" className={styles.cover} aria-label="별보기 지도 열기" />
    </Card>
  );
}
