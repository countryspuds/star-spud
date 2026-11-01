import type { RouteObject } from "react-router-dom";
import { lazyPage } from "../lib/lazyPage";

/**
 * Phase 2 라우트 — `VITE_PHASE2=true`일 때만 router가 붙인다 (PRD §4 · 명세 §17).
 * 페이지는 모두 lazy라 플래그가 꺼진 빌드의 첫 번들에는 들어가지 않는다.
 */

/** 커뮤니티 (specs/06 디자인 메모) — 피드 · 글쓰기 · 상세 · 수정 */
export const communityRoutes: RouteObject[] = [
  { path: "community", element: lazyPage(() => import("../features/community/CommunityPage")) },
  {
    path: "community/write",
    element: lazyPage(() => import("../features/community/PostEditorPage")),
  },
  {
    path: "community/:id",
    element: lazyPage(() => import("../features/community/PostDetailPage")),
  },
  {
    path: "community/:id/edit",
    element: lazyPage(() => import("../features/community/PostEditorPage")),
  },
];
