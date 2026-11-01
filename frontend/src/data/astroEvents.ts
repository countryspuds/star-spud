/**
 * 천체 이벤트 표 (mock) — specs/03 `events`의 일부. 먹이 결정·방치 판정·배고픔 알림 문구의 "서버 데이터" 역할.
 * Phase 2: 백엔드 `events` 테이블. 날짜는 한국 기준 극대기/현상일.
 */
export interface MockEvent {
  id: string;
  title: string;
  /** YYYY-MM-DD */
  date: string;
  type: "meteor" | "planet" | "moon";
  isMajor: boolean;
}

export const MOCK_EVENTS: MockEvent[] = [
  {
    id: "e_quad_2026",
    title: "사분의자리 유성우",
    date: "2026-01-03",
    type: "meteor",
    isMajor: true,
  },
  { id: "e_jupiter_2026", title: "목성 충", date: "2026-01-10", type: "planet", isMajor: false },
  { id: "e_lunar_2026_03", title: "개기월식", date: "2026-03-03", type: "moon", isMajor: true },
  {
    id: "e_lyrid_2026",
    title: "거문고자리 유성우",
    date: "2026-04-22",
    type: "meteor",
    isMajor: false,
  },
  {
    id: "e_eta_2026",
    title: "물병자리 에타 유성우",
    date: "2026-05-06",
    type: "meteor",
    isMajor: false,
  },
  {
    id: "e_perseid_2026",
    title: "페르세우스 유성우",
    date: "2026-08-12",
    type: "meteor",
    isMajor: true,
  },
  { id: "e_lunar_2026_08", title: "부분월식", date: "2026-08-28", type: "moon", isMajor: false },
  {
    id: "e_orionid_2026",
    title: "오리온자리 유성우",
    date: "2026-10-21",
    type: "meteor",
    isMajor: false,
  },
  {
    id: "e_staurid_2026",
    title: "남타우리드 유성우",
    date: "2026-11-05",
    type: "meteor",
    isMajor: false,
  },
  {
    id: "e_leonid_2026",
    title: "사자자리 유성우",
    date: "2026-11-17",
    type: "meteor",
    isMajor: true,
  },
  {
    id: "e_geminid_2026",
    title: "쌍둥이자리 유성우",
    date: "2026-12-14",
    type: "meteor",
    isMajor: true,
  },
];

/** 오늘 이후 가장 가까운 major 이벤트 (없으면 null) */
export function nextMajorEvent(today: string): MockEvent | null {
  return MOCK_EVENTS.find((e) => e.isMajor && e.date >= today) ?? null;
}
