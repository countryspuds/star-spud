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
- FastAPI (Python 3.13, async)
- 의존성·가상환경 관리: **uv**
- SQLAlchemy + GeoAlchemy2 (PostGIS 공간 쿼리)
- Authlib (카카오/네이버 OAuth) + JWT
- Celery + Redis (알림 푸시·외부 데이터 주기 갱신)
- astropy / ephem (달 위상·이벤트 계산)

**Data / Infra**
- PostgreSQL + PostGIS
- Redis (캐시 + Celery 브로커)
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
│   ├── package.json
│   └── package-lock.json    # 커밋 (frontend 안에 위치)
├── backend/                 # FastAPI (Python 3.13)
│   ├── app/
│   │   ├── main.py
│   │   ├── api/             # 라우터
│   │   ├── models/          # SQLAlchemy 모델
│   │   ├── services/        # 외부 데이터 연동·비즈니스 로직
│   │   └── tasks/           # Celery 작업
│   ├── pyproject.toml       # 의존성 정의 (uv)
│   ├── uv.lock              # 잠금 파일 (커밋)
│   └── .python-version      # 3.13 고정 (커밋)
├── docker-compose.yml       # postgres+postgis, redis
├── .gitignore
└── README.md
```

---

## 시작하기

### 사전 요구사항
- **[uv](https://docs.astral.sh/uv/)** — 백엔드 의존성·파이썬 버전 관리 (Python은 uv가 알아서 설치하므로 별도 설치 불필요)
- **Node.js** 18+
- **Docker** & Docker Compose

### 1. 저장소 클론
```bash
git clone https://github.com/kuyhxl/star-spud.git
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

### 4. 백엔드 실행 (uv)
```bash
cd backend
uv sync                              # .python-version(3.13) + uv.lock 기준으로 환경 자동 구성
uv run uvicorn app.main:app --reload
# API 문서: http://localhost:8000/docs
```
> `uv sync` 한 번이면 파이썬 3.13 설치·가상환경 생성·의존성 설치가 모두 끝납니다. `activate` 불필요.
> 의존성 추가는 `uv add <패키지>`, 실행은 `uv run <명령>`.

### 5. 프론트엔드 실행
```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
```

**프론트 개발 스크립트**
```bash
npm run lint         # ESLint 검사
npm run format       # Prettier 자동 정렬
```
> VS Code에 Prettier 확장(`esbenp.prettier-vscode`)을 설치하면 저장 시 자동 포맷됩니다.

---

## 로드맵

- **Phase 1** — 명소 지도 · 이벤트 캘린더 · 감자 심기 · 경량 커뮤니티 (반응형 웹)
- **Phase 2** — 경로 추천 · 장비 추천/후기
- **Phase 3+** — 관측 장인 마켓플레이스 · 모바일 앱
