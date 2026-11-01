import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { completeOnboarding, type PotatoAvatar } from "../../data/auth";
import { SIDO, type SidoCode } from "../../data/regions";
import { PillButton } from "../../components/ui/Pill";
import { POTATO_AVATARS, POTATO_AVATAR_LABEL, POTATO_AVATAR_SRC } from "../../lib/potatoAvatar";
import { AuthFrame, Steps } from "./AuthFrame";
import {
  NICKNAME_MAX,
  NICK_STATUS_TEXT,
  useNicknameCheck,
  type NickStatus,
} from "./useNicknameCheck";
import { useMe } from "./useMe";
import styles from "./auth.module.css";

const AGREEMENTS = [
  { key: "terms", label: "이용약관", required: true },
  { key: "privacy", label: "개인정보 수집·이용", required: true },
  { key: "age", label: "만 14세 이상", required: true },
  { key: "marketing", label: "유성우·이벤트 알림 받기", required: false },
] as const;
type AgreementKey = (typeof AGREEMENTS)[number]["key"];

const SIDO_CODES = Object.keys(SIDO) as SidoCode[];

/** `/onboarding` — 첫 로그인(nickname null) 사용자만. 완료 전엔 감자 심기·후기 불가 (specs/08) */
export function OnboardingPage() {
  const me = useMe();
  const navigate = useNavigate();

  const [nickname, setNickname] = useState("");
  const [avatar, setAvatar] = useState<PotatoAvatar>("basic");
  const [homeSido, setHomeSido] = useState<SidoCode | "">("");
  const [agreed, setAgreed] = useState<Record<AgreementKey, boolean>>({
    terms: false,
    privacy: false,
    age: false,
    marketing: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const nickStatus = useNicknameCheck(nickname);

  if (!me) return <Navigate to="/login?next=%2Fonboarding" replace />;
  // 이미 온보딩을 마친 사용자는 프로필로. 단, 방금 제출해서 닉네임이 생긴 경우는 아래 navigate가 /welcome으로 보낸다
  if (me.nickname !== null && !submitting) return <Navigate to="/me" replace />;

  const allAgreed = AGREEMENTS.every((a) => agreed[a.key]);
  const requiredAgreed = AGREEMENTS.filter((a) => a.required).every((a) => agreed[a.key]);
  const canSubmit = requiredAgreed && nickStatus === "available" && !submitting;

  const toggleAll = (on: boolean) => setAgreed({ terms: on, privacy: on, age: on, marketing: on });

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await completeOnboarding({
        nickname,
        potatoAvatar: avatar,
        homeSido: homeSido || null,
        marketingOptIn: agreed.marketing,
      });
      // 성공하면 이 화면은 사라진다. submitting을 되돌리면 라우터 전환(transition)보다 먼저 렌더돼 위의 /me 리다이렉트가 끼어든다
      navigate("/welcome", { replace: true });
    } catch {
      setSubmitting(false);
    }
  };

  return (
    <AuthFrame
      label="STAR-SPUD · ONBOARDING"
      title="감자 하나 심고 시작해요"
      body="닉네임과 내 감자만 고르면 끝이에요. 주로 보는 지역을 알려주면 오늘 밤 추천이 더 가까워져요."
    >
      <Steps active={[1, 2]} />
      <h2 className={styles.h2}>거의 다 됐어요</h2>
      <p className={styles.lead}>카카오 계정 {me.email ?? "(이메일 없음)"}으로 가입해요.</p>

      <form className={styles.form} onSubmit={onSubmit} noValidate>
        {/* 1. 닉네임 */}
        <div className={styles.field}>
          <label htmlFor="nickname" className={styles.fieldLabel}>
            닉네임
          </label>
          <div className={styles.inputWrap}>
            <input
              id="nickname"
              className={styles.input}
              value={nickname}
              maxLength={NICKNAME_MAX}
              autoComplete="off"
              spellCheck={false}
              onChange={(e) => setNickname(e.target.value)}
              aria-describedby="nickname-help nickname-status"
              aria-invalid={nickStatus === "invalid" || nickStatus === "taken"}
            />
            <NickStatusText status={nickStatus} />
          </div>
          <div className={styles.help} id="nickname-help">
            <span>한글·영문·숫자 2~12자 · 30일에 한 번 변경</span>
            <span className="tabular">
              {nickname.length}/{NICKNAME_MAX}
            </span>
          </div>
        </div>

        {/* 2. 내 감자 */}
        <fieldset className={styles.field}>
          <legend className={styles.fieldLabel}>내 감자</legend>
          <div className={styles.avatars}>
            {POTATO_AVATARS.map((a) => (
              <button
                key={a}
                type="button"
                className={a === avatar ? styles.avatarSelected : styles.avatar}
                aria-pressed={a === avatar}
                onClick={() => setAvatar(a)}
              >
                <img
                  src={POTATO_AVATAR_SRC[a]}
                  alt=""
                  width={52}
                  height={52}
                  className="pixelated"
                />
                <span>{POTATO_AVATAR_LABEL[a]}</span>
              </button>
            ))}
          </div>
        </fieldset>

        {/* 3. 주로 보는 지역 */}
        <div className={styles.field}>
          <label htmlFor="homeSido" className={styles.fieldLabel}>
            주로 보는 지역 <span className={styles.optional}>선택</span>
          </label>
          <select
            id="homeSido"
            className={styles.select}
            value={homeSido}
            onChange={(e) => setHomeSido(e.target.value as SidoCode | "")}
          >
            <option value="">아직 안 정했어요</option>
            {SIDO_CODES.map((code) => (
              <option key={code} value={code}>
                {SIDO[code].name}
              </option>
            ))}
          </select>
          <p className={styles.helpLine}>홈의 '오늘 밤' 추천과 거리 계산 기준이 돼요.</p>
        </div>

        {/* 4. 약관 */}
        <div className={styles.agreeBox}>
          <label className={`${styles.agreeRow} ${styles.agreeAll}`}>
            <input
              type="checkbox"
              checked={allAgreed}
              onChange={(e) => toggleAll(e.target.checked)}
            />
            <span>전체 동의</span>
          </label>
          <div className={styles.agreeSep} />
          {AGREEMENTS.map((a) => (
            <label key={a.key} className={styles.agreeRow}>
              <input
                type="checkbox"
                checked={agreed[a.key]}
                onChange={(e) => setAgreed({ ...agreed, [a.key]: e.target.checked })}
              />
              <span>{a.label}</span>
              <span className={a.required ? styles.required : styles.optionalTag}>
                {a.required ? "필수" : "선택"}
              </span>
            </label>
          ))}
        </div>

        {/* 5. 제출 */}
        <PillButton type="submit" tone="primary" className={styles.submit} disabled={!canSubmit}>
          감자 심으러 가기
        </PillButton>
      </form>
    </AuthFrame>
  );
}

function NickStatusText({ status }: { status: NickStatus }) {
  const text = NICK_STATUS_TEXT;
  const cls =
    status === "available"
      ? styles.statusOk
      : status === "checking"
        ? styles.statusMuted
        : styles.statusBad;
  return (
    <span id="nickname-status" className={`${styles.status} ${cls}`} role="status">
      {text[status]}
    </span>
  );
}
