# ADR-0008 브랜치 전략과 커밋 규칙

- 상태: 채택 (2026-09-02)

## 맥락
2인 팀. 나중에 `main` 머지 시 자동 배포(CD)를 붙일 예정이라 `main`은 항상 배포 가능한 상태여야 한다.

## 결정
**브랜치**
- `main`: 릴리즈 브랜치. 배포 가능한 상태만. 직접 커밋 금지.
- `develop`: 통합 브랜치. 기능 브랜치의 머지 대상.
- `feat/<주제>`, `fix/<주제>`, `chore/<주제>`: 작업 브랜치. `develop`에서 분기해 PR로 `develop`에 머지.
- 릴리즈: `develop` → `main` PR. 베타 이후 CD가 `main`을 배포.

**커밋 메시지**: Conventional Commits 형식, 설명은 한글.
```
<type>(<scope>): <한글 설명>

feat(map): 명소 핀에 관측 조건 색상 표시
fix(weather): 격자 변환 시 경도 반올림 오류 수정
chore(deps): astropy 추가
docs(adr): 광공해 데이터 결정 기록
```
type: `feat` `fix` `chore` `docs` `refactor` `test` `ci`. scope는 도메인 또는 영역(`map`, `potato`, `auth`, `weather`, `backend`, `frontend`, `adr` 등).

**PR**: `develop` 대상. 자기 머지 허용 여부는 미정(역할 분담이 정해지면 결정). PR 본문에 검증 방법을 적는다.

## 결과
- 기존 커밋 `[Chore] 프로젝트 초기 설정` 형식은 더 쓰지 않는다.
- CI는 PR 대상 브랜치가 `develop`·`main`일 때 실행.
