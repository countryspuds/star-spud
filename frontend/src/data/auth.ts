/**
 * 로그인 상태 — specs/08 `users` 모델.
 * Phase 1: mock. 우선순위는 (1) 이 탭의 mock 세션(sessionStorage) → (2) `VITE_MOCK_LOGGED_IN=true`면 온보딩을 마친 예시 사용자 → (3) 비로그인.
 * Phase 2: 같은 시그니처로 `/api/v1/auth/*`·`/api/v1/me*` 호출로 교체한다.
 */
import type {
  AuthProvider,
  Me,
  NotificationSettings,
  OnboardingInput,
  UpdateMeInput,
} from "./types";

export type {
  AuthProvider,
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
  providers: ["kakao"],
  nickname: "감자별",
  avatarUrl: null,
  potatoAvatar: "happy",
  homeSido: "gyeongnam",
  email: "st***@kakao.com",
  emailLogin: null,
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

const REMEMBER_KEY = "starspud.mockMeRemember";

/** 로그인 유지로 저장된 사용자가 같은 계정이면 최신 정보로 덮어쓴다 — 새 탭에서도 바뀐 지역·아바타가 보인다 */
function syncRemembered(me: Me): void {
  try {
    const remembered = parseMe(localStorage.getItem(REMEMBER_KEY));
    if (remembered && remembered.id === me.id) {
      localStorage.setItem(REMEMBER_KEY, JSON.stringify(me));
    }
  } catch {
    // 저장이 막힌 환경에서는 그냥 넘어간다
  }
}

/** 저장된 사용자 — 예전 저장분에 providers가 없으면 카카오로 본다 */
function parseMe(raw: string | null): Me | null {
  if (!raw) return null;
  const me = JSON.parse(raw) as Partial<Me> & Pick<Me, "id">;
  return { providers: ["kakao"], emailLogin: null, ...me } as Me;
}

function readSession(): Me | null {
  try {
    return (
      parseMe(sessionStorage.getItem(SESSION_KEY)) ?? parseMe(localStorage.getItem(REMEMBER_KEY))
    );
  } catch {
    return null;
  }
}

function writeSession(me: Me | null): void {
  try {
    if (me) sessionStorage.setItem(SESSION_KEY, JSON.stringify(me));
    else {
      sessionStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(REMEMBER_KEY);
    }
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
  // 온보딩·프로필·계정 연결로 바뀐 사용자 정보를 이메일 계정 저장소와 로그인 유지 저장분에도 반영
  if (me) {
    syncAccount(me);
    syncRemembered(me);
  }
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
    providers: ["kakao"],
    nickname: null,
    avatarUrl: null,
    potatoAvatar: "basic",
    homeSido: null,
    email: "st***@kakao.com",
    emailLogin: null,
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
  // 탈퇴한 사용자의 로그인 수단도 지운다 — 같은 이메일·비밀번호로 다시 들어올 수 없다 (specs/08 즉시 삭제)
  const me = await getMe();
  if (me) removeAccounts(me.id);
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

// ── Phase 2: 이메일 로그인·가입·재설정·계정 연결 (ADR-0014) ──────────
/**
 * mock 규칙: 이 탭에서 /signup으로 가입한 이메일과 시드 계정(`gamja@example.com` / `gamja1234`)만 로그인된다.
 * 비밀번호는 저장하지 않고 SHA-256 해시만 sessionStorage에 둔다. 인증코드는 6자리면 통과, "000000"만 틀린 코드.
 * TODO(Phase 2 백엔드): POST /api/v1/auth/email/{code,verify,signup,login,reset} · POST /api/v1/me/identities
 */
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** 비밀번호 규칙 — 8자 이상 + 영문 + 숫자 */
export const PASSWORD_RE = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
export const CODE_LENGTH = 6;
export const CODE_RESEND_SEC = 60;
export const RESET_LINK_MINUTES = 30;

const SEED_EMAIL = "gamja@example.com";
const SEED_PASSWORD = "gamja1234";
/** 소셜 전용으로 가입된 이메일 — 재설정 요청 시 "카카오로 로그인하세요" 안내 */
const SOCIAL_ONLY_EMAILS: Record<string, AuthProvider> = { "star@kakao.com": "kakao" };

const SEED_ME: Me = {
  id: "u_email_seed",
  providers: ["email"],
  nickname: "메일감자",
  avatarUrl: null,
  potatoAvatar: "basic",
  homeSido: "gangwon",
  email: "ga***@example.com",
  emailLogin: "ga***@example.com",
  createdAt: "2026-10-20T09:00:00+09:00",
  nicknameChangedAt: "2026-10-20",
  nicknameChangeableAt: "2026-11-19",
  canChangeNickname: false,
};

interface EmailAccount {
  email: string;
  hash: string;
  me: Me;
}
const ACCOUNTS_KEY = "starspud.mockEmailAccounts";

function readAccounts(): EmailAccount[] {
  try {
    const raw = sessionStorage.getItem(ACCOUNTS_KEY);
    return raw ? (JSON.parse(raw) as EmailAccount[]) : [];
  } catch {
    return [];
  }
}

function writeAccounts(list: EmailAccount[]): void {
  try {
    sessionStorage.setItem(ACCOUNTS_KEY, JSON.stringify(list));
  } catch {
    // 메모리에서만 유지
  }
}

/** 같은 id의 계정 항목에 최신 사용자 정보를 덮어쓴다 (이메일 수단이 있는 사용자만 저장돼 있다) */
function syncAccount(me: Me): void {
  const list = readAccounts();
  if (!list.some((a) => a.me.id === me.id)) return;
  writeAccounts(list.map((a) => (a.me.id === me.id ? { ...a, me } : a)));
}

function removeAccounts(userId: string): void {
  const list = readAccounts();
  if (list.some((a) => a.me.id === userId)) writeAccounts(list.filter((a) => a.me.id !== userId));
}

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

const normalizeEmail = (email: string) => email.trim().toLowerCase();
/** "gamja@example.com" → "ga***@example.com" */
export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  return `${local.slice(0, 2)}***@${domain}`;
}

function emailTaken(email: string): boolean {
  return (
    email === SEED_EMAIL ||
    email in SOCIAL_ONLY_EMAILS ||
    readAccounts().some((a) => a.email === email)
  );
}

/** 인증코드 발송 — 가입용. 이미 쓰는 이메일이면 EMAIL_TAKEN */
export async function requestEmailCode(email: string): Promise<{ resendAfterSec: number }> {
  const e = normalizeEmail(email);
  if (!EMAIL_RE.test(e)) throw new Error("EMAIL_INVALID");
  if (emailTaken(e)) throw new Error("EMAIL_TAKEN");
  await new Promise((r) => setTimeout(r, 300));
  return { resendAfterSec: CODE_RESEND_SEC };
}

/** 인증코드 확인 — mock은 6자리 숫자면 통과, "000000"은 CODE_INVALID */
export async function verifyEmailCode(email: string, code: string): Promise<void> {
  await new Promise((r) => setTimeout(r, 200));
  if (!/^\d{6}$/.test(code) || code === "000000") throw new Error("CODE_INVALID");
  void email;
}

/** 이메일 가입 — 온보딩 전(nickname null) 사용자를 만들고 로그인시킨다 → /onboarding */
export async function signupWithEmail(email: string, password: string): Promise<Me> {
  const e = normalizeEmail(email);
  if (!EMAIL_RE.test(e)) throw new Error("EMAIL_INVALID");
  if (!PASSWORD_RE.test(password)) throw new Error("PASSWORD_WEAK");
  if (emailTaken(e)) throw new Error("EMAIL_TAKEN");
  const now = new Date();
  const me: Me = {
    id: `u_${now.getTime().toString(36)}`,
    providers: ["email"],
    nickname: null,
    avatarUrl: null,
    potatoAvatar: "basic",
    homeSido: null,
    email: maskEmail(e),
    emailLogin: maskEmail(e),
    createdAt: now.toISOString(),
    nicknameChangedAt: toDateStr(now),
    nicknameChangeableAt: toDateStr(now),
    canChangeNickname: true,
  };
  writeAccounts([...readAccounts(), { email: e, hash: await sha256(password), me }]);
  setMe(me);
  return me;
}

/** 이메일 로그인 — 틀리면 INVALID_CREDENTIALS(이메일·비밀번호 중 무엇이 틀렸는지는 알리지 않는다) */
export async function loginWithEmail(
  email: string,
  password: string,
  remember: boolean,
): Promise<Me> {
  const e = normalizeEmail(email);
  await new Promise((r) => setTimeout(r, 300));
  let me: Me | null = null;
  if (e === SEED_EMAIL && password === SEED_PASSWORD) me = SEED_ME;
  else {
    const hash = await sha256(password);
    // 계정 저장소의 me는 setMe가 늘 최신으로 맞춰 둔다 (온보딩 완료·프로필·연결 상태 포함)
    const acc = readAccounts().find((a) => a.email === e && a.hash === hash);
    if (acc) me = acc.me;
  }
  if (!me) throw new Error("INVALID_CREDENTIALS");
  setMe(me);
  if (remember) {
    try {
      localStorage.setItem(REMEMBER_KEY, JSON.stringify(me));
    } catch {
      // 무시
    }
  }
  return me;
}

/** 비밀번호 재설정 링크 — 존재 여부는 알리지 않는다. 소셜 전용 계정이면 그 수단을 돌려줘 안내한다 */
export async function requestPasswordReset(
  email: string,
): Promise<{ sent: true; validMinutes: number; socialOnly: AuthProvider | null }> {
  const e = normalizeEmail(email);
  if (!EMAIL_RE.test(e)) throw new Error("EMAIL_INVALID");
  await new Promise((r) => setTimeout(r, 300));
  return {
    sent: true,
    validMinutes: RESET_LINK_MINUTES,
    socialOnly: SOCIAL_ONLY_EMAILS[e] ?? null,
  };
}

/** 계정에 로그인 수단 연결 — 네이버는 OAuth 창 대신 바로 연결(mock), 이메일은 주소 + 비밀번호 설정 */
export async function linkProvider(
  provider: "naver" | "email",
  credential?: { email: string; password: string },
): Promise<Me> {
  const me = await getMe();
  if (!me) throw new Error("LOGIN_REQUIRED");
  if (me.providers.includes(provider)) throw new Error("ALREADY_LINKED");
  const next: Me = { ...me, providers: [...me.providers, provider] };
  if (provider === "email") {
    if (!credential) throw new Error("EMAIL_INVALID");
    const e = normalizeEmail(credential.email);
    if (!EMAIL_RE.test(e)) throw new Error("EMAIL_INVALID");
    if (!PASSWORD_RE.test(credential.password)) throw new Error("PASSWORD_WEAK");
    if (emailTaken(e)) throw new Error("EMAIL_TAKEN");
    next.emailLogin = maskEmail(e);
    if (!next.email) next.email = next.emailLogin;
    writeAccounts([
      ...readAccounts(),
      { email: e, hash: await sha256(credential.password), me: next },
    ]);
  }
  await new Promise((r) => setTimeout(r, 250));
  setMe(next);
  return next;
}
