# 10. 알림

- Phase: **MVP는 앱 내 알림함 + 유형별 on/off 설정**(유성우 극대기 전날 · 신월/촬영 적기 시작 · 감자 배고픔 · 오늘 밤 지수 80 이상). 댓글 알림은 Phase 2, 이벤트별 알림 시점 선택(D-7/D-1/당일, [03](./03-events.md))은 Phase 2, 푸시(FCM)는 Phase 3. (11/1 `docs/FRONTEND_SPEC.md` §15 설정 화면에 맞춰 조정)
- 관련: [ADR-0003](../docs/ADR/0003-notifications-in-app-first.md) · [04 감자](./04-potato.md) · [03 이벤트](./03-events.md) · [06 커뮤니티](./06-community.md)

## 목적
감자 배고픔, 이벤트 예고, 커뮤니티 반응을 한 곳에 모아 보여주고, 채널(앱 내·푸시)이 늘어나도 생성 로직을 바꾸지 않게 한다.

## 데이터
```
notifications  id, user_id, type, payload(json), link(앱 내 경로), read_at, created_at, dedupe_key
```
- `type`: `potato_hungry`(MVP) · `event_alert`(MVP, major 이벤트 극대기 전날) · `dark_window`(MVP, 촬영 적기 시작) · `index_high`(MVP, 오늘 밤 지수 80 이상) · `spot_under_review`(P2, 등록자에게) · `post_comment` `post_like`(P2) · `meetup_*`(P3) · `system`.

```
notification_settings  user_id(PK), meteor_peak(기본 on), new_moon_window(기본 off), potato_hungry(기본 on), post_comment(P2, 기본 off), high_index(기본 on)
```
- 사용자당 한 행. 온보딩 완료 시 기본값으로 생성한다. 설정 화면(`docs/FRONTEND_SPEC.md` §15)의 토글 5개와 1:1.
- `payload`는 표시에 필요한 값을 **스냅샷**으로 담는다(명소명, 이벤트명, D-day 등). 원본이 바뀌거나 삭제돼도 알림은 그대로 읽힌다.
- `dedupe_key`: `(user_id, dedupe_key)` 유니크. 예: `potato_hungry:{potato_id}:{event_id}`. 같은 키로 재생성하면 무시.

## 기능 상세

### 알림함 (`/notifications`)
- 최신순, 커서 페이지네이션, 읽지 않은 항목 굵게. 헤더 아이콘에 미읽음 수 배지(최대 "99+").
- 항목 탭 → `link`로 이동 + 읽음 처리. "모두 읽음" 버튼.
- 90일 지난 알림은 배치로 삭제.
- 사용자 설정(MVP): 유형별 on/off. `GET /api/v1/me/notification-settings` · `PATCH /api/v1/me/notification-settings {meteorPeak?, newMoonWindow?, potatoHungry?, highIndex?}`. 꺼진 유형은 생성 자체를 건너뛴다(`notify()`가 설정을 확인). `post_comment`는 Phase 2라 PATCH에서 무시한다.

### 생성 규칙 (서비스 함수 `notify(user_id, type, payload, link, dedupe_key)`)
- 모든 도메인 코드는 이 함수만 호출한다. 채널 분기는 이 함수 안에서 한다.
- MVP: DB에 행 삽입만.
- Phase 3: 삽입 후 `device_tokens`가 있으면 FCM 발송을 큐에 넣는다(별도 워커, ADR-0004). 발송 실패는 알림함에 영향 없음.

### 유형별 규칙
| 유형 | 트리거 | dedupe | 링크 |
|---|---|---|---|
| potato_hungry | 감자 배치 normal→hungry | potato_id + 기준 이벤트 id | 감자 상세 |
| event_alert | `is_major` 이벤트 극대기 **전날 19:00** 일일 배치, `meteor_peak` on인 사용자 전부 (이벤트별 시점 선택은 P2, [03](./03-events.md)) | event_id | 캘린더 해당 월 |
| dark_window | [12 캘린더](./12-calendar.md) 촬영 적기 띠 **시작일 19:00** 일일 배치, `new_moon_window` on | 시작일 | 캘린더 |
| index_high | 매일 17:00 10일 지수 계산 뒤 `home_sido` 기준 **오늘** 점수 ≥ 80, `high_index` on ([02](./02-observing-conditions.md)) | sido + date | 홈 |
| spot_under_review (P2) | 신고 3건 누적 | spot_id | 명소 상세 |
| post_comment (P2) | 내 글에 댓글 | comment_id | 글 |
| meetup_* (P3) | 신청·승인·취소 | meetup_id + 상태 | 모임 |

## 엣지 케이스
| 상황 | 동작 |
|---|---|
| 배치가 중복 실행 | dedupe_key로 무시 |
| 알림 대상 감자·이벤트가 삭제됨 | payload 스냅샷으로 표시. 링크 이동 시 404면 "삭제된 항목이에요" 토스트 |
| 읽음 처리 요청이 중복 | 멱등, 200 |
| 타인의 알림 읽음 처리 시도 | 404 |
| 미읽음이 수천 건 | 배지는 "99+", 목록은 페이지네이션 |
| 사용자가 유형을 끈 뒤 다시 켬 | 꺼진 동안의 알림은 소급 생성하지 않음 |
| `home_sido`가 없음 | `index_high`는 생성하지 않음. 설정 화면 부제에 "주로 보는 지역 기준" 안내 |
| 극대기 전날 배치가 돌기 전에 이벤트가 추가됨(극대기까지 1일 미만) | 다음 배치에서 "전날"이 지났으면 건너뜀. 소급 발송 없음 |
| FCM 토큰 만료·무효(P3) | 발송 실패 응답에서 토큰 삭제 |
| 같은 사용자의 여러 기기(P3) | 모든 토큰에 발송, 한 기기에서 읽으면 서버 read_at 갱신, 다른 기기는 다음 조회 때 반영 |
| 야간 발송(P3) | 22:00~08:00에는 푸시 보류, 알림함에는 즉시. 이벤트 당일 알림은 예외 없음(15시 발송) |
| 탈퇴 | 알림 전부 삭제 |

## 완료 기준

**MVP**
- [ ] `notify()` 함수와 dedupe 유니크 제약, 중복 호출 테스트.
- [ ] 감자 배치에서 hungry 전이 시 알림 1건 생성, 재실행 시 0건 테스트.
- [ ] 알림함 목록·읽음·모두 읽음·미읽음 배지가 동작한다.
- [ ] 90일 정리 배치.
- [ ] 유형별 설정 GET/PATCH, 꺼진 유형은 `notify()`가 건너뛰는 테스트.
- [ ] 이벤트 극대기 전날 · 촬영 적기 시작 · 지수 80 이상 배치가 각각 알림 1건을 만들고, 재실행 시 0건(dedupe).

**Phase 2~3**
- [ ] 이벤트별 알림 시점 선택(D-7/D-1/당일), 댓글 알림, FCM 발송·토큰 정리·야간 보류.

## 미결
- 이메일 채널 도입 여부와 시점.
