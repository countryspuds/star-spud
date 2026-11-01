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
  --bg: #161b24; /* 페이지 바탕 (짙은 남청) */
  --card: #1f2530; /* 기본 카드 */
  --card-2: #242b38;
  --glass: rgba(255, 255, 255, 0.06);
  --edge: rgba(255, 255, 255, 0.09); /* 카드 테두리 1px */
  --glass-card: rgba(
    31,
    37,
    48,
    0.45
  ); /* 반투명 카드 (지도·차트 위젯) + backdrop-filter: blur(12px) */
  --light-card: #f3f5f8; /* 밝은 카드 (세부값 위젯) — 글자색 #141414 */

  /* text */
  --fg: #eaeef5;
  --fg-2: #98a2b3;
  --fg-3: #6b7382;

  /* accent */
  --lime: #d9fc46; /* 강조·'지금' 마커·활성 상태. 어두운 바탕에서만 */
  --blue: #4f7cff; /* primary 버튼 */
  --sprout: #5ea85c; /* 새싹·진행 바 */

  /* 광공해 5단계 (어두운 바탕용 — 밝은 바탕에선 p0 #1e2137, p1 #414fc4, p3 #bc492f) */
  --lp-0: #2d3650; /* 매우 낮음 · 산간·섬  */
  --lp-1: #4a5ad6; /* 낮음 · 농어촌 */
  --lp-2: #e5c33d; /* 보통 · 교외 */
  --lp-3: #c8503a; /* 높음 · 도시 주변 */
  --lp-4: #d9fc46; /* 매우 높음 · 대도시 */

  /* 감자색 4톤 (내 감자밭) */
  --potato-1: #f0d08a;
  --potato-2: #d9a95e;
  --potato-3: #b98545;
  --potato-4: #8a5a2e;

  /* 날씨(미세먼지) 상태색 */
  --aq-good: #3b82f6;
  --aq-ok: #22c55e;
  --aq-bad: #f59e0b;
  --aq-worst: #ef4444;

  --radius-card: 22px;
  --radius-pill: 999px;
  --gap: 16px;
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

| 경로                             | 페이지                       | 상태                       |
| -------------------------------- | ---------------------------- | -------------------------- |
| `/`                              | 홈 (벤토 랜딩)               | 구현                       |
| `/map`                           | 지도 · 별보기 (첫 탭, §10)   | 구현 (mock SVG)            |
| `/map/lp`                        | 지도 · 광공해 (전국)         | 구현                       |
| `/map/lp/:sido`                  | 지도 · 시·도 → 시·군·구 퍼즐 | 구현 (mock 1개 지역: 경남) |
| `/map/weather`                   | 지도 · 날씨                  | 구현 (placeholder 이미지)  |
| `/map/terrain`                   | 지도 · 지형고도              | 구현 (placeholder 이미지)  |
| `/map/field`                     | 지도 · 내 감자밭             | 구현 (mock)                |
| `/calendar`                      | 천문 캘린더 (월별)           | 구현 (§11)                 |
| `/field`, `/community`, `/login` | 준비 중                      | ComingSoon 페이지 공용     |

**공통 네비 (48px)** — 좌: 감자 로고(26px, `assets/potato/potato.svg`) + "별보러감자" 700 15px · 중: 홈 / 지도 / **캘린더** / **프로필** / 커뮤니티 / **장터** 6개 (활성 = `--fg`, 나머지 `--fg-2`, ADR-0012) — '이벤트'→'캘린더', '감자밭'→'프로필'(11/1). 커뮤니티·장터는 MVP에서 준비 중 페이지 · 우: 로그인 pill 버튼(32px).
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

| 탭        | 이미지                                              | 바탕색    | 범례                        |
| --------- | --------------------------------------------------- | --------- | --------------------------- |
| 광공해    | `maps/lightpollution-5km.svg` (도트)                | `#1b2130` | 5단계 (`--lp-*`)            |
| 날씨      | `maps/weather-placeholder.png` (실제 지도 SDK 자리) | `#dbe7f0` | 미세먼지 4단계 원 + 비 빗금 |
| 지형고도  | `maps/terrain-placeholder.png` (네이버 지형도 자리) | `#d6e5f0` | 해발 4단계                  |
| 내 감자밭 | `maps/myfield-5km.svg` (도트)                       | `#161b24` | 감자색 = 심은 셀            |

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
3. **시·도 → 시·군·구 퍼즐**: 조각 클릭 → `/map/lp/:sido`. 해당 시·도 셀만 남기고 뷰박스를 그 바운딩박스로 전환(400ms), 그 안에서 시·군·구 조각으로 다시 벌림. mock은 경남 1개(`lightpollution-gyeongnam-sigungu.svg`, 거제 강조). 브레드크럼 `전국 › 경상남도 › 거제시`, 패널 명소 리스트는 선택 시·군·구 기준. ← 전국 버튼.
   - **주의**: 5 km 셀로는 구 단위가 너무 작다. Phase 2에서 시·도 줌 = 1 km, 시·군·구 = 500 m 격자 이미지로 교체. 지금은 5 km로 구조만.
   - `cells-by-region-approx.json`의 지역 경계는 도시 앵커 기준 **근사치**다. 실제 구현 시 행정구역 GeoJSON(시도·시군구)으로 셀마다 코드를 다시 매긴다.

### 4.4 게이지 바 (`<NightGauge>`)

입력: `{ sunset, astroEnd, astroStart, sunrise, moonrise, moonset, moonIllum, waxing, now }` (모두 ISO 시각). 가로축 = `sunset−30min` ~ `sunrise+30min`, 위치 % = (t − start)/(end − start). 달 아이콘: `waxing ? moon-waxing-0XX : moon-waning-0XX` (XX = 조도 %를 10 단위 반올림, 0 → `moon-000`, 100 → `moon-100`). 한 줄 답("달 없는 완전한 밤")은 **`specs/12` 규칙**(관측 창에서 달이 떠 있는 구간을 뺀 가장 긴 구간, 없으면 "밤새 달이 떠 있어요")을 따르고 서버가 `darkWindow`로 내려준 값을 그린다. 프론트 `src/lib/night.ts`는 같은 규칙의 mock용 구현.

---

## 5. 준비 중 페이지 (`<ComingSoon section="이벤트" />`)

카드(--card) 가득, 가운데 정렬 세로 스택 gap 22px, max-width 520px:

- `potato/potato-sad.svg` 192px (pixelated)
- 라벨 "COMING SOON · {section}" / 제목 32px 700 "이 페이지는 아직 땅속에 있어요" / 본문 15px `--fg-2` "감자가 싹을 틔우는 중이에요. 먼저 지도에서 오늘 밤 갈 곳부터 찾아보세요."
- 픽셀 진행 바: 10칸, gap 3px, 높이 12px, 채운 칸 `--sprout`, 빈 칸 `rgba(255,255,255,.12)`. 아래 mono "싹 트는 중 / Phase 1 · 4/10"
- 버튼: [지도로 가기](primary, `/map`) [홈으로](보조, `/`)
- 배경에 픽셀 별 15~~20개 (2~~4px 흰 사각형, opacity .35~.9) 절대배치

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

- `npm run dev`로 `/`, `/map`, `/map/lp`, `/map/lp/gyeongnam`, `/map/weather`, `/map/terrain`, `/map/field`, `/calendar`가 뜬다
- 홈: 4칸 벤토가 화면 폭을 채우고 1440px·390px에서 깨지지 않는다
- 지도: 드래그/휠/버튼 줌이 동작하고 탭 전환 시 pan/zoom이 유지된다. 전국 클릭 → 17조각 분리 애니메이션 → 경남 클릭 → 시·군 퍼즐 → ← 전국
- 게이지 바: `tonight.json`을 바꾸면 눈금·달 세그먼트·'지금' 위치가 따라 움직인다
- `npm run lint`, `npm run format:check`, `tsc -b` 통과
- 폰트 외 외부 네트워크 호출 없음 (API 자리는 `src/data`의 함수 시그니처로만)

---

## 10. 추가 결정 (11/1) — 별보기 지도 (Star Score)

홈 위젯과 지도 페이지의 **첫 탭은 광공해가 아니라 '별보기 지도'**다. 광공해에 명소·접근성·고도를 합친 **정적 종합 점수**(0~100)이며, 오늘 밤 날씨·달은 여기 넣지 않는다(그건 §3의 10일 지수와 세부값이 맡음).

**셀 점수 공식 (백엔드가 계산, 프론트는 그리기만)**

| 요소                       | 비중 | 셀 값                                                        |
| -------------------------- | ---- | ------------------------------------------------------------ |
| 광공해                     | 50%  | 등급 0→100, 1→70, 2→35, 3→10, 4→0                            |
| 명소·천문대 근접           | 20%  | 셀 안 100 · 5 km 내 75 · 10 km 내 45 · 20 km 내 15 · 그 외 0 |
| 접근성 (포장도로까지 거리) | 15%  | 2 km 내 100 … 10 km+ 0 (도로망은 OSM)                        |
| 해발고도                   | 10%  | 0 m=0 … 1,000 m+=100                                         |
| 편의 (주차·화장실·차박)    | 5%   | 명소 속성 가산                                               |

API: `GET /api/v1/grid/starscore?res=5km` → `{ res, updatedAt, cells: [[nx, ny, score, sidoCode, sigunguCode], …] }` (`specs/11`과 동일). 연 1회 + 명소 추가 시 재계산.

**팔레트 (한 색 단계, 밝을수록 좋음)** — 8단계: `#1a2030 #232c44 #2f4668 #3f6a86 #5f9a85 #8fc46c #b9e258 #d9fc46`. 5~97 퍼센타일로 스트레치해서 칠한다(그래야 도시는 가라앉고 산간·명소가 뜬다).

지도 탭 순서: **[별보기] [광공해] [날씨] [지형고도] [내 감자밭]**. URL: 별보기 `/map`(기본), 광공해 `/map/lp`, 드릴다운 `/map/lp/:sido`. 홈 위젯 라벨: `STAR SCORE · 5 KM GRID / 별보기 지도`, 위젯 좌하단에 5칸 범례 + "나쁨 → 좋음 · 광공해 50 · 명소 20 · 접근 15 · 고도 10 · 편의 5".

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
- **중요 천문현상**(라임 테두리) = 서버가 준 `important`(신월 · 보름 · ZHR ≥ 10 유성우 극대 · 일식·월식 · 슈퍼문, `specs/12`). 감자 판정용 `isMajor`와는 다른 값이며 프론트는 둘 다 계산하지 않는다. 그 외(절기·행성 합 등)는 보통 표기.
- 달 아이콘: 서버가 준 `moonIllum`(정수 0~100)을 10 단위로 반올림 → `assets/moon/moon-{waxing|waning}-0XX.svg`. 조도·방향 계산 공식은 `specs/12`가 기준(`src/lib/moon.ts`는 mock용 동일 구현).
- 셀 클릭 → 그 날 "오늘 밤" 상세(게이지 바 + 추천 명소) 모달 또는 `/map?date=` 이동 (Phase 2).
- 알림 설정은 Phase 2 (서비스워커 푸시). 버튼 자리만.

### 11.3 데이터 — 한국천문연구원(KASI) OpenAPI 매핑 (공공데이터포털, 무료, XML)

| 캘린더 요소                        | API               | 엔드포인트 / 파라미터                                                                                                                         | 응답 필드                                                                                           |
| ---------------------------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| 일출·일몰, 월출·월몰, **천문박명** | 출몰시각 정보     | `B090041/openapi/service/RiseSetInfoService/getAreaRiseSetInfo` · `locdate=YYYYMMDD`, `location=서울` (위경도 버전 `getLCRiseSetInfo`도 있음) | `sunrise sunset suntransit moonrise moonset moontransit civilm civile nautm naute astm aste` (HHMM) |
| 월령 → 달 조도·상현/하현           | 월령 정보         | `.../LunPhInfoService/getLunPhInfo` · `solYear solMonth [solDay]`                                                                             | `lunAge`                                                                                            |
| 유성우 극대·행성 현상·근일점 등    | **천문현상 정보** | `.../AstroEventInfoService/getAstroEventInfo` · `solYear solMonth`                                                                            | `locdate seq astroTitle astroTime astroEvent remarks`                                               |
| 24절기(입동·소설), 공휴일          | 특일 정보         | `.../SpcdeInfoService/get24DivisionsInfo`, `getHoliDeInfo` · `solYear solMonth`                                                               | `locdate dateName dateKind isHoliday kst`                                                           |

- 천문현상 API는 **월 단위 한 번 호출**로 그 달의 현상 목록(유성우·행성 합·근지점 등)을 준다. 캘린더 셀의 현상 줄과 하단 리스트는 이 응답을 그대로 쓰면 된다. 어떤 현상을 '중요'로 올릴지는 `astroTitle` 키워드(신월·보름·유성우·식)로 서버에서 분류.
- 출몰시각은 **하루 1회 호출 × 30일**이라 월별 캘린더 한 장에 30회. 서버가 월 단위로 미리 받아 Redis에 캐시(월 바뀔 때 갱신).
- **KASI API에 없는 것**: 은하수 출몰시각(알비레오 기준), 달 조도 %. 둘 다 계산으로 대체 — 조도는 위 공식, 은하수 출몰은 알비레오(RA 19h31m, Dec +28°)의 출몰을 항성시로 계산(Phase 2, `astronomy-engine` 같은 라이브러리 서버 측 사용). ZHR·유성우 설명도 API에 없으면 우리 DB의 유성우 테이블(연중 고정 10여 개)에서 보강.
- 서비스 키는 서버에만 둔다. 프론트는 `GET /api/v1/calendar?year=2026&month=11&location=서울` 한 번으로 아래 모양을 받는다 (`specs/12`가 기준, 아래는 요약):

```json
{ "days": [ { "date": "2026-11-05", "sunrise": "07:02", "sunset": "17:28", "moonrise": "01:12", "moonset": "14:40",
             "astmEnd": "19:00", "astmStart": "05:33", "lunAge": 24.3, "moonIllum": 23, "waxing": false,
             "events": [ { "title": "남타우리드 유성우 극대", "time": "", "desc": "ZHR 5~10", "important": false } ],
             "shootingWindow": true } ],
  "events": [ … 월 전체 목록 … ] }
```

---

## 12. 팀 기획 문서와의 정합 (11/1)

`docs/PRD.md` 1.1 · `docs/ADR/0011~0014` · `specs/11,12`로 이 문서의 결정이 팀 문서에 반영됐다. 이 문서가 **덮어쓰지 않고 따르는** 팀 규칙:

- **감자 시스템은 `specs/04`를 따른다.** 감자는 (사용자, 명소)당 하나, 기록마다 먹이 +1, 등급 Lv1~4, 상태 normal/hungry/sprouted. 이 문서 §프로필의 "60일 + 지수 80 → 싹" 규칙은 **폐기**. '싹(sprouted)'은 방치 상태를 뜻하므로 UI 문구는 "싹이 났어요 · 오래 안 갔어요"로, 긍정 의미(재방문 보상)는 "등급 올라감"으로 바꾼다. 감자밭 타임라인의 한 줄 = 먹이 1개.
- 표시 규칙(핀 색·점수 구간·등급·상태·좋은 날)은 서버가 준 값만 그린다(AGENTS.md).
- 커뮤니티·장터·네이버·이메일 로그인·프로필 활동 탭·사진 업로드는 Phase 2. MVP에서는 메뉴 + 준비 중 페이지.
- 명소 유형 4개(자연·천문대·캠핑장·도심 근교)와 플래그(차박·주차·화장실·포장도로·시야 개방 방향)는 `specs/01`의 데이터 모델을 쓴다. 명소 리스트·상세·후기 정보 체크박스는 이 필드에 맞춘다.
- 브랜치·커밋은 ADR-0008 (develop에서 분기, Conventional Commits 한글).

---

## 13. 공통 네비·푸터·로그인 상태 (11/1)

- 네비 6개(§2): 홈 `/` · 지도 `/map` · 캘린더 `/calendar` · 프로필 `/me` · 커뮤니티 `/community` · 장터 `/market`. 커뮤니티·장터는 MVP에서 `<ComingSoon section="커뮤니티|장터" />`.
- 우측: 비로그인 = "로그인" pill(32px) → `/login`. 로그인 = **아바타 칩**(높이 32px, 좌 아바타 22px + 닉네임 13px 600, `--glass` 배경, `--edge` 테두리) → `/me`. 아바타 = 업로드 사진이 있으면 원형 사진, 없으면 감자 아바타(`potato_avatar`에 따라 `potato.svg | potato-happy.svg | potato-sad.svg`, pixelated).
- **푸터**(모든 페이지, `padding: 26px 24px 8px; border-top: 1px solid --edge`): 4열 grid `minmax(0,1.4fr) repeat(3, minmax(0,1fr))`, gap 24px. 1열 로고(22px)+"별보러감자" 15px 700 + 한 줄 소개 12px `--fg-2`. 2열 "서비스": 별보기 지도·천문 캘린더·커뮤니티·장터. 3열 "도움말": 문의·버그 제보 / 기능 제안 / 명소 정보 수정 요청 / 자주 묻는 질문 — 앞 셋은 `/feedback?type=bug|feature|spot_fix`. 4열 "정책": 이용약관·개인정보 처리방침·커뮤니티·장터 가이드·데이터 출처. 하단 줄(mono 10px `--fg-3`, 위 1px 선): "© 2026 Star-Spud · 천문 정보: 한국천문연구원 · 날씨: 기상청 · 광공해: NOAA VIIRS · 지도: {SDK}" / "v{버전} · 문의하기". 열 제목은 mono 라벨. 링크 13px `--fg-2`. ≤860px: 2열.

## 14. 로그인 · 온보딩 `/login`, `/onboarding`, `/welcome` (MVP: 카카오만, ADR-0014)

**공통 레이아웃**: 네비(링크 숨김, 우측 "둘러보기 →") 아래 grid `minmax(0,1fr) 440px`, gap 16px. 좌 소개 패널(`--card`, min-height 780px, 픽셀 별 15~20개 absolute, 우상단에 `starscore-5km.svg` 62% 폭 opacity .55, 하단 정렬 카피: mono 라벨 / h1 40px 700 `letter-spacing -.025em` / 본문 15px `--fg-2`). 우 카드(`--card`, padding 32px 30px, `align-self: start`). ≤900px: 1열, 소개 패널 min-height 260px.

**`/login`**: h2 "로그인" 22px 700 + "별도 회원가입 없이 3초면 끝나요." → **카카오로 시작하기** 버튼(높이 48px, radius 12px, 배경 `#FEE500`, 글자 `#191919`, 좌측 18px 정사각 아이콘 자리) → 약관 문구 11px `--fg-3`("계속하면 이용약관과 개인정보 처리방침에 동의하게 돼요. 소셜 계정의 이메일과 프로필 이름만 받아요."). 네이버 버튼·이메일 폼은 **Phase 2** (디자인 있음, 지금은 렌더하지 않음). 카카오 버튼은 `GET /api/v1/auth/kakao/authorize`로 이동(백엔드 없으면 mock: `/onboarding`으로).

**`/onboarding`** (첫 로그인, `nickname IS NULL`일 때 강제 리다이렉트. 완료 전엔 감자 심기·후기 불가): 상단 스텝 "1 약관 › 2 닉네임 › 3 완료"(mono 11px, 활성 `--lime` 원형 18px). h2 "거의 다 됐어요" + "카카오 계정 {masked email}으로 가입해요."

1. 닉네임: input 46px, 2~~12자 maxlength, 우측 안 상태 "✓ 사용 가능"(`--sprout`) / "이미 쓰는 닉네임이에요"(`#ff8a8a`). 디바운스 400ms `GET /api/v1/users/nickname-check?v=`. 아래 mono 10px "한글·영문·숫자 2~~12자 · 30일에 한 번 변경" / "{n}/12".
2. 내 감자: 3열 버튼(기본·웃는·시무룩, 52px 픽셀 아이콘 + 11px 라벨). 선택 = `--lime` 테두리 + `rgba(217,252,70,.08)` 배경.
3. 주로 보는 지역(선택): select, 17 시·도. 안내 "홈의 '오늘 밤' 추천과 거리 계산 기준이 돼요."
4. 약관 박스(`rgba(255,255,255,.03)`, `--edge`): "전체 동의" 체크(600) / 1px 선 / 이용약관(필수) · 개인정보 수집·이용(필수) · 만 14세 이상(필수) · 유성우·이벤트 알림 받기(선택). 체크박스 18px `accent-color: --lime`, 우측 mono 10px "필수"(`--lime`)/"선택"(`--fg-3`).
5. 버튼 "감자 심으러 가기"(primary 48px) — 필수 3개 체크 + 닉네임 유효할 때만 활성. `POST /api/v1/me/onboarding {nickname, potatoAvatar, homeSido?, marketingOptIn}` → `/welcome`.

**`/welcome`**: 스텝 3 활성. 카드 가운데 정렬: 선택한 감자 96px, 라벨 "가입 완료", h2 "환영해요, {닉네임}", "{지역} 기준으로 오늘 밤을 추천해 드릴게요." → 할 일 3개 행(mono `01 02 03` `--lime` + 제목 13px 600 + 설명 12px: 오늘 밤 어디 갈지 고르기 / 다녀와서 감자 심기 / {다음 major 이벤트} 알림 받기) → 버튼 "별보기 지도 열기"(primary, `/map`) / "홈으로"(보조).

## 15. 프로필 `/me` (MVP: 감자밭 + 설정 일부)

**레이아웃**: grid `280px minmax(0,1fr)`, gap 16px. 좌 사이드바(`--card`, padding 20px 16px, `align-self: start`): 아바타 88px 가운데 / 닉네임 18px 700 / mono "{지역} · since {가입연월}" / 숫자 3개(mono 11px, 값 14px: **감자 N · 배고픔 N · 명소 N** — `specs/04` 기준: 감자 = (사용자, 명소) 수, 배고픔 = `state=hungry|sprouted`) / 1px 선 / 메뉴 3개(감자밭 `/me` · 활동 `/me/activity` · 설정 `/me/settings`; 각 행 제목 14px 600 + mono 10px 부제; 활성 = `rgba(255,255,255,.06)` 배경 + `--edge` 테두리, radius 12px) / 1px 선 / "로그아웃" 보조 버튼 전폭. ≤900px: 1열.

**감자밭 `/me`**: 헤더(라벨 "MY FIELD · {N} POTATOES" + h1 24px "내 감자밭" + 우측 primary "감자 심기" → `/map`). 2열 grid:

- 좌 "전국 감자밭"(반투명 카드, min-height 520px): 감자 있는 셀만 감자색 4톤으로 칠한 도트 지도(`MapCanvas` 재사용, 나머지 셀 `#2a3140`), 우상단 mono "4,144셀 중 **{n}** · {%}", 하단 범례 "■ 심은 셀 · ■ 아직 · 시·도 {k}/17 밟음". 데이터 `GET /api/v1/me/potatoes` → 명소 좌표 → 셀.
- 우 "내 감자"(반투명 카드): 상단 필터 pill "전체 N" / "배고픔 N". 행 = `grid 36px minmax(0,1fr) auto`: 감자 일러스트(등급 Lv1~4, `state=hungry`는 말풍선, `sprouted`는 싹 — `specs/04` 표시 규칙) / 명소명 14px 600 + mono 날짜(마지막 방문) + 최신 후기 발췌 12px(ellipsis) / 우측 mono 11px "Lv{n} · 먹이 {m}" (hungry면 `#ff8a8a` "배고파요"). 정렬: 상태 우선(hungry·sprouted) → 최근 방문. 행 클릭 → 감자 상세(`/me/potatoes/:id`, Phase 1 후반: 먹이 목록·기록 수정·삭제·공개 여부). 하단 mono 10px 안내: "큰 천체 이벤트가 지나가도록 안 가면 감자가 배고파해요. 다시 가서 기록하면 등급이 올라요."
- **폐기**: 이전 디자인의 "싹 = 60일 + 지수 80" 문구, 타임라인의 "싹 트는 중" 긍정 표현.

**활동 `/me/activity`**: Phase 2 (후기·댓글·좋아요·응모 탭). 지금은 메뉴에 두되 `<ComingSoon section="활동" />`.

**설정 `/me/settings`**: 헤더 "설정". 2열 grid.

- 좌 "프로필" 카드(반투명): **프로필 사진**(원형 84px 미리보기 + 우하단 30px 카메라 버튼 + `input type=file accept=image/png,jpeg,webp`; 버튼 "사진 업로드"(흰 pill 32px) · "감자로 되돌리기"(보조); 안내 mono 10px "JPG · PNG · WEBP, 5 MB 이하 · 정사각형으로 잘려요 / 사진이 없으면 아래에서 고른 감자가 프로필이 돼요") → 닉네임(온보딩과 동일 + "마지막 변경 {날짜} · 다음 변경 가능 {날짜}", 30일 내면 input disabled) → 내 감자 3종(라벨 "내 감자 · 사진이 없을 때 쓰는 아바타") → 주로 보는 지역 select → 우측 정렬 "취소"/"저장"(primary). `PATCH /api/v1/me {nickname?, potatoAvatar?, homeSido?}`, 사진은 `POST /api/v1/uploads/presign` → PUT → `PATCH /api/v1/me {avatarUrl}`. 업로드는 Phase 2로 미뤄도 됨(ADR-0014); 그 경우 버튼 disabled + "곧 열려요" 툴팁.
- 우 상단 "알림" 카드: 행(제목 14px 600 + 부제 12px + 우측 토글 40×22, 켜짐 `--lime`/`#141414` 손잡이): 유성우 극대기 / 신월·촬영 적기 / 내 감자가 배고프면 / 내 후기에 댓글(Phase 2, disabled) / 오늘 밤 지수 80 이상. MVP는 앱 내 알림함(`specs/10`)이므로 토글은 알림함 생성 여부. `PATCH /api/v1/me/notification-settings`.
- 우 중간 "계정" 카드: 카카오 — "연결됨 · {masked}"(mono `--sprout`) / 네이버·이메일 로그인 — Phase 2(행은 두되 버튼 disabled "Phase 2") / 회원 탈퇴 — 빨강 링크 → 확인 모달("감자밭과 후기가 모두 지워져요") → `DELETE /api/v1/me` (`specs/08`: 즉시 삭제. 30일 복구는 Phase 2).
- 우 하단 "도움말" 카드: 문의·버그 제보·기능 제안(`/feedback`, 부제 "보낸 요청 {n} · 반영됨 {m}") / 자주 묻는 질문(`/faq`, Phase 2는 ComingSoon).

## 16. 문의 `/feedback` (MVP: 접수 폼 + 내 요청 목록)

헤더 라벨 "HELP · FEEDBACK" + h1 24px "무엇을 도와드릴까요?". grid `minmax(0,1fr) 360px`.

- 좌 카드(`--card`, padding 22px 24px): **유형** 4열 버튼(버그 제보 `#ff8a8a` "뭔가 안 돼요" / 기능 제안 `--lime` "이런 게 있으면" / 명소 정보 수정 `#7fb0ff` "주차·진입로가 달라요" / 기타 문의 `--fg-2` "계정 · 신고 · 제휴"; 선택 = 해당 색 테두리 + `rgba(255,255,255,.05)`; URL `?type=`로 초기값). 제목 input. 내용 textarea 7행(placeholder "버그라면: 어느 화면에서, 무엇을 눌렀을 때, 어떻게 됐는지 순서대로…"). 스크린샷 dashed 드롭존 64px, 최대 3장(presign 업로드, Phase 1 후반). 체크 박스 2개(기본 on): "진단 정보를 함께 보낼게요"(mono: 브라우저 · 화면 크기 · 마지막 페이지 · 앱 버전 — `navigator.userAgent`, `innerWidth×innerHeight`, 직전 라우트, `import.meta.env.VITE_APP_VERSION`) / "답변을 이메일로 받을게요"(로그인·이메일 있을 때만). 하단: mono "보통 2~3일 안에 답해요" + primary "보내기". `POST /api/v1/feedback {type, title, body, screenshots[], diagnostics?, replyByEmail}` → 성공 시 카드 자리에 웃는 감자 + "접수됐어요 · #{id}" + "내 요청 보기".
- 우 레일(반투명 카드 3개, `align-self: start`): **내가 보낸 요청**(행: 제목 13px 600 + mono "{유형} · {날짜}" + 상태 칩 mono 10px 테두리: 접수 `--fg-2` / 확인 중 `#e5c33d` / 반영됨 `--sprout` / 보류 `--fg-3`; 하단 안내 "접수 → 확인 중 → 반영됨 / 보류. 반영되면 알림이 가요") `GET /api/v1/me/feedback`; **최근 반영된 요청**(정적 목록 3개 + "전체 변경 내역 →" `/changelog`, Phase 2는 링크만); 한 줄 카드 "반영된 제안을 보낸 분께는 제안 감자가 감자밭에 심겨요"(웃는 감자 36px) — 제안 감자 자체는 Phase 2, 문구만.
- 비로그인도 보낼 수 있다(`user_id null`, 이메일 입력란 추가 노출).

## 17. Phase 2 화면 (디자인 완료, **`VITE_PHASE2=true`일 때만 구현 화면**)

캔버스 "대한민국 광공해 도트 지도"에 있음. PRD §4의 플래그 조건을 따른다: `VITE_PHASE2=true`면 아래 화면이 켜지고, 아니면 라우트는 지금처럼 `<ComingSoon />`로 받고 네비도 그대로다. Phase 2 페이지는 전부 `React.lazy`로 나눠 담아 플래그가 꺼진 빌드의 첫 번들에 들어가지 않는다 (`src/app/phase2Routes.tsx`). 치수는 기존 화면(홈·프로필·문의)의 카드·pill·mono 라벨·반투명 카드 패턴을 그대로 쓴다. 쓰기 동작(글·댓글·좋아요·투표·참여·찜)은 감자 심기와 같이 로그인 + 온보딩이 필요하다.

**구현 라우트 (11/1, 플래그 뒤)**

- `/community` 피드 — 글쓰기 박스 · 탭 추천/최신/모임/질문/잡담/이달의 사진(`?tab=`) · 글 카드(아바타·닉네임·종류 태그 5종·명소 태그 칩 + 오늘 밤 지수·본문·사진·좋아요/댓글/명소 저장, 내 글 ··· 메뉴 수정/삭제/링크 복사, 수정된 글 "(수정됨)") · 모임 글 날짜·집결·정원·참여 카드 · 질문 글 투표 바. 우측 레일: 오늘 밤 뜨는 명소(지수 순위) · 이번 주 모임 · 우주 뉴스(RSS 자리) · 이달의 사진 응모 · 오늘 밤 달 한 줄.
- `/community/:id` 상세 — 그날 밤 지수·달·구름 메타, 주차·화장실·차박·편의점 4타일, 댓글 인기순/최신순 + 작성, 내 글이면 수정·삭제.
- `/community/write` · `/community/:id/edit` — 글 종류 세그먼트, 명소 태그 검색, 본문 2,000자, 사진 ≤10(미리보기만, presign TODO), 모임 필드(날짜·집결·정원) · 투표 선택지 2~4, 후기 정보 체크(방문일), 이달의 사진 응모 체크(사진 응모 글만), 임시저장(localStorage). 수정은 "저장하면 (수정됨)" 안내 + 삭제 확인 모달(댓글·좋아요 사라짐 · 감자·응모 유지 · 30일 복구).
- mock: `src/data/community.json`(글 5건 — 종류별 1건, 1건 `editedAt`), `src/data/community.ts`(세션 저장 · 추천 순서·모임 상태·오늘 밤 지수는 서버 값이라는 전제로 mock 안에서만 만든다).
- `/market` — 검색 + "판매하기"(판매 등록 화면은 뒤 Phase라 disabled "곧 열려요"), 카테고리 칩 7(specs/07 `gear.category`에서 app 제외) · 필터(지역·가격 밴드·거래 방식·판매중만, `?q&cat&sido&price&trade&selling`) · 3열 카드(제목·가격·상태·지역·직거래/택배·시각·찜, 거래완료는 흐림 + 배지) · 안전 거래 안내 띠.
- `/market/:id` — 사진 자리(최대 10, 장비 종류별 svg 아이콘 placeholder — 실제 제품 사진은 쓰지 않는다) · 카테고리 태그·조회 · 제목·가격 28px · 상태/거래/구성 3타일 · 설명 · 채팅하기(disabled "Phase 3") + 찜 · 판매자 카드(감자 N·후기 N·거래 N — 공개 프로필은 Phase 3이라 내 상품만 `/me` 링크) · 주의사항 3줄.
- mock: `src/data/market.json`(12건, 거래완료 2·예약중 1), `src/data/market.ts`(찜만 세션 저장 · 판매 상태·조회 수·판매자 활동 수는 서버 값), 아이콘 `src/assets/gear/gear-*.svg`.
- `/login` — 카카오 버튼 아래 "또는 이메일로" 구분선 + 이메일/비밀번호 폼(표시 토글·로그인 유지·비밀번호 잊음 → `/reset-password`) + "이메일로 가입" → `/signup`. `/signup` — 스텝 "계정 › 닉네임 › 완료": 이메일 + 인증코드 받기 → 6자리 코드(mono, 재전송 60초 타이머) → 비밀번호(강도 바 4칸, 8자 + 영문 + 숫자) → 확인 → "다음 · 닉네임과 감자 고르기" → 기존 `/onboarding` 합류. `/reset-password` — 이메일 → 링크 발송 안내(30분 유효 · 스팸함) + 소셜 전용 계정 안내. mock 규칙은 `src/data/auth.ts`(시드 `gamja@example.com` / `gamja1234`, 이 탭에서 가입한 이메일, 코드는 6자리면 통과·`000000`만 오류, 비밀번호는 SHA-256 해시만 세션에).
- `/me/settings` 계정 — 카카오·네이버·이메일 행에 연결 상태(`Me.providers`, ADR-0014 계정 1 : 수단 N). 네이버 "연결"(mock 즉시 연결) · 이메일 "설정"(주소 + 비밀번호 폼) 활성. 해제는 뒤 Phase.
- `/me/activity` — 탭 후기·댓글·좋아요·응모(`?tab=`) + 11월 이달의 사진 응모 2칸(사진 응모 글이 자동으로 들어옴, 빈 칸은 `/community/write`) + 받은 반응 3타일(내 글 좋아요·댓글, 내 상품 찜). `src/data/activity.ts`가 감자·커뮤니티·장터 mock에서 모은다.

**디자인 목록**

- `/login` 네이버 버튼 · 이메일/비밀번호 폼, `/signup`(이메일 인증코드 → 비밀번호 → 온보딩 합류), `/reset-password` — ADR-0014
- `/community` 피드(글 종류 5: 후기·질문·모임·사진 응모·잡담, 명소 태그+오늘 밤 지수 칩, 투표, 우주 뉴스 레일), `/community/:id` 상세+댓글, `/community/write`, `/community/:id/edit`(저장 시 "(수정됨)"), 삭제 확인 모달(30일 소프트 삭제) — specs/06
- `/market` 목록(카테고리·필터·3열 카드·안전 거래 띠), `/market/:id` 상세(채팅 연결, 판매자 감자 활동) — specs/07
- `/me/activity` 활동 탭, 프로필 사진 업로드, 계정 연결(네이버·이메일), 탈퇴 30일 복구, 제안 감자

---

## 18. 명소 상세 · 감자 심기 · 감자 상세 · 알림함 (MVP 루프의 남은 화면, 11/1)

디자인 캔버스에 없는 화면이다. 기존 화면의 언어(§1 토큰, 반투명 카드, mono 라벨, 픽셀 감자·달)로 만들고, 규칙은 `specs/01`(명소)·`specs/02`(조건)·`specs/04`(감자)·`specs/10`(알림)을 따른다. 데이터 필드명은 specs의 모델을 쓴다.

### 18.1 명소 상세 `/spots/:id`

```
← 지도로 (13px --fg-2)
헤더 카드(--card, padding 22px 24px):
  mono 라벨 "{SIDO} · {SIGUNGU} · BORTLE {n}"          우측: 유형 칩(자연/천문대/캠핑장/도심 근교, mono 10px 테두리)
  h1 28px 700 명소명                                     우측: 조건 칩 "오늘 밤 {good|fair|bad}" (good --sprout / fair #e5c33d / bad --fg-3 / unknown 점선)
  13px --fg-2: "{거리} km · 차박 {가능|불가} · 주차 {n}대 · 화장실 {있음|없음}"   ← specs/01 flags
2열 grid minmax(0,1.2fr) minmax(0,1fr), gap 16px:
  좌: 사진 카드 — 공개 감자 기록 사진 모자이크(최대 6, 2×3, radius 10px). 없으면 유형별 기본 이미지(assets/photo-of-month-placeholder.png 임시).
      아래 "정보" 표(반투명 카드, 2열 라벨/값): 접근성(car/walk/transit) · 포장도로 · 시야 개방(N·E·S·W 중 열린 방향, 지평선 고도 {deg}°) · 설명(description)
  우: "오늘 밤 이곳" 카드(반투명): 날짜 탭 오늘/내일/모레(pill) → 판정 칩 크게 + 이유 한 줄(서버 `reason`) + 타일 3개(구름 % · 달 % + 월출 · 천문박명 끝) + 소형 NightGauge(§4.4, 높이 60px)
      버튼 2개: primary "길찾기"(카카오맵 딥링크 `kakaomap://route?ep={lat},{lng}&by=CAR`, 데스크톱은 `https://map.kakao.com/link/to/{name},{lat},{lng}`) / 보조 "명소 저장"(Phase 2, disabled)
      로그인 + 온보딩 완료: primary 전폭 "감자 심기" → §18.2 (이미 내 감자가 있으면 "먹이 주기 · Lv{n}")
      비로그인: 보조 "로그인하고 감자 심기" → /login?next=
하단 "이곳의 감자밭" 카드(반투명): 헤더 "공개 감자 {potato_count}" + 정렬(최신 기록순)
  행 = grid 36px minmax(0,1fr) auto: 등급 일러스트(Lv1~4, state 표시) / 닉네임 13px 600 + mono 방문일 + 최신 후기 발췌 12px(2줄 ellipsis) + 사진 썸네일 ≤3(48px) / 우측 mono "Lv{n} · 먹이 {m}"
  더 보기(cursor 페이징, `GET /api/v1/spots/{id}/potatoes?cursor=`)
  신고 링크(로그인 시, 우하단 11px --fg-3) → 사유 선택 모달 → `POST /api/v1/spots/{id}/reports`
`source=ugc`면 헤더에 "사용자 등록 명소 · @{닉네임}" 배지. `under_review`면 "검토 중" 배지.
모바일(≤860px): 1열, "오늘 밤 이곳" 카드가 사진보다 위, 감자 심기 버튼은 하단 고정 바(높이 64px, --bg 배경, 위 1px --edge).
```

데이터: `GET /api/v1/spots/{id}?date=` (mock `src/data/spots.json`에 `description, access[], paved, horizon_dirs[], horizon_alt, photos[], source` 추가), `GET /api/v1/spots/{id}/potatoes`.

### 18.2 감자 심기 / 먹이 주기 `/spots/:id/plant` (모달 또는 전체 페이지, 모바일은 페이지)

specs/04의 `POST /api/v1/spots/{id}/potato/feeds`. 카드(--card, max-width 640px 가운데):

- 헤더: 감자 일러스트 64px(기존 감자 있으면 현재 등급, 없으면 Lv1 실루엣) + "{명소명}에 감자 심기" / "먹이 주기 · Lv{n} → Lv{n+1}" 20px 700 + mono "기록 1건 = 먹이 1개"
- 방문일: date input(기본 오늘, max 오늘, min 2000-01-01). 같은 날 기록이 있으면 인라인 오류 "그날 기록이 이미 있어요 → 수정하기"(409).
- 후기: textarea 4행, 2~2000자, 카운터. placeholder "하늘은 어땠는지, 주차·화장실·진입로는 어땠는지."
- 사진: 드롭존 + 썸네일 ≤5(첫 장 대표). HEIC는 클라이언트 변환 실패 시 거부 문구.
- 공개 여부: 토글 "이 감자를 공개할게요"(기본 on) + 설명 "공개 감자는 명소 상세에 보여요. 비공개면 내 감자밭에서만."
- 버튼: 취소 / primary "감자 심기"|"먹이 주기". 제출 중 비활성.
- 성공 화면(같은 카드 교체): 감자 일러스트 + 먹이 아이콘(서버 `food`: star·moon·planet·galaxy·meteor) + "Lv{n} {등급명}이 됐어요" / 첫 감자면 "첫 감자를 심었어요" + 버튼 "내 감자밭 보기"(/me) / "명소로 돌아가기". `level_up: false`면 "Lv4는 최고 등급이에요. 먹이 {m}개".

### 18.3 감자 상세 `/me/potatoes/:id`

- 헤더(반투명): 일러스트 96px + 명소명 22px 700(링크 → /spots/:id) + mono "Lv{n} {등급명} · 먹이 {m} · 마지막 방문 {date}" + 상태 배지(normal 없음 / hungry "배고파요" #ff8a8a + 말풍선 "{다음 major 이벤트}이 D-{n}에 와요" / sprouted "싹이 났어요 · 오래 안 갔어요") + 우측 공개 토글(`PATCH /api/v1/potatoes/{id}`).
- 먹이 목록(최신순): 행 = 먹이 아이콘 28px / mono 방문일 / 후기 전문(접기 3줄) / 사진 썸네일 / 우측 "수정 · 삭제"(본인). 삭제 확인: "마지막 기록을 지우면 감자도 사라져요"(마지막일 때만).
- 하단 "먹이 주기" primary → §18.2.

### 18.4 알림함 `/notifications` (specs/10, MVP: 앱 내 알림함)

- 네비 우측 아바타 칩 왼쪽에 종 아이콘(16px stroke svg) + 미읽음 점(--lime 6px). 클릭 → 페이지.
- 리스트(--card): 행 = 유형 아이콘(배고픔 = 감자 + 말풍선, 이벤트 = 픽셀 달) / 제목 14px 600(미읽음은 --fg, 읽음 --fg-2) + 본문 13px + mono 시각 / 클릭 시 `link`로 이동 + 읽음 처리. 상단 "모두 읽음". 빈 상태: 시무룩 감자 + "아직 알림이 없어요".
- `GET /api/v1/me/notifications?cursor=` · `POST /api/v1/me/notifications/{id}/read` · `POST .../read-all`. mock 3건(배고픔 1, 이벤트 2).

### 18.5 mock 추가

`src/data/spots.json` 필드 확장, `src/data/potatoes.json`에 `feeds[]`(각 `{id, visited_on, food, review, photo_urls, event_id?}`), `src/data/notifications.json`. 함수: `getSpot(id, date)`, `getSpotPotatoes(id)`, `plantOrFeed(spotId, payload)`(mock: 감자 있으면 먹이 추가·level 재계산, 없으면 Lv1 생성), `getPotato(id)`, `updateFeed/deleteFeed`, `getNotifications/markRead`. 등급·상태·먹이 종류는 **서버 값**이라는 전제로 mock에서만 계산하고 컴포넌트는 값만 그린다.
