import { Link, NavLink } from "react-router-dom";
import { PillLink } from "../components/ui/Pill";
import potatoLogo from "../assets/potato/potato.svg";
import styles from "./layout.module.css";

const LINKS = [
  { to: "/", label: "홈", end: true },
  { to: "/map", label: "지도", end: false },
  { to: "/calendar", label: "캘린더", end: false },
  { to: "/field", label: "감자밭", end: false },
  { to: "/community", label: "커뮤니티", end: false },
];

export function Nav() {
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
      <PillLink to="/login" size="sm" tone="secondary" className={styles.login}>
        로그인
      </PillLink>
    </header>
  );
}
