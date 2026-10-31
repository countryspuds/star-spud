import { use } from "react";
import { getField } from "../../data";
import { ExampleCaption, Label } from "../ui/Label";
import styles from "./map.module.css";

const STAGES = [1, 2, 3, 4] as const;

/** 내 감자밭 요약 — 심은 셀 수와 단계별 분포 */
export function FieldSummary() {
  const { cells } = use(getField());
  const total = cells.length;

  return (
    <div className={styles.section}>
      <div className={styles.spotHead}>
        <Label>내 감자밭</Label>
        <ExampleCaption />
      </div>
      <p className={styles.fieldTotal}>
        <strong className="tabular">{total}</strong>칸에 감자를 심었어요
      </p>
      <div className={styles.fieldBar} role="img" aria-label="단계별 감자 비율">
        {STAGES.map((s) => {
          const n = cells.filter((c) => c.stage === s).length;
          return (
            <span
              key={s}
              style={{ flexGrow: n, background: `var(--potato-${s})` }}
              title={`${s}단계 ${n}칸`}
            />
          );
        })}
      </div>
    </div>
  );
}
