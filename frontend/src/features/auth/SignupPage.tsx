import { useEffect, useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { PillButton } from "../../components/ui/Pill";
import {
  CODE_LENGTH,
  EMAIL_RE,
  requestEmailCode,
  signupWithEmail,
  verifyEmailCode,
} from "../../data/auth";
import { passwordStrength } from "../../lib/password";
import { AuthFrame, Steps } from "./AuthFrame";
import { useMe } from "./useMe";
import authStyles from "./auth.module.css";
import styles from "./email.module.css";

const SIGNUP_STEPS = ["계정", "닉네임", "완료"] as const;

type Stage = "email" | "code" | "password";

const ERROR_TEXT: Record<string, string> = {
  EMAIL_INVALID: "이메일 형식을 확인해 주세요",
  EMAIL_TAKEN: "이미 가입된 이메일이에요. 로그인해 주세요",
  CODE_INVALID: "코드가 맞지 않아요. 다시 확인해 주세요",
  PASSWORD_WEAK: "비밀번호는 8자 이상, 영문과 숫자를 섞어 주세요",
};
const errorText = (e: unknown) =>
  ERROR_TEXT[e instanceof Error ? e.message : ""] ?? "잠시 뒤 다시 시도해 주세요";

/** 재전송 타이머 — 초 단위 카운트다운 */
function useCountdown(): [number, (sec: number) => void] {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);
  return [left, setLeft];
}

function StrengthBar({ password }: { password: string }) {
  const { score, label } = passwordStrength(password);
  return (
    <div className={styles.strength} aria-label={`비밀번호 강도 ${label || "없음"}`}>
      <div className={styles.bars} data-score={score}>
        <span />
        <span />
        <span />
        <span />
      </div>
      <span className={styles.strengthLabel}>{label}</span>
    </div>
  );
}

function SignupForm() {
  const navigate = useNavigate();
  const [stage, setStage] = useState<Stage>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resendLeft, setResendLeft] = useCountdown();

  const emailOk = EMAIL_RE.test(email.trim());
  const strength = passwordStrength(password);
  const confirmOk = confirm !== "" && confirm === password;

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  const sendCode = () =>
    run(async () => {
      const { resendAfterSec } = await requestEmailCode(email);
      setResendLeft(resendAfterSec);
      setStage("code");
      setCode("");
    });

  const verify = () =>
    run(async () => {
      await verifyEmailCode(email, code);
      setStage("password");
    });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (stage === "email") {
      if (emailOk && !busy) void sendCode();
    } else if (stage === "code") {
      if (code.length === CODE_LENGTH && !busy) void verify();
    } else if (strength.ok && confirmOk && !busy) {
      void run(async () => {
        await signupWithEmail(email, password);
        // 기존 온보딩에 합류 — 닉네임·감자·지역·약관
        navigate("/onboarding", { replace: true });
      });
    }
  };

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      {/* 1. 이메일 */}
      <div className={styles.field}>
        <label htmlFor="su-email" className={styles.fieldLabel}>
          이메일
        </label>
        <div className={styles.inputWrap}>
          <input
            id="su-email"
            type="email"
            className={`${styles.input} ${styles.withBtn}`}
            value={email}
            autoComplete="email"
            inputMode="email"
            disabled={stage !== "email"}
            onChange={(e) => setEmail(e.target.value)}
          />
          {stage === "email" ? (
            <button
              type="button"
              className={styles.inBtn}
              disabled={!emailOk || busy}
              onClick={() => void sendCode()}
            >
              인증코드 받기
            </button>
          ) : (
            <button
              type="button"
              className={styles.inBtn}
              onClick={() => {
                setStage("email");
                setError(null);
              }}
            >
              바꾸기
            </button>
          )}
        </div>
      </div>

      {/* 2. 인증코드 */}
      {stage !== "email" && (
        <div className={styles.field}>
          <label htmlFor="su-code" className={styles.fieldLabel}>
            인증코드 {stage === "password" && <span className={styles.ok}>✓ 확인됨</span>}
          </label>
          <input
            id="su-code"
            className={`${styles.input} ${styles.code}`}
            value={code}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={CODE_LENGTH}
            disabled={stage === "password"}
            placeholder="000000"
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, CODE_LENGTH))}
            aria-describedby="su-code-help"
          />
          <div className={styles.help} id="su-code-help">
            <span>{email.trim()}로 보낸 6자리 · 예시: 000000 빼고 아무 숫자</span>
            {stage === "code" && (
              <button
                type="button"
                className={styles.inBtn}
                style={{ position: "static", transform: "none" }}
                disabled={resendLeft > 0 || busy}
                onClick={() => void sendCode()}
              >
                {resendLeft > 0 ? `재전송 ${resendLeft}s` : "재전송"}
              </button>
            )}
          </div>
          {stage === "code" && (
            <PillButton
              tone="primary"
              className={styles.submit}
              type="submit"
              disabled={code.length !== CODE_LENGTH || busy}
            >
              코드 확인
            </PillButton>
          )}
        </div>
      )}

      {/* 3. 비밀번호 */}
      {stage === "password" && (
        <>
          <div className={styles.field}>
            <label htmlFor="su-password" className={styles.fieldLabel}>
              비밀번호
            </label>
            <div className={styles.inputWrap}>
              <input
                id="su-password"
                type={show ? "text" : "password"}
                className={`${styles.input} ${styles.withBtn}`}
                value={password}
                autoComplete="new-password"
                onChange={(e) => setPassword(e.target.value)}
                aria-describedby="su-password-help"
              />
              <button
                type="button"
                className={styles.inBtn}
                onClick={() => setShow((v) => !v)}
                aria-pressed={show}
              >
                {show ? "숨기기" : "표시"}
              </button>
            </div>
            <StrengthBar password={password} />
            <div className={styles.help} id="su-password-help">
              <span className={strength.ok ? styles.ok : undefined}>
                {strength.ok ? "✓ 8자 이상 · 영문 · 숫자" : "8자 이상, 영문과 숫자를 섞어 주세요"}
              </span>
            </div>
          </div>
          <div className={styles.field}>
            <label htmlFor="su-confirm" className={styles.fieldLabel}>
              비밀번호 확인
            </label>
            <input
              id="su-confirm"
              type={show ? "text" : "password"}
              className={styles.input}
              value={confirm}
              autoComplete="new-password"
              onChange={(e) => setConfirm(e.target.value)}
              aria-invalid={confirm !== "" && !confirmOk}
            />
            {confirm !== "" && !confirmOk && (
              <span className={styles.error}>비밀번호가 서로 달라요</span>
            )}
          </div>
          <PillButton
            type="submit"
            tone="primary"
            className={styles.submit}
            disabled={!strength.ok || !confirmOk || busy}
          >
            다음 · 닉네임과 감자 고르기
          </PillButton>
        </>
      )}

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <p className={authStyles.fine}>
        계속하면 이용약관과 개인정보 처리방침에 동의하게 돼요. 다음 단계(닉네임)에서 약관을 하나씩
        확인해요.
      </p>
    </form>
  );
}

/** `/signup` — 이메일 인증코드 → 비밀번호 → 기존 /onboarding 합류 (Phase 2 · ADR-0014) */
export default function SignupPage() {
  const me = useMe();
  // 이미 로그인돼 있으면 가입할 이유가 없다 (온보딩 전이면 가드가 /onboarding으로)
  if (me && me.nickname !== null) return <Navigate to="/me" replace />;
  if (me) return <Navigate to="/onboarding" replace />;
  return (
    <AuthFrame
      label="STAR-SPUD · SIGN UP"
      title="이메일로 시작해요"
      body="카카오 없이도 가입할 수 있어요. 인증코드로 이메일을 확인하고 비밀번호를 정하면, 닉네임과 감자를 고르러 가요."
    >
      <Steps active={[1]} labels={SIGNUP_STEPS} />
      <h2 className={authStyles.h2}>계정 만들기</h2>
      <p className={authStyles.lead}>이메일 인증 → 비밀번호 → 닉네임·감자 순서예요.</p>
      <SignupForm />
    </AuthFrame>
  );
}
