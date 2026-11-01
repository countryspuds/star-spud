import { Suspense } from "react";
import { Link, NavLink } from "react-router-dom";
import { useMe } from "../features/auth/useMe";
import { useUnreadCount } from "../features/notifications/useNotifications";
import { Avatar } from "../components/ui/Avatar";
import { PillLink } from "../components/ui/Pill";
import potatoLogo from "../assets/potato/potato.svg";
import styles from "./layout.module.css";

/** 메뉴 6개 — ADR-0012 · 명세 §13. 커뮤니티·장터는 MVP에서 준비 중 페이지 */
const LINKS = [
  { to: "/", label: "홈", end: true },
  { to: "/map", label: "지도", end: false },
  { to: "/calendar", label: "캘린더", end: false },
  { to: "/me", label: "프로필", end: false },
  { to: "/community", label: "커뮤니티", end: false },
  { to: "/market", label: "장터", end: false },
];

/** 종 아이콘 + 미읽음 점 → /notifications (명세 §18.4). 온보딩을 마친 사용자에게만 */
function Bell() {
  const unread = useUnreadCount();
  return (
    <Link
      to="/notifications"
      className={styles.bell}
      aria-label={unread > 0 ? `알림 ${unread}개 안 읽음` : "알림"}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path
          d="M3.5 11.5h9l-1.2-1.6V7a3.3 3.3 0 0 0-6.6 0v2.9L3.5 11.5Z"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <path d="M6.6 13.2a1.5 1.5 0 0 0 2.8 0" stroke="currentColor" strokeWidth="1.4" />
      </svg>
      {unread > 0 && <span className={styles.bellDot} data-testid="unread-dot" />}
    </Link>
  );
}

/** 우측: 비로그인 = 로그인 pill → /login · 로그인 = 종 + 아바타 칩 → /me */
function AuthChip() {
  const me = useMe();
  if (!me) {
    return (
      <PillLink to="/login" size="sm" tone="secondary">
        로그인
      </PillLink>
    );
  }
  // 온보딩 전(nickname null)이면 칩이 온보딩으로 데려간다 — 둘러보는 중에도 돌아올 길
  const onboarding = me.nickname === null;
  return (
    <>
      {!onboarding && <Bell />}
      <Link
        to={onboarding ? "/onboarding" : "/me"}
        className={styles.chip}
        aria-label={onboarding ? "온보딩 이어하기" : "내 프로필"}
      >
        <Avatar avatarUrl={me.avatarUrl} potatoAvatar={me.potatoAvatar} size={22} />
        <span className={styles.chipName}>{onboarding ? "온보딩 이어하기" : me.nickname}</span>
      </Link>
    </>
  );
}

export type NavVariant = "default" | "auth";

export function Nav({ variant = "default" }: { variant?: NavVariant }) {
  if (variant === "auth") {
    return (
      <header className={styles.navAuth}>
        <Link to="/" className={styles.brand}>
          <img src={potatoLogo} alt="" width={26} height={26} className="pixelated" />
          <span>별보러감자</span>
        </Link>
        <Link to="/" className={styles.browse}>
          둘러보기 →
        </Link>
      </header>
    );
  }
  return (
    <header className={styles.nav}>
      <Link to="/" className={styles.brand}>
        <img src={potatoLogo} alt="" width={26} height={26} className="pixelated" />
        <span>별보러감자</span>
      </Link>
      <nav className={styles.links} aria-label="주요 메뉴">
        {LINKS.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            className={({ isActive }) => (isActive ? styles.active : undefined)}
          >
            {l.label}
          </NavLink>
        ))}
      </nav>
      <div className={styles.auth}>
        <Suspense fallback={<span className={styles.authSkeleton} aria-hidden="true" />}>
          <AuthChip />
        </Suspense>
      </div>
    </header>
  );
}
