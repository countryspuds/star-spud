# ADR-0004 MVP에서 별도 워커·큐 제외, Spring `@Scheduled` 사용 (캐시는 Redis)

- 상태: 채택 (2026-09-02) · 갱신 (2026-11-01, 백엔드 Spring Boot 전환에 맞춤)

## 맥락
README 초안은 별도 워커(Celery)와 메시지 큐로 푸시 발송과 외부 데이터 갱신을 처리할 계획이었다. MVP에는 푸시가 없고([ADR-0003](./0003-notifications-in-app-first.md)), 외부 데이터 갱신은 명소 약 30곳 × 3일치 예보와 하루 한 번의 감자 상태 배치가 전부다.

## 결정
MVP에서는 별도 워커 프로세스와 메시지 큐를 쓰지 않는다. Spring Boot 프로세스 안에서 `@Scheduled`로 스케줄 작업을 돌린다. 날씨 스냅샷은 PostgreSQL 테이블(`weather_snapshots`)에 두고, 짧게 사는 캐시(천문 캘린더 월 데이터, 외부 API 응답)는 Spring Data Redis로 둔다.

## 결과
- 로컬 docker-compose는 PostGIS와 Redis 두 개를 띄운다. 운영 인프라는 앱 + DB + Redis.
- 프로세스가 여러 개로 늘어나면 스케줄 작업이 중복 실행될 수 있다. MVP는 단일 인스턴스로 운영하고, 다중 인스턴스가 되는 시점 또는 푸시 도입 시점에 별도 워커 + 큐(예: Redis 기반)로 분리한다.
- 스케줄 작업의 실제 로직은 서비스의 순수 메서드로 두고 `scheduler` 패키지는 호출만 하게 해서, 나중에 워커 태스크로 감싸기만 하면 되게 한다.
