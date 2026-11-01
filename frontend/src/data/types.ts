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

/** 내 감자밭 — 심은 5 km 셀 (격자 인덱스). stage 1~4 = 심은 뒤 경과(오래될수록 진한 감자색) */
export interface FieldCell {
  x: number;
  y: number;
  stage: 1 | 2 | 3 | 4;
}

export interface Field {
  cells: FieldCell[];
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

/** 별보기 점수 격자 해상도 — Phase 1은 5 km만 */
export type StarScoreRes = "5km";

/**
 * 별보기 점수 셀 — `GET /api/v1/grid/starscore?res=5km` 응답 `{ res, updatedAt, cells }`의 한 칸 (specs/11 · 명세 §10).
 * [nx, ny, score, sidoCode, sigunguCode]: 기상청 5 km 격자 인덱스, 0~100 점수, 시·도 코드, 시·군·구 코드.
 * 점수는 서버가 계산하고 프론트는 그리기만 한다.
 */
export type StarScoreCell = [
  nx: number,
  ny: number,
  score: number,
  sidoCode: string,
  sigunguCode: string,
];

export interface StarScoreGrid {
  cells: StarScoreCell[];
}

/** 천문 캘린더 — `GET /api/v1/calendar?year&month` 응답 (명세 §11.3) */
export interface CalendarEvent {
  title: string;
  /** "HH:MM" 또는 빈 문자열 */
  time: string;
  desc: string;
  /** 신월·ZHR ≥ 10 유성우·식·슈퍼문 — 서버가 분류 */
  important: boolean;
}

export interface CalendarDay {
  /** YYYY-MM-DD */
  date: string;
  sunrise: string;
  sunset: string;
  moonrise: string;
  moonset: string;
  /** 천문박명 끝·시작 (HH:MM) */
  astmEnd: string;
  astmStart: string;
  lunAge: number;
  moonIllum: number;
  waxing: boolean;
  events: CalendarEvent[];
  /** 딥스카이·은하수 촬영 적기 띠(하현일~상현일) — 서버가 판정 */
  shootingWindow: boolean;
}

export interface CalendarMonth {
  year: number;
  month: number;
  /** 데이터 출처 표기 (캡션) */
  source: string;
  days: CalendarDay[];
  /** 월 전체 현상 목록 (날짜 포함) */
  events: (CalendarEvent & { date: string })[];
}

/** 감자 아바타 — specs/08 `users.potato_avatar` */
export type PotatoAvatar = "basic" | "happy" | "sad";

/** 로그인 사용자 — `GET /api/v1/me` (specs/08 `users`). 온보딩 전엔 nickname이 null */
export interface Me {
  id: string;
  nickname: string | null;
  /** 업로드한 프로필 사진. 없으면 potatoAvatar를 그린다 */
  avatarUrl: string | null;
  potatoAvatar: PotatoAvatar;
  /** 주로 보는 시·도 코드 (선택) */
  homeSido: string | null;
  /** 마스킹된 이메일 (제공자가 준 경우) */
  email: string | null;
  /** ISO 가입 시각 */
  createdAt: string;
}
