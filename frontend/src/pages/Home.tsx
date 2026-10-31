import { Suspense, use } from "react";
import { getEvents } from "../data";
import { EventCard } from "../components/bento/EventCard";
import { IndexChart } from "../components/bento/IndexChart";
import { PhotoOfMonth } from "../components/bento/PhotoOfMonth";
import { StarScoreTeaser } from "../components/bento/StarScoreTeaser";
import { TonightDetails } from "../components/bento/TonightDetails";
import styles from "./Home.module.css";

function EventRow() {
  const events = use(getEvents());
  return (
    <div className={styles.events}>
      {events.map((e) => (
        <EventCard key={e.title} event={e} />
      ))}
    </div>
  );
}

export function Home() {
  return (
    <Suspense fallback={null}>
      <div className={styles.bento}>
        <PhotoOfMonth className={styles.photo} />
        <StarScoreTeaser className={styles.map} />
        <IndexChart className={styles.index} />
        <TonightDetails className={styles.tonight} />
      </div>
      <EventRow />
      <p className={styles.footnote}>
        날짜·지수·관측값은 모두 예시 데이터이며 실제 관측값이 아닙니다.
      </p>
    </Suspense>
  );
}
