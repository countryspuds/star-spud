# ADR-0004 MVP에서 Celery·Redis 제외, APScheduler 사용

- 상태: 채택 (2026-09-02)

## 맥락
README 초안은 Celery + Redis로 푸시 발송과 외부 데이터 갱신을 처리할 계획이었다. MVP에는 푸시가 없고([ADR-0003](./0003-notifications-in-app-first.md)), 외부 데이터 갱신은 명소 약 30곳 × 3일치 예보와 하루 한 번의 감자 상태 배치가 전부다.

## 결정
MVP에서는 Celery와 Redis를 쓰지 않는다. FastAPI 프로세스 안에서 APScheduler로 스케줄 작업을 돌린다. 날씨 캐시는 PostgreSQL 테이블(`weather_snapshots`)로 대체한다.

## 결과
- 로컬 docker-compose는 PostGIS 하나만 띄운다. 운영 인프라도 앱 + DB 두 개.
- 프로세스가 여러 개로 늘어나면 스케줄 작업이 중복 실행될 수 있다. MVP는 단일 인스턴스로 운영하고, 다중 인스턴스가 되는 시점 또는 푸시 도입 시점에 Celery + Redis로 전환한다.
- 작업 함수는 `app/tasks/`에 순수 함수로 두어 나중에 Celery 태스크로 감싸기만 하면 되게 한다.
