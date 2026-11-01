import { Suspense, use, useState, type FormEvent } from "react";
import { Link, useOutletContext } from "react-router-dom";
import {
  deleteMe,
  getNotificationSettings,
  updateMe,
  updateNotificationSettings,
  type Me,
  type NotificationSettings,
  type PotatoAvatar,
} from "../../data/auth";
import { getMyFeedback } from "../../data/feedback";
import { SIDO, type SidoCode } from "../../data/regions";
import { Avatar } from "../../components/ui/Avatar";
import { Card } from "../../components/ui/Card";
import { ExampleCaption, Label } from "../../components/ui/Label";
import { PillButton } from "../../components/ui/Pill";
import { POTATO_AVATARS, POTATO_AVATAR_LABEL, POTATO_AVATAR_SRC } from "../../lib/potatoAvatar";
import { NICKNAME_MAX, NICK_STATUS_TEXT, useNicknameCheck } from "../auth/useNicknameCheck";
import authStyles from "../auth/auth.module.css";
import styles from "./profile.module.css";

const SIDO_CODES = Object.keys(SIDO) as SidoCode[];
const fmtDate = (ymd: string) => ymd.replaceAll("-", ".");

/* ── 프로필 카드 ───────────────────────── */
function ProfileCard({
  me,
  saved,
  onSaved,
}: {
  me: Me;
  /** 저장 완료 표시 — 저장 뒤 me가 바뀌면 이 카드가 새로 만들어지므로 부모가 들고 있다 */
  saved: boolean;
  onSaved: (saved: boolean) => void;
}) {
  const current = me.nickname ?? "";
  const [nickname, setNickname] = useState(current);
  const [avatar, setAvatar] = useState<PotatoAvatar>(me.potatoAvatar);
  const [homeSido, setHomeSido] = useState<SidoCode | "">((me.homeSido as SidoCode | null) ?? "");
  const [saving, setSaving] = useState(false);
  const nickStatus = useNicknameCheck(nickname, current);

  const dirty =
    nickname !== current || avatar !== me.potatoAvatar || (homeSido || null) !== me.homeSido;
  const nickOk = nickname === current || nickStatus === "available";
  const canSave = dirty && nickOk && !saving;

  const reset = () => {
    setNickname(current);
    setAvatar(me.potatoAvatar);
    setHomeSido((me.homeSido as SidoCode | null) ?? "");
    onSaved(false);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    setSaving(true);
    try {
      await updateMe({
        nickname: nickname !== current ? nickname : undefined,
        potatoAvatar: avatar,
        homeSido: homeSido || null,
      });
      onSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card variant="glass" className={styles.settingsCard}>
      <Label>프로필</Label>
      <form className={styles.settingsForm} onSubmit={onSubmit} noValidate>
        {/* 프로필 사진 — 업로드는 Phase 2 (ADR-0014): 버튼 disabled + "곧 열려요" */}
        <div className={styles.photoRow}>
          <div className={styles.photoWrap}>
            <Avatar avatarUrl={me.avatarUrl} potatoAvatar={avatar} size={84} />
            <button
              type="button"
              className={styles.cameraBtn}
              disabled
              title="곧 열려요"
              aria-label="사진 바꾸기 (곧 열려요)"
            >
              ◉
            </button>
          </div>
          <div className={styles.photoActions}>
            <div className={styles.photoBtns}>
              <PillButton size="sm" className={styles.whitePill} disabled title="곧 열려요">
                사진 업로드
              </PillButton>
              <PillButton size="sm" disabled title="곧 열려요">
                감자로 되돌리기
              </PillButton>
              <span className={styles.soon}>곧 열려요</span>
            </div>
            <p className={styles.mono}>
              JPG · PNG · WEBP, 5 MB 이하 · 정사각형으로 잘려요
              <br />
              사진이 없으면 아래에서 고른 감자가 프로필이 돼요
            </p>
          </div>
        </div>

        {/* 닉네임 — 30일 규칙은 서버가 판정(canChangeNickname) */}
        <div className={authStyles.field}>
          <label htmlFor="s-nickname" className={authStyles.fieldLabel}>
            닉네임
          </label>
          <div className={authStyles.inputWrap}>
            <input
              id="s-nickname"
              className={authStyles.input}
              value={nickname}
              maxLength={NICKNAME_MAX}
              disabled={!me.canChangeNickname}
              autoComplete="off"
              spellCheck={false}
              onChange={(e) => setNickname(e.target.value)}
              aria-describedby="s-nickname-help"
              aria-invalid={nickStatus === "invalid" || nickStatus === "taken"}
            />
            <span
              className={`${authStyles.status} ${
                nickStatus === "available"
                  ? authStyles.statusOk
                  : nickStatus === "checking" || nickStatus === "idle"
                    ? authStyles.statusMuted
                    : authStyles.statusBad
              }`}
              role="status"
            >
              {NICK_STATUS_TEXT[nickStatus]}
            </span>
          </div>
          <div className={authStyles.help} id="s-nickname-help">
            <span>
              마지막 변경 {fmtDate(me.nicknameChangedAt)} · 다음 변경 가능{" "}
              {fmtDate(me.nicknameChangeableAt)}
            </span>
            <span className="tabular">
              {nickname.length}/{NICKNAME_MAX}
            </span>
          </div>
        </div>

        {/* 내 감자 */}
        <fieldset className={authStyles.field}>
          <legend className={authStyles.fieldLabel}>
            내 감자 <span className={authStyles.optional}>사진이 없을 때 쓰는 아바타</span>
          </legend>
          <div className={authStyles.avatars}>
            {POTATO_AVATARS.map((a) => (
              <button
                key={a}
                type="button"
                className={a === avatar ? authStyles.avatarSelected : authStyles.avatar}
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

        {/* 지역 */}
        <div className={authStyles.field}>
          <label htmlFor="s-homeSido" className={authStyles.fieldLabel}>
            주로 보는 지역
          </label>
          <select
            id="s-homeSido"
            className={authStyles.select}
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
        </div>

        <div className={styles.formActions}>
          {saved && !dirty && (
            <span className={styles.savedMsg} role="status">
              저장했어요
            </span>
          )}
          <PillButton size="sm" onClick={reset} disabled={!dirty}>
            취소
          </PillButton>
          <PillButton size="sm" tone="primary" type="submit" disabled={!canSave}>
            저장
          </PillButton>
        </div>
      </form>
    </Card>
  );
}

/* ── 알림 카드 ─────────────────────────── */
const ALERT_ROWS: {
  key: keyof NotificationSettings;
  title: string;
  sub: string;
  phase2?: boolean;
}[] = [
  { key: "meteorPeak", title: "유성우 극대기", sub: "극대기 전날 알림함에 넣어요" },
  { key: "newMoonWindow", title: "신월·촬영 적기", sub: "달 없는 밤이 시작될 때" },
  { key: "potatoHungry", title: "내 감자가 배고프면", sub: "큰 이벤트가 지나갔는데 안 갔을 때" },
  { key: "postComment", title: "내 후기에 댓글", sub: "커뮤니티와 함께 열려요", phase2: true },
  { key: "highIndex", title: "오늘 밤 지수 80 이상", sub: "주로 보는 지역 기준" },
];

/** 설정은 한 번만 읽고(use), 토글 상태는 자식이 가진다 — 토글마다 새 Promise로 다시 suspend되지 않게 */
function AlertsCard() {
  const initial = use(getNotificationSettings());
  return <AlertsForm initial={initial} />;
}

function AlertsForm({ initial }: { initial: NotificationSettings }) {
  const [settings, setSettings] = useState(initial);
  const toggle = async (key: keyof NotificationSettings) => {
    const next = { ...settings, [key]: !settings[key] };
    setSettings(next);
    await updateNotificationSettings({ [key]: next[key] });
  };
  return (
    <Card variant="glass" className={styles.settingsCard}>
      <div className={styles.cardHead}>
        <Label>알림</Label>
        <span className={styles.mono}>MVP는 앱 내 알림함</span>
      </div>
      <ul className={styles.alertRows}>
        {ALERT_ROWS.map((r) => (
          <li key={r.key} className={styles.alertRow}>
            <div className={styles.alertText}>
              <span className={styles.alertTitle}>{r.title}</span>
              <span className={styles.alertSub}>
                {r.phase2 ? "Phase 2 · " : ""}
                {r.sub}
              </span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings[r.key]}
              aria-label={r.title}
              className={settings[r.key] ? styles.toggleOn : styles.toggle}
              disabled={r.phase2}
              onClick={() => toggle(r.key)}
            >
              <span className={styles.knob} />
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/* ── 계정 카드 ─────────────────────────── */
function AccountCard({ me }: { me: Me }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // 삭제되면 사용자가 null이 되고 ProfileLayout이 홈으로 보낸다
  const onDelete = async () => {
    setDeleting(true);
    try {
      await deleteMe();
    } catch {
      setDeleting(false);
    }
  };

  return (
    <Card variant="glass" className={styles.settingsCard}>
      <Label>계정</Label>
      <ul className={styles.accountRows}>
        <li className={styles.accountRow}>
          <span className={styles.alertTitle}>카카오</span>
          <span className={styles.linked}>연결됨 · {me.email ?? "이메일 없음"}</span>
        </li>
        <li className={styles.accountRow}>
          <span className={styles.alertTitle}>네이버</span>
          <PillButton size="sm" disabled>
            Phase 2
          </PillButton>
        </li>
        <li className={styles.accountRow}>
          <span className={styles.alertTitle}>이메일 로그인</span>
          <PillButton size="sm" disabled>
            Phase 2
          </PillButton>
        </li>
      </ul>
      <button type="button" className={styles.danger} onClick={() => setConfirming(true)}>
        회원 탈퇴
      </button>

      {confirming && (
        <div className={styles.modalBackdrop} onClick={() => !deleting && setConfirming(false)}>
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="delete-title" className={styles.modalTitle}>
              정말 탈퇴할까요?
            </h3>
            <p className={styles.modalBody}>
              감자밭과 후기가 모두 지워져요. 같은 카카오 계정으로 다시 가입해도 되돌릴 수 없어요.
            </p>
            <div className={styles.modalActions}>
              <PillButton size="sm" onClick={() => setConfirming(false)} disabled={deleting}>
                남을래요
              </PillButton>
              <PillButton
                size="sm"
                className={styles.dangerPill}
                onClick={onDelete}
                disabled={deleting}
              >
                탈퇴할게요
              </PillButton>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

/* ── 도움말 카드 ───────────────────────── */
function HelpCard() {
  const feedback = use(getMyFeedback());
  const applied = feedback.filter((f) => f.status === "applied").length;
  return (
    <Card variant="glass" className={styles.settingsCard}>
      <Label>도움말</Label>
      <ul className={styles.helpRows}>
        <li>
          <Link to="/feedback" className={styles.helpLink}>
            <span className={styles.alertTitle}>문의·버그 제보·기능 제안</span>
            <span className={styles.alertSub}>
              보낸 요청 {feedback.length} · 반영됨 {applied} <ExampleCaption />
            </span>
          </Link>
        </li>
        <li>
          <Link to="/faq" className={styles.helpLink}>
            <span className={styles.alertTitle}>자주 묻는 질문</span>
            <span className={styles.alertSub}>Phase 2 · 준비 중</span>
          </Link>
        </li>
      </ul>
    </Card>
  );
}

/** `/me/settings` — 명세 §15 */
export function SettingsPage() {
  const me = useOutletContext<Me>();
  const [saved, setSaved] = useState(false);
  return (
    <>
      <header className={styles.head}>
        <div>
          <Label>SETTINGS</Label>
          <h1 className={styles.h1}>설정</h1>
        </div>
      </header>
      <div className={styles.settingsGrid}>
        {/* 저장 뒤 me가 바뀌면 폼 초기값을 새로 잡도록 key */}
        <ProfileCard
          key={`${me.nickname}-${me.potatoAvatar}-${me.homeSido}`}
          me={me}
          saved={saved}
          onSaved={setSaved}
        />
        <div className={styles.settingsRight}>
          <Suspense fallback={null}>
            <AlertsCard />
          </Suspense>
          <AccountCard me={me} />
          <Suspense fallback={null}>
            <HelpCard />
          </Suspense>
        </div>
      </div>
    </>
  );
}
