# 11. 별보기 점수와 격자 지도

- Phase: **MVP** (5 km 격자). 1 km·500 m 격자는 Phase 2
- 관련: [ADR-0011](../docs/ADR/0011-map-rendering-hybrid.md) · [ADR-0002](../docs/ADR/0002-light-pollution-viirs.md) · [01 명소](./01-spot-map.md) · [02 관측 조건](./02-observing-conditions.md) · `docs/FRONTEND_SPEC.md` §10

## 목적
"전국에서 어디가 별 보기 좋은가"를 한 장으로 보여준다. 광공해만이 아니라 실제로 갈 수 있는 곳이 높게 나오도록 명소·접근성·고도를 합친다. 정적 점수이며 오늘 밤 날씨·달은 포함하지 않는다(그건 [02 관측 조건](./02-observing-conditions.md)과 홈의 10일 지수가 맡는다).

## 규칙
- 단위: 기상청 단기예보와 같은 **5 km 격자**(nx, ny). 육지 셀만(약 4,100개).
- 셀 점수 0~100 = 광공해 50 % + 명소 근접 20 % + 접근성 15 % + 해발고도 10 % + 편의 5 %.

| 요소 | 셀 값 |
|---|---|
| 광공해 | VIIRS 등급 0→100, 1→70, 2→35, 3→10, 4→0 |
| 명소 근접 | 셀 안에 `active` 명소 100 · 5 km 내 75 · 10 km 내 45 · 20 km 내 15 · 그 외 0 |
| 접근성 | 포장도로까지 거리 2 km 내 100 … 10 km 이상 0 (OSM 도로망. **MVP에서는 도로 데이터 없이 광공해 등급별 고정값**: 0→45, 1→100, 2→90, 3→60, 4→30) |
| 해발고도 | 0 m=0 … 1,000 m 이상=100 (DEM 셀 평균) |
| 편의 | 셀 안 명소의 주차·화장실·차박 플래그 수 × 33 |

- 표시: 5~97 퍼센타일로 스트레치한 뒤 8단계 팔레트(`#1a2030 … #d9fc46`). 밝을수록 좋음.
- 각 셀에 **시·도 코드와 시·군·구 코드**를 붙인다(행정구역 GeoJSON point-in-polygon, 연 1회). 프론트 퍼즐 드릴다운의 근거.
- 재계산: 연 1회(VIIRS 갱신) + 명소 추가·숨김 시 해당 셀 반경 20 km.

## API
- `GET /api/v1/grid/starscore?res=5km` → `{ res, updatedAt, cells: [[nx, ny, score, sidoCode, sigunguCode], …] }`. 캐시 24 h, ETag.
- `GET /api/v1/grid/lightpollution?res=5km` → 같은 모양, `score` 자리에 등급 0~4.
- Phase 2: `res=1km|500m`, `sido=` 로 범위 제한.

## 엣지 케이스
| 상황 | 동작 |
|---|---|
| VIIRS 값이 없는 셀(섬·연안) | 광공해 등급 0으로 취급, `source: "assumed"` 표시 |
| 명소가 `under_review`·`hidden` | 근접·편의 계산에서 제외 |
| 행정구역 경계에 걸친 셀 | 셀 중심점이 속한 구역 |
| 격자 JSON이 없음(배치 미실행) | 503, 프론트는 번들된 mock SVG로 대체하고 "예시 데이터" 캡션 |

## 완료 기준
- [ ] `grid/service/StarScoreService`에 5요소 점수와 스트레치의 JUnit 테스트(최소 10케이스).
- [ ] 배치가 격자 JSON을 Redis에 올리고 API가 24 h 캐시로 응답한다.
- [ ] 프론트 `/map` 별보기 탭과 홈 위젯이 mock SVG 대신 이 JSON으로 그린다.
