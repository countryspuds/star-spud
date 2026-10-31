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
      // 옛 주소 — 메뉴명이 '캘린더'로 바뀌면서 /calendar로 통합 (§2)
      { path: "events", element: <Navigate to="/calendar" replace /> },
      { path: "field", element: <ComingSoon section="감자밭" /> },
      { path: "community", element: <ComingSoon section="커뮤니티" /> },
      { path: "login", element: <ComingSoon section="로그인" /> },
    ],
  },
]);
