# 🥔⭐ Star-Spud (별보러감자)

> **별 보러 감자!** 별 보기 좋은 곳을 *어디·언제* 가야 할지 찾고, 잘 보러 가고, 그 경험을 '감자'로 기록·공유하는 천체관측 플랫폼.

대한민국 전국의 별 관측 명소를 광공해·날씨·달 정보와 함께 지도로 보여주고, 천체 이벤트 캘린더로 관측 타이밍을 알려주며, 다녀온 곳엔 '감자'를 심어 나만의 관측 기록을 쌓을 수 있습니다.

---

## 주요 기능

| 기능 | 설명 |
|---|---|
| **명소 지도** | 전국 관측 명소 + 광공해(보틀 등급)·구름량·달 위상·박명 시각 오버레이, 차박·접근성 필터 |
| **천체 이벤트 캘린더** | 유성우 극대기·일식/월식·슈퍼문 등 + 해당 날짜 날씨·월령, 알림 |
| **감자 심기** | 후기·사진을 남기면 명소에 감자가 심김. **영구 기록 + 시간이 지나면 싹이 터** 재방문을 유도 |
| **경로 추천** | 산·외곽 명소까지 진입로 메모·주차 정보 포함 길안내 |
| **커뮤니티** | 후기·질문·모임(이벤트 기반 번개 포함) |
| **장비 추천** | 망원경·쌍안경 등 추천/순위/후기 *(예정)* |
| 🧑**관측 장인** | 장비·지식을 가진 장인과의 P2P 관측 세션 *(후순위 / 미확정)* |

---

## 기술 스택

**Frontend**
- React + TypeScript (Vite)
- 카카오맵 / 네이버지도 SDK
- ESLint + Prettier (코드 품질·포매팅)
- 서비스워커 (웹 푸시 알림)

**Backend**
- Spring Boot 4.1 (Java 25)
- 빌드: **Gradle** (Kotlin DSL, Wrapper 포함)
- Spring Data JPA + Hibernate Spatial (PostGIS 공간 쿼리) + Flyway (마이그레이션)
- Spring Security OAuth2 Client (카카오/네이버 로그인) + JWT
- Spring Data Redis (캐시) + `@Scheduled` (알림 푸시·외부 데이터 주기 갱신)
- 천문 계산(달 위상·이벤트): 한국천문연구원 API 우선, JVM 천문 라이브러리 병행 검토
- springdoc-openapi (API 문서 → 프론트 타입 생성)
- JUnit 5 + Testcontainers (테스트)

**Data / Infra**
- PostgreSQL + PostGIS
- Redis (캐시)
- 오브젝트 스토리지 (S3 호환, 후기 사진)

**외부 데이터** — 기상청(날씨) · 한국천문연구원(천문) · 광공해 지도 · 카카오/네이버(지도·길찾기)

---

## 프로젝트 구조

```
star-spud/
├── frontend/                # React + TypeScript (Vite)
│   ├── src/
│   ├── eslint.config.js
│   ├── .prettierrc
│   ├── tsconfig*.json
│   ├── package.json
│   └── package-lock.json    # 커밋 (frontend 안에 위치)
├── backend/                 # Spring Boot (Java 25, Gradle)
│   ├── src/main/java/com/starspud/
│   │   ├── StarSpudApplication.java
│   │   └── <도메인>/        # spot, event, potato, community … 기능별 패키지
│   │       ├── controller/  # REST API
│   │       ├── service/     # 비즈니스 로직·외부 데이터 연동
│   │       ├── repository/  # Spring Data JPA
│   │       └── domain/      # JPA 엔티티
│   ├── src/main/resources/
│   │   ├── application.yml
│   │   └── db/migration/    # Flyway V*.sql
│   ├── src/test/java/       # Testcontainers 통합 테스트
│   ├── build.gradle.kts     # 의존성 정의
│   ├── settings.gradle.kts  # JDK 25 자동 설치 설정 (foojay)
│   └── gradlew              # Gradle Wrapper (커밋)
├── docker-compose.yml       # postgres+postgis, redis
├── .env.example
├── .gitignore
└── README.md
```

---

## 시작하기

### 사전 요구사항
- **JDK 17+** — Gradle 실행용. 빌드에 쓰는 JDK 25는 Gradle이 자동으로 내려받으므로 별도 설치 불필요
- **Node.js** 22+ (Vite 8 기준)
- **Docker** & Docker Compose

### 1. 저장소 클론
```bash
git clone https://github.com/countryspuds/star-spud.git
cd star-spud
```

### 2. 환경 변수 설정
```bash
cp .env.example .env
# .env 파일을 열어 API 키 등을 채워넣기
```

### 3. 인프라(DB·Redis) 실행
```bash
docker compose up -d
```

### 4. 백엔드 실행 (Gradle)
```bash
cd backend
./gradlew bootRun    # http://localhost:8080
# 상태 확인: http://localhost:8080/actuator/health
```
> `bootRun`은 루트의 `docker-compose.yml`을 감지해 DB·Redis가 꺼져 있으면 자동으로 띄우고 접속 정보도 자동 연결합니다. 3단계를 건너뛰어도 됩니다.
> 의존성 추가는 `build.gradle.kts`의 `dependencies`에 적고 다시 빌드하면 됩니다.

**백엔드 개발 스크립트**
```bash
./gradlew build      # 컴파일 + 테스트 + JAR 생성
./gradlew test       # 테스트 (Testcontainers 사용, Docker 꺼져 있으면 건너뜀)
```

### 5. 프론트엔드 실행
```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
```

**프론트 개발 스크립트**
```bash
npm run lint         # ESLint 검사
npx tsc -b           # 타입 검사 (루트 tsconfig은 참조 전용이라 `tsc --noEmit`은 검사하지 않음)
npm run format       # Prettier 자동 정렬
```
> VS Code에 Prettier 확장(`esbenp.prettier-vscode`)을 설치하면 저장 시 자동 포맷됩니다.

---

## 로드맵

- **Phase 1** — 명소 지도 · 이벤트 캘린더 · 감자 심기 · 경량 커뮤니티 (반응형 웹)
- **Phase 2** — 경로 추천 · 장비 추천/후기
- **Phase 3+** — 관측 장인 마켓플레이스 · 모바일 앱
