import { Card } from "../components/ui/Card";
import { Label } from "../components/ui/Label";
import { PillLink } from "../components/ui/Pill";
import potatoSad from "../assets/potato/potato-sad.svg";
import styles from "./ComingSoon.module.css";

const PROGRESS_TOTAL = 10;
const PROGRESS_DONE = 4;

// 배경 픽셀 별 — 렌더마다 바뀌지 않도록 고정 좌표 (left%, top%, size px, opacity)
const STARS: ReadonlyArray<readonly [number, number, number, number]> = [
  [6, 12, 3, 0.8],
  [14, 64, 2, 0.5],
  [21, 28, 4, 0.9],
  [27, 85, 2, 0.4],
  [33, 8, 2, 0.6],
  [9, 42, 2, 0.35],
  [40, 92, 3, 0.55],
  [57, 6, 2, 0.45],
  [63, 88, 4, 0.7],
  [70, 18, 3, 0.85],
  [76, 52, 2, 0.4],
  [82, 74, 3, 0.6],
  [88, 10, 2, 0.5],
  [93, 36, 4, 0.9],
  [95, 80, 2, 0.35],
  [47, 4, 3, 0.65],
  [3, 90, 3, 0.55],
  [86, 94, 2, 0.45],
];

export function ComingSoon({ section }: { section: string }) {
  return (
    <Card className={styles.page}>
      <div className={styles.stars} aria-hidden="true">
        {STARS.map(([left, top, size, opacity], i) => (
          <span
            key={i}
            style={{ left: `${left}%`, top: `${top}%`, width: size, height: size, opacity }}
          />
        ))}
      </div>

      <div className={styles.stack}>
        <img src={potatoSad} alt="" width={192} height={192} className="pixelated" />
        <Label>COMING SOON · {section}</Label>
        <h1 className={styles.title}>이 페이지는 아직 땅속에 있어요</h1>
        <p className={styles.body}>
          감자가 싹을 틔우는 중이에요. 먼저 지도에서 오늘 밤 갈 곳부터 찾아보세요.
        </p>

        <div className={styles.progressWrap}>
          <div
            className={styles.progress}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={PROGRESS_TOTAL}
            aria-valuenow={PROGRESS_DONE}
            aria-label="개발 진행도"
          >
            {Array.from({ length: PROGRESS_TOTAL }, (_, i) => (
              <span key={i} className={i < PROGRESS_DONE ? styles.filled : undefined} />
            ))}
          </div>
          <span className={styles.progressCaption}>
            싹 트는 중 / Phase 1 · {PROGRESS_DONE}/{PROGRESS_TOTAL}
          </span>
        </div>

        <div className={styles.actions}>
          <PillLink to="/map" tone="primary">
            지도로 가기
          </PillLink>
          <PillLink to="/" tone="secondary">
            홈으로
          </PillLink>
        </div>
      </div>
    </Card>
  );
}
