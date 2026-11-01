import { use, useSyncExternalStore } from "react";
import {
  getNotifications,
  getUnreadCount,
  subscribeNotifications,
  type NotificationPage,
} from "../../data/notifications";

/** 알림 목록 — 읽음 처리로 바뀌면 다시 렌더된다. Suspense 안에서 쓴다 */
export function useNotifications(): NotificationPage {
  return use(useSyncExternalStore(subscribeNotifications, getNotifications, getNotifications));
}

/** 미읽음 수 — 네비 종 아이콘의 점 */
export function useUnreadCount(): number {
  return useSyncExternalStore(subscribeNotifications, getUnreadCount, getUnreadCount);
}
