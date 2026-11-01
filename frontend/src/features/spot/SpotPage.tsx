import { Suspense, use, useState } from "react";
import { Link, useParams } from "react-router-dom";
import photoPlaceholder from "../../assets/photo-of-month-placeholder.png";
import potatoSad from "../../assets/potato/potato-sad.svg";
import { Card } from "../../components/ui/Card";
import { ExampleCaption, Label } from "../../components/ui/Label";
import { PillLink } from "../../components/ui/Pill";
import { SIDO, isSidoCode } from "../../data/regions";
import { getSpot, nightDates, type SpotDetail } from "../../data/spots";
import { ConditionChip } from "./ConditionChip";
import { ACCESS, DIRECTION, SPOT_TYPE } from "./labels";
import { PlantCta } from "./PlantCta";
import { SpotPotatoes } from "./SpotPotatoes";
import { TonightHere } from "./TonightHere";
import styles from "./spot.module.css";

/* ── 헤더 ───────────────────────────── */
function SpotHeader({ spot }: { spot: SpotDetail }) {
  const sido = isSidoCode(spot.sido) ? SIDO[spot.sido].short : spot.sido;
  const { carCamping, parking, toilet } = spot.flags;
  return (
    <Card className={styles.head}>
      <div className={styles.headRow}>
        <Label>
          {sido} · {spot.sigungu} · BORTLE {spot.bortle}
        </Label>
        <div className={styles.badges}>
          {spot.source === "ugc" && (
            <span className={styles.badge}>
              사용자 등록 명소{spot.createdBy ? ` · @${spot.createdBy}` : ""}
            </span>
          )}
          {spot.status === "under_review" && <span className={styles.badge}>검토 중</span>}
          <span className={styles.badge}>{SPOT_TYPE[spot.type]}</span>
        </div>
      </div>
      <div className={styles.headRow}>
        <h1 className={styles.h1}>{spot.name}</h1>
        <ConditionChip condition={spot.night.condition} prefix="오늘 밤" />
      </div>
      <p className={`${styles.facts} tabular`}>
        {spot.distanceKm} km · 차박 {carCamping ? "가능" : "불가"} · 주차{" "}
        {parking == null ? "정보 없음" : `${parking}대`} · 화장실 {toilet ? "있음" : "없음"}
      </p>
    </Card>
  );
}

/* ── 사진 ───────────────────────────── */
function PhotoCard({ spot }: { spot: SpotDetail }) {
  const photos = spot.photos.slice(0, 6);
  return (
    <Card variant="glass" className={styles.photos}>
      {photos.length === 0 ? (
        <img src={photoPlaceholder} alt="" className={styles.photoSingle} />
      ) : (
        <div className={styles.mosaic}>
          {photos.map((src, i) => (
            <img key={i} src={src} alt="" loading="lazy" />
          ))}
        </div>
      )}
      <span className={styles.photoCaption}>
        {photos.length === 0 ? "기본 이미지" : `공개 감자 기록 사진 ${photos.length}장`} ·{" "}
        <ExampleCaption />
      </span>
    </Card>
  );
}

/* ── 정보 표 ─────────────────────────── */
function InfoCard({ spot }: { spot: SpotDetail }) {
  const rows: [string, string][] = [
    ["접근성", spot.access.map((a) => ACCESS[a]).join(" · ")],
    ["포장도로", spot.paved ? "끝까지 포장" : "마지막 구간 비포장"],
    [
      "시야 개방",
      `${spot.horizonDirs.map((d) => DIRECTION[d]).join("·")} 열림 · 지평선 고도 ${spot.horizonAlt}°`,
    ],
    ["설명", spot.description],
  ];
  return (
    <Card variant="glass" className={styles.info}>
      <Label>정보</Label>
      <dl className={styles.table}>
        {rows.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

/* ── 없는 명소 (specs/01: hidden 명소도 404) ── */
function NotFound() {
  return (
    <Card className={styles.notFound}>
      <img src={potatoSad} alt="" width={120} height={120} className="pixelated" />
      <Label>NOT FOUND</Label>
      <h1 className={styles.notFoundTitle}>이 명소는 찾을 수 없어요</h1>
      <p className={styles.notFoundBody}>주소가 틀렸거나, 비공개 처리된 명소예요.</p>
      <PillLink to="/map" tone="primary">
        지도로 가기
      </PillLink>
    </Card>
  );
}

function SpotBody({ id }: { id: string }) {
  // 오늘·내일·모레 날짜는 처음 그릴 때 정해 둔다 — 탭을 오가도 같은 밤을 가리킨다
  const [dates] = useState(nightDates);
  const spot = use(getSpot(id, dates[0]));
  if (!spot) return <NotFound />;

  return (
    <div className={styles.page}>
      <Link to="/map" className={styles.back}>
        ← 지도로
      </Link>
      <SpotHeader spot={spot} />
      <div className={styles.grid}>
        <div className={styles.left}>
          <PhotoCard spot={spot} />
          <InfoCard spot={spot} />
        </div>
        <TonightHere spot={spot} dates={dates} />
      </div>
      <Suspense fallback={null}>
        <SpotPotatoes spot={spot} />
      </Suspense>
      {/* 모바일: 감자 심기 CTA 하단 고정 바 (명세 §18.1) */}
      <div className={styles.mobileBar}>
        <Suspense fallback={null}>
          <PlantCta spot={spot} />
        </Suspense>
      </div>
    </div>
  );
}

/** `/spots/:id` 명소 상세 — 명세 §18.1 */
export function SpotPage() {
  const { id = "" } = useParams();
  return (
    <Suspense fallback={null}>
      <SpotBody key={id} id={id} />
    </Suspense>
  );
}
