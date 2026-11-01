/**
 * 로그인 상태 — specs/08 `users` 모델.
 * Phase 1: mock. 우선순위는 (1) 이 탭의 mock 세션(sessionStorage) → (2) `VITE_MOCK_LOGGED_IN=true`면 온보딩을 마친 예시 사용자 → (3) 비로그인.
 * Phase 2: 같은 시그니처로 `/api/v1/auth/*`·`/api/v1/me*` 호출로 교체한다.
 */
import type { Me, NotificationSettings, OnboardingInput, UpdateMeInput } from "./types";

export type {
  Me,
  NotificationSettings,
  OnboardingInput,
  PotatoAvatar,
  UpdateMeInput,
} from "./types";

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
  nicknameChangedAt: "2026-10-05",
  nicknameChangeableAt: "2026-11-04",
  canChangeNickname: false,
};

/** mock 알림 설정 기본값 */
const MOCK_NOTIFICATION_SETTINGS: NotificationSettings = {
  meteorPeak: true,
  newMoonWindow: false,
  potatoHungry: true,
  postComment: false,
  highIndex: true,
};

const toDateStr = (d: Date) => d.toISOString().slice(0, 10);
const plusDays = (d: Date, n: number) => new Date(d.getTime() + n * 86_400_000);

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
  const now = new Date();
  setMe({
    id: `u_${now.getTime().toString(36)}`,
    nickname: null,
    avatarUrl: null,
    potatoAvatar: "basic",
    homeSido: null,
    email: "st***@kakao.com",
    createdAt: now.toISOString(),
    nicknameChangedAt: toDateStr(now),
    nicknameChangeableAt: toDateStr(now),
    canChangeNickname: true,
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
  const now = new Date();
  const next: Me = {
    ...me,
    nickname: input.nickname,
    potatoAvatar: input.potatoAvatar,
    homeSido: input.homeSido,
    // 온보딩에서 정한 닉네임도 30일 규칙의 시작점 — 서버가 판정
    nicknameChangedAt: toDateStr(now),
    nicknameChangeableAt: toDateStr(plusDays(now, 30)),
    canChangeNickname: false,
  };
  setMe(next);
  return next;
}

/** 프로필 수정 — TODO(Phase 2): PATCH /api/v1/me */
export async function updateMe(input: UpdateMeInput): Promise<Me> {
  const me = await getMe();
  if (!me) throw new Error("LOGIN_REQUIRED");
  const next: Me = { ...me };
  if (input.potatoAvatar !== undefined) next.potatoAvatar = input.potatoAvatar;
  if (input.homeSido !== undefined) next.homeSido = input.homeSido;
  if (input.nickname !== undefined && input.nickname !== me.nickname) {
    if (!me.canChangeNickname) throw new Error("NICKNAME_CHANGE_TOO_SOON");
    const now = new Date();
    next.nickname = input.nickname;
    next.nicknameChangedAt = toDateStr(now);
    next.nicknameChangeableAt = toDateStr(plusDays(now, 30));
    next.canChangeNickname = false;
  }
  setMe(next);
  return next;
}

/** 로그아웃 — TODO(Phase 2): POST /api/v1/auth/logout (refresh 폐기) */
export async function logout(): Promise<void> {
  setMe(null);
}

/** 회원 탈퇴 — specs/08: 즉시 삭제. TODO(Phase 2): DELETE /api/v1/me */
export async function deleteMe(): Promise<void> {
  notificationSettings = { ...MOCK_NOTIFICATION_SETTINGS };
  setMe(null);
}

// ── 알림 설정 (mock은 메모리에만) ──────────────────────
let notificationSettings: NotificationSettings = { ...MOCK_NOTIFICATION_SETTINGS };
let notificationPromise: Promise<NotificationSettings> | null = null;

/** TODO(Phase 2): GET /api/v1/me/notification-settings */
export function getNotificationSettings(): Promise<NotificationSettings> {
  notificationPromise ??= Promise.resolve(notificationSettings);
  return notificationPromise;
}

/** TODO(Phase 2): PATCH /api/v1/me/notification-settings */
export async function updateNotificationSettings(
  patch: Partial<NotificationSettings>,
): Promise<NotificationSettings> {
  notificationSettings = { ...notificationSettings, ...patch };
  notificationPromise = Promise.resolve(notificationSettings);
  return notificationSettings;
}
