import { Navigate, createBrowserRouter } from "react-router-dom";
import { Layout } from "./Layout";
import { Home } from "../pages/Home";
import { MapPage } from "../pages/MapPage";
import { CalendarPage } from "../pages/CalendarPage";
import { ComingSoon } from "../pages/ComingSoon";
import { LoginPage } from "../features/auth/LoginPage";
import { OnboardingPage } from "../features/auth/OnboardingPage";
import { WelcomePage } from "../features/auth/WelcomePage";
import { ProfileLayout } from "../features/profile/ProfileLayout";
import { FieldPage } from "../features/profile/FieldPage";
import { SettingsPage } from "../features/profile/SettingsPage";
import { FeedbackPage } from "../features/feedback/FeedbackPage";
import { SpotPage } from "../features/spot/SpotPage";
import { PlantPage } from "../features/potato/PlantPage";
import { PotatoDetailPage } from "../features/potato/PotatoDetailPage";
import { NotificationsPage } from "../features/notifications/NotificationsPage";
import { PHASE2 } from "../lib/phase2";
import { communityRoutes } from "./phase2Routes";

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      // 지도 탭·시도 전환은 모두 같은 MapPage 인스턴스 안에서 처리 → pan/zoom 상태 유지
      { path: "map/*", element: <MapPage /> },
      { path: "calendar", element: <CalendarPage /> },
      // 명소 상세 (명세 §18.1) · 감자 심기/먹이 주기 (§18.2, 온보딩 필요 — OnboardingGuard)
      { path: "spots/:id", element: <SpotPage /> },
      { path: "spots/:id/plant", element: <PlantPage /> },
      // 옛 주소 — 메뉴명이 '캘린더'로 바뀌면서 /calendar로, '감자밭'이 '프로필'로 바뀌면서 /me로 통합 (§2·§13)
      { path: "events", element: <Navigate to="/calendar" replace /> },
      { path: "field", element: <Navigate to="/me" replace /> },
      // 프로필 — 사이드바 공용 (명세 §15). 활동 탭은 Phase 2라 준비 중 페이지
      {
        path: "me",
        element: <ProfileLayout />,
        children: [
          { index: true, element: <FieldPage /> },
          { path: "settings", element: <SettingsPage /> },
          // 감자 상세 (명세 §18.3)
          { path: "potatoes/:id", element: <PotatoDetailPage /> },
        ],
      },
      { path: "feedback", element: <FeedbackPage /> },
      // 알림함 (명세 §18.4, specs/10 MVP). 로그인·온보딩 필요
      { path: "notifications", element: <NotificationsPage /> },
      // 변경 내역 페이지는 Phase 2 — 문의 화면의 링크만 받는다 (명세 §16)
      { path: "changelog", element: <ComingSoon section="변경 내역" /> },
      // MVP 제외 — 메뉴 자리와 준비 중 페이지만 둔다 (ADR-0012 · 명세 §17).
      // Phase 2 화면은 VITE_PHASE2=true일 때만 붙는다 (PRD §4) — 꺼져 있으면 아래 ComingSoon 그대로
      ...(PHASE2
        ? communityRoutes
        : [{ path: "community", element: <ComingSoon section="커뮤니티" /> }]),
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
  {
    // 로그인·온보딩 — 네비 링크 숨김 레이아웃 (명세 §14)
    element: <Layout variant="auth" />,
    children: [
      { path: "login", element: <LoginPage /> },
      { path: "onboarding", element: <OnboardingPage /> },
      { path: "welcome", element: <WelcomePage /> },
    ],
  },
]);
