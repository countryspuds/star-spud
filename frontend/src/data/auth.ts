/**
 * 로그인 상태 — specs/08 `users` 모델.
 * Phase 1: mock. 우선순위는 (1) 이 탭의 mock 세션(sessionStorage) → (2) `VITE_MOCK_LOGGED_IN=true`면 온보딩을 마친 예시 사용자 → (3) 비로그인.
 * Phase 2: 같은 시그니처로 `/api/v1/auth/*`·`/api/v1/me*` 호출로 교체한다.
 */
import type { Me, OnboardingInput } from "./types";

export type { Me, OnboardingInput, PotatoAvatar } from "./types";

/** 백엔드 주소. 비어 있으면 mock만 쓴다 (Phase 1 기본) */
const API_BASE: string = import.meta.env.VITE_API_BASE ?? "";

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

/** mock에서 "별감자"만 이미 쓰는 닉네임으로 취급한다 */
const MOCK_TAKEN_NICKNAMES = new Set(["별감자"]);

// ── mock 세션 (이 탭에서만 유지) ──────────────────────────
const SESSION_KEY = "starspud.mockMe";

function readSession(): Me | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Me) : null;
  } catch {
    return null;
  }
}

function writeSession(me: Me | null): void {
  try {
    if (me) sessionStorage.setItem(SESSION_KEY, JSON.stringify(me));
    else sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // 저장이 막힌 환경(시크릿 창 등)에서는 메모리에서만 유지
  }
}

function initialMe(): Me | null {
  return readSession() ?? (import.meta.env.VITE_MOCK_LOGGED_IN === "true" ? MOCK_ME : null);
}

// ── 구독 가능한 현재 사용자 ──────────────────────────────
let mePromise: Promise<Me | null> | null = null;
const listeners = new Set<() => void>();

function setMe(me: Me | null): void {
  writeSession(me);
  mePromise = Promise.resolve(me);
  listeners.forEach((l) => l());
}

/** 현재 사용자. 비로그인이면 null. 같은 Promise를 돌려주므로 `use()`로 읽어도 된다 */
export function getMe(): Promise<Me | null> {
  mePromise ??= Promise.resolve(initialMe());
  return mePromise;
}

/** 로그인·온보딩·로그아웃으로 사용자가 바뀌면 알림 (useSyncExternalStore용) */
export function subscribeMe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// ── 흐름 ───────────────────────────────────────────────
/**
 * 카카오 로그인 시작 — specs/08: `GET /api/v1/auth/kakao/login?next=`로 이동(서버가 제공자 페이지로 리다이렉트).
 * 백엔드가 없으면 mock: 온보딩 전(nickname null) 사용자를 세션에 만들고 true를 돌려준다 → 호출한 쪽이 /onboarding으로 보낸다.
 */
export function loginWithKakao(next: string): boolean {
  if (API_BASE) {
    window.location.assign(`${API_BASE}/api/v1/auth/kakao/login?next=${encodeURIComponent(next)}`);
    return false;
  }
  setMe({
    id: `u_${Date.now().toString(36)}`,
    nickname: null,
    avatarUrl: null,
    potatoAvatar: "basic",
    homeSido: null,
    email: "st***@kakao.com",
    createdAt: new Date().toISOString(),
  });
  return true;
}

/** 닉네임 중복 확인 — TODO(Phase 2): GET /api/v1/users/nickname-check?v= */
export async function checkNickname(v: string): Promise<{ available: boolean }> {
  await new Promise((r) => setTimeout(r, 150)); // 네트워크 흉내
  return { available: !MOCK_TAKEN_NICKNAMES.has(v) };
}

/** 온보딩 완료 — TODO(Phase 2): POST /api/v1/me/onboarding */
export async function completeOnboarding(input: OnboardingInput): Promise<Me> {
  const me = await getMe();
  if (!me) throw new Error("LOGIN_REQUIRED");
  const next: Me = {
    ...me,
    nickname: input.nickname,
    potatoAvatar: input.potatoAvatar,
    homeSido: input.homeSido,
  };
  setMe(next);
  return next;
}
