# Star-Spud 아키텍처

- 문서 버전: 1.0 (2026-09-02)
- 관련 문서: [PRD.md](./PRD.md) · [specs/](../specs/) · [ADR/](./ADR/)
- 이 문서는 **전체 제품** 기준으로 쓰되, MVP에서 빠지는 구성요소는 *(Phase 2+)* 로 표시한다.

---

## 1. 시스템 구성

```mermaid
flowchart LR
  subgraph clients [클라이언트]
    Web[React + TS 웹]
    iOS[iOS 앱 Swift *Phase 3*]
    Android[Android 앱 Kotlin *Phase 3*]
  end

  subgraph backend [백엔드 · Spring Boot]
    API[REST API /api/v1]
    Sched[스케줄러 @Scheduled]
    Admin[관리자 API /api/v1/admin]
  end

  subgraph data [데이터]
    PG[(PostgreSQL + PostGIS)]
    Redis[(Redis 캐시)]
    R2[(오브젝트 스토리지 R2 / S3)]
  end

  subgraph ext [외부]
    KMA[기상청 단기예보]
    KASI[한국천문연구원 *Phase 2*]
    MapSDK[지도 SDK 카카오|네이버 *ADR-0011* · OAuth · 길찾기]
    FCM[FCM 푸시 *Phase 3*]
  end

  Web --> API
  iOS --> API
  Android --> API
  Web -. 지도 SDK .-> MapSDK
  API --> PG
  API --> Redis
  API --> R2
  Sched --> PG
  Sched --> KMA
  Sched --> KASI
  API --> MapSDK
  API --> FCM
  Admin --> PG
  R2 -. 광공해 정적 타일 .-> Web
  Redis -. 격자 JSON · 캘린더 캐시 .-> API
```

- 클라이언트는 모두 같은 REST API를 쓴다. 웹·앱 공용 계약이므로 API에 웹 전용 가정을 넣지 않는다.
- 스케줄러는 API와 같은 프로세스 안에서 `@Scheduled`로 돈다 ([ADR-0004](./ADR/0004-no-celery-in-mvp.md)). 푸시가 생기는 시점에 별도 워커 + 큐로 분리한다. Redis는 캐시 용도.
- 광공해 오버레이는 서버가 아니라 오브젝트 스토리지의 정적 타일에서 직접 로드한다 ([ADR-0002](./ADR/0002-light-pollution-viirs.md)).

---

## 2. 백엔드

### 2.1 스택
Spring Boot 4.1 (Java 25) · Spring Web MVC · Spring Data JPA + Hibernate Spatial · Flyway · Spring Security OAuth2 Client + JWT · Spring Data Redis · `@Scheduled` · `RestClient` · springdoc-openapi · JUnit 5 + Testcontainers · Gradle (Kotlin DSL). 천문 계산은 KASI API 우선, JVM 천문 라이브러리는 검토 중.

### 2.2 디렉토리

```
backend/
├── src/main/java/com/starspud/
│   ├── StarSpudApplication.java
│   ├── config/            # 보안(JWT·OAuth2), Redis 캐시, 스케줄링, OpenAPI 설정
│   ├── common/            # 에러 응답 {code, message}(@RestControllerAdvice), 공통 DTO
│   ├── spot/              # 도메인 패키지 — 아래 구조를 도메인마다 반복
│   │   ├── controller/    # REST API (얇게)
│   │   ├── service/       # 비즈니스 로직·외부 연동
│   │   ├── repository/    # Spring Data JPA
│   │   ├── domain/        # JPA 엔티티
│   │   └── dto/           # 요청·응답 record + Bean Validation
│   ├── condition/         # 좋은 날 판정 (WeatherService: 기상청 호출·격자 변환·스냅샷, AstroService: 달·박명)
│   ├── event/  potato/  auth/  notification/  admin/
│   ├── (Phase 2+) post/  meetup/  gear/  follow/
│   └── scheduler/         # 스케줄 작업 진입점 (날씨 갱신, 감자 상태 배치) — 로직은 서비스에
├── src/main/resources/
│   ├── application.yml
│   └── db/migration/      # Flyway V*.sql
├── src/test/java/         # JUnit 5 · Testcontainers(PostGIS·Redis)
├── scripts/               # 시드(큐레이션 30곳), VIIRS 타일 생성
├── build.gradle.kts  settings.gradle.kts  gradlew  gradle/wrapper/
```

### 2.3 API 설계 원칙
- 접두사 `/api/v1`. 버전은 경로에 둔다. 앱 출시 후 호환성 깨는 변경은 v2로.
- springdoc이 만드는 OpenAPI 스키마가 프론트·앱의 계약이다. 프론트는 스키마에서 타입을 생성한다. 엔티티를 그대로 응답하지 않고 DTO를 거친다.
- 인증은 `Authorization: Bearer <access>`. access 30분, refresh 30일. refresh는 DB에 저장해 폐기 가능.
- 비로그인 허용 엔드포인트(지도·조건·이벤트·공개 감자 열람)는 인증을 선택적으로 받는다.
- 목록은 커서 페이지네이션. 지리 검색은 `bbox` 또는 `lat,lng,radius`.
- 에러는 `{ "code": "SPOT_NOT_FOUND", "message": "..." }` 형태로 통일.

### 2.4 주요 데이터 흐름

**날씨 스냅샷 갱신 (스케줄, 1시간마다).**
1. 모든 명소의 기상청 격자 좌표를 모은다 (명소 저장 시 위경도→격자 변환값을 컬럼에 둔다).
2. 격자별로 단기예보를 호출한다. 같은 격자를 공유하는 명소는 한 번만.
3. 날짜별 야간(일몰~자정) 하늘상태·구름량을 `weather_snapshots`에 upsert.

**관측 조건 응답.**
1. `weather_snapshots`에서 명소·날짜 구름량을 읽는다.
2. 달 조도·출몰·천문박명은 서버가 계산한다 — KASI 출몰시각·월령 API 응답을 Redis에 캐시하고 조도는 월령에서 계산. 명소 좌표 기준 계산이 필요해지면 JVM 천문 라이브러리로 보강(검토 중).
3. 판정 규칙(구름 ≤30% AND (달 ≤50% OR 자정 전 월몰))으로 `good | fair | bad` 산출.

**감자 방치 배치 (스케줄, 매일 새벽).**
1. 지나간 이벤트 중 "큰 이벤트"를 찾는다.
2. 각 감자에 대해 마지막 먹이 이후 지나간 큰 이벤트 수를 센다. 1회 → `hungry` + 알림 생성, 2회 이상 → `sprouted`.
3. 상태 변화가 있을 때만 `notifications`에 기록한다.

**감자 심기 / 먹이 주기.**
1. 사용자가 명소·날짜·후기·사진을 보낸다.
2. 같은 사용자·명소의 감자가 있으면 먹이 추가, 없으면 새 감자 생성.
3. 먹이 종류는 방문일의 이벤트·달 조도·명소 보틀 등급으로 서버가 결정한다.
4. 등급 = min(4, 1 + 먹이 수). 상태는 `normal`로 회복.

---

## 3. 데이터 모델

핵심 테이블. *(Phase 2+)* 표시는 MVP에서 만들지 않는다.

```
users              id, nickname(유니크, 2~12자, 30일 1회 변경), avatar_url?, potato_avatar(basic|happy|sad), home_sido?, email?, role(user|admin), created_at, deleted_at
auth_identities    id, user_id, provider(kakao|naver|email), provider_uid|email, password_hash?, created_at   (유니크: provider+uid) — ADR-0014
refresh_tokens     id, user_id, token_hash, family_id, expires_at, revoked_at, user_agent

spots              id, name, type(nature|observatory|camping|suburban), geom(Point 4326),
                   bortle(1..9), access(car|walk|transit[]), paved, car_camping, parking, toilet,
                   horizon_dirs(N,E,S,W 개방 여부), horizon_alt(도), description,
                   kma_grid_x, kma_grid_y, source(curated|public|ugc), created_by, status(active|under_review|hidden)
spot_photos        id, spot_id, url, uploaded_by
spot_reports       id, spot_id, user_id, reason, created_at, resolved_at   (유니크: spot_id+user_id)
spot_notes         id, spot_id, user_id, category(road|parking|gate|safety|other), body, helpful_count, status  (Phase 2)
weather_snapshots  spot_id, target_date, cloud_pct, sky_code, fetched_at   (PK: spot_id+target_date)

grid_cells         nx, ny, res(5km|1km|500m), lp_level(0..4), elevation_m, sido_code, sigungu_code, star_score(0..100), updated_at   (PK: res+nx+ny) — specs/11
calendar_days      location, date, sunrise, sunset, moonrise?, moonset?, astm_start, astm_end, lun_age, fetched_at   (PK: location+date) — specs/12, Redis 캐시 우선
photo_of_month     id, month, feed_id, likes_snapshot, selected_at
feedback           id, user_id?, type(bug|feature|spot_fix|other), title, body, screenshots[], diagnostics(json), status(received|reviewing|done|held), created_at

events             id, type(meteor|solar_eclipse|lunar_eclipse|supermoon|planet|comet|other), name, peak_at(UTC),
                   starts_at, ends_at, is_major, visible_in_kr, description, tips, zhr, radiant, direction,
                   source(manual|kasi), external_id, deleted_at
event_alerts       id, user_id, event_id, offset(d7|d1|d0)                          (Phase 2)

potatoes           id, user_id, spot_id, level(1..4), state(normal|hungry|sprouted),
                   is_public, planted_at, last_fed_at
potato_feeds       id, potato_id, visited_on, food(star|moon|planet|galaxy|meteor),
                   review, photo_urls[], event_id?, created_at
potato_feed_gear   feed_id, gear_id                                                  (Phase 2)

notifications      id, user_id, type(potato_hungry|event_alert|...), payload(json 스냅샷), link, read_at, created_at,
                   dedupe_key   (유니크: user_id+dedupe_key)
device_tokens      id, user_id, platform(web|ios|android), token, created_at         (Phase 3)

posts              id, user_id, spot_id?, type(review_q|free), title, body, created_at  (Phase 2)
comments           id, post_id, user_id, body                                        (Phase 2)
meetups            id, host_id, event_id, spot_id, meet_at, capacity, description    (Phase 3)
meetup_members     meetup_id, user_id, status                                        (Phase 3)
follows            follower_id, followee_id                                          (Phase 3)
gear               id, category, name, brand, price_range, curated_note              (Phase 2)
gear_reviews       id, gear_id, user_id, rating, body                                (Phase 2)
```

- 공간 인덱스: `spots.geom`에 GiST.
- 감자는 (user_id, spot_id) 유니크. 재방문은 `potato_feeds` 행 추가. (potato_id, visited_on)도 유니크.
- 컬럼 수준의 규칙과 엣지 케이스는 `specs/`가 기준이다. 여기 표와 어긋나면 specs를 따르고 이 표를 고친다.
- 사진은 스토리지에 올리고 URL만 저장한다. 업로드는 서버가 presigned URL을 발급한다.

---

## 4. 프론트엔드 (웹)

- React 19 + TypeScript + Vite. 상태는 TanStack Query(서버 상태) + 최소한의 로컬 상태.
- 라우팅([ADR-0012](./ADR/0012-home-and-ia.md)): `/` 홈(벤토) · `/map` 별보기 · `/map/lp[/:sido]` 광공해·퍼즐 · `/map/weather` · `/map/terrain` · `/map/field` · `/calendar` · `/spots/:id` · `/me`(프로필: 감자밭·활동·설정) · `/community`·`/market`(MVP는 준비 중) · `/login` · `/feedback` · `/notifications`.
- 지도는 두 렌더러([ADR-0011](./ADR/0011-map-rendering-hybrid.md)): 도트 격자 `<MapCanvas>`(전국 개요·퍼즐·감자밭)와 지도 SDK `<NaverMap>`/`<KakaoMap>`(내 위치·핀·날씨·지형·상세). 핀 색과 점수 구간은 API 값으로만 결정한다. 판정 로직을 프론트에 두지 않는다.
- 광공해 오버레이(SDK 쪽): 커스텀 타일셋 `https://<storage>/lp/{z}/{x}/{y}.png`. 도트 지도는 `GET /api/v1/grid/starscore` JSON을 canvas에 그린다.
- 데이터 계층: 현재 `src/data/index.ts`의 함수(`getTonight()`, `getCalendar()` …)가 `VITE_API_BASE` 유무로 API/mock JSON을 고른다. 백엔드 API가 생기면 TanStack Query + `openapi-typescript` 생성 타입으로 교체한다(함수 시그니처 유지).
- 디렉토리(구현 기준): `src/app`(라우터·레이아웃·theme.css) · `src/pages` · `src/components/{bento,map,gauge,ui}` · `src/data`(mock·API 함수·타입) · `src/lib`(격자·달·시간·퍼즐 계산). 디자인 토큰·치수는 `docs/FRONTEND_SPEC.md`.

---

## 5. 외부 연동

| 연동 | 용도 | 비고 |
|---|---|---|
| 기상청 단기예보 API | 구름량·하늘상태 | 격자 좌표. 3일 예보. 공공데이터포털 키 |
| 한국천문연구원 API (MVP, [ADR-0013](./ADR/0013-calendar-in-mvp.md)) | 출몰시각·월령·천문현상·특일 4종 → 캘린더·이벤트 자동 적재 | 월 단위 캐시. 서비스 키는 서버만 |
| 달 위상·조도·출몰·박명 | 관측 조건·캘린더 | 서버 계산 (KASI API + 자체 계산, JVM 천문 라이브러리 검토 중) |
| NASA/NOAA VIIRS 야간광 | 보틀 등급·오버레이 | 연 1회 갱신. 오프라인 처리 |
| 지도 SDK (카카오 또는 네이버, 미정) | 내 위치 기준 명소 지도·날씨·지형 | 프론트. [ADR-0011](./ADR/0011-map-rendering-hybrid.md) |
| 행정구역 GeoJSON(시도·시군구) | 격자 셀에 지역 코드 부여 | 공공데이터포털, 연 1회 오프라인 |
| Copernicus DEM / 국내 DEM | 격자 해발고도 | 연 1회 오프라인 |
| 에어코리아 API *(Phase 2)* | 미세먼지(날씨 탭) | 측정소 단위 |
| 카카오 OAuth (MVP) · 네이버 OAuth *(Phase 2)* | 로그인 | Spring Security OAuth2 Client, [ADR-0014](./ADR/0014-auth-methods.md) |
| 카카오 모빌리티 길찾기 *(Phase 2)* | 앱 내 경로 | 서버 프록시 |
| FCM *(Phase 3)* | 웹·iOS·Android 푸시 | 단일 발송 백엔드 |

---

## 6. 광공해 파이프라인 (오프라인 스크립트)

1. VIIRS 연간 합성 래스터(한반도 영역) 내려받기.
2. `scripts/lp_sample.py`: 각 명소 좌표의 복사휘도 값을 읽어 보틀 등급으로 근사 변환 → `spots.bortle` 갱신.
3. *(스트레치)* `scripts/lp_tiles.sh`: GDAL로 색상 램프 적용 → `gdal2tiles`로 z 6~12 타일 생성 → 스토리지 `lp/` 경로에 업로드.
4. 연 1회 반복. 서버 런타임 의존성 없음.

---

## 7. 배포·운영

- PaaS(Fly.io / Railway / Render 중 택1)에 백엔드 컨테이너 + 관리형 PostgreSQL(PostGIS). 프론트는 정적 호스팅(같은 PaaS 또는 Cloudflare Pages). 사진·타일은 Cloudflare R2. ([ADR-0005](./ADR/0005-paas-deploy.md))
- 로컬: `docker-compose.yml`로 PostGIS와 Redis를 띄운다. `./gradlew bootRun`이 꺼져 있으면 자동으로 띄우고 접속 정보를 연결한다.
- 환경 변수: `.env.example`에 전체 키 목록 유지. 시크릿은 PaaS 대시보드.
- CI: PR마다 백엔드 `./gradlew test`, 프론트 `lint` + `tsc -b`. CD: `main` 머지 시 배포 (베타 직전 세팅).
- 브랜치: `main`(릴리즈) ← `develop` ← `feat/*`. ([ADR-0008](./ADR/0008-branching-and-commits.md))

---

## 8. 앱 단계에서 바뀌는 것 *(Phase 3)*

- `device_tokens` 테이블과 FCM 발송 서비스 추가. 알림 생성 로직은 그대로 두고 발송 채널만 추가된다.
- 애플 로그인 추가 (iOS 소셜 로그인 필수 조건).
- 별도 워커 + 큐 도입 (푸시 발송량과 재시도 관리).
- API v1 동결. 앱이 참조하는 스키마는 깨지 않는다.
