import { Link } from "react-router-dom";
import { Label } from "../components/ui/Label";
import potatoLogo from "../assets/potato/potato.svg";
import styles from "./layout.module.css";

const APP_VERSION = import.meta.env.VITE_APP_VERSION ?? "dev";

/** 푸터 4열 — 명세 §13. 정책 문서와 FAQ는 준비 중 페이지 */
const COLUMNS: { title: string; links: { to: string; label: string }[] }[] = [
  {
    title: "서비스",
    links: [
      { to: "/map", label: "별보기 지도" },
      { to: "/calendar", label: "천문 캘린더" },
      { to: "/community", label: "커뮤니티" },
      { to: "/market", label: "장터" },
    ],
  },
  {
    title: "도움말",
    links: [
      { to: "/feedback?type=bug", label: "문의·버그 제보" },
      { to: "/feedback?type=feature", label: "기능 제안" },
      { to: "/feedback?type=spot_fix", label: "명소 정보 수정 요청" },
      { to: "/faq", label: "자주 묻는 질문" },
    ],
  },
  {
    title: "정책",
    links: [
      { to: "/terms", label: "이용약관" },
      { to: "/privacy", label: "개인정보 처리방침" },
      { to: "/guide", label: "커뮤니티·장터 가이드" },
      { to: "/sources", label: "데이터 출처" },
    ],
  },
];

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerGrid}>
        <div className={styles.footerBrand}>
          <Link to="/" className={styles.footerLogo}>
            <img src={potatoLogo} alt="" width={22} height={22} className="pixelated" />
            <span>별보러감자</span>
          </Link>
          <p className={styles.footerIntro}>
            별 보기 좋은 곳과 오늘 밤의 조건을 한 장에. 다녀온 밤은 감자로 남겨요.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <nav key={col.title} className={styles.footerCol} aria-label={col.title}>
            <Label>{col.title}</Label>
            <ul>
              {col.links.map((l) => (
                <li key={l.to}>
                  <Link to={l.to}>{l.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className={styles.footerBottom}>
        <span>
          © 2026 Star-Spud · 천문 정보: 한국천문연구원 · 날씨: 기상청 · 광공해: NOAA VIIRS · 지도:
          미정(ADR-0011)
        </span>
        <span>
          v{APP_VERSION} · <Link to="/feedback">문의하기</Link>
        </span>
      </div>
    </footer>
  );
}
