import { use } from "react";
import { Link } from "react-router-dom";
import { getTonight } from "../../data";
import { moonPhaseLabel } from "../../lib/moon";
import { fmtHM, sameDay } from "../../lib/time";
import potatoHappy from "../../assets/potato/potato-happy.svg";
import { MoonIcon } from "../gauge/MoonIcon";
import { Card } from "../ui/Card";
import { Tile } from "../ui/Tile";
import styles from "./bento.module.css";

/** 오늘 밤 세부값 (밝은 카드) */
export function TonightDetails({ className }: { className?: string }) {
  const t = use(getTonight());
  const moonsetNextDay = !sameDay(t.moonset, t.astroEnd);

  return (
    <Card variant="light" className={[styles.tonight, className].filter(Boolean).join(" ")}>
      <div className={styles.tonightHead}>
        <img
          src={potatoHappy}
          alt=""
          width={30}
          height={30}
          className={`pixelated ${styles.avatar}`}
        />
        <div className={styles.tonightWhere}>
          <strong>{t.location}</strong>
          <span>{t.basis}</span>
        </div>
        <Link to="/map" className={styles.arrowDark} aria-label="지도에서 오늘 밤 보기">
          ↗
        </Link>
      </div>

      <div className={styles.tiles}>
        <Tile label="구름량" value={`${t.cloudPct}%`} sub="전운량 예보" />
        <Tile
          label="달"
          value={
            <span className={styles.moonValue}>
              {t.moonIllum}%
              <MoonIcon illum={t.moonIllum} waxing={t.waxing} size={18} />
            </span>
          }
          sub={`${moonPhaseLabel(t.moonIllum, t.waxing)} · 월출 ${fmtHM(t.moonrise)}`}
        />
        <Tile
          label="천문박명 끝"
          value={fmtHM(t.astroEnd)}
          sub={`월몰 ${fmtHM(t.moonset)}${moonsetNextDay ? " (내일)" : ""}`}
        />
      </div>

      <p className={`${styles.tonightMeta} tabular`}>
        <span>습도 {t.humidityPct}%</span>
        <span>바람 {t.windMs}m/s</span>
        <span>시정 {t.visibilityKm}km</span>
        <span>기온 {t.tempC}°C</span>
        <span className={styles.exampleDark}>예시 데이터</span>
      </p>
    </Card>
  );
}
