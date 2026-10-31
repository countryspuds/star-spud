/** 이달의 사진 — 명세 §3 */
export interface PhotoOfMonth {
  title: string;
  place: string;
  author: string;
  /** YYYY-MM-DD */
  date: string;
  bortle: number;
  likes: number;
  /** 이미지 URL (mock에서는 에셋 파일명을 URL로 바꿔서 돌려준다) */
  src: string;
}

/** 오늘 밤 세부값 + 게이지 입력 — 명세 §4.4, §6. 시각은 모두 ISO(+09:00) */
export interface NightTimes {
  sunset: string;
  astroEnd: string;
  astroStart: string;
  sunrise: string;
  moonrise: string;
  moonset: string;
  /** 달 밝기 0~100 (%) */
  moonIllum: number;
  waxing: boolean;
  now: string;
}

export interface Tonight extends NightTimes {
  location: string;
  basis: string;
  cloudPct: number;
  humidityPct: number;
  windMs: number;
  visibilityKm: number;
  tempC: number;
}

/** 별보기 지수 입력 (하루) */
export interface IndexDayInput {
  /** "M.D" */
  date: string;
  /** 구름량 0~1 */
  cloud: number;
  /** 달 밝기 0~100 */
  moonIllum: number;
  /** 시정 0~1 (정규화) */
  visibility: number;
}

export interface IndexDay extends IndexDayInput {
  /** 0~100 */
  score: number;
  event?: string;
}

export interface IndexEvent {
  date: string;
  label: string;
}

export interface Index10d {
  days: IndexDay[];
  events: IndexEvent[];
}

/** D-day 이벤트 카드 */
export interface AstroEvent {
  dday: number;
  title: string;
  sub: string;
  moonIllum: number;
  waxing: boolean;
}

/** 광공해 5단계 0~4 */
export type LpLevel = 0 | 1 | 2 | 3 | 4;

export interface Spot {
  id: string;
  name: string;
  /** 시·도 코드 (예: gyeongnam) */
  sido: string;
  /** 시·군·구 이름 (예: 거제시) */
  sigungu: string;
  bortle: number;
  lpLevel: LpLevel;
  distanceKm: number;
  elevationM: number;
}
