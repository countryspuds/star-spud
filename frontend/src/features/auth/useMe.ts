import { use, useSyncExternalStore } from "react";
import { getMe, subscribeMe, type Me } from "../../data/auth";

/** 현재 사용자 — 로그인·온보딩·로그아웃이 일어나면 다시 렌더된다. Suspense 안에서 쓴다 */
export function useMe(): Me | null {
  const promise = useSyncExternalStore(subscribeMe, getMe, getMe);
  return use(promise);
}
