# AGENTS.md — Star-Spud 작업 가이드

이 파일은 사람과 AI 에이전트가 이 저장소에서 작업할 때 지켜야 할 규칙이다. 제품 개요와 MVP 경계는 `docs/PRD.md`, 기능별 상세 명세(규칙·엣지 케이스·완료 기준)는 `specs/`, 구조는 `docs/ARCHITECTURE.md`, 결정 기록은 `docs/ADR/`에 있다. **작업 전에 관련 문서를 먼저 읽는다.**

## 프로젝트
- 별보러감자: 별 관측 명소 지도 + 관측 조건 + 감자 캐릭터로 기록하는 서비스. 2인 팀.
- 현재 단계: **MVP (Phase 1)**, 2026-12-01 베타 목표. MVP 범위는 `docs/PRD.md` 4장.
- 언어: 문서·커밋·코드 주석·UI 문구는 한글. 코드 식별자는 영문.

## 범위 규칙
- `docs/PRD.md`의 MVP 표에서 "제외"인 기능은 만들지 않는다. 요청받으면 MVP 밖임을 알리고 확인을 받는다.
- 기능을 구현할 때는 `specs/NN-*.md`의 규칙과 엣지 케이스를 따르고, 완료 기준 체크리스트의 테스트를 함께 작성한다. 명세와 다르게 만들어야 하면 명세를 먼저 고친다.
- 표시 규칙(핀 색상, 감자 등급·상태, 좋은 날 판정)은 **서버가 결정**한다. 프론트에 판정 로직을 넣지 않는다.
- 구조적 결정(라이브러리 교체, 인프라, 데이터 모델의 큰 변경)을 바꾸려면 `docs/ADR/`에 새 ADR을 추가한다. 기존 ADR을 수정하지 않는다.
- 문서와 코드가 어긋나면 코드가 아니라 문서를 먼저 확인하고, 어느 쪽이 맞는지 사람에게 묻는다.

## 스택
- 백엔드: Python 3.13, FastAPI, SQLAlchemy 2 + GeoAlchemy2, Alembic, Authlib, astropy, APScheduler. 패키지 관리는 **uv**.
- 프론트: React 19 + TypeScript(strict) + Vite, TanStack Query, 카카오맵 JS SDK.
- DB: PostgreSQL + PostGIS. MVP에는 Redis·Celery 없음 (ADR-0004).
- 스토리지: Cloudflare R2 (S3 호환).

## 명령어
```bash
docker compose up -d                      # PostGIS
cd backend && uv sync && uv run uvicorn app.main:app --reload
cd backend && uv run pytest               # 백엔드 테스트 (PR 필수)
cd backend && uv run alembic upgrade head  # 마이그레이션
cd frontend && npm install && npm run dev
cd frontend && npm run lint && npx tsc --noEmit   # 프론트 검사 (PR 필수)
```

## 코드 규칙
**백엔드**
- 라우터(`app/api/v1`)는 얇게. 로직은 `app/services`, 스케줄 작업은 `app/tasks`에 순수 함수로.
- 새 엔드포인트는 Pydantic 스키마(`app/schemas`)를 반드시 정의한다. OpenAPI가 프론트·앱의 계약이다.
- API 경로는 `/api/v1/...`. 에러 응답은 `{code, message}`.
- 외부 API 호출은 `app/services`에서만, httpx async 사용, 타임아웃 명시.
- 로직이 있는 서비스 함수에는 pytest를 쓴다. 특히 좋은 날 판정, 먹이 결정, 등급·방치 상태 전이, 기상청 격자 변환.
- 의존성 추가는 `uv add`. `pip` 직접 사용 금지.

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
