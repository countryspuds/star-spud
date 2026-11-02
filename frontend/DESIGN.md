---
name: 별보러감자 (Star-Spud)
description: 정밀한 관측 계기 위에 픽셀 감자가 남기는 밤하늘 일지
colors:
  midnight-navy: "#161b24"
  surface: "#1f2530"
  surface-raised: "#242b38"
  surface-well: "#12161f"
  glass-card: "rgba(31, 37, 48, 0.45)"
  glass-fill: "rgba(255, 255, 255, 0.06)"
  edge: "rgba(255, 255, 255, 0.09)"
  map-scrim: "rgba(22, 27, 36, 0.75)"
  starlight: "#eaeef5"
  dusk-gray: "#98a2b3"
  deep-dusk-gray: "#6b7382"
  caption-on-photo: "#c9d1dd"
  glow-lime: "#d9fc46"
  action-blue: "#4f7cff"
  sprout-green: "#5ea85c"
  soft-alert: "#ff8a8a"
  daylight-card: "#f3f5f8"
  daylight-ink: "#141414"
  tile-white: "#ffffff"
  tile-muted: "#5b6474"
  kakao-yellow: "#fee500"
  kakao-ink: "#191919"
  star-score-1: "#1a2030"
  star-score-2: "#2f4668"
  star-score-3: "#5f9a85"
  star-score-4: "#b9e258"
  lp-0: "#2d3650"
  lp-1: "#4a5ad6"
  lp-2: "#e5c33d"
  lp-3: "#c8503a"
  potato-1: "#f0d08a"
  potato-2: "#d9a95e"
  potato-3: "#b98545"
  potato-4: "#8a5a2e"
  aq-good: "#3b82f6"
  aq-ok: "#22c55e"
  aq-bad: "#f59e0b"
  aq-worst: "#ef4444"
typography:
  display:
    fontFamily: "IBM Plex Sans KR, system-ui, sans-serif"
    fontSize: "56px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "IBM Plex Sans KR, system-ui, sans-serif"
    fontSize: "28px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  stat:
    fontFamily: "IBM Plex Sans KR, system-ui, sans-serif"
    fontSize: "26px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.02em"
  title:
    fontFamily: "IBM Plex Sans KR, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 600
  card-title:
    fontFamily: "IBM Plex Sans KR, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1.35
  body:
    fontFamily: "IBM Plex Sans KR, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontFamily: "IBM Plex Sans KR, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "IBM Plex Mono, IBM Plex Sans KR, ui-monospace, monospace"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0.12em"
  caption:
    fontFamily: "IBM Plex Mono, IBM Plex Sans KR, ui-monospace, monospace"
    fontSize: "10px"
    fontWeight: 400
    letterSpacing: "0.04em"
rounded:
  card: "22px"
  tile: "14px"
  control: "12px"
  small: "10px"
  tag: "8px"
  pill: "999px"
spacing:
  hair: "2px"
  tight: "4px"
  snug: "6px"
  base: "8px"
  cozy: "10px"
  comfy: "12px"
  grid: "16px"
  section: "24px"
components:
  button-primary:
    backgroundColor: "{colors.action-blue}"
    textColor: "{colors.tile-white}"
    rounded: "{rounded.pill}"
    padding: "0 18px"
    height: "36px"
  button-secondary:
    backgroundColor: "{colors.glass-fill}"
    textColor: "{colors.starlight}"
    rounded: "{rounded.pill}"
    padding: "0 18px"
    height: "36px"
  button-kakao:
    backgroundColor: "{colors.kakao-yellow}"
    textColor: "{colors.kakao-ink}"
    rounded: "{rounded.control}"
    height: "48px"
  card-solid:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.starlight}"
    rounded: "{rounded.card}"
  card-glass:
    backgroundColor: "{colors.glass-card}"
    textColor: "{colors.starlight}"
    rounded: "{rounded.card}"
  card-light:
    backgroundColor: "{colors.daylight-card}"
    textColor: "{colors.daylight-ink}"
    rounded: "{rounded.card}"
  tile:
    backgroundColor: "{colors.tile-white}"
    textColor: "{colors.daylight-ink}"
    rounded: "{rounded.tile}"
    padding: "10px 12px"
  input:
    backgroundColor: "{colors.glass-fill}"
    textColor: "{colors.starlight}"
    rounded: "{rounded.control}"
    padding: "0 14px"
    height: "46px"
  tab:
    backgroundColor: "{colors.map-scrim}"
    textColor: "{colors.caption-on-photo}"
    rounded: "{rounded.pill}"
    padding: "0 14px"
    height: "32px"
  tab-active:
    backgroundColor: "{colors.starlight}"
    textColor: "{colors.daylight-ink}"
    rounded: "{rounded.pill}"
    padding: "0 14px"
    height: "32px"
---

# Design System: 별보러감자 (Star-Spud)

## Overview

**Creative North Star: "감자의 관측 일지"**

별보러감자의 화면은 감자가 밤마다 적어 두는 관측 기록이다. 틀은 정밀한 계기처럼 차분하다. 자정 남청 바탕에 둥근 카드가 줄지어 있고, 값은 대문자 mono 라벨과 줄 맞는 숫자로 적힌다. 장난기는 그 틀 안에 놓인 픽셀 감자, 픽셀 달, 5 km 도트 지도에서 나온다. 계기처럼 믿을 수 있어야 하고, 감자처럼 웃음이 나야 한다.

밀도는 높은 편이다. 본문은 14px, 라벨과 캡션은 10~11px까지 내려가 한 화면에 조건 값과 시각을 많이 담는다. 페이지는 최대 폭 없이 화면을 다 쓰고, 넓은 화면에서는 벤토 격자로, 860px 이하에서는 한 줄로 쌓인다.

모션은 조용하다. 반복 애니메이션 없이 상태가 바뀔 때 짧은 전환만 쓴다. 표면은 평평하고, 층은 그림자가 아니라 면의 색과 1px 테두리로 나눈다.

**Key Characteristics:**

- 항상 어두운 화면. 라이트 테마가 없고 `color-scheme: dark`로 고정한다.
- 각진 픽셀이 둥근 카드 안에 놓이는 의도된 대비.
- 대문자 mono 라벨과 tabular 숫자가 만드는 관측 기록의 말투.
- 그림자가 없는 평면 구조.
- 예시 값에는 항상 "예시 데이터" 캡션을 붙이는 정직한 표시.

## Colors

자정 남청의 어두운 바탕 위에서 축광 라임과 파랑이 드물게 빛나고, 지도와 감자에는 데이터 전용 색을 쓴다.

### Primary

- **축광 라임** (`glow-lime`, #d9fc46): 어둠 속 야광 눈금 같은 색이다. 현재 시각 마커, 포커스 링, 미읽음 점, 천문 캘린더의 중요 날짜 테두리와 D-day, 차트의 오늘 지점에 쓴다. 별보기 점수 "매우 좋음"과 광공해 "매우 높음" 셀도 이 색이다.
- **행동 파랑** (`action-blue`, #4f7cff): 길찾기, 감자 심기, 글쓰기 같은 주 버튼의 면이다. 천문 캘린더의 촬영 적기 띠에도 쓴다.

파랑은 행동, 라임은 지금·활성에 주로 쓰지만, 이 구분은 현재 쓰임을 적은 것이고 규칙으로 고정하지 않았다.

### Secondary

- **새싹 초록** (`sprout-green`, #5ea85c): 판정 "좋음"과 진행 바처럼 긍정적인 상태를 나타낸다.
- **부드러운 경고** (`soft-alert`, #ff8a8a): 입력 오류, 배고픔·싹 상태, 위험 동작 문구에 쓴다. 현재 토큰 없이 값으로 직접 적혀 있다.

### Tertiary

색이 곧 값인 데이터 전용 팔레트다. 일반 UI 장식에 쓰지 않는다.

- **별보기 점수** (`star-score-1`~`star-score-4` + `glow-lime`): 어두운 남청에서 라임으로 밝아진다. 밝을수록 좋다.
- **광공해 5단계** (`lp-0`~`lp-3` + `glow-lime`): 매우 낮음에서 매우 높음까지. 점수 지도와 달리 밝은 라임이 나쁜 값이다.
- **감자색 4톤** (`potato-1`~`potato-4`): 내 감자밭에서 심은 셀에 쓴다.
- **미세먼지** (`aq-good`, `aq-ok`, `aq-bad`, `aq-worst`): 날씨 지도 탭의 범례에 쓴다.
- **카카오 노랑** (`kakao-yellow`, `kakao-ink`): 카카오 로그인 버튼 전용이다.

### Neutral

- **자정 남청** (`midnight-navy`, #161b24): 페이지 바탕이다.
- **기본 면** (`surface`, #1f2530): 카드의 기본 면이다.
- **올린 면** (`surface-raised`, #242b38): 카드 안에서 한 단계 올라온 면이다.
- **깊은 우물** (`surface-well`, #12161f): 지도처럼 카드 안에 파인 영역이다.
- **유리 카드** (`glass-card`, 45% 불투명): blur와 함께 쓰는 반투명 카드 면이다.
- **유리 칠** (`glass-fill`, 흰색 6%): 보조 버튼, 입력 칩처럼 면 위에 살짝 얹는 칠이다.
- **가장자리** (`edge`, 흰색 9%): 카드와 컨트롤의 1px 테두리다.
- **지도 위 막** (`map-scrim`, 75% 불투명 남청): 지도 위 탭과 버튼의 면이다.
- **별빛** (`starlight`, #eaeef5): 기본 글자다.
- **땅거미 회색** (`dusk-gray`, #98a2b3): 라벨과 보조 글자, 비활성 메뉴다.
- **깊은 땅거미** (`deep-dusk-gray`, #6b7382): 캡션과 가장 약한 안내다.
- **사진 위 캡션** (`caption-on-photo`, #c9d1dd): 사진·지도 위에 얹는 글자다.
- **낮 카드** (`daylight-card`, `daylight-ink`): 홈의 오늘 밤 세부값 카드 한 곳에만 쓰는 밝은 면과 글자다.
- **타일** (`tile-white`, `tile-muted`): 세부값 타일의 흰 면과 보조 글자다.

### Named Rules

**The Data Palette Rule.** 점수, 광공해, 감자, 미세먼지 팔레트의 색은 값을 뜻한다. 장식에 빌려 쓰지 않는다.

## Typography

**Display Font:** IBM Plex Sans KR (system-ui, sans-serif로 대체)
**Body Font:** IBM Plex Sans KR
**Label/Mono Font:** IBM Plex Mono (한글은 IBM Plex Sans KR로 대체)

**Character:** 한 가족의 두 글꼴이 역할을 나눈다. Sans KR이 읽는 글을 맡고, Mono가 라벨과 시각, 수치 캡션을 맡아 기록지의 말투를 만든다.

### Hierarchy

- **Display** (700, 56px, 1): 캘린더의 큰 월 숫자처럼 화면 하나에 하나만 쓴다. 모바일에서는 44px로 줄어든다. 로그인 소개 제목은 40px, 자간 -0.025em, 행간 1.15를 쓴다.
- **Headline** (700, 28px, 1.2): 명소 이름 같은 페이지 제목이다. 프로필 영역은 24px를 쓴다.
- **Stat** (700, 26px, 1): 별보기 지수 같은 큰 숫자다. 세부값 타일의 값은 20px, 행간 1.2다.
- **Title** (600, 18px): 위젯 제목이다.
- **Card Title** (600, 15px, 1.35): 카드와 목록 항목의 제목이다.
- **Body** (400, 14px, 1.5): 기본 본문이다. 한글은 `word-break: keep-all`로 단어 단위로 줄을 바꾼다.
- **Body Small** (13px, 1.5): 보조 문장과 컨트롤 글자다. 가장 자주 쓰는 크기다.
- **Label** (400, 11px, 0.12em, 대문자): "STAR SCORE · 5 KM GRID" 같은 카드 머리 라벨이다.
- **Caption** (400, 10px, 0.04em): "예시 데이터"와 짧은 메타 정보다.

굵기는 600과 700을 주로 쓰고, 500과 400은 드물다.

### Named Rules

**The Logbook Numerals Rule.** 줄을 맞춰 비교하는 숫자에는 `font-variant-numeric: tabular-nums`를 쓴다. 시각과 좌표성 값은 Mono로 적는다.

## Layout

페이지 패딩은 위 14px, 좌우 16px, 아래 48px이고, 카드 사이 간격은 16px로 통일한다. 페이지에는 최대 폭을 두지 않는다. 네비는 48px 높이의 3단 격자이며 메뉴를 가운데 둔다.

홈은 벤토 격자다. 첫 줄은 1.5 : 1 비율에 높이 `clamp(480px, 62vh, 760px)`, 둘째 줄은 230px이고, 그 아래에 이벤트 카드 3개가 놓인다. 명소 상세는 1.2 : 1의 두 칸, 지도는 왼쪽 패널과 오른쪽 캔버스로 나뉜다.

간격은 8, 10, 6, 12, 4px이 대부분을 차지한다. 카드 안 패딩은 16~24px이다.

860px 이하에서는 벤토가 한 줄로 쌓이고 네비 메뉴가 숨겨지며, 사진은 4:3, 지도는 1:1이 된다. 그 밖에 화면별로 600, 900, 1000, 1100px 분기점을 쓴다.

## Elevation & Depth

그림자를 쓰지 않는다. 층은 면의 색(`midnight-navy` → `surface` → `surface-raised`)과 1px `edge` 테두리로 나눈다. 우묵한 영역은 `surface-well`로 내려 파고, 반투명 카드는 blur 12px로 바탕과 구분한다. 지도 위 탭과 확대 버튼은 blur 6px를 쓴다.

### Named Rules

**The No-Shadow Rule.** `box-shadow`를 쓰지 않는다. 표면을 띄워야 하면 면의 색, 테두리, blur로 해결한다.

**The Glass Surface Rule.** 반투명 카드는 지도·사진 위 전용이 아니라 일반 표면 중 하나다. 불투명 카드와 함께 쓸 수 있다.

## Shapes

형태는 둥글고 부드러운 틀과 각진 픽셀의 대비로 이루어진다. 카드는 22px, 세부값 타일은 14px, 입력창은 12px로 둥글고, 버튼과 탭, 칩은 완전한 pill이다. 아이콘 버튼과 아바타 칩 안의 동그란 요소는 원을 쓴다.

지도 셀, 달, 감자, 먹이 아이콘은 `image-rendering: pixelated`로 각진 채 둔다.

### Named Rules

**The Square Pixel Rule.** 도트와 픽셀 요소를 둥글리거나 매끄럽게 보정하지 않는다. 둥근 카드 안의 각진 픽셀이 이 시스템의 서명이다.

## Components

**둥글고 조용한 계기판.** 부드러운 형태 안에 정보를 정확히 담고, 크게 움직이거나 장식하지 않는다.

### Buttons

- **Shape:** 완전한 pill(999px). 크기는 32, 36, 40px이고, 가로로 꽉 차는 주 동작도 같은 pill을 쓴다.
- **Primary:** `action-blue` 면에 흰 글자, 600 굵기.
- **Secondary:** `glass-fill` 면에 1px `edge` 테두리, `starlight` 글자.
- **Hover / Focus:** 라임 2px 포커스 링을 2px 띄워 그린다.
- **Kakao:** 48px 높이, 12px 모서리, 카카오 노랑. 로그인 전용이다.

### Chips

- **판정 칩:** 글자색과 같은 1px 테두리의 pill이다. 작은 칩은 26px, 큰 칩은 36px이다. 값을 알 수 없으면 테두리를 점선으로 바꾼다.
- **배지:** 10px Mono, 1px `edge` 테두리의 작은 pill이다. 명소 유형 같은 분류에 쓴다.

### Cards / Containers

- **Corner Style:** 22px.
- **Background:** 기본 `surface`, 반투명 `glass-card`, 밝은 `daylight-card` 세 가지다.
- **Shadow Strategy:** 없음. Elevation & Depth를 따른다.
- **Border:** 1px `edge`.
- **Internal Padding:** 16~24px.

### Inputs / Fields

- **Style:** 46px 높이, 12px 모서리, 흰색 4% 면, 1px `edge` 테두리. 라벨은 13px 600으로 위에 둔다.
- **Focus:** 라임 2px 링을 1px 띄워 그린다.
- **Error / Disabled:** 오류는 `soft-alert` 글자로 알린다.

### Navigation

48px 높이. 왼쪽에 감자 로고와 이름, 가운데에 메뉴 6개, 오른쪽에 종 아이콘과 아바타 칩을 둔다. 메뉴는 14px 500이고, 기본은 `dusk-gray`, 활성과 hover는 `starlight`이며 0.15s로 전환한다. 860px 이하에서는 메뉴가 숨겨진다.

### Tabs

32px 높이의 pill. 활성은 `starlight` 면에 `daylight-ink` 글자로 뒤집는다. 지도 위 비활성 탭은 `map-scrim` 면에 blur 6px를 쓴다.

### Tile

흰 면, 14px 모서리에 라벨 11px, 값 20px 700, 보조 Mono 11px를 쌓는 세부값 칸이다. 면이 항상 흰색이므로 글자색(`daylight-ink`)도 타일이 직접 정한다. 어두운 카드 안에서도 그대로 쓸 수 있다.

### Pixel Map

5 km 셀로 그린 대한민국 도트 지도다. 별보기, 광공해, 내 감자밭을 같은 격자로 보여 주고, 왼쪽 패널에 범례와 "예시 데이터" 표시를 둔다. 시·도와 시·군·구 퍼즐 전환에는 300~400ms ease-out을 쓴다. 이 시스템에서 가장 긴 전환이다.

### Night Gauge

일몰부터 일출까지를 가로 띠 하나로 보여 준다. 박명 구간은 남청 그라디언트, 달이 뜬 구간은 밝은 띠로 표시하고, 지금 시각은 라임 마커로 찍는다.

### Example Caption

mock 값 옆에 붙이는 10px Mono "예시 데이터" 표시다. 실제 데이터로 바뀌기 전까지 값과 함께 둔다.

## Do's and Don'ts

### Do:

- **Do** 층을 면의 색과 1px `edge` 테두리로 나눈다.
- **Do** 지도 셀, 달, 감자에 `image-rendering: pixelated`를 적용한다.
- **Do** 상태 전환은 0.15s 안팎의 색·투명도 변화로 짧게 끝낸다.
- **Do** 카드 머리에 대문자 Mono 라벨을 두고, 비교하는 숫자는 tabular로 맞춘다.
- **Do** 포커스는 라임 2px 링으로 표시한다.
- **Do** mock 값에는 "예시 데이터" 캡션을 붙인다.

### Don't:

- **Don't** `box-shadow`로 표면을 띄우지 않는다.
- **Don't** 도트와 픽셀 요소를 둥글리거나 매끄럽게 보정하지 않는다.
- **Don't** 라임을 밝은 바탕에 쓰지 않는다.
- **Don't** 점수·광공해·감자 팔레트를 장식에 쓰지 않는다.
- **Don't** 반복 애니메이션이나 큰 움직임을 장식으로 넣지 않는다.
- **Don't** 페이지에 최대 폭을 걸지 않는다.
