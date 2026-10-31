import type { AstroEvent } from "../../data";
import { MoonIcon } from "../gauge/MoonIcon";
import { Card } from "../ui/Card";
import styles from "./bento.module.css";

export function EventCard({ event }: { event: AstroEvent }) {
  return (
    <Card className={styles.event}>
      <div className={styles.eventText}>
        <span className={`${styles.dday} tabular`}>D-{event.dday}</span>
        <h3 className={styles.eventTitle}>{event.title}</h3>
        <p className={styles.eventSub}>{event.sub}</p>
      </div>
      <MoonIcon illum={event.moonIllum} waxing={event.waxing} size={22} />
    </Card>
  );
}
