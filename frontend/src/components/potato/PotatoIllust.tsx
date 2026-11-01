import type { PotatoState } from "../../data/types";
import { potatoIllustSrc, type PotatoLevel } from "../../lib/potatoIllust";
import styles from "./potato.module.css";

interface Props {
  level: PotatoLevel;
  state: PotatoState;
  /** 한 변 px (기본 36) */
  size?: number;
  className?: string;
}

/** 감자 일러스트 — 등급·상태(서버 값)에 맞는 그림. `hungry`는 말풍선(specs/04) */
export function PotatoIllust({ level, state, size = 36, className }: Props) {
  return (
    <span
      className={[styles.illust, className].filter(Boolean).join(" ")}
      style={{ width: size, height: size }}
      data-state={state}
    >
      <img
        src={potatoIllustSrc(level, state)}
        alt=""
        width={size}
        height={size}
        className="pixelated"
        draggable={false}
      />
      {state === "hungry" && (
        <span className={styles.bubble} aria-hidden="true">
          …
        </span>
      )}
    </span>
  );
}
