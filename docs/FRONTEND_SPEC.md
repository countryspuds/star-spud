# Star-Spud 프론트엔드 스펙 (Phase 1 · 디자인 핸드오프)

> 이 문서는 디자인 캔버스("대한민국 광공해 도트 지도")에서 확정한 홈 / 지도 / 준비 중 페이지를
> `frontend/` (React 19 + TypeScript + Vite 8)로 구현하기 위한 명세다.
> 모든 이미지 에셋은 `frontend/src/assets/` 아래에 이미 들어 있다 (아래 §7).
> 백엔드 API는 아직 없다. **모든 데이터는 mock JSON**으로 두고, 나중에 API로 교체할 수 있게 `src/data/` 한 곳에 모은다.

---

## 1. 디자인 토큰

```css
:root {
  /* ground */
  --bg: #161b24;            /* 페이지 바탕 (짙은 남청) */
  --card: #1f2530;          /* 기본 카드 */
  --card-2: #242b38;
  --glass: rgba(255,255,255,.06);
  --edge: rgba(255,255,255,.09);   /* 카드 테두리 1px */
  --glass-card: rgba(31,37,48,.45); /* 반투명 카드 (지도·차트 위젯) + backdrop-filter: blur(12px) */
  --light-card: #f3f5f8;    /* 밝은 카드 (세부값 위젯) — 글자색 #141414 */

  /* text */
  --fg: #eaeef5;  --fg-2: #98a2b3;  --fg-3: #6b7382;

  /* accent */
  --lime: #d9fc46;   /* 강조·'지금' 마커·활성 상태. 어두운 바탕에서만 */
  --blue: #4f7cff;   /* primary 버튼 */
  --sprout: #5ea85c; /* 새싹·진행 바 */

  /* 광공해 5단계 (어두운 바탕용 — 밝은 바탕에선 p0 #1e2137, p1 #414fc4, p3 #bc492f) */
  --lp-0: #2d3650;  /* 매우 낮음 · 산간·섬  */
  --lp-1: #4a5ad6;  /* 낮음 · 농어촌 */
  --lp-2: #e5c33d;  /* 보통 · 교외 */
  --lp-3: #c8503a;  /* 높음 · 도시 주변 */
  --lp-4: #d9fc46;  /* 매우 높음 · 대도시 */

  /* 감자색 4톤 (내 감자밭) */
  --potato-1: #f0d08a; --potato-2: #d9a95e; --potato-3: #b98545; --potato-4: #8a5a2e;

  /* 날씨(미세먼지) 상태색 */
  --aq-good: #3b82f6; --aq-ok: #22c55e; --aq-bad: #f59e0b; --aq-worst: #ef4444;

  --radius-card: 22px;  --radius-pill: 999px;  --gap: 16px;
}
```

**타이포**
- 본문/제목: `IBM Plex Sans KR` (400/500/600/700) — Google Fonts
- 라벨/숫자/캡션: `IBM Plex Mono` (400/500) — 대문자 라벨은 `font-size:11px; letter-spacing:.12em; text-transform:uppercase; color:var(--fg-2)`
- 숫자가 줄맞춤되는 곳은 `font-variant-numeric: tabular-nums`
- 기본 본문 14px / 1.5, 카드 제목 15px 600, 큰 숫자 26px 700 `letter-spacing:-.02em`

**모양 규칙**
- 카드: `border-radius:22px; border:1px solid var(--edge)`; 그림자 없음
- 버튼: pill(999px), 높이 32~40px, 600 weight. primary = `--blue` 배경 + 흰 글자. 보조 = `--glass` 배경 + `--edge` 테두리
- 탭(지도 위): pill, 활성 = `#eaeef5` 배경 + `#141414` 글자, 비활성 = `rgba(22,27,36,.75)` + `#c9d1dd`
- 도트/픽셀 요소(지도, 달, 감자)는 `image-rendering: pixelated`, 정사각 셀. 둥근 카드 안에서 픽셀 요소가 각진 채로 보이는 것이 의도된 대비다.

---

## 2. 라우트와 공통 레이아웃

| 경로 | 페이지 | 상태 |
|---|---|---|
| `/` | 홈 (벤토 랜딩) | 구현 |
| `/map` | 지도 · 광공해 (전국) | 구현 |
| `/map/:sido` | 지도 · 시·도 → 시·군·구 퍼즐 | 구현 (mock 1개 지역: 경남) |
| `/map/weather` | 지도 · 날씨 | 구현 (placeholder 이미지) |
| `/map/terrain` | 지도 · 지형고도 | 구현 (placeholder 이미지) |
| `/map/field` | 지도 · 내 감자밭 | 구현 (mock) |
| `/calendar` | 천문 캘린더 (월별) | 구현 (§11) |
| `/field`, `/community`, `/login` | 준비 중 | ComingSoon 페이지 공용 |

**공통 네비 (48px)** — 좌: 감자 로고(26px, `assets/potato/potato.svg`) + "별보러감자" 700 15px · 중: 홈 / 지도 / **캘린더** / 감자밭 / 커뮤니티 (활성 = `--fg`, 나머지 `--fg-2`) — 메뉴명은 '이벤트'가 아니라 '캘린더'로 확정 (11/1) · 우: 로그인 pill 버튼(32px).
페이지 패딩 `14px 16px 48px`, 카드 사이 `gap:16px`. **가로 max-width 없음** — 화면 폭을 다 쓴다.
모바일(≤860px): 네비 링크 숨김(햄버거 대신 하단 탭바는 Phase 2), 그리드는 1열로 스택.

---

## 3. 홈 `/` — 벤토 랜딩

```
grid-template-columns: 1.5fr 1fr;  grid-template-rows: clamp(480px, 62vh, 760px) 230px;  gap: 16px
┌──────────────── (col1,row1) 이달의 사진 ───────────────┬── (col2,row1) 광공해 지도 ──┐
│ 사진 풀블리드(object-fit:cover)                          │ 반투명 카드 (--glass-card)   │
│ 좌상단 캡션: 라벨 "OCTOBER · 이달의 하늘"(11px mono)     │ 좌상단: 라벨 "LIGHT POLLUTION │
│   제목 15px 600 / 촬영자·날짜·Bortle 11px #c9d1dd        │   · 5 KM GRID" + "광공해 지도"│
│ 우상단: 좋아요 칩 (10px mono, 하트 10px #ff6b8a)          │   18px 600                   │
│                                                          │ 가운데: 도트 지도 (min(84%,   │
│                                                          │   560px) 폭)                 │
│                                                          │ 우상단: ↗ 원형 아이콘 30px     │
│                                                          │ 카드 전체가 /map 링크         │
├──────────────── (col1,row2) 별보기 지수 · 10일 ──────────┼── (col2,row2) 오늘 밤 세부값 ─┤
│ 반투명 카드. 헤더: 제목 15px + 라벨 "구름 40 · 달 30 ·    │ 밝은 카드 (--light-card)      │
│   시정 15 · 이벤트 15" / 우측 오늘 값 26px + 한 줄 설명    │ 1행: 아바타 30px + "서울 노원구"│
│ SVG 라인차트 150px: y 0/50/100 격자, 면 그라데이션,        │   + "내 위치 · 21:00 기준", ↗  │
│   선 #cfd6e2 1.5px, 점 r3.2, 마지막 점 --lime,            │ 2행: 타일 3개 (구름량/달/박명) │
│   이벤트 날엔 라임 점선 + 라벨                            │   라벨 11px / 값 20px 700 / 보조│
│                                                          │ 3행: 습도·바람·시정·기온 mono  │
└──────────────────────────────────────────────────────────┴──────────────────────────────┘
아래: 이벤트 카드 3개 (grid 3열) — "D-5" mono 라임 / 제목 14px 600 / 날짜·설명 12px / 우측 달 위상 아이콘 22px
```
- 이달의 사진은 하나만 (슬라이드 점 없음). 데이터: `{ title, place, author, date, bortle, likes, src }`.
- 별보기 지수: 0~100. mock 공식 `0.4*(1-구름) + 0.3*(달 어두움) + 0.15*시정 + 0.15*이벤트보너스` ×100. 이벤트 날짜엔 마커.
- 세부값 타일: 구름량 %, 달 %(위상 + 월출시각), 천문박명 끝(+월몰). 아래 한 줄 습도/바람/시정/기온.

---

## 4. 지도 `/map/*`

```
grid-template-columns: 300px minmax(0,1fr); gap:16px
┌ 좌 패널 (--card) ─────┐ ┌ 지도 영역 (--glass-card, 높이 640px, overflow hidden) ───────────┐
│ "위치" 라벨 + 브레드크럼 │ │ 좌상단: 탭 4개 [광공해][날씨][지형고도][내 감자밭] — 탭은 지도 자체를│
│  전국 › 경상남도 › 거제시│ │   바꾼다 (레이어 아님). 라우트 전환                                  │
│ ───────────────────── │ │ 우상단: 줌 버튼 + / − / ⌂(전국)                                     │
│ 범례 (탭별로 교체)      │ │ 가운데: 지도 이미지 — 드래그로 이동, 휠로 확대(커서 중심), 0.6~8배   │
│ ───────────────────── │ │ 하단 중앙: 힌트 pill (mono 11px)                                    │
│ 명소 리스트            │ └──────────────────────────────────────────────────────────────────┘
│  ■ 이름 / mono 보조 /   │ ┌ 오늘 밤 게이지 바 (--glass-card) ─────────────────────────────────┐
│    거리 km (현재 지역   │ │ 헤더: "오늘 밤" + 라벨 "10.31 (토) → 11.1 (일) · 서울 기준" / 우측 라임│
│    기준으로 필터)        │ │   한 줄 답: "달 없는 완전한 밤 19:04 ~ 21:12 (2시간 8분)"            │
└───────────────────────┘ │ 눈금 줄(26px): 일몰 · 박명 끝 · 박명 시작 · 일출 (mono 10px, 세로선)  │
                          │ 바(14px, pill): 가로축 = 일몰−30분 → 일출+30분. 배경 linear-gradient:│
                          │   #5a6b8c → #3b4a6b(일몰) → #0f131b(천문박명 끝) → #0f131b(박명 시작)│
                          │   → #3b4a6b(일출) → #5a6b8c. 테두리 --edge                           │
                          │ 달 세그먼트: 흰(#e9edf5) 6px 선, 월출~월몰 구간. 시작점 위에 달 위상 픽셀│
                          │   아이콘 24px (assets/moon/*), 아래 "월출 21:12", 끝에 "월몰 10:48 (내일)"│
                          │ 지금 마커: --lime 2px 세로선 + 위 ▲ + 아래 "지금 22:57"              │
                          │ 하단 범례 mono 11px                                                  │
                          └──────────────────────────────────────────────────────────────────┘
```

### 4.1 탭별 지도
| 탭 | 이미지 | 바탕색 | 범례 |
|---|---|---|---|
| 광공해 | `maps/lightpollution-5km.svg` (도트) | `#1b2130` | 5단계 (`--lp-*`) |
| 날씨 | `maps/weather-placeholder.png` (실제 지도 SDK 자리) | `#dbe7f0` | 미세먼지 4단계 원 + 비 빗금 |
| 지형고도 | `maps/terrain-placeholder.png` (네이버 지형도 자리) | `#d6e5f0` | 해발 4단계 |
| 내 감자밭 | `maps/myfield-5km.svg` (도트) | `#161b24` | 감자색 = 심은 셀 |

모든 이미지는 **같은 1056×976 좌표계(5 km 셀 = 8px 피치, 7px 사각형)**라서 탭을 바꿔도 pan/zoom 상태를 유지한 채 이미지만 교체한다.
날씨·지형 탭은 Phase 1에선 placeholder 이미지, Phase 2에서 **네이버 Maps JS v3** (`mapTypeId: naver.maps.MapTypeId.TERRAIN` 등)로 교체. 컴포넌트 경계를 `<MapCanvas>`(이미지 pan/zoom)와 `<NaverMap>`으로 나눠 둘 것.

### 4.2 pan / zoom (`<MapCanvas>`)
- 상태 `{ scale, tx, ty }`, 이미지 wrapper에 `transform: translate(tx,ty) scale(scale)`, `transform-origin: 0 0`, wrapper는 영역 중앙에 1056×976으로 놓고 margin으로 센터링.
- 드래그: pointerdown → pointermove(델타 누적) → pointerup. `touch-action: none`, `user-select: none`, 커서 grab/grabbing.
- 휠: `addEventListener('wheel', h, { passive: false })` + `preventDefault()` (React onWheel은 passive라 막을 수 없음). 커서 기준 줌: `f = ns/scale; tx' = mx − (mx − tx)·f` (mx = 커서 − 영역 중심).
- 범위 0.6 ~ 8. +/− 버튼은 1.3배, ⌂는 `{1,0,0}` 리셋.
- 줌 ≥ 2.5에서 5 km → 1 km 격자 이미지로 교체하는 LOD 훅 자리만 남겨둔다 (`getLayerSrc(tab, scale)`).

### 4.3 광공해 탭 드릴다운 (전국 → 시·도 → 시·군·구)
1. **전국**: `lightpollution-5km.svg`. 지도 클릭(드래그 아닌 클릭) → 17개 시·도 퍼즐 상태.
2. **17 시·도 퍼즐**: `lightpollution-17sido-exploded.svg`를 그대로 써도 되지만, 구현은 `cells-by-region-approx.json`(셀 → 지역코드)을 읽어 **지역별 `<g>`로 그리고 `transform`으로 벌리는** 방식이 정석이다. 각 조각: 중심에서 바깥으로 `dx*0.14 + 방향*30px` 이동, 300ms ease-out. 호버 조각만 opacity 1, 나머지 0.35. 라벨(mono 11px, `rgba(22,27,36,.8)` 배경 pill)은 조각 중심에, 40셀 미만 작은 조각(서울·광역시·세종)은 라벨을 위로 띄운다.
   - 17 시·도: 서울특별시 · 부산·대구·인천·광주·대전·울산광역시 · 세종특별자치시 · 경기도 · 강원특별자치도 · 충청북도 · 충청남도 · 전북특별자치도 · 전라남도 · 경상북도 · 경상남도 · 제주특별자치도 (+ 울릉·독도는 경북 소속이지만 지도상 별도 조각)
3. **시·도 → 시·군·구 퍼즐**: 조각 클릭 → `/map/:sido`. 해당 시·도 셀만 남기고 뷰박스를 그 바운딩박스로 전환(400ms), 그 안에서 시·군·구 조각으로 다시 벌림. mock은 경남 1개(`lightpollution-gyeongnam-sigungu.svg`, 거제 강조). 브레드크럼 `전국 › 경상남도 › 거제시`, 패널 명소 리스트는 선택 시·군·구 기준. ← 전국 버튼.
   - **주의**: 5 km 셀로는 구 단위가 너무 작다. Phase 2에서 시·도 줌 = 1 km, 시·군·구 = 500 m 격자 이미지로 교체. 지금은 5 km로 구조만.
   - `cells-by-region-approx.json`의 지역 경계는 도시 앵커 기준 **근사치**다. 실제 구현 시 행정구역 GeoJSON(시도·시군구)으로 셀마다 코드를 다시 매긴다.

### 4.4 게이지 바 (`<NightGauge>`)
입력: `{ sunset, astroEnd, astroStart, sunrise, moonrise, moonset, moonIllum, waxing, now }` (모두 ISO 시각). 가로축 = `sunset−30min` ~ `sunrise+30min`, 위치 % = (t − start)/(end − start). 달 아이콘: `waxing ? moon-waxing-0XX : moon-waning-0XX` (XX = 10% 반올림, 0 → `moon-000`, 100 → `moon-100`). 한 줄 답 = 천문박명 끝 ~ (월출 또는 박명 시작 중 빠른 것) 구간 길이.

---

## 5. 준비 중 페이지 (`<ComingSoon section="이벤트" />`)
카드(--card) 가득, 가운데 정렬 세로 스택 gap 22px, max-width 520px:
- `potato/potato-sad.svg` 192px (pixelated)
- 라벨 "COMING SOON · {section}" / 제목 32px 700 "이 페이지는 아직 땅속에 있어요" / 본문 15px `--fg-2` "감자가 싹을 틔우는 중이에요. 먼저 지도에서 오늘 밤 갈 곳부터 찾아보세요."
- 픽셀 진행 바: 10칸, gap 3px, 높이 12px, 채운 칸 `--sprout`, 빈 칸 `rgba(255,255,255,.12)`. 아래 mono "싹 트는 중 / Phase 1 · 4/10"
- 버튼: [지도로 가기](primary, `/map`) [홈으로](보조, `/`)
- 배경에 픽셀 별 15~20개 (2~4px 흰 사각형, opacity .35~.9) 절대배치

---

## 6. mock 데이터 (`src/data/`)
- `photoOfMonth.json` — 위 §3 필드
- `tonight.json` — 세부값 + 게이지 입력 (`sunset: "2026-10-31T17:32+09:00"` …, `moonIllum: 71, waxing: false`)
- `index10d.json` — `[{ date:"10.31", score:38 }, …]` 10개 + `events:[{date:"11.5", label:"남타우리드 극대기"}]`
- `events.json` — D-day 카드 3개 `{ dday, title, sub, moonIllum }`
- `spots.json` — 명소 `{ id, name, sido, sigungu, bortle, lpLevel(0~4), distanceKm, elevationM }` 10개 이상 (경남 5개 포함)
- `field.json` — 내가 심은 셀 좌표 목록 (5 km 격자 x,y)
날짜·시각·지수는 **예시값**이며 실제 관측값이 아니다. UI 어딘가에 "예시 데이터" 캡션을 남긴다.

---

## 7. 에셋 (`frontend/src/assets/`)
```
maps/lightpollution-5km.svg           광공해 도트 지도 (어두운 바탕용 팔레트) — 1056×976
maps/lightpollution-5km-light.svg     같은 지도, 흰 바탕용 원본 팔레트
maps/lightpollution-17sido-exploded.svg   17 시·도 퍼즐 (경남 강조, 나머지 흐림) — viewBox -100 -100 1256 1176
maps/lightpollution-gyeongnam-sigungu.svg 경남 시·군 퍼즐 (거제 강조)
maps/myfield-5km.svg                  내 감자밭 도트 지도 (mock 59셀)
maps/weather-placeholder.png          날씨 탭 자리 (2112×1952, 실제 지도 SDK로 교체 예정)
maps/terrain-placeholder.png          지형고도 탭 자리 (2112×1952, 네이버 지형도로 교체 예정)
maps/cells-by-region-approx.json      { 지역코드: [[x,y,"#hex"], …] } — 5 km 셀과 근사 지역코드
photo-of-month-placeholder.png        이달의 사진 자리 (1200×800, 프로그램 생성 은하수)
potato/potato.svg · potato-happy.svg · potato-sad.svg   도트 감자 (로고 / 상태 / 준비 중)
moon/moon-000.svg, moon-100.svg, moon-waxing-010…090.svg, moon-waning-010…090.svg   12×12px 픽셀 달, 10% 단위
```
SVG 지도는 `<img>`로 써도 되고(가장 단순), 퍼즐 애니메이션이 필요한 곳은 JSON에서 `<svg>`를 직접 그린다.

---

## 8. 컴포넌트 구조 (제안)
```
src/
  app/            router, layout(Nav), theme.css(토큰)
  pages/          Home, MapPage(탭 라우팅), ComingSoon
  components/
    bento/        PhotoOfMonth, IndexChart, MapTeaser, TonightDetails, EventCard
    map/          MapCanvas(pan/zoom), MapTabs, MapLegend, SpotList, Breadcrumb, RegionPuzzle(17 + 시군구), NaverMap(stub)
    gauge/        NightGauge, MoonIcon
    ui/           Card, Pill(Button), Label(mono), Tile
  data/           mock json + index10d 계산 함수
  lib/            time(일출몰 위치 %), grid(셀 좌표 ↔ px), lod(getLayerSrc)
```

## 9. 완료 기준
- `npm run dev`로 `/`, `/map`, `/map/weather`, `/map/terrain`, `/map/field`, `/map/gyeongnam`, `/events`가 뜬다
- 홈: 4칸 벤토가 화면 폭을 채우고 1440px·390px에서 깨지지 않는다
- 지도: 드래그/휠/버튼 줌이 동작하고 탭 전환 시 pan/zoom이 유지된다. 전국 클릭 → 17조각 분리 애니메이션 → 경남 클릭 → 시·군 퍼즐 → ← 전국
- 게이지 바: `tonight.json`을 바꾸면 눈금·달 세그먼트·'지금' 위치가 따라 움직인다
- `npm run lint`, `npm run format:check`, `tsc -b` 통과
- 폰트 외 외부 네트워크 호출 없음 (API 자리는 `src/data`의 함수 시그니처로만)

---

## 10. 추가 결정 (11/1) — 별보기 지도 (Star Score)

홈 위젯과 지도 페이지의 **첫 탭은 광공해가 아니라 '별보기 지도'**다. 광공해에 명소·접근성·고도를 합친 **정적 종합 점수**(0~100)이며, 오늘 밤 날씨·달은 여기 넣지 않는다(그건 §3의 10일 지수와 세부값이 맡음).

**셀 점수 공식 (백엔드가 계산, 프론트는 그리기만)**
| 요소 | 비중 | 셀 값 |
|---|---|---|
| 광공해 | 50% | 등급 0→100, 1→70, 2→35, 3→10, 4→0 |
| 명소·천문대 근접 | 20% | 셀 안 100 · 5 km 내 75 · 10 km 내 45 · 20 km 내 15 · 그 외 0 |
| 접근성 (포장도로까지 거리) | 15% | 2 km 내 100 … 10 km+ 0 (도로망은 OSM) |
| 해발고도 | 10% | 0 m=0 … 1,000 m+=100 |
| 편의 (주차·화장실·차박) | 5% | 명소 속성 가산 |

API: `GET /api/grid/starscore?res=5km` → `{ cells: [[x, y, score, regionCode], …] }`. 연 1회 + 명소 추가 시 재계산.

**팔레트 (한 색 단계, 밝을수록 좋음)** — 8단계: `#1a2030 #232c44 #2f4668 #3f6a86 #5f9a85 #8fc46c #b9e258 #d9fc46`. 5~97 퍼센타일로 스트레치해서 칠한다(그래야 도시는 가라앉고 산간·명소가 뜬다).

지도 탭 순서: **[별보기] [광공해] [날씨] [지형고도] [내 감자밭]**. 홈 위젯 라벨: `STAR SCORE · 5 KM GRID / 별보기 지도`, 위젯 좌하단에 5칸 범례 + "나쁨 → 좋음 · 광공해 50 · 명소 20 · 접근 15 · 고도 10 · 편의 5".

mock 이미지: `assets/maps/starscore-5km.svg` (광공해 + 명소 앵커 20개 + 산맥 근사치로 만든 **예시**. 접근성은 도로 데이터가 없어 광공해 등급으로 대신함).

---

## 11. 천문 캘린더 `/calendar` (11/1 추가)

참조: 엑소스카이 천문달력의 구성(일별 출몰시각·월령·현상, 달 없는 촬영 적기 띠, 중요 현상 강조, 하단 용어 설명)을 우리 디자인으로 옮긴 것. 캔버스 아트보드 "천문 캘린더 · 11월".

### 11.1 레이아웃
```
카드(--card) 패딩 22px
헤더: 월 숫자 56px 700 (letter-spacing -.04em) · 라벨 "2026 · NOVEMBER" + "천문 캘린더" 18px · ‹ › 원형 버튼 30px
      우측 범례(mono 11px): [파란 띠] 딥스카이·은하수 촬영 적기 / [라임 테두리] 중요 천문현상 / [달 아이콘] 달 조도 % / "일출·일몰 / 월출·월몰 · 서울 기준"
요일 헤더: SUN #ff8a8a · MON~FRI #98a2b3 · SAT #7fb0ff, mono 11px letter-spacing .12em, 아래 2px 선
그리드: 7열, gap 6px, 셀 min-height 148px, radius 12px, border 1px --edge, padding 10px
  셀 내부 (세로 스택 gap 6px):
   1행  날짜 26px 700 (일=빨강, 토=파랑, 평일 --fg)  ·····  우측: 픽셀 달 20px + 조도 % (mono 10px --fg-2)
   2행  현상 제목 11px 600 (#c9d1dd, 중요 현상은 --lime) + 한 줄 설명 10px --fg-2  (없으면 생략)
   3행  (margin-top:auto) 2×2 mono 9.5px --fg-3: 일출 / 월출 / 일몰 / 월몰
  촬영 적기 셀: background rgba(79,124,255,.10). 첫 셀 좌상단에 파란 pill "딥스카이 · 은하수 촬영 적기 (하현 → 상현)"
  중요 현상 셀: border 1px --lime
  그리드 아래 mono 11px --fg-3 캡션: 데이터 출처/예시 표기
하단 2단 (grid 2열, gap 16px, 반투명 카드):
  좌 "이번 달 천문현상" — 행: 날짜(mono 12px --lime, 90px) | 제목 14px 600 + 설명 12px --fg-2. 헤더 우측 "N EVENTS · 알림 설정"
  우 "캘린더 읽는 법" — 행: 용어(13px 600 #7fb0ff, 110px) | 설명 12px #c9d1dd. 용어 8개: 월령, 달 조도 %, 상현·하현, 천문박명, 극대기, ZHR, 합·충, 근지점·원지점
모바일(≤860px): 그리드 2열, 요일 헤더 숨김, 하단 1열
```

### 11.2 규칙
- **촬영 적기 띠** = 하현일 ~ 상현일 (달이 자정 전후에 떠서 초저녁 밤이 어두운 구간). 월령 API로 하현(≈22.1)·상현(≈7.4) 날짜를 찾아 그 사이를 칠한다.
- **중요 천문현상** = 신월, 유성우 극대기 중 ZHR ≥ 10, 일식·월식, 슈퍼문. 그 외(절기·행성 합 등)는 보통 표기.
- 달 아이콘: `moonIllum`(%)을 10% 단위로 반올림 → `assets/moon/moon-{waxing|waning}-0XX.svg`. 조도는 월령에서 계산: `illum = (1 − cos(2π · lunAge / 29.53)) / 2`, waxing = lunAge < 14.77.
- 셀 클릭 → 그 날 "오늘 밤" 상세(게이지 바 + 추천 명소) 모달 또는 `/map?date=` 이동 (Phase 2).
- 알림 설정은 Phase 2 (서비스워커 푸시). 버튼 자리만.

### 11.3 데이터 — 한국천문연구원(KASI) OpenAPI 매핑 (공공데이터포털, 무료, XML)
| 캘린더 요소 | API | 엔드포인트 / 파라미터 | 응답 필드 |
|---|---|---|---|
| 일출·일몰, 월출·월몰, **천문박명** | 출몰시각 정보 | `B090041/openapi/service/RiseSetInfoService/getAreaRiseSetInfo` · `locdate=YYYYMMDD`, `location=서울` (위경도 버전 `getLCRiseSetInfo`도 있음) | `sunrise sunset suntransit moonrise moonset moontransit civilm civile nautm naute astm aste` (HHMM) |
| 월령 → 달 조도·상현/하현 | 월령 정보 | `.../LunPhInfoService/getLunPhInfo` · `solYear solMonth [solDay]` | `lunAge` |
| 유성우 극대·행성 현상·근일점 등 | **천문현상 정보** | `.../AstroEventInfoService/getAstroEventInfo` · `solYear solMonth` | `locdate seq astroTitle astroTime astroEvent remarks` |
| 24절기(입동·소설), 공휴일 | 특일 정보 | `.../SpcdeInfoService/get24DivisionsInfo`, `getHoliDeInfo` · `solYear solMonth` | `locdate dateName dateKind isHoliday kst` |

- 천문현상 API는 **월 단위 한 번 호출**로 그 달의 현상 목록(유성우·행성 합·근지점 등)을 준다. 캘린더 셀의 현상 줄과 하단 리스트는 이 응답을 그대로 쓰면 된다. 어떤 현상을 '중요'로 올릴지는 `astroTitle` 키워드(신월·보름·유성우·식)로 서버에서 분류.
- 출몰시각은 **하루 1회 호출 × 30일**이라 월별 캘린더 한 장에 30회. 서버가 월 단위로 미리 받아 Redis에 캐시(월 바뀔 때 갱신).
- **KASI API에 없는 것**: 은하수 출몰시각(알비레오 기준), 달 조도 %. 둘 다 계산으로 대체 — 조도는 위 공식, 은하수 출몰은 알비레오(RA 19h31m, Dec +28°)의 출몰을 항성시로 계산(Phase 2, `astronomy-engine` 같은 라이브러리 서버 측 사용). ZHR·유성우 설명도 API에 없으면 우리 DB의 유성우 테이블(연중 고정 10여 개)에서 보강.
- 서비스 키는 서버에만 둔다. 프론트는 `GET /api/calendar?year=2026&month=11` 한 번으로 아래 모양을 받는다:
```json
{ "days": [ { "date": "2026-11-05", "sunrise": "07:02", "sunset": "17:28", "moonrise": "01:12", "moonset": "14:40",
             "astmEnd": "19:00", "astmStart": "05:33", "lunAge": 24.3, "moonIllum": 23, "waxing": false,
             "events": [ { "title": "남타우리드 유성우 극대", "time": "", "desc": "ZHR 5~10", "important": false } ],
             "shootingWindow": true } ],
  "events": [ … 월 전체 목록 … ] }
```
