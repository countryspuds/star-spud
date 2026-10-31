import type { Dispatch, SetStateAction } from "react";
import { BUTTON_STEP, MAX_SCALE, MIN_SCALE, zoomAt, type View } from "../../lib/view";
import styles from "./map.module.css";

/** + / − / ⌂(전국 맞춤) — 버튼은 영역 중심 기준 1.3배 */
export function ZoomControls({
  view,
  onViewChange,
  onReset,
  minScale = MIN_SCALE,
}: {
  view: View;
  onViewChange: Dispatch<SetStateAction<View>>;
  /** ⌂ — 지도 전체가 보이는 배율로 */
  onReset: () => void;
  minScale?: number;
}) {
  return (
    <div className={styles.zoom} role="group" aria-label="지도 확대·축소">
      <button
        type="button"
        aria-label="확대"
        disabled={view.scale >= MAX_SCALE}
        onClick={() => onViewChange((v) => zoomAt(v, v.scale * BUTTON_STEP, 0, 0, minScale))}
      >
        +
      </button>
      <button
        type="button"
        aria-label="축소"
        disabled={view.scale <= minScale + 1e-6}
        onClick={() => onViewChange((v) => zoomAt(v, v.scale / BUTTON_STEP, 0, 0, minScale))}
      >
        −
      </button>
      <button type="button" aria-label="전국 보기로 초기화" onClick={onReset}>
        ⌂
      </button>
    </div>
  );
}
