import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { OnboardingGuard } from "../features/auth/OnboardingGuard";
import { Footer } from "./Footer";
import { Nav, type NavVariant } from "./Nav";
import styles from "./layout.module.css";

/** variant="auth": 로그인·온보딩 — 네비 링크 숨김, 우측 "둘러보기 →" (명세 §14) */
export function Layout({ variant = "default" }: { variant?: NavVariant }) {
  return (
    <div className={styles.shell}>
      <Nav variant={variant} />
      <main className={styles.main}>
        <Suspense fallback={null}>
          <OnboardingGuard>
            <Outlet />
          </OnboardingGuard>
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
