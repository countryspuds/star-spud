import { useEffect, useState, type KeyboardEvent } from "react";
import lp5km from "../../assets/maps/lightpollution-5km.svg";
import { MAP_H, MAP_W } from "../../lib/grid";
import {
  MAP_CENTER,
  SIDO_EXPLODE,
  SIGUNGU_EXPLODE,
  SMALL_PIECE_CELLS,
  explodeOffset,
  getSidoPieces,
  unionBounds,
  type Piece,
} from "../../lib/puzzle";
import styles from "./puzzle.module.css";

interface Offset {
  x: number;
  y: number;
}

/** 다음 프레임 이후에 true — 마운트 직후 상태에서 transition이 걸리도록 */
function useAfterPaint(delayMs = 0): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(() => {
        if (delayMs === 0) setReady(true);
      });
    });
    const timer = delayMs > 0 ? setTimeout(() => setReady(true), delayMs) : undefined;
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [delayMs]);
  return ready;
}

function PieceShape({
  piece,
  offset,
  dim,
  onHover,
  onPick,
}: {
  piece: Piece;
  offset: Offset;
  dim: boolean;
  onHover?: (id: string | null) => void;
  onPick?: () => void;
}) {
  const interactive = onPick != null;
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onPick?.();
    }
  };
  return (
    <g
      className={interactive ? `${styles.piece} ${styles.interactive}` : styles.piece}
      style={{ transform: `translate(${offset.x}px, ${offset.y}px)`, opacity: dim ? 0.35 : 1 }}
      onPointerEnter={onHover && (() => onHover(piece.id))}
      onPointerLeave={onHover && (() => onHover(null))}
      onFocus={onHover && (() => onHover(piece.id))}
      onBlur={onHover && (() => onHover(null))}
      onClick={
        onPick &&
        ((e) => {
          e.stopPropagation();
          onPick();
        })
      }
      onKeyDown={interactive ? onKeyDown : undefined}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={interactive ? piece.label : undefined}
    >
      {piece.paths.map((p) => (
        <path key={p.fill} fill={p.fill} d={p.d} />
      ))}
      {interactive && <path d={piece.hitPath} fill="transparent" />}
    </g>
  );
}

function PieceLabel({
  text,
  x,
  y,
  raised,
  dim,
  visible = true,
}: {
  text: string;
  x: number;
  y: number;
  raised: boolean;
  dim: boolean;
  visible?: boolean;
}) {
  return (
    <span
      className={raised ? `${styles.label} ${styles.raised}` : styles.label}
      style={{ left: x, top: y, opacity: visible ? (dim ? 0.35 : 1) : 0 }}
    >
      {text}
    </span>
  );
}

/** 17 시·도 퍼즐 — 전국 지도를 클릭하면 조각이 바깥으로 벌어진다 */
export function SidoPuzzle({ onPick }: { onPick: (sido: string) => void }) {
  const pieces = getSidoPieces();
  const exploded = useAfterPaint();
  const [hover, setHover] = useState<string | null>(null);
  // 울릉·독도는 경북과 함께 강조
  const hoverTarget = pieces.find((p) => p.id === hover)?.target ?? null;

  const offsets = new Map(
    pieces.map((p) => [
      p.id,
      exploded ? explodeOffset(p, MAP_CENTER, SIDO_EXPLODE.k, SIDO_EXPLODE.push) : { x: 0, y: 0 },
    ]),
  );

  return (
    <>
      <svg className={styles.svg} width={MAP_W} height={MAP_H} viewBox={`0 0 ${MAP_W} ${MAP_H}`}>
        {pieces.map((p) => (
          <PieceShape
            key={p.id}
            piece={p}
            offset={offsets.get(p.id)!}
            dim={hoverTarget != null && p.target !== hoverTarget}
            onHover={setHover}
            onPick={() => onPick(p.target)}
          />
        ))}
      </svg>
      <div className={styles.labels}>
        {pieces.map((p) => {
          const o = offsets.get(p.id)!;
          return (
            <PieceLabel
              key={p.id}
              text={p.label}
              x={p.cx + o.x}
              y={p.cy + o.y}
              raised={p.cells.length < SMALL_PIECE_CELLS}
              dim={hoverTarget != null && p.target !== hoverTarget}
            />
          );
        })}
      </div>
    </>
  );
}

/**
 * 시·도 → 시·군·구 퍼즐.
 * 전국 지도가 사라지며 해당 시·도 바운딩박스로 확대(400ms) → 시·군·구 조각으로 다시 벌어진다.
 * pieces가 한 조각뿐(시·군·구 데이터 없음)이면 확대까지만 한다.
 */
export function SigunguPuzzle({
  pieces,
  selected,
  onSelect,
  viewport,
}: {
  pieces: Piece[];
  selected: string | null;
  onSelect?: (id: string) => void;
  /** 지도 영역의 실제 크기(px) — 확대 배율을 화면에 보이는 영역에 맞춘다 */
  viewport: { width: number; height: number };
}) {
  const zoomed = useAfterPaint();
  const split = useAfterPaint(420);
  const [hover, setHover] = useState<string | null>(null);
  const canSplit = pieces.length > 1;

  const b = unionBounds(pieces);
  const bw = b.x1 - b.x0;
  const bh = b.y1 - b.y0;
  const bc = { x: (b.x0 + b.x1) / 2, y: (b.y0 + b.y1) / 2 };
  const fitW = Math.min(viewport.width || MAP_W, MAP_W);
  const fitH = Math.min(viewport.height || MAP_H, MAP_H);
  const k = Math.min((fitW * 0.6) / bw, (fitH * 0.6) / bh, 4);
  const zoomTransform = zoomed
    ? `translate(${MAP_W / 2}px, ${MAP_H / 2}px) scale(${k}) translate(${-bc.x}px, ${-bc.y}px)`
    : "translate(0px, 0px) scale(1) translate(0px, 0px)";

  const active = hover ?? selected;
  const offsets = new Map(
    pieces.map((p) => [
      p.id,
      split && canSplit
        ? explodeOffset(p, bc, SIGUNGU_EXPLODE.k, SIGUNGU_EXPLODE.push)
        : { x: 0, y: 0 },
    ]),
  );

  return (
    <>
      <img
        src={lp5km}
        alt=""
        width={MAP_W}
        height={MAP_H}
        className={`pixelated ${styles.fadeOut}`}
        style={{ opacity: zoomed ? 0 : 1 }}
        draggable={false}
      />
      <svg className={styles.svg} width={MAP_W} height={MAP_H} viewBox={`0 0 ${MAP_W} ${MAP_H}`}>
        <g className={styles.zoomGroup} style={{ transform: zoomTransform }}>
          {pieces.map((p) => (
            <PieceShape
              key={p.id}
              piece={p}
              offset={offsets.get(p.id)!}
              dim={canSplit && active != null && p.id !== active}
              onHover={canSplit ? setHover : undefined}
              onPick={canSplit && onSelect ? () => onSelect(p.id) : undefined}
            />
          ))}
        </g>
      </svg>
      {canSplit && (
        <div className={styles.labels}>
          {pieces.map((p) => {
            const o = offsets.get(p.id)!;
            return (
              <PieceLabel
                key={p.id}
                text={p.label}
                x={MAP_W / 2 + k * (p.cx + o.x - bc.x)}
                y={MAP_H / 2 + k * (p.cy + o.y - bc.y)}
                raised={false}
                dim={active != null && p.id !== active}
                visible={split}
              />
            );
          })}
        </div>
      )}
    </>
  );
}
