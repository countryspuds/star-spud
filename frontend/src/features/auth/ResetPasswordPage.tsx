import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { PillButton, PillLink } from "../../components/ui/Pill";
import { EMAIL_RE, requestPasswordReset, type AuthProvider } from "../../data/auth";
import { AuthFrame } from "./AuthFrame";
import authStyles from "./auth.module.css";
import styles from "./email.module.css";

const PROVIDER_LABEL: Record<AuthProvider, string> = {
  kakao: "카카오",
  naver: "네이버",
  email: "이메일",
};

/** `/reset-password` — 이메일 → 링크 발송 안내 (30분 유효 · 스팸함) + 소셜 계정 안내 (Phase 2 · ADR-0014) */
export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    validMinutes: number;
    socialOnly: AuthProvider | null;
  } | null>(null);

  const canSubmit = EMAIL_RE.test(email.trim()) && !busy;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      const r = await requestPasswordReset(email);
      setResult({ validMinutes: r.validMinutes, socialOnly: r.socialOnly });
    } catch {
      setError("이메일 형식을 확인해 주세요");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthFrame
      label="STAR-SPUD · RESET"
      title="비밀번호를 잊으셨나요?"
      body="가입한 이메일로 재설정 링크를 보내 드려요. 소셜 계정으로 가입했다면 비밀번호 없이 그 계정으로 로그인하면 돼요."
    >
      <h2 className={authStyles.h2}>비밀번호 재설정</h2>
      {result ? (
        <div className={styles.form}>
          {result.socialOnly ? (
            <div className={`${styles.notice} ${styles.social}`} role="status">
              <strong>{PROVIDER_LABEL[result.socialOnly]} 계정으로 가입한 이메일이에요</strong>
              <span>
                비밀번호가 따로 없어요. 로그인 화면에서 {PROVIDER_LABEL[result.socialOnly]} 버튼으로
                들어오면 돼요. 이메일 로그인도 쓰고 싶다면 로그인 뒤 설정 › 계정에서 이메일을 연결할
                수 있어요.
              </span>
            </div>
          ) : (
            <div className={styles.notice} role="status">
              <strong>재설정 링크를 보냈어요</strong>
              <span>
                {email.trim()}로 보낸 링크를 {result.validMinutes}분 안에 열어 새 비밀번호를 정해
                주세요. 메일이 안 보이면 스팸함도 확인해 주세요.
              </span>
              <span className={styles.noticeMono}>
                가입하지 않은 이메일에는 메일이 가지 않아요 · 링크는 한 번만 쓸 수 있어요
              </span>
            </div>
          )}
          <PillLink to="/login" tone="primary" className={styles.submit}>
            로그인으로
          </PillLink>
          <button
            type="button"
            className={styles.link}
            style={{ background: "none", border: 0, cursor: "pointer", alignSelf: "center" }}
            onClick={() => setResult(null)}
          >
            다른 이메일로 다시 보내기
          </button>
        </div>
      ) : (
        <form className={styles.form} onSubmit={onSubmit} noValidate>
          <div className={styles.field}>
            <label htmlFor="rp-email" className={styles.fieldLabel}>
              가입한 이메일
            </label>
            <input
              id="rp-email"
              type="email"
              className={styles.input}
              value={email}
              autoComplete="email"
              inputMode="email"
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={error !== null}
            />
          </div>
          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}
          <PillButton type="submit" tone="primary" className={styles.submit} disabled={!canSubmit}>
            재설정 링크 보내기
          </PillButton>
          <p className={styles.signupLink}>
            <Link to="/login" className={styles.link}>
              로그인으로 돌아가기
            </Link>
          </p>
          <p className={styles.seedHint}>예시: star@kakao.com은 카카오 전용 계정 안내가 나와요</p>
        </form>
      )}
    </AuthFrame>
  );
}
