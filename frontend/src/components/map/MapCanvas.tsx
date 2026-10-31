import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type Dispatch,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
  type SetStateAction,
} from "react";
import { MAP_H, MAP_W } from "../../lib/grid";
import { zoomAt, type View } from "../../lib/view";
import styles from "./canvas.module.css";

const DRAG_THRESHOLD = 4;

interface Props {
  view: View;
  onViewChange: Dispatch<SetStateAction<View>>;
  /** 최소 배율 (작은 화면에선 fit 배율이 0.6보다 작을 수 있다) */
  minScale?: number;
  /** true면 view 변화를 300ms로 부드럽게 (fit 상태에서 화면 크기·퍼즐 전환 시) */
  smooth?: boolean;
  /** 드래그가 아닌 클릭 — 지도 좌표(px, 0~1056 × 0~976) */
  onMapClick?: (pt: { x: number; y: number }) => void;
  children: ReactNode;
}

/**
 * 1056×976 지도 레이어를 pan/zoom 하는 캔버스 (명세 §4.2).
 * 이동: 마우스는 휠 버튼(가운데 버튼) 드래그, 터치·펜은 손가락 드래그. 왼쪽 클릭은 지도·조각 선택에 쓴다.
 * 레이어는 영역 중앙에 놓이고 transform-origin은 레이어 중심 → 영역 중심 기준 좌표로 커서 줌 공식이 그대로 성립한다.
 */
export function MapCanvas({
  view,
  onViewChange,
  minScale,
  smooth = false,
  onMapClick,
  children,
}: Props) {
  const areaRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef(view);
  const suppressClick = useRef(false);
  const [dragging, setDragging] = useState(false);

  useLayoutEffect(() => {
    viewRef.current = view;
  });

  // React onWheel은 passive라 preventDefault가 안 된다 → 직접 등록
  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      const mx = e.clientX - r.left - r.width / 2;
      const my = e.clientY - r.top - r.height / 2;
      const delta = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
      const k = Math.exp(-delta * 0.0015);
      onViewChange((v) => zoomAt(v, v.scale * k, mx, my, minScale));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [onViewChange, minScale]);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    // 마우스는 휠 버튼(1)만 이동, 터치·펜은 기본 접촉(0)으로 이동
    const pan = e.pointerType === "mouse" ? e.button === 1 : e.button === 0;
    // 왼쪽 버튼은 이동하지 않지만, 누른 채 움직였으면 클릭으로 치지 않도록 추적한다
    if (!pan && e.button !== 0) return;
    // 휠 버튼 기본 동작(자동 스크롤) 막기
    if (e.button === 1) e.preventDefault();
    const sx = e.clientX;
    const sy = e.clientY;
    const base = viewRef.current;
    let moved = false;

    const move = (ev: globalThis.PointerEvent) => {
      const dx = ev.clientX - sx;
      const dy = ev.clientY - sy;
      if (!moved && Math.hypot(dx, dy) > DRAG_THRESHOLD) {
        moved = true;
        if (pan) setDragging(true);
      }
      if (moved && pan) onViewChange((v) => ({ ...v, tx: base.tx + dx, ty: base.ty + dy }));
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      if (moved) {
        suppressClick.current = true;
        // 클릭 이벤트가 안 따라오는 경우(영역 밖에서 놓음)를 대비해 다음 틱에 해제
        setTimeout(() => (suppressClick.current = false), 0);
        if (pan) setDragging(false);
      }
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  };

  // 드래그 끝의 click은 지도·조각 클릭으로 취급하지 않는다
  const onClickCapture = (e: MouseEvent) => {
    if (suppressClick.current) {
      suppressClick.current = false;
      e.stopPropagation();
      e.preventDefault();
    }
  };

  const onClick = (e: MouseEvent<HTMLDivElement>) => {
    if (!onMapClick || !areaRef.current) return;
    const r = areaRef.current.getBoundingClientRect();
    const mx = e.clientX - r.left - r.width / 2;
    const my = e.clientY - r.top - r.height / 2;
    const v = viewRef.current;
    onMapClick({ x: (mx - v.tx) / v.scale + MAP_W / 2, y: (my - v.ty) / v.scale + MAP_H / 2 });
  };

  return (
    <div
      ref={areaRef}
      className={dragging ? `${styles.area} ${styles.dragging}` : styles.area}
      onPointerDown={onPointerDown}
      onMouseDown={(e) => {
        if (e.button === 1) e.preventDefault();
      }}
      onClickCapture={onClickCapture}
      onClick={onClick}
    >
      <div
        className={styles.layer}
        style={{
          // 라벨처럼 화면 크기를 유지해야 하는 요소가 배율을 되돌리는 데 쓴다
          ["--inv-scale" as string]: 1 / view.scale,
          transform: `translate(${view.tx}px, ${view.ty}px) scale(${view.scale})`,
          transition: smooth && !dragging ? "transform 300ms ease-out" : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
}
