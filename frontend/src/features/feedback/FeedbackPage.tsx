import {
  Suspense,
  use,
  useRef,
  useState,
  useSyncExternalStore,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
} from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import potatoHappy from "../../assets/potato/potato-happy.svg";
import { Card } from "../../components/ui/Card";
import { ExampleCaption, Label } from "../../components/ui/Label";
import { PillButton } from "../../components/ui/Pill";
import {
  getMyFeedback,
  getRecentChanges,
  submitFeedback,
  subscribeMyFeedback,
  type Diagnostics,
  type FeedbackStatus,
  type FeedbackType,
} from "../../data/feedback";
import { getLastRoute, useLastRoute } from "../../lib/lastRoute";
import { useMe } from "../auth/useMe";
import styles from "./feedback.module.css";

const APP_VERSION = import.meta.env.VITE_APP_VERSION ?? "dev";
const MAX_SCREENSHOTS = 3;
/** 느슨한 이메일 형식 — 공백 없이 "x@y.z" 꼴. 실제 수신 가능 여부는 서버가 본다 */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** 유형 4개 — 색은 명세 §16 */
const TYPES: { type: FeedbackType; label: string; hint: string; color: string }[] = [
  { type: "bug", label: "버그 제보", hint: "뭔가 안 돼요", color: "#ff8a8a" },
  { type: "feature", label: "기능 제안", hint: "이런 게 있으면", color: "var(--lime)" },
  { type: "spot_fix", label: "명소 정보 수정", hint: "주차·진입로가 달라요", color: "#7fb0ff" },
  { type: "other", label: "기타 문의", hint: "계정 · 신고 · 제휴", color: "var(--fg-2)" },
];
const TYPE_LABEL: Record<FeedbackType, string> = Object.fromEntries(
  TYPES.map((t) => [t.type, t.label]),
) as Record<FeedbackType, string>;

const isFeedbackType = (v: string | null): v is FeedbackType =>
  v !== null && TYPES.some((t) => t.type === v);

/** 상태 칩 — 접수 → 확인 중 → 반영됨 / 보류 */
const STATUS: Record<FeedbackStatus, { label: string; color: string }> = {
  received: { label: "접수", color: "var(--fg-2)" },
  reviewing: { label: "확인 중", color: "#e5c33d" },
  applied: { label: "반영됨", color: "var(--sprout)" },
  held: { label: "보류", color: "var(--fg-3)" },
};

const fmtDate = (ymd: string) => ymd.replaceAll("-", ".");

/** 제출 시점의 실제 진단 값 — 명세 §16 */
function collectDiagnostics(): Diagnostics {
  return {
    userAgent: navigator.userAgent,
    screen: `${window.innerWidth}×${window.innerHeight}`,
    lastRoute: getLastRoute(),
    appVersion: APP_VERSION,
  };
}

/** UA 문자열을 한 줄 요약 (표시용) */
function browserName(ua: string): string {
  if (/Edg\//.test(ua)) return "Edge";
  if (/Chrome\//.test(ua)) return "Chrome";
  if (/Safari\//.test(ua)) return "Safari";
  if (/Firefox\//.test(ua)) return "Firefox";
  return "브라우저";
}

/* ── 폼 ─────────────────────────────── */
function FeedbackForm({ onDone }: { onDone: (id: string) => void }) {
  const me = useMe();
  // 유형은 URL(?type=)이 기준 — 푸터 링크로 다른 유형을 눌러도 바로 따라오고, 주소를 공유하면 같은 유형이 열린다
  const [params, setParams] = useSearchParams();
  const typeParam = params.get("type");
  const type: FeedbackType = isFeedbackType(typeParam) ? typeParam : "bug";
  const setType = (t: FeedbackType) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("type", t);
        return next;
      },
      { replace: true },
    );
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [withDiagnostics, setWithDiagnostics] = useState(true);
  const [replyByEmail, setReplyByEmail] = useState(true);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  // 표시용 미리보기 — 직전 라우트는 Layout의 추적 effect 뒤에 정해지므로 구독해서 읽는다. 실제 전송 값은 제출 시점에 다시 모은다
  const lastRoute = useLastRoute();
  const [preview] = useState(collectDiagnostics);

  const canEmail = me !== null && me.email !== null;
  // 비로그인이 적은 이메일은 비어 있거나 형식이 맞아야 한다 (noValidate라 브라우저 검증이 없음)
  const emailTrimmed = email.trim();
  const emailInvalid = me === null && emailTrimmed !== "" && !EMAIL_RE.test(emailTrimmed);
  const canSubmit = title.trim() !== "" && body.trim() !== "" && !emailInvalid && !submitting;

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const images = Array.from(list).filter((f) => f.type.startsWith("image/"));
    setFiles((prev) => [...prev, ...images].slice(0, MAX_SCREENSHOTS));
  };
  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    addFiles(e.target.files);
    e.target.value = "";
  };
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      // TODO(Phase 1 후반): files를 POST /api/v1/uploads/presign → PUT으로 올리고 키를 screenshots에 넣는다
      const { id } = await submitFeedback({
        type,
        title: title.trim(),
        body: body.trim(),
        screenshots: [],
        diagnostics: withDiagnostics ? collectDiagnostics() : undefined,
        replyByEmail: me ? canEmail && replyByEmail : emailTrimmed !== "",
        email: me ? undefined : emailTrimmed || undefined,
      });
      onDone(id);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className={styles.form}>
      <form onSubmit={onSubmit} noValidate>
        {/* 유형 */}
        <fieldset className={styles.field}>
          <legend className={styles.fieldLabel}>유형</legend>
          <div className={styles.types}>
            {TYPES.map((t) => (
              <button
                key={t.type}
                type="button"
                className={styles.type}
                data-selected={t.type === type}
                style={{ ["--type-color" as string]: t.color }}
                aria-pressed={t.type === type}
                onClick={() => setType(t.type)}
              >
                <span className={styles.typeLabel}>{t.label}</span>
                <span className={styles.typeHint}>{t.hint}</span>
              </button>
            ))}
          </div>
        </fieldset>

        {/* 제목·내용 */}
        <div className={styles.field}>
          <label htmlFor="fb-title" className={styles.fieldLabel}>
            제목
          </label>
          <input
            id="fb-title"
            className={styles.input}
            value={title}
            maxLength={80}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="한 줄로 요약해 주세요"
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="fb-body" className={styles.fieldLabel}>
            내용
          </label>
          <textarea
            id="fb-body"
            className={styles.textarea}
            rows={7}
            value={body}
            maxLength={2000}
            onChange={(e) => setBody(e.target.value)}
            placeholder="버그라면: 어느 화면에서, 무엇을 눌렀을 때, 어떻게 됐는지 순서대로…"
          />
        </div>

        {/* 스크린샷 — 파일 선택까지만. 업로드는 TODO */}
        <div className={styles.field}>
          <span className={styles.fieldLabel}>
            스크린샷 <span className={styles.optional}>선택 · 최대 {MAX_SCREENSHOTS}장</span>
          </span>
          <div
            className={styles.dropzone}
            data-over={dragOver}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
          >
            <input
              ref={fileInput}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              className="sr-only"
              onChange={onFileChange}
              aria-label="스크린샷 파일 선택"
            />
            <button
              type="button"
              className={styles.dropBtn}
              onClick={() => fileInput.current?.click()}
              disabled={files.length >= MAX_SCREENSHOTS}
            >
              {files.length >= MAX_SCREENSHOTS
                ? "3장까지 넣었어요"
                : "여기에 끌어다 놓거나 눌러서 고르기"}
            </button>
          </div>
          {files.length > 0 && (
            <ul className={styles.files}>
              {files.map((f, i) => (
                <li key={`${f.name}-${i}`}>
                  <span>{f.name}</span>
                  <button
                    type="button"
                    className={styles.fileRemove}
                    onClick={() => setFiles(files.filter((_, j) => j !== i))}
                    aria-label={`${f.name} 빼기`}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 체크 2개 + 비로그인 이메일 */}
        <div className={styles.checks}>
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={withDiagnostics}
              onChange={(e) => setWithDiagnostics(e.target.checked)}
            />
            <span className={styles.checkText}>
              <span>진단 정보를 함께 보낼게요</span>
              <span className={styles.mono}>
                {browserName(preview.userAgent)} · {preview.screen} · 마지막 페이지{" "}
                {lastRoute ?? "없음"} · v{preview.appVersion}
              </span>
            </span>
          </label>
          {me ? (
            <label className={styles.check} data-disabled={!canEmail}>
              <input
                type="checkbox"
                checked={canEmail && replyByEmail}
                disabled={!canEmail}
                onChange={(e) => setReplyByEmail(e.target.checked)}
              />
              <span className={styles.checkText}>
                <span>답변을 이메일로 받을게요</span>
                <span className={styles.mono}>
                  {canEmail ? me.email : "계정에 이메일이 없어요 · 알림함으로 알려 드려요"}
                </span>
              </span>
            </label>
          ) : (
            <div className={styles.field}>
              <label htmlFor="fb-email" className={styles.fieldLabel}>
                답변 받을 이메일 <span className={styles.optional}>선택</span>
              </label>
              <input
                id="fb-email"
                type="email"
                className={styles.input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="비워 두면 답변을 받을 수 없어요"
                autoComplete="email"
                aria-invalid={emailInvalid}
                aria-describedby={emailInvalid ? "fb-email-error" : undefined}
              />
              {emailInvalid && (
                <span id="fb-email-error" className={styles.error} role="alert">
                  이메일 형식이 아니에요
                </span>
              )}
            </div>
          )}
        </div>

        <div className={styles.formFoot}>
          <span className={styles.mono}>보통 2~3일 안에 답해요</span>
          <PillButton type="submit" tone="primary" disabled={!canSubmit}>
            {submitting ? "보내는 중…" : "보내기"}
          </PillButton>
        </div>
      </form>
    </Card>
  );
}

/* ── 성공 카드 ───────────────────────── */
function Done({ id, onAgain }: { id: string; onAgain: () => void }) {
  return (
    <Card className={`${styles.form} ${styles.done}`}>
      <img src={potatoHappy} alt="" width={96} height={96} className="pixelated" />
      <Label>RECEIVED</Label>
      <h2 className={styles.doneTitle}>접수됐어요 · #{id}</h2>
      <p className={styles.doneBody}>보통 2~3일 안에 답해요. 반영되면 알림이 가요.</p>
      <div className={styles.doneActions}>
        <a href="#my-requests" className={styles.pillPrimary}>
          내 요청 보기
        </a>
        <PillButton onClick={onAgain}>하나 더 보내기</PillButton>
      </div>
    </Card>
  );
}

/* ── 우측 레일 ───────────────────────── */
function MyRequests() {
  const me = useMe();
  // 제출 직후 목록이 바뀌면 같은 자리에서 다시 렌더 — 새 Promise를 use()에 그냥 넘기면 "uncached promise" 경고가 난다
  const items = use(useSyncExternalStore(subscribeMyFeedback, getMyFeedback, getMyFeedback));
  return (
    <Card variant="glass" className={styles.rail} id="my-requests">
      <div className={styles.railHead}>
        <Label>내가 보낸 요청</Label>
        <ExampleCaption />
      </div>
      {!me && items.length === 0 ? (
        <p className={styles.railEmpty}>로그인하면 보낸 요청의 상태를 여기서 볼 수 있어요.</p>
      ) : items.length === 0 ? (
        <p className={styles.railEmpty}>아직 보낸 요청이 없어요.</p>
      ) : (
        <ul className={styles.requests}>
          {items.map((f) => (
            <li key={f.id} className={styles.request}>
              <div className={styles.requestText}>
                <span className={styles.requestTitle}>{f.title}</span>
                <span className={styles.mono}>
                  {TYPE_LABEL[f.type]} · {fmtDate(f.createdAt)}
                </span>
              </div>
              <span className={styles.chip} style={{ color: STATUS[f.status].color }}>
                {STATUS[f.status].label}
              </span>
            </li>
          ))}
        </ul>
      )}
      <p className={styles.mono}>접수 → 확인 중 → 반영됨 / 보류. 반영되면 알림이 가요</p>
    </Card>
  );
}

function RecentChanges() {
  const items = use(getRecentChanges());
  return (
    <Card variant="glass" className={styles.rail}>
      <div className={styles.railHead}>
        <Label>최근 반영된 요청</Label>
        <ExampleCaption />
      </div>
      <ul className={styles.changes}>
        {items.map((c) => (
          <li key={c.date + c.title}>
            <span className={styles.mono}>{fmtDate(c.date)}</span>
            <span>{c.title}</span>
          </li>
        ))}
      </ul>
      <Link to="/changelog" className={styles.more}>
        전체 변경 내역 →
      </Link>
    </Card>
  );
}

function SuggestionPotato() {
  return (
    <Card variant="glass" className={`${styles.rail} ${styles.potatoNote}`}>
      <img src={potatoHappy} alt="" width={36} height={36} className="pixelated" />
      <span>반영된 제안을 보낸 분께는 제안 감자가 감자밭에 심겨요</span>
    </Card>
  );
}

/** `/feedback` — 명세 §16. 비로그인도 보낼 수 있다 */
export function FeedbackPage() {
  const { search } = useLocation();
  // 접수 화면은 제출한 그 주소(?type=)에서만 — 푸터 등에서 다른 유형 링크로 들어오면 그 유형의 빈 폼이 열린다
  const [done, setDone] = useState<{ id: string; search: string } | null>(null);
  const doneId = done !== null && done.search === search ? done.id : null;
  const onDone = (id: string) => setDone({ id, search });
  // 다시 보내기 때 폼을 새로 만들기 위한 키
  const [formKey, setFormKey] = useState(0);
  const again = () => {
    setDone(null);
    setFormKey((k) => k + 1);
  };
  return (
    <>
      <header className={styles.head}>
        <Label>HELP · FEEDBACK</Label>
        <h1 className={styles.h1}>무엇을 도와드릴까요?</h1>
      </header>
      <div className={styles.grid}>
        {doneId ? (
          <Done id={doneId} onAgain={again} />
        ) : (
          <FeedbackForm key={formKey} onDone={onDone} />
        )}
        <div className={styles.rails}>
          <Suspense fallback={null}>
            <MyRequests />
            <RecentChanges />
          </Suspense>
          <SuggestionPotato />
        </div>
      </div>
    </>
  );
}
