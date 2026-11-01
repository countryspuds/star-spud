import { useEffect, useSyncExternalStore } from "react";
import { useLocation } from "react-router-dom";

/**
 * 직전 라우트 추적 — 문의의 진단 정보("마지막 페이지")용 (명세 §16).
 * Layout에서 한 번 호출한다. pathname이 바뀔 때마다 이전 값을 기억하고 sessionStorage에도 남긴다.
 */
const KEY = "starspud.lastRoute";
let current: string | null = null;
let previous: string | null = null;
const listeners = new Set<() => void>();

export function useTrackRoute(): void {
  const { pathname } = useLocation();
  useEffect(() => {
    if (pathname === current) return;
    previous = current;
    current = pathname;
    try {
      if (previous) sessionStorage.setItem(KEY, previous);
    } catch {
      // 저장이 막힌 환경에서는 메모리만
    }
    listeners.forEach((l) => l());
  }, [pathname]);
}

/** 지금 화면 직전에 보던 경로. 새로 고침 직후에는 sessionStorage 값 */
export function getLastRoute(): string | null {
  if (previous) return previous;
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** 렌더 중에 읽는 직전 라우트 — 추적 effect가 돈 뒤 값이 바뀌면 다시 렌더된다 */
export function useLastRoute(): string | null {
  return useSyncExternalStore(subscribe, getLastRoute, getLastRoute);
}
