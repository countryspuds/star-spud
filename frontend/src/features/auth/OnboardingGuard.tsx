import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useMe } from "./useMe";

/** 온보딩 전 사용자가 가도 되는 곳 */
const ALLOWED = new Set(["/login", "/onboarding"]);

/**
 * 라우트 가드 — specs/08: 첫 로그인(`nickname IS NULL`)이면 온보딩으로 보낸다.
 * 비로그인 사용자는 어디든 둘러볼 수 있다(쓰기만 로그인 요구).
 */
export function OnboardingGuard({ children }: { children: ReactNode }) {
  const me = useMe();
  const { pathname } = useLocation();
  if (me && me.nickname === null && !ALLOWED.has(pathname)) {
    return <Navigate to="/onboarding" replace />;
  }
  return children;
}
