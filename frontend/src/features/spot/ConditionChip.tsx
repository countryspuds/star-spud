import type { Condition } from "../../data/spots";
import { CONDITION } from "./labels";
import styles from "./spot.module.css";

interface Props {
  condition: Condition;
  /** 앞에 붙는 말 (예: "오늘 밤") */
  prefix?: string;
  /** "오늘 밤 이곳" 카드의 큰 칩 */
  large?: boolean;
}

/** 판정 칩 — 색·문구는 labels.ts, 판정 값은 서버. unknown은 점선 테두리 */
export function ConditionChip({ condition, prefix, large = false }: Props) {
  const { label, color } = CONDITION[condition];
  return (
    <span
      className={large ? styles.chipLarge : styles.chip}
      data-condition={condition}
      style={{ color }}
    >
      {prefix ? `${prefix} ${label}` : label}
    </span>
  );
}
