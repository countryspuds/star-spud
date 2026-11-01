import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useMe } from "./useMe";

/** 온보딩을 마쳐야 들어갈 수 있는 곳 — 프로필(감자밭·설정·감자 상세)과 감자 심기/먹이 주기 */
const REQUIRES_ONBOARDING = ["/me"];
const REQUIRES_ONBOARDING_RE = [/^\/spots\/[^/]+\/plant$/];

/**
 * 라우트 가드 — specs/08: 첫 로그인(`nickname IS NULL`) 사용자는 둘러보기(홈·지도·캘린더 등)는 되지만
 * 감자 심기·후기·프로필은 온보딩을 마쳐야 한다. 비로그인 사용자는 어디든 둘러볼 수 있다(쓰기만 로그인 요구).
 */
export function OnboardingGuard({ children }: { children: ReactNode }) {
  const me = useMe();
  const { pathname } = useLocation();
  const needsOnboarding =
    REQUIRES_ONBOARDING.some((p) => pathname === p || pathname.startsWith(`${p}/`)) ||
    REQUIRES_ONBOARDING_RE.some((re) => re.test(pathname));
  if (me && me.nickname === null && needsOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }
  return children;
}
