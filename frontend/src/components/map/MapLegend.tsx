import type { MapTab } from "../../lib/mapRoute";
import { ExampleCaption, Label } from "../ui/Label";
import styles from "./map.module.css";

interface Item {
  color: string;
  label: string;
  sub?: string;
  shape?: "square" | "circle" | "hatch";
}

const LEGENDS: Record<MapTab, { title: string; items: Item[]; note?: string; example?: boolean }> =
  {
    lp: {
      title: "광공해 · 5단계",
      items: [
        { color: "var(--lp-0)", label: "매우 낮음", sub: "산간·섬" },
        { color: "var(--lp-1)", label: "낮음", sub: "농어촌" },
        { color: "var(--lp-2)", label: "보통", sub: "교외" },
        { color: "var(--lp-3)", label: "높음", sub: "도시 주변" },
        { color: "var(--lp-4)", label: "매우 높음", sub: "대도시" },
      ],
    },
    weather: {
      title: "날씨 · 미세먼지",
      items: [
        { color: "var(--aq-good)", label: "좋음", shape: "circle" },
        { color: "var(--aq-ok)", label: "보통", shape: "circle" },
        { color: "var(--aq-bad)", label: "나쁨", shape: "circle" },
        { color: "var(--aq-worst)", label: "매우 나쁨", shape: "circle" },
        { color: "var(--aq-good)", label: "비", shape: "hatch" },
      ],
      note: "실제 지도 SDK 연동 전 자리표시 이미지",
    },
    terrain: {
      title: "지형 · 해발고도",
      items: [
        { color: "#c4cabb", label: "0–100 m" },
        { color: "#c3cfae", label: "100–300 m" },
        { color: "#bcae96", label: "300–700 m" },
        { color: "#968b78", label: "700 m+" },
      ],
      note: "네이버 지형도 연동 전 자리표시 이미지",
      example: true,
    },
    field: {
      title: "내 감자밭 · 심은 뒤 경과",
      items: [
        { color: "var(--potato-1)", label: "갓 심음" },
        { color: "var(--potato-2)", label: "싹 틈" },
        { color: "var(--potato-3)", label: "자라는 중" },
        { color: "var(--potato-4)", label: "다 자람" },
      ],
      note: "감자색 = 내가 심은 5 km 셀. 오래될수록 진해져요",
      example: true,
    },
  };

function Swatch({ color, shape = "square" }: Pick<Item, "color" | "shape">) {
  if (shape === "hatch") {
    return <span className={styles.swatchHatch} style={{ color }} aria-hidden="true" />;
  }
  return (
    <span
      className={shape === "circle" ? styles.swatchCircle : styles.swatch}
      style={{ background: color }}
      aria-hidden="true"
    />
  );
}

/** 탭별 범례 */
export function MapLegend({ tab }: { tab: MapTab }) {
  const legend = LEGENDS[tab];
  return (
    <div className={styles.section}>
      <Label>범례</Label>
      <p className={styles.legendTitle}>{legend.title}</p>
      <ul className={styles.legendList}>
        {legend.items.map((it) => (
          <li key={it.label}>
            <Swatch color={it.color} shape={it.shape} />
            <span>{it.label}</span>
            {it.sub && <span className={styles.legendSub}>{it.sub}</span>}
          </li>
        ))}
      </ul>
      {(legend.note || legend.example) && (
        <p className={styles.legendNote}>
          {legend.note}
          {legend.example && <ExampleCaption className={styles.legendExample} />}
        </p>
      )}
    </div>
  );
}
