import { use } from "react";
import { PillLink } from "../../components/ui/Pill";
import { getMyPotatoes } from "../../data/potatoes";
import type { SpotDetail } from "../../data/spots";
import { useMe } from "../auth/useMe";
import styles from "./spot.module.css";

/** 이미 내 감자가 있으면 "먹이 주기 · Lv{n}" — 등급은 서버 값 */
function MyPotatoCta({ spot }: { spot: SpotDetail }) {
  const mine = use(getMyPotatoes()).find((p) => p.spot.id === spot.id);
  return (
    <PillLink to={`/spots/${spot.id}/plant`} tone="primary" size="lg" className={styles.cta}>
      {mine ? `먹이 주기 · Lv${mine.level}` : "감자 심기"}
    </PillLink>
  );
}

/**
 * 감자 심기 CTA — 명세 §18.1의 4가지 상태.
 * 비로그인 → 로그인(돌아올 곳 포함) · 온보딩 전 → 온보딩 · 감자 없음 → 감자 심기 · 감자 있음 → 먹이 주기.
 * Suspense 안에서 쓴다 (useMe · getMyPotatoes).
 */
export function PlantCta({ spot }: { spot: SpotDetail }) {
  const me = useMe();
  const here = `/spots/${spot.id}`;
  if (!me) {
    return (
      <PillLink to={`/login?next=${encodeURIComponent(here)}`} size="lg" className={styles.cta}>
        로그인하고 감자 심기
      </PillLink>
    );
  }
  if (me.nickname === null) {
    return (
      <PillLink to="/onboarding" size="lg" className={styles.cta}>
        온보딩 마치고 감자 심기
      </PillLink>
    );
  }
  return <MyPotatoCta spot={spot} />;
}
