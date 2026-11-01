import type { ReactNode } from "react";
import { Navigate, matchPath, useLocation } from "react-router-dom";
import { useMe } from "./useMe";

/**
 * 온보딩을 마쳐야 들어갈 수 있는 곳 — 프로필(감자밭·설정·감자 상세)·알림함·감자 심기/먹이 주기.
 * 라우터와 같은 `matchPath`로 비교한다 — 대소문자(`/NOTIFICATIONS`)와 끝의 "/"(`/me/`)를 라우터가 받아들이는
 * 그대로 받아들여, 문자열 비교로는 새는 주소가 없게 한다.
 */
const REQUIRES_ONBOARDING = ["/me/*", "/notifications/*", "/spots/:id/plant"];

/**
 * 라우트 가드 — specs/08: 첫 로그인(`nickname IS NULL`) 사용자는 둘러보기(홈·지도·캘린더 등)는 되지만
 * 감자 심기·후기·프로필은 온보딩을 마쳐야 한다. 비로그인 사용자는 어디든 둘러볼 수 있다(쓰기만 로그인 요구).
 */
export function OnboardingGuard({ children }: { children: ReactNode }) {
  const me = useMe();
  const { pathname } = useLocation();
  const needsOnboarding = REQUIRES_ONBOARDING.some((pattern) => matchPath(pattern, pathname));
  if (me && me.nickname === null && needsOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }
  return children;
}
