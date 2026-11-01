import { Navigate, createBrowserRouter } from "react-router-dom";
import { Layout } from "./Layout";
import { Home } from "../pages/Home";
import { MapPage } from "../pages/MapPage";
import { CalendarPage } from "../pages/CalendarPage";
import { ComingSoon } from "../pages/ComingSoon";

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      // 지도 탭·시도 전환은 모두 같은 MapPage 인스턴스 안에서 처리 → pan/zoom 상태 유지
      { path: "map/*", element: <MapPage /> },
      { path: "calendar", element: <CalendarPage /> },
      // 옛 주소 — 메뉴명이 '캘린더'로 바뀌면서 /calendar로, '감자밭'이 '프로필'로 바뀌면서 /me로 통합 (§2·§13)
      { path: "events", element: <Navigate to="/calendar" replace /> },
      { path: "field", element: <Navigate to="/me" replace /> },
      // 프로필·로그인·문의는 다음 PR에서 구현 — 그때까지 준비 중 페이지
      { path: "me", element: <ComingSoon section="프로필" /> },
      { path: "me/settings", element: <ComingSoon section="설정" /> },
      { path: "login", element: <ComingSoon section="로그인" /> },
      { path: "feedback", element: <ComingSoon section="문의" /> },
      // MVP 제외 — 메뉴 자리와 준비 중 페이지만 둔다 (ADR-0012 · 명세 §17)
      { path: "community", element: <ComingSoon section="커뮤니티" /> },
      { path: "market", element: <ComingSoon section="장터" /> },
      { path: "me/activity", element: <ComingSoon section="활동" /> },
      { path: "faq", element: <ComingSoon section="자주 묻는 질문" /> },
      // 정책 문서 — 문안이 정해지면 페이지로 교체 (specs/08 미결)
      { path: "terms", element: <ComingSoon section="이용약관" /> },
      { path: "privacy", element: <ComingSoon section="개인정보 처리방침" /> },
      { path: "guide", element: <ComingSoon section="커뮤니티·장터 가이드" /> },
      { path: "sources", element: <ComingSoon section="데이터 출처" /> },
    ],
  },
]);
