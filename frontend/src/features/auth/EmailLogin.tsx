import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { PillButton } from "../../components/ui/Pill";
import { EMAIL_RE, loginWithEmail } from "../../data/auth";
import { safeNext } from "./safeNext";
import styles from "./email.module.css";

/** `/login` 아래 "또는 이메일로" — 이메일/비밀번호 폼 (Phase 2 · ADR-0014). 카카오 버튼은 위에 그대로 */
export default function EmailLogin() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeNext(params.get("next"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const canSubmit = EMAIL_RE.test(email.trim()) && password !== "" && !busy;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      const me = await loginWithEmail(email, password, remember);
      navigate(me.nickname === null ? "/onboarding" : next, { replace: true });
    } catch {
      setError("이메일 또는 비밀번호가 맞지 않아요");
      setBusy(false);
    }
  };

  return (
    <>
      <div className={styles.divider} role="separator">
        또는 이메일로
      </div>
      <form className={styles.form} onSubmit={onSubmit} noValidate>
        <div className={styles.field}>
          <label htmlFor="login-email" className={styles.fieldLabel}>
            이메일
          </label>
          <input
            id="login-email"
            type="email"
            className={styles.input}
            value={email}
            autoComplete="email"
            inputMode="email"
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={error !== null}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="login-password" className={styles.fieldLabel}>
            비밀번호
          </label>
          <div className={styles.inputWrap}>
            <input
              id="login-password"
              type={show ? "text" : "password"}
              className={`${styles.input} ${styles.withBtn}`}
              value={password}
              autoComplete="current-password"
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={error !== null}
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
        </div>
        <div className={styles.row}>
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            <span>로그인 유지</span>
          </label>
          <Link to="/reset-password" className={styles.link}>
            비밀번호를 잊었어요
          </Link>
        </div>
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        <PillButton type="submit" tone="primary" className={styles.submit} disabled={!canSubmit}>
          이메일로 로그인
        </PillButton>
        <p className={styles.signupLink}>
          아직 계정이 없나요?{" "}
          <Link
            to={`/signup${params.get("next") ? `?next=${encodeURIComponent(next)}` : ""}`}
            className={styles.link}
          >
            이메일로 가입
          </Link>
        </p>
        <p className={styles.seedHint}>
          예시 계정: gamja@example.com / gamja1234 · 이 탭에서 가입한 이메일도 로그인돼요
        </p>
      </form>
    </>
  );
}
