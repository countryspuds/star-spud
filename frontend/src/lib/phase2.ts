/**
 * Phase 2 화면 플래그 — docs/PRD.md §4. `VITE_PHASE2=true`일 때만 커뮤니티·장터·이메일 로그인·활동 탭을 켠다.
 * 꺼져 있으면 라우트·네비는 MVP 그대로(준비 중 페이지). Phase 2 페이지는 모두 React.lazy로 나눠 담는다.
 */
export const PHASE2: boolean = import.meta.env.VITE_PHASE2 === "true";
