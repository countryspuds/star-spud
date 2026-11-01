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

/** 명소 유형 — specs/01: 자연 / 천문대 / 캠핑장 / 도심 근교 */
export type SpotType = "nature" | "observatory" | "camping" | "suburb";
/** 접근 수단 */
export type SpotAccess = "car" | "walk" | "transit";
/** 시야가 열린 방향 */
export type Direction = "N" | "E" | "S" | "W";
/** 관측 조건 판정 — specs/02. 서버가 판정해 내려주고 프론트는 색·문구만 매핑한다 */
export type Condition = "good" | "fair" | "bad" | "unknown";

/** 관측 명소 — `GET /api/v1/spots/{id}` (specs/01 모델, 명세 §18.5) */
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
  type: SpotType;
  lat: number;
  lng: number;
  description: string;
  access: SpotAccess[];
  /** 마지막 구간까지 포장도로인지 */
  paved: boolean;
  horizonDirs: Direction[];
  /** 열린 방향의 지평선 고도(°) — 지형이 가리는 높이 */
  horizonAlt: number;
  /** 공개 감자 기록 사진 — 서버가 최대 6장 모아 준다. mock은 에셋 파일명 */
  photos: string[];
  /** curated = 운영자 큐레이션 · ugc = 사용자 등록 */
  source: "curated" | "ugc";
  /** ugc 등록자 닉네임 (탈퇴하면 null) */
  createdBy: string | null;
  status: "active" | "under_review";
  flags: {
    carCamping: boolean;
    /** 주차 가능 대수. 모르면 null */
    parking: number | null;
    toilet: boolean;
  };
}

/** 명소의 어느 날 밤 조건 — `GET /api/v1/spots/{id}?date=`의 조건 부분 (specs/02). 판정·이유는 서버 값 */
export interface SpotNight {
  /** YYYY-MM-DD (그날 저녁부터 다음 날 새벽까지의 "밤") */
  date: string;
  condition: Condition;
  /** 이유 한 줄 (예: "구름은 적지만 달이 밤새 떠 있어요") */
  reason: string;
  /** 관측 창 평균 구름량 %. 스냅샷이 없으면 null */
  cloudPct: number | null;
  times: NightTimes;
}

export interface SpotDetail extends Spot {
  night: SpotNight;
}

/** 명소의 공개 감자 한 줄 — `GET /api/v1/spots/{id}/potatoes?cursor=` (specs/04) */
export interface SpotPotato {
  id: string;
  nickname: string;
  level: 1 | 2 | 3 | 4;
  state: PotatoState;
  foodCount: number;
  /** 마지막 방문일 YYYY-MM-DD */
  lastVisitedOn: string;
  latestReview: string;
  /** 최신 기록 사진 URL (최대 3장 표시) */
  photos: string[];
}

export interface SpotPotatoPage {
  items: SpotPotato[];
  /** 다음 페이지 커서. 없으면 null */
  nextCursor: string | null;
  /** 공개 감자 전체 수 */
  total: number;
}

/** 명소 신고 사유 — `POST /api/v1/spots/{id}/reports` */
export type SpotReportReason = "wrong_location" | "no_access" | "duplicate" | "other";

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
  /** 닉네임 마지막 변경일·다음 변경 가능일(YYYY-MM-DD)과 지금 바꿀 수 있는지 — 30일 규칙은 서버가 판정 */
  nicknameChangedAt: string;
  nicknameChangeableAt: string;
  canChangeNickname: boolean;
}

/** 온보딩 제출 — `POST /api/v1/me/onboarding` (명세 §14) */
export interface OnboardingInput {
  nickname: string;
  potatoAvatar: PotatoAvatar;
  homeSido: string | null;
  marketingOptIn: boolean;
}

/** 감자 상태 — specs/04. hungry·sprouted는 방치 상태(서버 배치가 판정) */
export type PotatoState = "normal" | "hungry" | "sprouted";

/** 내 감자 — `GET /api/v1/me/potatoes` (specs/04). (사용자, 명소)당 하나 */
export interface Potato {
  id: string;
  spot: {
    id: string;
    name: string;
    /** 시·도 코드 */
    sido: string;
    /** 명소 좌표를 서버가 5 km 격자 인덱스로 바꾼 값 [x, y] */
    cell: [x: number, y: number];
  };
  /** Lv1~4 = min(4, 먹이 수) — 서버 계산 */
  level: 1 | 2 | 3 | 4;
  state: PotatoState;
  /** 먹이(기록) 수 */
  foodCount: number;
  /** 마지막 방문일 YYYY-MM-DD */
  lastVisitedOn: string;
  /** 최신 후기 발췌 */
  latestReview: string;
  isPublic: boolean;
}

/** 먹이 종류 — specs/04. 서버가 방문일 조건(이벤트 → 달 → 보틀 → 별)으로 결정 */
export type Food = "star" | "moon" | "planet" | "galaxy" | "meteor";

/** 먹이(기록) 한 건 — specs/04 `feeds` (명세 §18.5) */
export interface Feed {
  id: string;
  /** 방문일 YYYY-MM-DD */
  visitedOn: string;
  food: Food;
  review: string;
  photoUrls: string[];
  /** 먹이 결정에 쓰인 이벤트 (있을 때만) */
  eventId?: string;
}

/** 감자 상세 — `GET /api/v1/potatoes/{id}` (본인). 먹이는 최신순 */
export interface PotatoDetail extends Potato {
  feeds: Feed[];
  /** hungry 말풍선용 — 다음 major 이벤트. 없으면 null */
  nextMajorEvent: { title: string; dday: number } | null;
}

/** 기록 제출 — `POST /api/v1/spots/{id}/potato/feeds` (specs/04) */
export interface FeedInput {
  visitedOn: string;
  review: string;
  /** presign으로 올린 사진 키 — 업로드는 TODO라 지금은 항상 빈 배열 */
  photoKeys: string[];
  /** 감자 단위 공개 여부 */
  isPublic: boolean;
}

/** 기록 응답 — specs/04: `potato{level, state, food}`, `is_new_potato`, `level_up` */
export interface PlantResult {
  potato: Potato;
  feed: Feed;
  isNewPotato: boolean;
  levelUp: boolean;
}

/** 기록 수정 — `PATCH /api/v1/feeds/{id}` */
export interface FeedPatch {
  visitedOn?: string;
  review?: string;
}

/** 알림 유형 — specs/10 (MVP 4종 + system) */
export type NotificationType =
  "potato_hungry" | "event_alert" | "dark_window" | "index_high" | "system";

/** 알림 한 건 — `GET /api/v1/me/notifications?cursor=` (specs/10). 문구는 생성 시점 스냅샷 */
export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  /** 앱 내 경로 */
  link: string;
  /** ISO 생성 시각 */
  createdAt: string;
  /** ISO 읽은 시각. 안 읽었으면 null */
  readAt: string | null;
}

export interface NotificationPage {
  items: AppNotification[];
  nextCursor: string | null;
  unreadCount: number;
}

/** 알림 설정 — `PATCH /api/v1/me/notification-settings` (명세 §15). MVP는 앱 내 알림함 생성 여부 */
export interface NotificationSettings {
  meteorPeak: boolean;
  newMoonWindow: boolean;
  potatoHungry: boolean;
  /** Phase 2 (커뮤니티) */
  postComment: boolean;
  highIndex: boolean;
}

/** 프로필 수정 — `PATCH /api/v1/me` */
export interface UpdateMeInput {
  nickname?: string;
  potatoAvatar?: PotatoAvatar;
  homeSido?: string | null;
}

export type FeedbackType = "bug" | "feature" | "spot_fix" | "other";
/** 접수 → 확인 중 → 반영됨 / 보류 (명세 §16) */
export type FeedbackStatus = "received" | "reviewing" | "applied" | "held";

/** 내가 보낸 요청 — `GET /api/v1/me/feedback` */
export interface MyFeedback {
  id: string;
  type: FeedbackType;
  title: string;
  status: FeedbackStatus;
  /** YYYY-MM-DD */
  createdAt: string;
}

/** 문의에 붙이는 진단 정보 — 명세 §16. 제출 시점에 실제 값을 모은다 */
export interface Diagnostics {
  userAgent: string;
  /** "가로×세로" px */
  screen: string;
  /** 문의 화면 직전에 보던 경로 (없으면 null) */
  lastRoute: string | null;
  appVersion: string;
}

/** 문의 제출 — `POST /api/v1/feedback` */
export interface FeedbackInput {
  type: FeedbackType;
  title: string;
  body: string;
  /** 업로드한 스크린샷 키 (presign 업로드는 Phase 1 후반 — 지금은 항상 빈 배열) */
  screenshots: string[];
  diagnostics?: Diagnostics;
  replyByEmail: boolean;
  /** 비로그인 사용자가 적은 답변 받을 이메일 */
  email?: string;
}

export interface FeedbackReceipt {
  id: string;
}

/** 최근 반영된 요청 — 정적 목록 (명세 §16) */
export interface RecentChange {
  /** YYYY-MM-DD */
  date: string;
  title: string;
}

/* ── 커뮤니티 (Phase 2 · specs/06 디자인 메모) ───────────────────── */

/** 글 종류 5 — 후기 · 질문 · 모임 · 사진 응모 · 잡담 */
export type PostType = "review" | "question" | "meetup" | "photo" | "chat";

/** 피드 탭 — 추천 · 최신 · 모임 · 질문 · 잡담 · 이달의 사진 */
export type FeedTab = "recommended" | "latest" | "meetup" | "question" | "chat" | "photo";

export interface PostAuthor {
  id: string;
  /** 탈퇴하면 "탈퇴한 사용자" */
  nickname: string;
  avatarUrl: string | null;
  potatoAvatar: PotatoAvatar;
}

/** 명소 태그 — 오늘 밤 지수(0~100)는 서버가 계산해 내려준다 */
export interface PostSpotTag {
  id: string;
  name: string;
  tonightIndex: number;
}

/** 모임 글의 모임 카드 — specs/06 §6.3 필드 일부 */
export interface MeetupInfo {
  /** 만나는 시각 ISO */
  at: string;
  /** 집결 장소 */
  meetPoint: string;
  /** 정원 2~20 */
  capacity: number;
  joined: number;
  joinedByMe: boolean;
  /** 서버 판정 — 정원이 차면 full, 시각이 지나면 ended */
  status: "open" | "full" | "ended";
}

export interface PollOption {
  id: string;
  label: string;
  votes: number;
}

/** 질문 글의 투표 */
export interface PollInfo {
  options: PollOption[];
  total: number;
  /** 내가 고른 선택지. 안 했으면 null */
  myVote: string | null;
}

/** 후기 정보 — 방문일. 그날 밤 메타는 서버가 붙인다 */
export interface ReviewInfo {
  visitedOn: string;
}

/** 글 한 건 — `GET /api/v1/posts?tab=` */
export interface Post {
  id: string;
  type: PostType;
  author: PostAuthor;
  spot: PostSpotTag | null;
  body: string;
  photos: string[];
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  /** 태그된 명소를 내가 저장했는지 */
  spotSavedByMe: boolean;
  createdAt: string;
  /** 수정했으면 ISO 시각 → "(수정됨)" */
  editedAt: string | null;
  meetup: MeetupInfo | null;
  poll: PollInfo | null;
  reviewInfo: ReviewInfo | null;
  /** 이달의 사진 응모 */
  photoContest: boolean;
}

/** 후기 글의 "그날 밤" 메타 — 서버 값 */
export interface PostNightMeta {
  index: number;
  moonIllum: number;
  waxing: boolean;
  cloudPct: number | null;
}

/** 명소 편의 4타일 — 주차 · 화장실 · 차박 · 편의점 */
export interface PostFacilities {
  parking: number | null;
  toilet: boolean;
  carCamping: boolean;
  storeNearby: boolean;
}

export interface PostComment {
  id: string;
  author: PostAuthor;
  body: string;
  likeCount: number;
  likedByMe: boolean;
  createdAt: string;
}

/** 글 상세 — `GET /api/v1/posts/{id}` */
export interface PostDetail extends Post {
  night: PostNightMeta | null;
  facilities: PostFacilities | null;
  comments: PostComment[];
}

/** 글 작성·수정 — `POST /api/v1/posts` · `PATCH /api/v1/posts/{id}` */
export interface PostInput {
  type: PostType;
  spotId: string | null;
  body: string;
  /** presign으로 올린 사진 키 — 업로드는 TODO라 지금은 항상 빈 배열 */
  photoKeys: string[];
  reviewInfo: ReviewInfo | null;
  photoContest: boolean;
  meetup: { at: string; meetPoint: string; capacity: number } | null;
  poll: { options: string[] } | null;
}

/** 임시저장 — 폼 값 그대로 (사진은 저장하지 않는다) */
export interface PostDraft extends PostInput {
  savedAt: string;
}

/** 우측 레일 — `GET /api/v1/community/rail` */
export interface CommunityRail {
  /** 오늘 밤 뜨는 명소 — 지수 순위 */
  tonightSpots: { id: string; name: string; index: number }[];
  /** 이번 주 모임 */
  weekMeetups: {
    postId: string;
    title: string;
    at: string;
    spotName: string;
    joined: number;
    capacity: number;
  }[];
  /** 우주 뉴스 — RSS 자리. url이 없으면 링크 없이 보여준다 */
  news: { id: string; title: string; source: string; publishedAt: string; url: string | null }[];
  /** 이달의 사진 응모 */
  photoContest: {
    /** YYYY-MM */
    month: string;
    /** 응모 마감 YYYY-MM-DD */
    deadline: string;
    entries: { id: string; src: string; author: string; postId: string | null }[];
  };
  /** 오늘 밤 달 한 줄 */
  moon: { illum: number; waxing: boolean; line: string };
}

/* ── 장터 (Phase 2 · specs/07 장비 카테고리) ───────────────────────── */

/** 장비 카테고리 7 — specs/07 `gear.category`에서 app(천체 앱)은 중고 거래 대상이 아니라 뺐다 */
export type GearCategory =
  "binoculars" | "telescope" | "mount" | "camera" | "lens" | "tripod" | "accessory";

/** 상품 상태 */
export type ListingCondition = "new" | "like_new" | "good" | "used";
/** 거래 방식 */
export type TradeMethod = "meet" | "delivery" | "both";
/** 판매 상태 — 서버 값 */
export type ListingStatus = "selling" | "reserved" | "sold";
/** 가격 밴드 필터 — specs/07 `price_band` (만원) */
export type PriceBand = "under_10" | "10_30" | "30_100" | "over_100";

/** 장터 목록 한 칸 — `GET /api/v1/market/listings` */
export interface MarketListing {
  id: string;
  title: string;
  /** 원 */
  price: number;
  category: GearCategory;
  condition: ListingCondition;
  /** 시·도 코드 */
  sido: string;
  trade: TradeMethod;
  status: ListingStatus;
  createdAt: string;
  likeCount: number;
  likedByMe: boolean;
  viewCount: number;
  /** 사진 수 (최대 10). 이미지 자체는 Phase 2 백엔드 — 지금은 카테고리 아이콘 자리 */
  photoCount: number;
}

export interface MarketSeller {
  id: string;
  nickname: string;
  avatarUrl: string | null;
  potatoAvatar: PotatoAvatar;
  potatoCount: number;
  reviewCount: number;
  tradeCount: number;
}

/** 상품 상세 — `GET /api/v1/market/listings/{id}` */
export interface MarketListingDetail extends MarketListing {
  description: string;
  /** 구성품 한 줄 */
  includes: string;
  seller: MarketSeller;
}

/** 목록 필터 — 쿼리 파라미터 그대로 */
export interface MarketFilter {
  q: string;
  category: GearCategory | null;
  sido: string | null;
  price: PriceBand | null;
  trade: "meet" | "delivery" | null;
  sellingOnly: boolean;
}
