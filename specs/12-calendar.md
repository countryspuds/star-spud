# 12. 천문 캘린더

- Phase: **MVP** (ADR-0013). 알림 설정·은하수 출몰시각은 Phase 2
- 관련: [ADR-0013](../docs/ADR/0013-calendar-in-mvp.md) · [03 이벤트](./03-events.md) · [04 감자](./04-potato.md) · `docs/FRONTEND_SPEC.md` §11

## 목적
"언제 가야 하는가"에 월 단위로 답한다. 일별 출몰시각·달 조도·천문현상을 한 장에 두고, 달 없는 밤(하현~상현)을 띠로 보여준다.

## 데이터 (KASI OpenAPI, 공공데이터포털)
| 요소 | API | 호출 |
|---|---|---|
| 일출·일몰·월출·월몰·천문박명 | `RiseSetInfoService/getAreaRiseSetInfo` (`locdate`, `location`) | 하루 1회 × 일수 |
| 월령 → 달 조도·상현/하현 | `LunPhInfoService/getLunPhInfo` | 월 1회 |
| 유성우·행성·근일점 등 | `AstroEventInfoService/getAstroEventInfo` (`solYear`, `solMonth`) | 월 1회 |
| 24절기·공휴일 | `SpcdeInfoService/get24DivisionsInfo`, `getHoliDeInfo` | 월 1회 |

- 서버가 **월 단위로 미리 받아** Redis에 캐시(키 `calendar:{yyyy-mm}:{location}`), 월초와 매일 05:00 갱신. 프론트는 한 번만 호출.
- 달 조도 % = `round(((1 − cos(2π · lunAge / 29.53)) / 2) × 100)` (정수 0~100, 보름 = 100), `waxing = lunAge < 14.77`. 아이콘은 조도를 10 단위로 반올림한 픽셀 달(0 → `moon-000`, 100 → `moon-100`).
- 천문현상 응답의 `astroTitle`로 `events` 테이블에 `source=kasi` 행을 upsert한다(`external_id` = 날짜+seq). **`is_major`는 [03 이벤트](./03-events.md)의 기준(3대 유성우 극대기·한국에서 보이는 일식·월식·슈퍼문)만 따른다** — 감자 방치 판정에 쓰이므로 캘린더 강조와 섞지 않는다. 캘린더 강조용 `important`는 아래 규칙으로 응답 시점에 계산하는 별도 값이며 DB에 저장하지 않는다.
- 기준 지역: 사용자의 "주로 보는 지역"(없으면 서울).

## 규칙
- 촬영 적기 띠 = 하현일 ~ 상현일.
- 중요 현상(`important`, 라임 테두리) = 신월 · 보름 · ZHR ≥ 10 유성우 극대 · 일식·월식 · 슈퍼문. `is_major`와 독립.
- 한 줄 답 "달 없는 완전한 밤" = 관측 창 `[천문박명 끝, 다음 날 천문박명 시작]`에서 **달이 떠 있는 구간 `[월출, 월몰]`(자정을 넘길 수 있고, 전날 월출이 이어질 수 있음)을 뺀 나머지 중 가장 긴 구간**. 예: 밤 19:00~05:00, 달 18:00~23:00이면 23:00~05:00. 남는 구간이 없으면 "오늘은 밤새 달이 떠 있어요". 프론트 `src/lib/night.ts`와 같은 규칙.

## API
- `GET /api/v1/calendar?year=2026&month=11&location=서울` →
```json
{ "days": [ { "date": "2026-11-05", "sunrise": "07:02", "sunset": "17:28", "moonrise": "01:12", "moonset": "14:40",
             "astmEnd": "19:00", "astmStart": "05:33", "lunAge": 24.3, "moonIllum": 23, "waxing": false,
             "events": [ { "id": 41, "title": "남타우리드 유성우 극대", "time": "", "desc": "ZHR 5~10", "important": false, "isMajor": false } ],
             "darkWindow": { "from": "19:00", "to": "01:12" },
             "shootingWindow": true, "holiday": null } ],
  "events": [ … 월 전체 … ] }
```

## 엣지 케이스
| 상황 | 동작 |
|---|---|
| KASI API 장애 | 캐시된 지난 응답 유지 + `stale: true`. 캐시도 없으면 503, 프론트는 오류 화면 + 재시도 |
| 월출·월몰이 없는 날(`----`) | `null`. 띠·게이지는 전날 값으로 이어 그림 |
| 미래 13개월 이후 요청 | 400 `CALENDAR_OUT_OF_RANGE` |
| 같은 날 현상이 여러 개 | `events` 배열, 중요 현상 먼저 |

## 완료 기준
- [ ] `calendar/service`에 월령→조도·방향, 촬영 적기 띠, 한 줄 답 계산의 JUnit 테스트.
- [ ] 11월 캘린더가 실제 KASI 값으로 뜨고 `frontend/src/data/calendar-2026-11.json` mock이 제거된다.
