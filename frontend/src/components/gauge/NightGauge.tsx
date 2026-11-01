import type { CSSProperties } from "react";
import type { NightTimes } from "../../data/types";
import { axisPct, darkWindow, gaugeAxis, moonSpans } from "../../lib/night";
import { fmtDuration, fmtHM, fmtMDW, sameDay, toMs } from "../../lib/time";
import { Card } from "../ui/Card";
import { ExampleCaption, Label } from "../ui/Label";
import { MoonIcon } from "./MoonIcon";
import styles from "./gauge.module.css";

/** 가장자리 근처 라벨은 안쪽으로 정렬 */
function anchorStyle(p: number): CSSProperties {
  const shift = p < 6 ? "0%" : p > 94 ? "-100%" : "-50%";
  return { left: `${p}%`, transform: `translateX(${shift})` };
}

interface Props {
  times: NightTimes;
  place: string;
  /** 소형(명세 §18.1): 카드·헤더·범례 없이 눈금 + 바 + 달 라벨만, 높이 약 60px */
  compact?: boolean;
}

/** 오늘 밤 게이지 바 — 명세 §4.4 */
export function NightGauge({ times, place, compact = false }: Props) {
  const axis = gaugeAxis(times);
  const P = (iso: string) => axisPct(toMs(iso), axis);

  const stops = [
    ["#5a6b8c", 0],
    ["#3b4a6b", P(times.sunset)],
    ["#0f131b", P(times.astroEnd)],
    ["#0f131b", P(times.astroStart)],
    ["#3b4a6b", P(times.sunrise)],
    ["#5a6b8c", 100],
  ] as const;
  const gradient = `linear-gradient(90deg, ${stops.map(([c, p]) => `${c} ${p}%`).join(", ")})`;

  const ticks = [
    { label: "일몰", iso: times.sunset },
    { label: "박명 끝", iso: times.astroEnd },
    { label: "박명 시작", iso: times.astroStart },
    { label: "일출", iso: times.sunrise },
  ];

  const moon = moonSpans(times, axis);
  const riseMs = toMs(times.moonrise);
  const setMs = toMs(times.moonset);
  const riseVisible = riseMs >= axis.from && riseMs <= axis.to;
  const firstMoon = moon[0];
  const lastMoon = moon[moon.length - 1];

  const nowMs = toMs(times.now);
  const nowVisible = nowMs >= axis.from && nowMs <= axis.to;
  const nowP = axisPct(nowMs, axis);

  const dark = darkWindow(times);
  const answer = dark
    ? `달 없는 완전한 밤 ${fmtHM(dark.from)} ~ ${fmtHM(dark.to)} (${fmtDuration(dark.to - dark.from)})`
    : "오늘 밤은 달 없는 어두운 시간이 없어요";

  const setLabel = `월몰 ${fmtHM(times.moonset)}${sameDay(times.moonset, times.sunset) ? "" : " (내일)"}`;

  const ticksRow = (
    <div className={styles.ticks}>
      {ticks.map((t) => (
        <div key={t.label} className={styles.tick} style={{ left: `${P(t.iso)}%` }}>
          <span className={styles.tickLabel} style={anchorStyle(P(t.iso))}>
            <span>{t.label}</span>
            <span>{fmtHM(t.iso)}</span>
          </span>
        </div>
      ))}
    </div>
  );

  const bar = (
    <div className={styles.bar} style={{ background: gradient }}>
      {moon.map((m) => (
        <span
          key={m.from}
          className={styles.moonSeg}
          style={{
            left: `${axisPct(m.from, axis)}%`,
            width: `${axisPct(m.to, axis) - axisPct(m.from, axis)}%`,
          }}
        />
      ))}
      {nowVisible && <span className={styles.nowLine} style={{ left: `${nowP}%` }} />}
    </div>
  );

  const moonLabels = (
    <div className={styles.below}>
      {riseVisible && (
        <span className={styles.moonLabel} style={anchorStyle(axisPct(riseMs, axis))}>
          월출 {fmtHM(times.moonrise)}
        </span>
      )}
      {lastMoon && (
        <span
          className={styles.moonLabel}
          style={anchorStyle(axisPct(Math.min(setMs, lastMoon.to), axis))}
        >
          {setLabel}
        </span>
      )}
    </div>
  );

  if (compact) {
    return (
      <div className={styles.compact} role="img" aria-label={answer}>
        <div className={styles.track}>
          {ticksRow}
          {bar}
          {moonLabels}
        </div>
      </div>
    );
  }

  return (
    <Card variant="glass" className={styles.gauge}>
      <div className={styles.head}>
        <div className={styles.headLeft}>
          <h2 className={styles.title}>오늘 밤</h2>
          <Label>
            {fmtMDW(times.sunset)} → {fmtMDW(times.sunrise)} · {place} 기준
          </Label>
        </div>
        <p className={styles.answer}>{answer}</p>
      </div>

      <div className={styles.scroller}>
        <div className={styles.track}>
          {ticksRow}

          {/* 달 아이콘 · 지금 ▲ */}
          <div className={styles.above}>
            {firstMoon && (
              <span
                className={styles.moonIcon}
                style={{ left: `${axisPct(firstMoon.from, axis)}%` }}
              >
                <MoonIcon illum={times.moonIllum} waxing={times.waxing} size={24} />
              </span>
            )}
            {nowVisible && (
              <span className={styles.nowCaret} style={{ left: `${nowP}%` }} aria-hidden="true">
                ▲
              </span>
            )}
          </div>

          {bar}
          {moonLabels}

          {/* 지금 라벨 */}
          <div className={styles.below}>
            {nowVisible && (
              <span className={styles.nowLabel} style={anchorStyle(nowP)}>
                지금 {fmtHM(times.now)}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className={styles.legend}>
        <span>
          <i className={styles.legendSky} style={{ background: gradient }} /> 하늘 어둠 (일몰 →
          천문박명)
        </span>
        <span>
          <i className={styles.legendMoon} /> 달이 떠 있는 시간
        </span>
        <span>
          <i className={styles.legendNow} /> 지금
        </span>
        <ExampleCaption className={styles.legendExample} />
      </div>
    </Card>
  );
}
