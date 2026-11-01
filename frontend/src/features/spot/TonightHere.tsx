import { Suspense, use, useState, useTransition } from "react";
import { MoonIcon } from "../../components/gauge/MoonIcon";
import { NightGauge } from "../../components/gauge/NightGauge";
import { Card } from "../../components/ui/Card";
import { ExampleCaption, Label } from "../../components/ui/Label";
import { PillAnchor, PillButton } from "../../components/ui/Pill";
import { Tile } from "../../components/ui/Tile";
import { getSpot, type SpotDetail } from "../../data/spots";
import { IS_MOBILE, kakaoRouteWeb, openKakaoRouteApp } from "../../lib/kakaoRoute";
import { moonPhaseLabel } from "../../lib/moon";
import { fmtHM, sameDay } from "../../lib/time";
import { ConditionChip } from "./ConditionChip";
import { PlantCta } from "./PlantCta";
import styles from "./spot.module.css";

const TAB_LABELS = ["오늘", "내일", "모레"] as const;

/** "2026-11-01" → "11.1" */
const fmtMD = (ymd: string) => `${Number(ymd.slice(5, 7))}.${Number(ymd.slice(8, 10))}`;

/** 선택한 밤의 판정·이유·타일·소형 게이지 — 값은 모두 서버(mock) 응답 그대로 */
function NightBlock({ id, date }: { id: string; date: string }) {
  const detail = use(getSpot(id, date));
  if (!detail) return null;
  const n = detail.night;
  const t = n.times;
  const moonriseNextDay = !sameDay(t.moonrise, t.sunset);

  return (
    <>
      <div className={styles.verdict}>
        <ConditionChip condition={n.condition} large />
        <p className={styles.reason}>{n.reason}</p>
      </div>
      <div className={styles.tiles}>
        <Tile
          label="구름량"
          value={n.cloudPct == null ? "—" : `${n.cloudPct}%`}
          sub={n.cloudPct == null ? "예보 없음" : "관측 창 평균"}
        />
        <Tile
          label="달"
          value={
            <span className={styles.moonValue}>
              {t.moonIllum}%
              <MoonIcon illum={t.moonIllum} waxing={t.waxing} size={18} />
            </span>
          }
          sub={`${moonPhaseLabel(t.moonIllum, t.waxing)} · 월출 ${fmtHM(t.moonrise)}${moonriseNextDay ? " (내일)" : ""}`}
        />
        <Tile
          label="천문박명 끝"
          value={fmtHM(t.astroEnd)}
          sub={`박명 시작 ${fmtHM(t.astroStart)}`}
        />
      </div>
      <NightGauge times={t} place={detail.sigungu} compact />
    </>
  );
}

/** 길찾기 — specs/05: 모바일은 앱 스킴(+폴백), 데스크톱은 웹 길찾기 새 탭 */
function RouteButton({ spot }: { spot: SpotDetail }) {
  if (IS_MOBILE) {
    return (
      <PillButton tone="primary" onClick={() => openKakaoRouteApp(spot)}>
        길찾기
      </PillButton>
    );
  }
  return (
    <PillAnchor
      tone="primary"
      href={kakaoRouteWeb(spot.name, spot.lat, spot.lng)}
      target="_blank"
      rel="noreferrer"
    >
      길찾기
    </PillAnchor>
  );
}

/** "오늘 밤 이곳" 카드 — 날짜 탭(오늘/내일/모레) + 판정 + 길찾기 + 감자 심기 CTA (명세 §18.1) */
export function TonightHere({ spot, dates }: { spot: SpotDetail; dates: readonly string[] }) {
  const [tab, setTab] = useState(0);
  // 탭 전환은 새 날짜의 Promise를 기다리는 동안 이전 내용을 그대로 두는 transition
  const [pending, startTransition] = useTransition();

  return (
    <Card variant="glass" className={styles.tonight}>
      <div className={styles.tonightHead}>
        <Label>오늘 밤 이곳</Label>
        <div className={styles.tabs} role="tablist" aria-label="날짜">
          {TAB_LABELS.map((label, i) => (
            <button
              key={label}
              type="button"
              role="tab"
              aria-selected={tab === i}
              className={tab === i ? styles.tabOn : styles.tab}
              onClick={() => startTransition(() => setTab(i))}
            >
              {label}
              <span className={styles.tabDate}>{fmtMD(dates[i])}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.night} data-pending={pending}>
        <Suspense fallback={null}>
          <NightBlock id={spot.id} date={dates[tab]} />
        </Suspense>
      </div>

      <div className={styles.actions}>
        <RouteButton spot={spot} />
        <PillButton disabled title="Phase 2에 열려요" aria-disabled="true">
          명소 저장
        </PillButton>
      </div>
      <div className={styles.ctaDesktop}>
        <Suspense fallback={null}>
          <PlantCta spot={spot} />
        </Suspense>
      </div>
      <ExampleCaption className={styles.caption} />
    </Card>
  );
}
