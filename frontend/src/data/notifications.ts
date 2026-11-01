/**
 * 알림함 — specs/10, 명세 §18.4. Phase 1: mock(이 탭의 sessionStorage).
 * Phase 2: `GET /api/v1/me/notifications?cursor=` · `POST /api/v1/me/notifications/{id}/read` · `POST .../read-all`.
 * 알림 생성(배치·dedupe)은 서버 일이라 여기엔 없다. 문구도 서버가 만든 스냅샷을 그대로 보여준다.
 */
import notificationsJson from "./notifications.json";
import type { AppNotification, NotificationPage } from "./types";

export type { AppNotification, NotificationPage, NotificationType } from "./types";

const SESSION_KEY = "starspud.mockNotifications";

function readSession(): AppNotification[] | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as AppNotification[]) : null;
  } catch {
    return null;
  }
}

function writeSession(list: AppNotification[]): void {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(list));
  } catch {
    // 저장이 막힌 환경에서는 메모리에서만 유지
  }
}

let notifications: AppNotification[] = readSession() ?? (notificationsJson as AppNotification[]);
let pagePromise: Promise<NotificationPage> | null = null;
const listeners = new Set<() => void>();

/** 읽음 처리로 목록이 바뀌면 알림 (useSyncExternalStore용) */
export function subscribeNotifications(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function changed(): void {
  writeSession(notifications);
  pagePromise = null;
  listeners.forEach((l) => l());
}

const unreadCount = () => notifications.filter((n) => n.readAt === null).length;

/** 알림 목록(최신순) + 미읽음 수 — TODO(Phase 2): GET /api/v1/me/notifications?cursor= (mock은 한 페이지) */
export function getNotifications(): Promise<NotificationPage> {
  pagePromise ??= Promise.resolve({
    items: [...notifications].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    nextCursor: null,
    unreadCount: unreadCount(),
  });
  return pagePromise;
}

/** 네비 종 아이콘용 미읽음 수 — 동기 스냅샷 */
export function getUnreadCount(): number {
  return unreadCount();
}

/** 읽음 처리 — TODO(Phase 2): POST /api/v1/me/notifications/{id}/read (멱등) */
export async function markRead(id: string): Promise<void> {
  const target = notifications.find((n) => n.id === id);
  if (!target || target.readAt !== null) return;
  notifications = notifications.map((n) =>
    n.id === id ? { ...n, readAt: new Date().toISOString() } : n,
  );
  changed();
}

/** 모두 읽음 — TODO(Phase 2): POST /api/v1/me/notifications/read-all */
export async function markAllRead(): Promise<void> {
  if (unreadCount() === 0) return;
  const now = new Date().toISOString();
  notifications = notifications.map((n) => (n.readAt === null ? { ...n, readAt: now } : n));
  changed();
}
