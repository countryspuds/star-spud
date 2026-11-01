import type { ReactNode } from "react";
import starScoreMap from "../../assets/maps/starscore-5km.svg";
import { Card } from "../../components/ui/Card";
import { Label } from "../../components/ui/Label";
import styles from "./auth.module.css";

// 소개 패널 배경의 픽셀 별 — 고정 좌표 (left%, top%, size px, opacity)
const STARS: ReadonlyArray<readonly [number, number, number, number]> = [
  [5, 10, 3, 0.8],
  [12, 58, 2, 0.5],
  [19, 24, 4, 0.9],
  [26, 80, 2, 0.4],
  [31, 6, 2, 0.6],
  [8, 38, 2, 0.35],
  [38, 90, 3, 0.55],
  [55, 70, 2, 0.45],
  [61, 86, 4, 0.7],
  [68, 62, 3, 0.85],
  [74, 48, 2, 0.4],
  [80, 74, 3, 0.6],
  [86, 56, 2, 0.5],
  [91, 92, 4, 0.9],
  [44, 42, 3, 0.65],
  [3, 92, 3, 0.55],
  [23, 48, 2, 0.45],
];

export type Step = 1 | 2 | 3;

const STEP_LABELS: readonly [string, string, string] = ["약관", "닉네임", "완료"];

/** 상단 스텝 "1 약관 › 2 닉네임 › 3 완료" — active에 포함된 번호만 --lime (명세 §14). 이메일 가입은 "계정 › 닉네임 › 완료" */
export function Steps({
  active,
  labels = STEP_LABELS,
}: {
  active: readonly Step[];
  labels?: readonly [string, string, string];
}) {
  const items: { n: Step; label: string }[] = [
    { n: 1, label: labels[0] },
    { n: 2, label: labels[1] },
    { n: 3, label: labels[2] },
  ];
  return (
    <ol className={styles.steps} aria-label="가입 단계">
      {items.map((s, i) => (
        <li key={s.n} className={active.includes(s.n) ? styles.stepActive : undefined}>
          {i > 0 && (
            <span className={styles.stepSep} aria-hidden="true">
              ›
            </span>
          )}
          <span className={styles.stepNum}>{s.n}</span>
          <span>{s.label}</span>
        </li>
      ))}
    </ol>
  );
}

interface Props {
  label: string;
  title: string;
  body: string;
  children: ReactNode;
}

/** 로그인·온보딩 공통 2열 — 좌 소개 패널, 우 카드 (명세 §14) */
export function AuthFrame({ label, title, body, children }: Props) {
  return (
    <div className={styles.frame}>
      <Card className={styles.intro}>
        <div className={styles.stars} aria-hidden="true">
          {STARS.map(([left, top, size, opacity], i) => (
            <span
              key={i}
              style={{ left: `${left}%`, top: `${top}%`, width: size, height: size, opacity }}
            />
          ))}
        </div>
        <img src={starScoreMap} alt="" className={`pixelated ${styles.introMap}`} />
        <div className={styles.introCopy}>
          <Label>{label}</Label>
          <h1 className={styles.introTitle}>{title}</h1>
          <p className={styles.introBody}>{body}</p>
        </div>
      </Card>
      <Card className={styles.panel}>{children}</Card>
    </div>
  );
}
