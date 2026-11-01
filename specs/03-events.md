# 03. 천체 이벤트

- Phase: **MVP는 데이터 + 캘린더 뷰 + KASI 연동**([ADR-0013](../docs/ADR/0013-calendar-in-mvp.md), [12 캘린더](./12-calendar.md)). 유성우 극대기 전날 알림(전역 on/off)은 MVP([10 알림](./10-notifications.md)), 유성우 외 이벤트 알림과 이벤트별 시점 선택은 Phase 2. 별도 `/events` 목록 화면은 만들지 않고 캘린더 하단 리스트가 대신한다.
- 관련: [04 감자](./04-potato.md)(방치 판정에 사용) · [10 알림](./10-notifications.md) · [02 관측 조건](./02-observing-conditions.md)

## 목적
"언제 별을 보러 가야 하는가"에 답한다. 유성우 극대기, 식, 슈퍼문, 행성 이벤트를 한국 기준 시각으로 제공하고, 감자 시스템의 시계 역할을 한다.

## 사용자 스토리
- 입문자로서 이번 달에 볼 만한 게 뭔지 목록으로 보고 싶다.
- 계획하는 사용자로서 유성우 전날 알림을 받고 싶다(MVP, [10 알림](./10-notifications.md)). 일주일 전 등 시점 선택은 Phase 2.
- 취미가로서 극대기 시각, 복사점, 시간당 예상 유성 수(ZHR)를 알고 싶다.

## 데이터

```
events
  id, type(meteor|solar_eclipse|lunar_eclipse|supermoon|planet|comet|other)
  name            "페르세우스자리 유성우"
  peak_at         UTC 저장, KST 표시
  starts_at, ends_at   기간형 이벤트(유성우 활동기)에만. 단발 이벤트는 peak_at과 동일
  is_major        감자 방치 판정에 쓰이는 "큰 이벤트" 여부
  visible_in_kr   한국에서 관측 가능 여부
  description, tips(관측 팁), zhr, radiant(복사점 텍스트), direction(방위 텍스트)
  source(manual|kasi), external_id
```

- **is_major 기준(초기)**: 3대 유성우(사분의자리·페르세우스·쌍둥이자리) 극대기, 한국에서 보이는 일식·월식, 슈퍼문. 그 외(소규모 유성우, 행성 접근, 혜성)는 minor. 관리자가 개별 조정 가능.
- MVP: 한국천문연구원 천문현상 API에서 월 단위로 받아 `source = kasi`로 upsert([12 캘린더](./12-calendar.md)). `is_major`는 위 기준으로 서버가 제목 키워드로 정하고 관리자가 개별 조정. 수동 항목(`source = manual`)은 `external_id`로 매칭하며 수동 값이 우선.
- 캘린더 강조(`important`)는 `is_major`와 다른 값이다. 신월·보름·ZHR ≥ 10 유성우도 강조하지만 감자 방치 판정에는 쓰지 않는다.

## 기능 상세

### MVP: 캘린더 안의 이벤트 (`/calendar`, [12 캘린더](./12-calendar.md))
- 별도 `/events` 목록 화면은 없다. 월 캘린더의 날짜 셀에 현상 제목을, 하단 "이번 달 천문현상" 리스트에 날짜순 항목(유형 아이콘, 이름, 극대기 KST, major 배지, 한국 관측 가능 여부, 한 줄 팁)을 보여준다. 홈의 "다가오는 이벤트 3개"도 같은 데이터.
- 항목 탭 → 이벤트 상세(모달 또는 `/calendar/events/:id`): 설명, 팁, ZHR·복사점·방위, 극대기 밤의 달 조도(서버 계산, 사용자 지역 기준).
- 극대기가 오늘~모레 안이면 "조건 좋은 명소" 상위 5곳(전국, `good` 우선, 거리순)을 보여준다.
- 지난 이벤트는 캘린더의 이전 달로 이동해 본다.

### Phase 2: 알림 설정
- 이벤트별 알림 시점 선택(D-7 / D-1 저녁 19시 / 당일 15시). `event_alerts(user_id, event_id, offset)`.
- 알림 발송은 [10 알림](./10-notifications.md) 규칙에 따른다. D-1·당일 알림에는 사용자 위치 기준(최근 지도 중심) 조건 좋은 명소 3곳을 포함한다.

## API
- `GET /api/v1/events?from=&to=&major_only=` → 목록(KST 변환은 클라이언트, 응답은 ISO 8601 with offset).
- `GET /api/v1/events/{id}` → 상세 + `moon_illumination_at_peak` + `recommended_spots`(범위 안일 때만).
- `PUT /api/v1/events/{id}/alerts` (auth, Phase 2) → `{offsets: ["d7","d1"]}`.

## 엣지 케이스
| 상황 | 동작 |
|---|---|
| 극대기가 한국 시간으로 낮 시간 | 그대로 표시하되 팁에 "극대기 전날 밤/당일 밤 중 어느 쪽이 유리한지"를 운영자가 적는다. 감자 판정은 극대기 날짜의 밤을 쓴다 |
| 한국에서 안 보이는 일식 | `visible_in_kr = false`. 목록에는 표시하되 흐리게, major로 등록 불가(저장 시 검증) |
| 유성우 활동기(2주)와 극대기(1일) | 목록·판정은 극대기 기준. 상세에 활동기 표시 |
| 같은 밤에 이벤트 2개 이상 | 둘 다 표시. 감자 먹이 결정은 major 우선, 같으면 유형 우선순위 meteor > planet > 기타 |
| 이벤트 시각이 수정됨 | 감자 방치 배치는 매일 다시 계산하므로 자동 반영. 이미 보낸 배고픔 알림은 회수하지 않는다 |
| 이벤트가 삭제됨 | 소프트 삭제(`deleted_at`). 판정에서 제외. 참조하는 `potato_feeds.event_id`는 유지 |
| 알림 설정 시점에 D-7이 이미 지남(Phase 2) | 남은 offset만 예약. UI에서 지난 옵션은 비활성 |
| 이벤트가 하나도 등록되지 않음 | 목록에 "등록된 이벤트가 없어요". 감자 방치 배치는 아무것도 바꾸지 않는다 |
| UTC/KST 경계: 극대기 UTC 9월 2일 16:00 = KST 9월 3일 01:00 | "9월 2일 밤"으로 묶는다. 관측 창 규칙([02](./02-observing-conditions.md))과 동일하게 새벽 4시 이전은 전날 밤 |
| KASI 데이터와 수동 데이터 충돌 | 수동 값 우선. 차이 목록 관리자 표시는 Phase 2 |
| KASI API 장애로 그 달 적재 실패 | 기존 `events` 행 유지. 캘린더는 [12](./12-calendar.md)의 stale 규칙 |

## 완료 기준

**MVP**
- [ ] KASI 천문현상 API 월 단위 적재(`source = kasi`, `external_id` 매칭)와 `is_major` 키워드 판정에 JUnit 테스트가 있다. `visible_in_kr = false`인 이벤트는 major로 저장되지 않는다(테스트).
- [ ] 관리자 API로 이벤트를 수동 등록·수정할 수 있고 수동 값이 KASI 값보다 우선한다.
- [ ] 캘린더 셀과 하단 리스트, 홈 이벤트 카드가 같은 `events` 데이터를 KST로 보여준다.
- [ ] 극대기 밤 달 조도가 상세에 표시된다.
- [ ] 2026-12 ~ 2027-12 범위에 3대 유성우 3건과 한국에서 보이는 식이 `is_major`로 들어 있다(KASI 적재 후 검증).
- [ ] UTC → "어느 날 밤" 매핑 함수에 경계 테스트가 있다.

**Phase 2**
- [ ] 알림 설정 저장·발송, KASI·수동 충돌 목록 관리자 표시.

## 미결
- 슈퍼문을 major로 둘지(달이 밝아 별 관측엔 불리). 초기값은 major이되 먹이 유형은 `moon`.
- 행성 이벤트의 범위(충, 최대 이각, 합 중 무엇을 등록할지).
