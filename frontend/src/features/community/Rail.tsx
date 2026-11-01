import { Link } from "react-router-dom";
import { MoonIcon } from "../../components/gauge/MoonIcon";
import { Card } from "../../components/ui/Card";
import { ExampleCaption, Label } from "../../components/ui/Label";
import { fmtHM, fmtMDW, monthNameEn } from "../../lib/time";
import { moonPhaseLabel } from "../../lib/moon";
import { indexColor } from "./labels";
import { useRail } from "./useCommunity";
import styles from "./community.module.css";

/** 우측 레일 — 오늘 밤 뜨는 명소 · 이번 주 모임 · 우주 뉴스 · 이달의 사진 · 오늘 밤 달 */
export function Rail() {
  const rail = useRail();
  const contestMonth = Number(rail.photoContest.month.slice(5));
  return (
    <aside className={styles.rail} aria-label="커뮤니티 레일">
      <Card variant="glass" className={styles.railCard}>
        <div className={styles.railHead}>
          <Label>TONIGHT · 오늘 밤 뜨는 명소</Label>
          <ExampleCaption />
        </div>
        <ol className={styles.rank}>
          {rail.tonightSpots.map((s, i) => (
            <li key={s.id}>
              <Link to={`/spots/${s.id}`} className={styles.rankRow}>
                <span className={`${styles.rankNum} tabular`}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className={styles.rankName}>{s.name}</span>
                <span
                  className={`${styles.rankIndex} tabular`}
                  style={{ color: indexColor(s.index) }}
                >
                  {s.index}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </Card>

      <Card variant="glass" className={styles.railCard}>
        <Label>THIS WEEK · 이번 주 모임</Label>
        {rail.weekMeetups.length === 0 ? (
          <p className={styles.railEmpty}>이번 주에 잡힌 모임이 없어요</p>
        ) : (
          <ul className={styles.railList}>
            {rail.weekMeetups.map((m) => (
              <li key={m.postId}>
                <Link to={`/community/${m.postId}`} className={styles.railRow}>
                  <span className={styles.railTitle}>{m.title}</span>
                  <span className={`${styles.railMeta} tabular`}>
                    {fmtMDW(m.at)} {fmtHM(m.at)} · {m.spotName} · {m.joined}/{m.capacity}명
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card variant="glass" className={styles.railCard}>
        <div className={styles.railHead}>
          <Label>SPACE NEWS · 우주 뉴스</Label>
          <span className={styles.railNote}>RSS 자리</span>
        </div>
        <ul className={styles.railList}>
          {rail.news.map((n) => (
            <li key={n.id} className={styles.railRow}>
              {n.url ? (
                <a
                  href={n.url}
                  target="_blank"
                  rel="noreferrer nofollow"
                  className={styles.railTitle}
                >
                  {n.title}
                </a>
              ) : (
                <span className={styles.railTitle}>{n.title}</span>
              )}
              <span className={`${styles.railMeta} tabular`}>
                {n.source} · {fmtMDW(n.publishedAt)} {fmtHM(n.publishedAt)}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      <Card variant="glass" className={styles.railCard}>
        <div className={styles.railHead}>
          <Label>
            {monthNameEn(`${rail.photoContest.month}-01`)} · {contestMonth}월 이달의 사진
          </Label>
          <Link to="/community?tab=photo" className={styles.railLink}>
            응모 보기 →
          </Link>
        </div>
        <ul className={styles.contestGrid}>
          {rail.photoContest.entries.map((e) => {
            const thumb = (
              <img src={e.src} alt={`${e.author}의 응모 사진`} className={styles.thumb} />
            );
            return (
              <li key={e.id}>
                {e.postId ? <Link to={`/community/${e.postId}`}>{thumb}</Link> : thumb}
                <span className={styles.thumbAuthor}>{e.author}</span>
              </li>
            );
          })}
        </ul>
        <p className={styles.railMeta}>
          마감 {rail.photoContest.deadline.replaceAll("-", ".")} · 사진 응모 글을 쓰면 자동으로
          올라가요
        </p>
      </Card>

      <Card variant="glass" className={`${styles.railCard} ${styles.moonCard}`}>
        <MoonIcon illum={rail.moon.illum} waxing={rail.moon.waxing} size={36} />
        <div className={styles.moonText}>
          <Label>TONIGHT · 달</Label>
          <span className={styles.moonLine}>
            {moonPhaseLabel(rail.moon.illum, rail.moon.waxing)} {rail.moon.illum}% ·{" "}
            {rail.moon.line}
          </span>
        </div>
      </Card>
    </aside>
  );
}
