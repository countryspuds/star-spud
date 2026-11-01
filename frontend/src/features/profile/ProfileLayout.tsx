import { Suspense, useState } from "react";
import { Navigate, NavLink, Outlet, useLocation } from "react-router-dom";
import { logout, type Me } from "../../data/auth";
import { isNeglected } from "../../data/potatoes";
import { SIDO, isSidoCode } from "../../data/regions";
import { Avatar } from "../../components/ui/Avatar";
import { Card } from "../../components/ui/Card";
import { ExampleCaption } from "../../components/ui/Label";
import { PillButton } from "../../components/ui/Pill";
import { useMe } from "../auth/useMe";
import { PHASE2 } from "../../lib/phase2";
import { useMyPotatoes } from "../potato/useMyPotatoes";
import styles from "./profile.module.css";

const MENU = [
  { to: "/me", label: "감자밭", sub: "MY FIELD", end: true },
  { to: "/me/activity", label: "활동", sub: PHASE2 ? "REVIEWS · LIKES" : "PHASE 2", end: false },
  { to: "/me/settings", label: "설정", sub: "PROFILE · ALERTS", end: false },
];

/** 가입 연월 "YYYY.MM" */
const sinceOf = (iso: string) => iso.slice(0, 7).replace("-", ".");

/** 감자 N · 배고픔 N · 명소 N — specs/04: 감자 = (사용자, 명소) 수, 배고픔 = hungry|sprouted */
function Stats() {
  const potatoes = useMyPotatoes();
  const spots = new Set(potatoes.map((p) => p.spot.id)).size;
  const items = [
    ["감자", potatoes.length],
    ["배고픔", potatoes.filter(isNeglected).length],
    ["명소", spots],
  ] as const;
  return (
    <dl className={styles.stats}>
      {items.map(([k, v]) => (
        <div key={k}>
          <dt>{k}</dt>
          <dd className="tabular">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function Sidebar({ me }: { me: Me }) {
  const sido = me.homeSido && isSidoCode(me.homeSido) ? SIDO[me.homeSido].short : "지역 미설정";
  // 사용자가 사라지면 ProfileLayout이 홈으로 보낸다
  const onLogout = () => logout();
  return (
    <Card className={styles.sidebar}>
      <div className={styles.who}>
        <Avatar avatarUrl={me.avatarUrl} potatoAvatar={me.potatoAvatar} size={88} />
        <h2 className={styles.nick}>{me.nickname}</h2>
        <span className={styles.since}>
          {sido} · since {sinceOf(me.createdAt)}
        </span>
      </div>
      <Suspense fallback={null}>
        <Stats />
      </Suspense>
      <ExampleCaption className={styles.sideCaption} />
      <div className={styles.sep} />
      <nav className={styles.menu} aria-label="프로필 메뉴">
        {MENU.map((m) => (
          <NavLink
            key={m.to}
            to={m.to}
            end={m.end}
            className={({ isActive }) => (isActive ? styles.menuActive : styles.menuItem)}
          >
            <span>{m.label}</span>
            <span className={styles.menuSub}>{m.sub}</span>
          </NavLink>
        ))}
      </nav>
      <div className={styles.sep} />
      <PillButton onClick={onLogout} className={styles.logout}>
        로그아웃
      </PillButton>
    </Card>
  );
}

/** `/me/*` — 좌 사이드바 + 우 본문 (명세 §15). 비로그인은 로그인으로, 온보딩 전은 가드가 처리 */
export function ProfileLayout() {
  const me = useMe();
  const { pathname } = useLocation();
  // 이 화면에서 로그아웃·탈퇴로 사용자가 사라진 경우(seenMe)는 홈으로, 처음부터 비로그인이면 로그인으로
  const [seenMe, setSeenMe] = useState(me !== null);
  if (me && !seenMe) setSeenMe(true);
  if (!me) {
    return <Navigate to={seenMe ? "/" : `/login?next=${encodeURIComponent(pathname)}`} replace />;
  }
  if (me.nickname === null) return <Navigate to="/onboarding" replace />;
  return (
    <div className={styles.page}>
      <Sidebar me={me} />
      <div className={styles.content}>
        <Outlet context={me satisfies Me} />
      </div>
    </div>
  );
}
