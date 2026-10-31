# AGENTS.md — Star-Spud 작업 가이드

이 파일은 사람과 AI 에이전트가 이 저장소에서 작업할 때 지켜야 할 규칙이다. 제품 개요와 MVP 경계는 `docs/PRD.md`, 기능별 상세 명세(규칙·엣지 케이스·완료 기준)는 `specs/`, 구조는 `docs/ARCHITECTURE.md`, 결정 기록은 `docs/ADR/`에 있다. **작업 전에 관련 문서를 먼저 읽는다.**

## 프로젝트
- 별보러감자: 별 관측 명소 지도 + 관측 조건 + 감자 캐릭터로 기록하는 서비스. 2인 팀.
- 현재 단계: **MVP (Phase 1)**, 2026-12-01 베타 목표. MVP 범위는 `docs/PRD.md` 4장.
- 언어: 문서·커밋·코드 주석·UI 문구는 한글. 코드 식별자는 영문.

## 범위 규칙
- `docs/PRD.md`의 MVP 표에서 "제외"인 기능은 만들지 않는다. 요청받으면 MVP 밖임을 알리고 확인을 받는다. 제외 기능이라도 **메뉴 자리와 준비 중 페이지**는 둔다(ADR-0012).
- 기능을 구현할 때는 `specs/NN-*.md`의 규칙과 엣지 케이스를 따르고, 완료 기준 체크리스트의 테스트를 함께 작성한다. 명세와 다르게 만들어야 하면 명세를 먼저 고친다.
- 표시 규칙(핀 색상, 감자 등급·상태, 좋은 날 판정)은 **서버가 결정**한다. 프론트에 판정 로직을 넣지 않는다.
- 구조적 결정(라이브러리 교체, 인프라, 데이터 모델의 큰 변경)을 바꾸려면 `docs/ADR/`에 새 ADR을 추가한다. 기존 ADR을 수정하지 않는다.
- 문서와 코드가 어긋나면 코드가 아니라 문서를 먼저 확인하고, 어느 쪽이 맞는지 사람에게 묻는다.

## 스택
- 백엔드: Java 25, Spring Boot 4.1 (Web MVC, Validation, Actuator), Spring Data JPA + Hibernate Spatial, Flyway, Spring Security OAuth2 Client + JWT, Spring Data Redis, `@Scheduled`, springdoc-openapi. 빌드는 **Gradle**(Kotlin DSL, Wrapper 커밋). 천문 계산은 한국천문연구원(KASI) API 우선, JVM 천문 라이브러리는 검토 중.
- 프론트: React 19 + TypeScript(strict) + Vite + react-router. 서버 상태는 백엔드 API가 생기면 TanStack Query로(현재는 `src/data` mock 함수). 지도는 도트 격자(`MapCanvas`) + 지도 SDK(카카오/네이버 미정, ADR-0011). 디자인 치수·토큰은 `docs/FRONTEND_SPEC.md`.
- DB: PostgreSQL + PostGIS. 캐시는 Redis. 별도 워커·큐는 MVP에 없음 (ADR-0004).
- 스토리지: Cloudflare R2 (S3 호환).

## 명령어
```bash
docker compose up -d                      # PostGIS + Redis (bootRun이 자동으로 띄우기도 함)
cd backend && ./gradlew bootRun           # http://localhost:8080 (JDK 25는 Gradle이 자동 설치)
cd backend && ./gradlew test              # 백엔드 테스트 (PR 필수, Testcontainers → Docker 필요)
cd backend && ./gradlew build             # 컴파일 + 테스트 + JAR
cd frontend && npm install && npm run dev
cd frontend && npm run lint && npx tsc -b   # 프론트 검사 (PR 필수; 루트 tsconfig은 참조 전용이라 `tsc --noEmit`은 아무것도 검사하지 않음)
```
- 마이그레이션은 Flyway가 앱 시작 시 `src/main/resources/db/migration/V*.sql`을 자동 적용한다. 별도 명령 없음.

## 코드 규칙
**백엔드**
- 패키지는 도메인별 `com.starspud.<도메인>.{controller,service,repository,domain,dto}`. 컨트롤러는 얇게. 로직은 `service`, 스케줄 작업은 `scheduler`에 두고 실제 로직은 서비스의 순수 메서드로 분리한다.
- 새 엔드포인트는 요청·응답 DTO(`record` + Bean Validation)를 반드시 정의한다. JPA 엔티티를 그대로 응답하지 않는다. springdoc이 만드는 OpenAPI 문서가 프론트·앱의 계약이다.
- API 경로는 `/api/v1/...`. 에러 응답은 `{code, message}` (`@RestControllerAdvice`에서 통일).
- 외부 API 호출은 `service`에서만, `RestClient` 사용, 연결·읽기 타임아웃 명시.
- 스키마 변경은 Flyway 마이그레이션 파일로만. `ddl-auto`로 운영 스키마를 바꾸지 않는다.
- 로직이 있는 서비스 메서드에는 JUnit 5 테스트를 쓴다(DB가 필요하면 Testcontainers). 특히 좋은 날 판정, 먹이 결정, 등급·방치 상태 전이, 기상청 격자 변환.
- 의존성 추가는 `build.gradle.kts`의 `dependencies`에만. 버전은 Spring Boot BOM을 따르고, BOM 밖 라이브러리만 버전을 명시한다.

**프론트**
- 파일은 `.ts`/`.tsx`만. `any` 금지.
- API 타입은 생성된 것(`src/api`)을 쓴다. 손으로 응답 타입을 쓰지 않는다.
- 도메인별로 `src/features/<도메인>`에 모은다.
- 프론트 테스트는 두지 않는다. lint + 타입 검사로 대신한다.

## Git
- 브랜치: `main`(릴리즈) ← `develop` ← `feat/*`, `fix/*`, `chore/*`. `main` 직접 커밋 금지. (ADR-0008)
- 커밋: Conventional Commits, 설명은 한글. 예) `feat(potato): 먹이 종류 결정 로직 추가`
- PR은 `develop` 대상. 본문에 무엇을 어떻게 검증했는지 쓴다.
- 사용자가 요청하지 않으면 커밋·푸시하지 않는다.

## 작업 방식
- 변경 전에 가정과 해석을 짧게 밝힌다. 해석이 여러 개면 고르지 말고 묻는다.
- 요청한 범위만 바꾼다. 인접 코드 정리·리팩터링은 하지 않는다.
- 완료 보고에는 실행한 검증 명령과 결과를 적는다. 실패했으면 실패했다고 쓴다.
- 임시 파일은 저장소 밖에 만든다.
