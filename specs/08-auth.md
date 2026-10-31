# 08. 계정·인증

- Phase: **MVP는 카카오 로그인.** 네이버·구글은 Phase 2, 애플은 Phase 3(iOS 앱).
- 관련: [ADR-0009](../docs/ADR/0009-auth-oauth-jwt.md) · [ADR-0006](../docs/ADR/0006-native-mobile-app.md)

## 목적
가입 마찰 없이 소셜 로그인으로 들어오고, 읽기는 비로그인으로 열어둔다. 쓰기(감자, 알림, 게시글, 명소 등록)만 로그인을 요구한다.

## 사용자 스토리
- 처음 온 사용자로서 지도와 명소를 로그인 없이 보고 싶다.
- 감자를 심으려는 사용자로서 카카오로 3초 만에 로그인하고 싶다.
- 떠나는 사용자로서 탈퇴하면 내 기록이 지워지길 바란다.

## 흐름

### 웹 OAuth (Authorization Code)
1. `GET /api/v1/auth/{provider}/login?next=` → 제공자 인증 페이지로 리다이렉트. `state`에 CSRF 토큰과 `next` 저장(서버 세션 또는 서명 쿠키, 10분).
2. 콜백 `GET /api/v1/auth/{provider}/callback?code=&state=` → 코드 교환 → 프로필 조회 → `users` upsert → JWT 발급.
3. access 토큰(30분)은 응답 본문, refresh 토큰(30일)은 `HttpOnly; Secure; SameSite=Lax` 쿠키. 프론트는 `next`로 이동.
4. `POST /api/v1/auth/refresh` → 쿠키의 refresh로 새 access + **새 refresh**(회전). 이전 refresh는 폐기.
5. `POST /api/v1/auth/logout` → refresh 폐기, 쿠키 삭제.

### 앱 (Phase 3)
- 네이티브 SDK로 받은 제공자 토큰을 `POST /api/v1/auth/{provider}/native`로 보내면 서버가 검증 후 같은 JWT 발급. refresh는 본문으로 반환(앱이 보관).

### 사용자
```
users            id, nickname(2~12자, 유니크, 30일 1회 변경), avatar_url?, potato_avatar(basic|happy|sad), home_sido?, email?, role(user|admin),
                 created_at, deleted_at
auth_identities  id, user_id, provider(kakao|naver|email), provider_uid|email, password_hash?(email만), created_at
                 (유니크: provider + provider_uid) — [ADR-0014](../docs/ADR/0014-auth-methods.md). MVP는 kakao 행만 생성
refresh_tokens  id, user_id, token_hash, family_id, expires_at, revoked_at, user_agent
```
- 소셜 로그인: `auth_identities(provider, provider_uid)`로 사용자를 찾고, 없으면 `users` + `auth_identities`를 함께 만든다. 한 사용자에 여러 identity가 붙을 수 있다(Phase 2 계정 연결).
- 첫 로그인 시 `nickname IS NULL`이면 온보딩(닉네임·감자 아바타·주로 보는 지역·약관)으로 보낸다. 닉네임 초안은 제공자 닉네임, 중복이면 뒤에 숫자. 온보딩 전엔 감자 심기·후기 불가(둘러보기 가능).
- 닉네임 규칙: 한글·영문·숫자, 2~12자, 금칙어 목록.
- 이메일은 제공자가 주면 저장하되 필수가 아니다. 알림 채널로 쓰지 않는다(MVP).

### 탈퇴
- `DELETE /api/v1/me` → 즉시 처리: 감자·기록·사진·알림·refresh 삭제, **`auth_identities` 행 전부 삭제**, `users`는 `deleted_at` 기록 후 개인정보 컬럼(nickname, avatar_url, email, home_sido) 익명화. 공개 게시글(Phase 2)은 "탈퇴한 사용자"로 유지. 30일 유예·복구는 Phase 2(디자인 있음).
- 같은 카카오 계정으로 재가입하면 새 사용자다.

### 권한
- `role = admin`은 DB에서 직접 부여한다. UI에 승격 기능 없음.
- 관리자 웹은 별도 세션([09](./09-admin.md)).

## 엣지 케이스
| 상황 | 동작 |
|---|---|
| `state` 불일치·만료 | 400, 로그인 처음부터 |
| 제공자가 프로필 조회에 실패 | 502 `PROVIDER_ERROR`, 재시도 안내 |
| 카카오가 닉네임 동의를 안 줌 | "감자_{랜덤6}"로 생성, 온보딩에서 변경 유도 |
| refresh 재사용 감지(회전된 토큰이 다시 옴) | 같은 `family_id` 전부 폐기, 401. 탈취 의심 |
| access 만료 중 요청 | 401 `TOKEN_EXPIRED` → 프론트가 refresh 1회 시도 후 재요청. 실패면 로그아웃 상태로 |
| 여러 기기 로그인 | 기기마다 refresh family. 로그아웃은 해당 기기만. "모든 기기 로그아웃"은 Phase 2 |
| 탈퇴한 사용자의 access가 아직 유효 | 매 요청 `deleted_at` 검사, 401 |
| 제재 중 사용자 로그인 | 로그인은 되고 쓰기만 403 |
| 닉네임 변경이 금칙어·중복 | 400/409 |
| 비로그인으로 쓰기 API 호출 | 401 `LOGIN_REQUIRED`. 프론트는 로그인 후 `next`로 복귀 |
| 브라우저가 서드파티 쿠키 차단 | 같은 사이트(API를 같은 도메인 서브패스 또는 서브도메인)로 배포해 퍼스트파티 쿠키가 되게 한다 |
| 관리자 계정 탈퇴 | 마지막 관리자면 400 |

## 완료 기준

**MVP**
- [ ] 카카오 로그인 → 감자 심기 → 로그아웃 → refresh로 재접근 불가가 로컬·배포 환경에서 동작한다.
- [ ] refresh 회전과 재사용 감지 테스트.
- [ ] 닉네임 중복·금칙어·자동 생성 테스트.
- [ ] 탈퇴 시 감자·사진·알림이 삭제되고 사용자 행이 익명화되는 테스트.
- [ ] 401 → refresh → 재요청 흐름이 프론트 API 클라이언트에 구현되어 있다.
- [ ] 비로그인으로 지도·상세·이벤트·공개 감자를 볼 수 있다.

**Phase 2~3**
- [ ] 네이버·구글·애플 제공자 추가, 네이티브 토큰 교환 엔드포인트, 모든 기기 로그아웃.

## 미결
- 계정 연결(같은 사람의 카카오+구글)을 지원할지.
- 개인정보 처리방침·이용약관 문안과 동의 저장 시점.
