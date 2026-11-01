import { Suspense } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import potatoImg from "../../assets/potato/potato.svg";
import potatoSad from "../../assets/potato/potato-sad.svg";
import { MoonIcon } from "../../components/gauge/MoonIcon";
import { Card } from "../../components/ui/Card";
import { ExampleCaption, Label } from "../../components/ui/Label";
import { PillButton } from "../../components/ui/Pill";
import { markAllRead, markRead, type AppNotification } from "../../data/notifications";
import { fmtHM, fmtMDW } from "../../lib/time";
import { useMe } from "../auth/useMe";
import { useNotifications } from "./useNotifications";
import styles from "./notifications.module.css";

/** 유형 아이콘 — 배고픔 = 감자 + 말풍선, 그 외(이벤트·촬영 적기·지수) = 픽셀 달 (명세 §18.4) */
function TypeIcon({ type }: { type: AppNotification["type"] }) {
  if (type === "potato_hungry") {
    return (
      <span className={styles.iconPotato}>
        <img src={potatoImg} alt="" width={28} height={28} className="pixelated" />
        <span className={styles.bubble} aria-hidden="true">
          …
        </span>
      </span>
    );
  }
  // 촬영 적기는 가는 그믐달, 그 외는 반달 — 어두운 바탕에서 보이도록 삭(0%)은 피한다
  return <MoonIcon illum={type === "dark_window" ? 20 : 50} waxing={false} size={28} />;
}

function Row({ n }: { n: AppNotification }) {
  const unread = n.readAt === null;
  return (
    <li>
      {/* 탭 → 읽음 처리 + link로 이동. 읽음 요청은 멱등이라 기다리지 않는다 */}
      <Link
        to={n.link}
        className={styles.row}
        data-unread={unread}
        onClick={() => void markRead(n.id)}
      >
        <TypeIcon type={n.type} />
        <div className={styles.text}>
          <span className={styles.title}>{n.title}</span>
          <span className={styles.body}>{n.body}</span>
          <span className={styles.time}>
            {fmtMDW(n.createdAt)} {fmtHM(n.createdAt)}
          </span>
        </div>
        {unread && <span className={styles.dot} aria-label="안 읽음" />}
      </Link>
    </li>
  );
}

function Inbox() {
  const { items, unreadCount } = useNotifications();
  return (
    <Card className={styles.card}>
      <div className={styles.head}>
        <div className={styles.headText}>
          <Label>INBOX{unreadCount > 0 ? ` · ${unreadCount} UNREAD` : ""}</Label>
          <h1 className={styles.h1}>알림</h1>
        </div>
        {items.length > 0 && (
          <PillButton size="sm" onClick={() => void markAllRead()} disabled={unreadCount === 0}>
            모두 읽음
          </PillButton>
        )}
      </div>

      {items.length === 0 ? (
        <div className={styles.empty}>
          <img src={potatoSad} alt="" width={120} height={120} className="pixelated" />
          <p>아직 알림이 없어요</p>
          <span>감자가 배고파하거나 유성우가 다가오면 여기에 알려 드려요.</span>
        </div>
      ) : (
        <ul className={styles.list}>
          {items.map((n) => (
            <Row key={n.id} n={n} />
          ))}
        </ul>
      )}

      <div className={styles.foot}>
        <span className={styles.note}>
          유성우 극대기 전날 · 촬영 적기 시작 · 내 감자가 배고프면 · 오늘 밤 지수 80 이상.{" "}
          <Link to="/me/settings" className={styles.settingsLink}>
            알림 설정
          </Link>
        </span>
        <ExampleCaption />
      </div>
    </Card>
  );
}

function Gate() {
  const me = useMe();
  const { pathname } = useLocation();
  // 비로그인은 로그인으로. 온보딩 전은 OnboardingGuard가 /onboarding으로 보낸다
  if (!me) return <Navigate to={`/login?next=${encodeURIComponent(pathname)}`} replace />;
  return <Inbox />;
}

/** `/notifications` 알림함 — 명세 §18.4 · specs/10 MVP */
export function NotificationsPage() {
  return (
    <div className={styles.page}>
      <Suspense fallback={null}>
        <Gate />
      </Suspense>
    </div>
  );
}
