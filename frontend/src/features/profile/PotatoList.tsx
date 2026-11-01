import { useState } from "react";
import potatoImg from "../../assets/potato/potato.svg";
import { Card } from "../../components/ui/Card";
import { ExampleCaption, Label } from "../../components/ui/Label";
import { isNeglected, type Potato } from "../../data/potatoes";
import styles from "./profile.module.css";

type Filter = "all" | "neglected";

const fmtDate = (ymd: string) => ymd.replaceAll("-", ".");

/**
 * 감자 일러스트 — specs/04의 등급 4 × 상태 2 일러스트가 아직 없어 도트 감자 하나에
 * 등급 배지, hungry는 말풍선, sprouted는 싹을 CSS로 얹는다.
 */
function PotatoIllust({ potato }: { potato: Potato }) {
  return (
    <span className={styles.illust} data-state={potato.state}>
      <img src={potatoImg} alt="" width={36} height={36} className="pixelated" />
      {potato.state === "hungry" && (
        <span className={styles.bubble} aria-hidden="true">
          …
        </span>
      )}
      {potato.state === "sprouted" && <span className={styles.sprout} aria-hidden="true" />}
    </span>
  );
}

function RightLabel({ potato }: { potato: Potato }) {
  if (potato.state === "hungry") return <span className={styles.alert}>배고파요</span>;
  if (potato.state === "sprouted") return <span className={styles.alert}>싹이 났어요</span>;
  return (
    <span className={styles.meta}>
      Lv{potato.level} · 먹이 {potato.foodCount}
    </span>
  );
}

/** 내 감자 목록 — 명세 §15. 정렬은 서버(getMyPotatoes)가 한 순서 그대로 */
export function PotatoList({ potatoes }: { potatoes: Potato[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const neglected = potatoes.filter(isNeglected);
  const shown = filter === "all" ? potatoes : neglected;

  return (
    <Card variant="glass" className={styles.list}>
      <div className={styles.listHead}>
        <Label>내 감자</Label>
        <div className={styles.filters} role="tablist" aria-label="감자 필터">
          <button
            type="button"
            role="tab"
            aria-selected={filter === "all"}
            className={filter === "all" ? styles.filterOn : styles.filter}
            onClick={() => setFilter("all")}
          >
            전체 {potatoes.length}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={filter === "neglected"}
            className={filter === "neglected" ? styles.filterOn : styles.filter}
            onClick={() => setFilter("neglected")}
          >
            배고픔 {neglected.length}
          </button>
        </div>
      </div>

      {shown.length === 0 ? (
        <p className={styles.empty}>배고픈 감자가 없어요. 잘 돌보고 있네요.</p>
      ) : (
        <ul className={styles.rows}>
          {shown.map((p) => (
            <li key={p.id} className={styles.row}>
              <PotatoIllust potato={p} />
              <div className={styles.rowText}>
                <span className={styles.spotName}>{p.spot.name}</span>
                <span className={styles.date}>
                  {fmtDate(p.lastVisitedOn)} · Lv{p.level}
                </span>
                <span className={styles.review}>{p.latestReview}</span>
              </div>
              <RightLabel potato={p} />
            </li>
          ))}
        </ul>
      )}

      <p className={styles.listNote}>
        큰 천체 이벤트가 지나가도록 안 가면 감자가 배고파해요. 다시 가서 기록하면 등급이 올라요.{" "}
        <ExampleCaption />
      </p>
    </Card>
  );
}
