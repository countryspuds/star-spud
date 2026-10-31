import type { ReactNode } from "react";
import styles from "./ui.module.css";

/** 밝은 카드 안의 세부값 타일: 라벨 11px / 값 20px 700 / 보조 */
export function Tile({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className={styles.tile}>
      <span className={styles.tileLabel}>{label}</span>
      <span className={styles.tileValue}>{value}</span>
      {sub != null && <span className={styles.tileSub}>{sub}</span>}
    </div>
  );
}
