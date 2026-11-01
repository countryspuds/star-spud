import { useState, type FormEvent } from "react";
import { PillButton } from "../../components/ui/Pill";
import { EMAIL_RE, linkProvider, type AuthProvider } from "../../data/auth";
import { passwordStrength } from "../../lib/password";
import { useMe } from "../auth/useMe";
import emailStyles from "../auth/email.module.css";
import styles from "./profile.module.css";

const LABEL: Record<AuthProvider, string> = {
  kakao: "카카오",
  naver: "네이버",
  email: "이메일 로그인",
};
const ERROR_TEXT: Record<string, string> = {
  EMAIL_INVALID: "이메일 형식을 확인해 주세요",
  EMAIL_TAKEN: "이미 다른 계정에 연결된 이메일이에요",
  PASSWORD_WEAK: "비밀번호는 8자 이상, 영문과 숫자를 섞어 주세요",
  ALREADY_LINKED: "이미 연결돼 있어요",
};

/** 이메일 연결 — 주소 + 비밀번호를 정하면 이 계정으로 이메일 로그인이 된다 */
function EmailLinkForm({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const ok = EMAIL_RE.test(email.trim()) && passwordStrength(password).ok && !busy;
  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!ok) return;
    setBusy(true);
    setError(null);
    try {
      await linkProvider("email", { email, password });
      onDone();
    } catch (err) {
      setError(ERROR_TEXT[err instanceof Error ? err.message : ""] ?? "잠시 뒤 다시 시도해 주세요");
      setBusy(false);
    }
  };
  return (
    <form className={styles.linkForm} onSubmit={onSubmit} noValidate>
      <input
        type="email"
        className={emailStyles.input}
        value={email}
        placeholder="이메일"
        aria-label="연결할 이메일"
        autoComplete="email"
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        className={emailStyles.input}
        value={password}
        placeholder="비밀번호 (8자 이상 · 영문 · 숫자)"
        aria-label="비밀번호"
        autoComplete="new-password"
        onChange={(e) => setPassword(e.target.value)}
      />
      {error && (
        <span className={emailStyles.error} role="alert">
          {error}
        </span>
      )}
      <div className={styles.linkFormActions}>
        <PillButton size="sm" onClick={onDone} disabled={busy}>
          취소
        </PillButton>
        <PillButton size="sm" tone="primary" type="submit" disabled={!ok}>
          연결
        </PillButton>
      </div>
    </form>
  );
}

/** 설정 › 계정 — 카카오 · 네이버 "연결" · 이메일 "설정" (Phase 2 · ADR-0014 계정 1 : 수단 N) */
export default function AccountLinks() {
  const me = useMe();
  const [emailOpen, setEmailOpen] = useState(false);
  const [naverBusy, setNaverBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!me) return null;
  const has = (p: AuthProvider) => me.providers.includes(p);

  // TODO(Phase 2 백엔드): GET /api/v1/auth/naver/link 로 이동해 OAuth 뒤 돌아온다. mock은 바로 연결
  const linkNaver = async () => {
    setNaverBusy(true);
    setError(null);
    try {
      await linkProvider("naver");
    } catch (err) {
      setError(ERROR_TEXT[err instanceof Error ? err.message : ""] ?? "잠시 뒤 다시 시도해 주세요");
    } finally {
      setNaverBusy(false);
    }
  };

  const rows: AuthProvider[] = ["kakao", "naver", "email"];
  return (
    <>
      <ul className={styles.accountRows}>
        {rows.map((p) => (
          <li key={p} className={styles.accountRow}>
            <span className={styles.alertTitle}>{LABEL[p]}</span>
            {has(p) ? (
              <span className={styles.linked}>
                연결됨
                {p === "kakao" ? ` · ${me.email ?? "이메일 없음"}` : ""}
                {p === "email" ? ` · ${me.emailLogin ?? me.email ?? ""}` : ""}
              </span>
            ) : p === "naver" ? (
              <PillButton size="sm" onClick={() => void linkNaver()} disabled={naverBusy}>
                연결
              </PillButton>
            ) : p === "email" ? (
              <PillButton size="sm" onClick={() => setEmailOpen(true)} disabled={emailOpen}>
                설정
              </PillButton>
            ) : (
              <span className={styles.soon}>연결 안 됨</span>
            )}
          </li>
        ))}
      </ul>
      {emailOpen && <EmailLinkForm onDone={() => setEmailOpen(false)} />}
      {error && (
        <span className={emailStyles.error} role="alert">
          {error}
        </span>
      )}
      <span className={styles.soon}>
        연결 해제는 뒤 Phase · 한 계정에 여러 로그인 수단 (ADR-0014)
      </span>
    </>
  );
}
