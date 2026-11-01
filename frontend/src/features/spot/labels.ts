import type {
  Condition,
  Direction,
  SpotAccess,
  SpotReportReason,
  SpotType,
} from "../../data/spots";

/** 판정 → 문구·색 (명세 §18.1). 판정 자체는 서버 값 */
export const CONDITION: Record<Condition, { label: string; color: string }> = {
  good: { label: "좋음", color: "var(--sprout)" },
  fair: { label: "보통", color: "#e5c33d" },
  bad: { label: "나쁨", color: "var(--fg-3)" },
  unknown: { label: "정보 없음", color: "var(--fg-3)" },
};

export const SPOT_TYPE: Record<SpotType, string> = {
  nature: "자연",
  observatory: "천문대",
  camping: "캠핑장",
  suburb: "도심 근교",
};

export const ACCESS: Record<SpotAccess, string> = {
  car: "자동차",
  walk: "도보",
  transit: "대중교통",
};

export const DIRECTION: Record<Direction, string> = { N: "북", E: "동", S: "남", W: "서" };

export const REPORT_REASONS: { reason: SpotReportReason; label: string }[] = [
  { reason: "wrong_location", label: "위치가 달라요" },
  { reason: "no_access", label: "출입할 수 없는 곳이에요 (사유지·통제)" },
  { reason: "duplicate", label: "이미 있는 명소와 같은 곳이에요" },
  { reason: "other", label: "기타" },
];
