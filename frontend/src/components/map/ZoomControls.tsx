import type { Dispatch, SetStateAction } from "react";
import { BUTTON_STEP, HOME_VIEW, MAX_SCALE, MIN_SCALE, zoomAt, type View } from "../../lib/view";
import styles from "./map.module.css";

/** + / − / ⌂(전국) — 버튼은 영역 중심 기준 1.3배 */
export function ZoomControls({
  view,
  onViewChange,
}: {
  view: View;
  onViewChange: Dispatch<SetStateAction<View>>;
}) {
  return (
    <div className={styles.zoom} role="group" aria-label="지도 확대·축소">
      <button
        type="button"
        aria-label="확대"
        disabled={view.scale >= MAX_SCALE}
        onClick={() => onViewChange((v) => zoomAt(v, v.scale * BUTTON_STEP))}
      >
        +
      </button>
      <button
        type="button"
        aria-label="축소"
        disabled={view.scale <= MIN_SCALE}
        onClick={() => onViewChange((v) => zoomAt(v, v.scale / BUTTON_STEP))}
      >
        −
      </button>
      <button type="button" aria-label="전국 보기로 초기화" onClick={() => onViewChange(HOME_VIEW)}>
        ⌂
      </button>
    </div>
  );
}
