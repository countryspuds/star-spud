import type { ListingCondition, ListingStatus, PriceBand, TradeMethod } from "../../data/market";

export const CONDITION_LABEL: Record<ListingCondition, string> = {
  new: "미개봉",
  like_new: "거의 새것",
  good: "상태 좋음",
  used: "사용감 있음",
};

export const TRADE_LABEL: Record<TradeMethod, string> = {
  meet: "직거래",
  delivery: "택배",
  both: "직거래 · 택배",
};

export const STATUS_LABEL: Record<ListingStatus, string> = {
  selling: "판매중",
  reserved: "예약중",
  sold: "거래완료",
};

/** 가격 필터 — specs/07 price_band (만원) */
export const PRICE_BANDS: { band: PriceBand; label: string }[] = [
  { band: "under_10", label: "10만 원 이하" },
  { band: "10_30", label: "10~30만 원" },
  { band: "30_100", label: "30~100만 원" },
  { band: "over_100", label: "100만 원 이상" },
];

export const isPriceBand = (v: string | null): v is PriceBand =>
  v !== null && PRICE_BANDS.some((b) => b.band === v);

/** "1,150,000원" */
export const fmtWon = (n: number) => `${n.toLocaleString("ko-KR")}원`;

/** 안전 거래 안내 띠 · 상세 주의사항 3줄 */
export const SAFETY_LINES = [
  "직거래는 밝고 사람 많은 곳에서, 물건을 직접 확인한 뒤 돈을 건네세요.",
  "선입금·외부 링크 결제·개인정보 요구는 거절하고 신고해 주세요.",
  "택배 거래는 송장·대화 내역을 남기고, 고가 장비는 안전결제를 써 주세요.",
] as const;
