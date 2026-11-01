/**
 * 로그인 상태 — specs/08 `users` 모델.
 * Phase 1: mock. `VITE_MOCK_LOGGED_IN=true`면 온보딩을 마친 예시 사용자, 아니면 비로그인.
 * Phase 2: 같은 시그니처로 `GET /api/v1/me` (401이면 null) 호출로 교체한다.
 */
import type { Me } from "./types";

export type { Me, PotatoAvatar } from "./types";

/** 온보딩을 마친 예시 사용자 */
const MOCK_ME: Me = {
  id: "u_mock",
  nickname: "감자별",
  avatarUrl: null,
  potatoAvatar: "happy",
  homeSido: "gyeongnam",
  email: "st***@kakao.com",
  createdAt: "2026-10-05T12:00:00+09:00",
};

let mePromise: Promise<Me | null> | null = null;

/** 현재 사용자. 비로그인이면 null. 같은 Promise를 돌려주므로 `use()`로 읽어도 된다 */
export function getMe(): Promise<Me | null> {
  mePromise ??= Promise.resolve(import.meta.env.VITE_MOCK_LOGGED_IN === "true" ? MOCK_ME : null);
  return mePromise;
}
