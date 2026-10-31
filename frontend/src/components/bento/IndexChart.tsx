import { use } from "react";
import { getIndex10d } from "../../data";
import { useElementSize } from "../../lib/useElementSize";
import { Card } from "../ui/Card";
import { ExampleCaption, Label } from "../ui/Label";
import styles from "./bento.module.css";

const CHART_H = 150;
const PAD = { top: 18, right: 14, bottom: 20, left: 28 };

function describe(score: number): string {
  if (score >= 70) return "별 보기 좋은 밤이에요";
  if (score >= 40) return "그럭저럭 볼 만한 밤이에요";
  return "달과 구름 때문에 아쉬운 밤이에요";
}

/** 별보기 지수 · 10일 라인차트 (직접 그린 SVG) */
export function IndexChart({ className }: { className?: string }) {
  const { days } = use(getIndex10d());
  const [ref, { width }] = useElementSize<HTMLDivElement>();
  const today = days[0];

  const plotW = Math.max(0, width - PAD.left - PAD.right);
  const plotH = CHART_H - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (days.length > 1 ? (plotW * i) / (days.length - 1) : 0);
  const y = (v: number) => PAD.top + plotH * (1 - v / 100);

  const line = days.map((d, i) => `${i ? "L" : "M"}${x(i)},${y(d.score)}`).join("");
  const area = `${line}L${x(days.length - 1)},${y(0)}L${x(0)},${y(0)}Z`;
  const last = days.length - 1;
  // 좁은 폭에선 날짜 라벨을 하나 걸러 표시
  const labelEvery = days.length > 1 && plotW / (days.length - 1) < 36 ? 2 : 1;

  return (
    <Card variant="glass" className={[styles.index, className].filter(Boolean).join(" ")}>
      <div className={styles.indexHead}>
        <div className={styles.indexTitles}>
          <h2 className={styles.cardTitle}>별보기 지수 · 10일</h2>
          <Label>구름 40 · 달 30 · 시정 15 · 이벤트 15</Label>
        </div>
        <div className={styles.indexToday}>
          <span className={`${styles.bigNum} tabular`}>{today.score}</span>
          <span className={styles.indexDesc}>
            오늘 · {describe(today.score)} <ExampleCaption />
          </span>
        </div>
      </div>

      <div ref={ref} className={styles.chart}>
        {width > 0 && (
          <svg width={width} height={CHART_H} role="img" aria-label="10일 별보기 지수 추이">
            <defs>
              <linearGradient id="index-area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#cfd6e2" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#cfd6e2" stopOpacity="0" />
              </linearGradient>
            </defs>

            {[0, 50, 100].map((v) => (
              <g key={v}>
                <line
                  x1={PAD.left}
                  x2={PAD.left + plotW}
                  y1={y(v)}
                  y2={y(v)}
                  stroke="rgba(255,255,255,.08)"
                />
                <text x={PAD.left - 8} y={y(v) + 3} textAnchor="end" className={styles.axis}>
                  {v}
                </text>
              </g>
            ))}

            {days.map((d, i) =>
              d.event ? (
                <g key={`ev-${d.date}`}>
                  <line
                    x1={x(i)}
                    x2={x(i)}
                    y1={PAD.top - 4}
                    y2={y(0)}
                    stroke="var(--lime)"
                    strokeDasharray="3 3"
                  />
                  <text
                    x={x(i)}
                    y={PAD.top - 8}
                    textAnchor={i > last - 2 ? "end" : i < 2 ? "start" : "middle"}
                    className={styles.eventLabel}
                  >
                    {d.event}
                  </text>
                </g>
              ) : null,
            )}

            <path d={area} fill="url(#index-area)" />
            <path d={line} fill="none" stroke="#cfd6e2" strokeWidth={1.5} />

            {days.map((d, i) => (
              <g key={d.date}>
                <circle
                  cx={x(i)}
                  cy={y(d.score)}
                  r={3.2}
                  fill={i === last ? "var(--lime)" : "#cfd6e2"}
                >
                  <title>{`${d.date} · ${d.score}`}</title>
                </circle>
                {i % labelEvery === 0 && (
                  <text x={x(i)} y={CHART_H - 4} textAnchor="middle" className={styles.axis}>
                    {d.date}
                  </text>
                )}
              </g>
            ))}
          </svg>
        )}
      </div>
    </Card>
  );
}
