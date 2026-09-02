# ADR-0007 프론트엔드 TypeScript 전환

- 상태: 채택 (2026-09-02)

## 맥락
README는 React + TypeScript라고 적혀 있으나 실제 소스는 `.jsx`이고 `tsconfig`가 없다. 반면 `package.json`의 build 스크립트는 `tsc -b && vite build`를 호출해 현재 상태로는 빌드가 실패한다.

## 결정
프론트엔드를 TypeScript로 전환한다. `tsconfig.json`을 추가하고 기존 `.jsx`를 `.tsx`로 바꾼다. API 타입은 백엔드 OpenAPI 스키마에서 생성한다(`openapi-typescript`). `strict: true`.

## 결과
- 9월 골격 작업의 첫 항목. 이후 새 파일은 모두 `.ts`/`.tsx`.
- CI에서 `tsc --noEmit`을 lint와 함께 돌린다.
- 프론트 테스트는 두지 않고 타입 검사와 lint로 대신한다 (팀 결정).
