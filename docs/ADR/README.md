# ADR (Architecture Decision Records)

기술·제품 구조에 영향을 주는 결정을 기록한다. 결정을 바꿀 때는 기존 문서를 고치지 말고 새 ADR을 추가하고, 기존 문서의 상태를 `superseded by ADR-XXXX`로 바꾼다.

형식: `NNNN-kebab-title.md`. 각 문서는 **상태 / 맥락 / 결정 / 결과** 네 절로 구성한다.

| 번호 | 제목 | 상태 |
|---|---|---|
| [0001](./0001-kakao-map-sdk.md) | 지도 SDK는 카카오맵 단일 | 채택 (ADR-0011 결정 시 재검토) |
| [0002](./0002-light-pollution-viirs.md) | 광공해는 VIIRS 좌표 샘플링 + 정적 타일 | 채택 |
| [0003](./0003-notifications-in-app-first.md) | MVP 알림은 앱 내 알림함, 푸시는 FCM으로 앱 단계에 | 채택 |
| [0004](./0004-no-celery-in-mvp.md) | MVP에서 별도 워커·큐 제외, Spring `@Scheduled` 사용 (캐시는 Redis) | 채택 (2026-11-01 갱신) |
| [0005](./0005-paas-deploy.md) | 배포는 PaaS + Cloudflare R2 | 채택 |
| [0006](./0006-native-mobile-app.md) | 모바일 앱은 네이티브(Swift/Kotlin), 웹 베타 후 착수 | 채택 (재검토 조건 있음) |
| [0007](./0007-frontend-typescript.md) | 프론트엔드 TypeScript 전환 | 채택 |
| [0008](./0008-branching-and-commits.md) | 브랜치 전략과 커밋 규칙 | 채택 |
| [0009](./0009-auth-oauth-jwt.md) | 인증은 소셜 OAuth + JWT, MVP는 카카오만 | 채택 (ADR-0014가 보완) |
| [0010](./0010-admin-sqladmin.md) | 관리자 도구는 최소 관리자 REST API + 프론트 관리 화면 | 채택 (2026-11-01 갱신) |
| [0011](./0011-map-rendering-hybrid.md) | 지도 렌더링: 도트 격자 + 실제 지도 SDK 하이브리드, SDK 선택 미결 | **제안** |
| [0012](./0012-home-and-ia.md) | 홈 화면(벤토)과 메뉴 6개 IA | 채택 |
| [0013](./0013-calendar-in-mvp.md) | 천문 캘린더 MVP 포함, KASI API 연동 앞당김 | 채택 |
| [0014](./0014-auth-methods.md) | 로그인 수단: MVP 카카오 + 온보딩, 네이버·이메일 Phase 2, 계정 1:N 구조 | 채택 |
