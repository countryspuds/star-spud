import { Suspense } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { loginWithKakao } from "../../data/auth";
import { lazyPage } from "../../lib/lazyPage";
import { PHASE2 } from "../../lib/phase2";
import { AuthFrame } from "./AuthFrame";
import { safeNext } from "./safeNext";
import { useMe } from "./useMe";
import styles from "./auth.module.css";

/** Phase 2: "또는 이메일로" 구분선 + 이메일 폼 — 플래그가 켜졌을 때만 청크를 받는다 (ADR-0014) */
const emailLogin = PHASE2 ? lazyPage(() => import("./EmailLogin")) : null;

/** `/login` — MVP는 카카오만. 이메일 폼은 VITE_PHASE2=true일 때만 아래에 붙는다 (명세 §14·§17, ADR-0014) */
export function LoginPage() {
  const me = useMe();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeNext(params.get("next"));

  // 이미 로그인돼 있으면 로그인 화면을 보여줄 이유가 없다 (온보딩 전이면 가드가 /onboarding으로 보낸다)
  if (me && me.nickname !== null) return <Navigate to={next} replace />;

  const onKakao = () => {
    if (loginWithKakao(next)) navigate("/onboarding", { replace: true });
  };

  return (
    <AuthFrame
      label="STAR-SPUD · LOGIN"
      title="오늘 밤, 어디서 볼까요?"
      body="로그인하면 다녀온 밤을 감자로 남기고, 내 감자밭에서 키울 수 있어요. 지도와 캘린더는 로그인 없이도 볼 수 있어요."
    >
      <h2 className={styles.h2}>로그인</h2>
      <p className={styles.lead}>별도 회원가입 없이 3초면 끝나요.</p>
      <button type="button" className={styles.kakao} onClick={onKakao}>
        <span className={styles.kakaoIcon} aria-hidden="true" />
        카카오로 시작하기
      </button>
      <p className={styles.fine}>
        계속하면 이용약관과 개인정보 처리방침에 동의하게 돼요. 소셜 계정의 이메일과 프로필 이름만
        받아요.
      </p>
      {emailLogin && <Suspense fallback={null}>{emailLogin}</Suspense>}
    </AuthFrame>
  );
}
