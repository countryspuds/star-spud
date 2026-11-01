import { Suspense } from "react";
import { Link, NavLink } from "react-router-dom";
import { useMe } from "../features/auth/useMe";
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

/** 우측: 비로그인 = 로그인 pill → /login · 로그인 = 아바타 칩 → /me */
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
    <Link
      to={onboarding ? "/onboarding" : "/me"}
      className={styles.chip}
      aria-label={onboarding ? "온보딩 이어하기" : "내 프로필"}
    >
      <Avatar avatarUrl={me.avatarUrl} potatoAvatar={me.potatoAvatar} size={22} />
      <span className={styles.chipName}>{onboarding ? "온보딩 이어하기" : me.nickname}</span>
    </Link>
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
