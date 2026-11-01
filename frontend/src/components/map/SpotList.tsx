import { use } from "react";
import { Link } from "react-router-dom";
import { getSpots } from "../../data";
import { ExampleCaption, Label } from "../ui/Label";
import styles from "./map.module.css";

/** 명소 리스트 — 현재 지역(시·도 / 시·군·구) 기준 필터, 거리순 */
export function SpotList({ sido, sigungu }: { sido?: string; sigungu?: string }) {
  const spots = use(getSpots(sido, sigungu));

  return (
    <div className={`${styles.section} ${styles.spotSection}`}>
      <div className={styles.spotHead}>
        <Label>명소 · {spots.length}</Label>
        <ExampleCaption />
      </div>
      {spots.length === 0 ? (
        <p className={styles.empty}>이 지역 명소는 아직 없어요.</p>
      ) : (
        <ul className={styles.spots}>
          {spots.map((s) => (
            <li key={s.id} className={styles.spot}>
              {/* 행 전체가 명소 상세 링크 (명세 §18.1) */}
              <Link to={`/spots/${s.id}`} className={styles.spotLink}>
                <span
                  className={styles.swatch}
                  style={{ background: `var(--lp-${s.lpLevel})` }}
                  aria-label={`광공해 ${s.lpLevel}단계`}
                />
                <div className={styles.spotText}>
                  <span className={styles.spotName}>{s.name}</span>
                  <span className={styles.spotSub}>
                    {s.sigungu} · Bortle {s.bortle} · {s.elevationM.toLocaleString("ko-KR")} m
                  </span>
                </div>
                <span className={`${styles.spotDist} tabular`}>{s.distanceKm} km</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
