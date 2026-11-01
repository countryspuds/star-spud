import { Suspense, useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import potatoSad from "../../assets/potato/potato-sad.svg";
import { Card } from "../../components/ui/Card";
import { ExampleCaption, Label } from "../../components/ui/Label";
import { PillButton, PillLink } from "../../components/ui/Pill";
import {
  BODY_MAX,
  MEETUP_CAPACITY,
  PHOTO_MAX,
  POLL_OPTIONS_MAX,
  POLL_OPTIONS_MIN,
  clearDraft,
  createPost,
  loadDraft,
  saveDraft,
  searchSpotTags,
  spotNameOf,
  updatePost,
  type PostDetail,
  type PostDraft,
  type PostInput,
  type PostType,
} from "../../data/community";
import { fmtHM, todayYmd } from "../../lib/time";
import authStyles from "../auth/auth.module.css";
import { useMe } from "../auth/useMe";
import { DeleteModal } from "./PostCard";
import { POST_ERROR_TEXT, POST_TYPES } from "./labels";
import { usePost } from "./useCommunity";
import styles from "./community.module.css";

/* ── 폼 상태 ↔ 입력 모델 ───────────────── */
interface FormState {
  type: PostType;
  spot: { id: string; name: string } | null;
  body: string;
  reviewOn: boolean;
  visitedOn: string;
  photoContest: boolean;
  /** datetime-local 값 "YYYY-MM-DDTHH:MM" */
  meetupAt: string;
  meetPoint: string;
  capacity: string;
  pollOn: boolean;
  pollOptions: string[];
}

const EMPTY: FormState = {
  type: "review",
  spot: null,
  body: "",
  reviewOn: false,
  visitedOn: todayYmd(),
  photoContest: false,
  meetupAt: "",
  meetPoint: "",
  capacity: "6",
  pollOn: false,
  pollOptions: ["", ""],
};

/** ISO(+09:00) → datetime-local 값. 표시는 한국 시각 기준 */
function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const kst = new Date(d.getTime() + 9 * 3_600_000);
  return kst.toISOString().slice(0, 16);
}

function fromInput(input: PostInput, spotName: string | null): FormState {
  return {
    type: input.type,
    spot: input.spotId ? { id: input.spotId, name: spotName ?? input.spotId } : null,
    body: input.body,
    reviewOn: input.reviewInfo !== null,
    visitedOn: input.reviewInfo?.visitedOn ?? todayYmd(),
    photoContest: input.photoContest,
    meetupAt: input.meetup ? toLocalInput(input.meetup.at) : "",
    meetPoint: input.meetup?.meetPoint ?? "",
    capacity: input.meetup ? String(input.meetup.capacity) : "6",
    pollOn: input.poll !== null,
    pollOptions: input.poll?.options.length ? input.poll.options : ["", ""],
  };
}

function fromPost(post: PostDetail): FormState {
  return fromInput(
    {
      type: post.type,
      spotId: post.spot?.id ?? null,
      body: post.body,
      photoKeys: [],
      reviewInfo: post.reviewInfo,
      photoContest: post.photoContest,
      meetup: post.meetup
        ? { at: post.meetup.at, meetPoint: post.meetup.meetPoint, capacity: post.meetup.capacity }
        : null,
      poll: post.poll ? { options: post.poll.options.map((o) => o.label) } : null,
    },
    post.spot?.name ?? null,
  );
}

function toInput(f: FormState): PostInput {
  return {
    type: f.type,
    spotId: f.spot?.id ?? null,
    body: f.body,
    // TODO(Phase 2 백엔드): 사진을 POST /api/v1/uploads/presign → PUT으로 올리고 키를 넣는다
    photoKeys: [],
    reviewInfo: f.reviewOn ? { visitedOn: f.visitedOn } : null,
    photoContest: f.type === "photo" && f.photoContest,
    meetup:
      f.type === "meetup"
        ? {
            at: f.meetupAt ? `${f.meetupAt}:00+09:00` : "",
            meetPoint: f.meetPoint,
            capacity: Number(f.capacity),
          }
        : null,
    poll: f.type === "question" && f.pollOn ? { options: f.pollOptions } : null,
  };
}

/* ── 사진 미리보기 ─────────────────────── */
interface Photo {
  file: File;
  url: string;
}

/* ── 명소 태그 검색 ────────────────────── */
function SpotPicker({
  spot,
  onChange,
}: {
  spot: FormState["spot"];
  onChange: (spot: FormState["spot"]) => void;
}) {
  const [q, setQ] = useState("");
  const results = searchSpotTags(q);
  if (spot) {
    return (
      <div className={styles.pickedSpot}>
        <span className={styles.pickedName}>{spot.name}</span>
        <button
          type="button"
          className={styles.pickedRemove}
          aria-label="명소 태그 지우기"
          onClick={() => onChange(null)}
        >
          ✕
        </button>
      </div>
    );
  }
  return (
    <div className={styles.spotSearch}>
      <input
        className={authStyles.input}
        value={q}
        placeholder="명소 이름이나 시·군·구로 검색"
        aria-label="명소 검색"
        autoComplete="off"
        onChange={(e) => setQ(e.target.value)}
      />
      {q.trim() !== "" && (
        <ul className={styles.suggest} role="listbox" aria-label="명소 검색 결과">
          {results.length === 0 ? (
            <li className={styles.suggestEmpty}>일치하는 명소가 없어요</li>
          ) : (
            results.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={false}
                  className={styles.suggestItem}
                  onClick={() => {
                    onChange({ id: r.id, name: r.name });
                    setQ("");
                  }}
                >
                  <span>{r.name}</span>
                  <span className={styles.suggestSub}>{r.sigungu}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

/* ── 폼 ────────────────────────────────── */
interface EditorProps {
  mode: "write" | "edit";
  initial: FormState;
  postId?: string;
  draft?: PostDraft | null;
}

function Editor({ mode, initial, postId, draft }: EditorProps) {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(initial);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [draftShown, setDraftShown] = useState(draft !== null && draft !== undefined);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  // 미리보기 URL은 떠날 때 모두 해제
  const photosRef = useRef<Photo[]>([]);
  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);
  useEffect(() => () => photosRef.current.forEach((p) => URL.revokeObjectURL(p.url)), []);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const all = Array.from(list);
    const heic = all.some((f) => /\.hei[cf]$/i.test(f.name) || /heic|heif/i.test(f.type));
    const images = all.filter((f) => f.type.startsWith("image/") && !/heic|heif/i.test(f.type));
    const room = PHOTO_MAX - photos.length;
    if (heic) setPhotoError("HEIC 사진은 아직 못 올려요. JPG로 바꿔서 올려 주세요");
    else if (images.length > room) setPhotoError(`사진은 ${PHOTO_MAX}장까지예요`);
    else setPhotoError(null);
    const next = images.slice(0, room).map((file) => ({ file, url: URL.createObjectURL(file) }));
    if (next.length) setPhotos((prev) => [...prev, ...next]);
  };
  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    addFiles(e.target.files);
    e.target.value = "";
  };
  const removePhoto = (i: number) => {
    URL.revokeObjectURL(photos[i].url);
    setPhotos(photos.filter((_, j) => j !== i));
    setPhotoError(null);
  };

  const bodyLen = form.body.length;
  const canSubmit = form.body.trim() !== "" && bodyLen <= BODY_MAX && !busy;

  const onSaveDraft = () => {
    const d = saveDraft(toInput(form));
    setSavedAt(d.savedAt);
    setDraftShown(false);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      const input = toInput(form);
      const post =
        mode === "edit" && postId ? await updatePost(postId, input) : await createPost(input);
      if (mode === "write") clearDraft();
      navigate(`/community/${post.id}`, { replace: true });
    } catch (err) {
      const code = err instanceof Error ? err.message : "";
      setError(POST_ERROR_TEXT[code] ?? "저장하지 못했어요. 잠시 뒤 다시 시도해 주세요");
      setBusy(false);
    }
  };

  const nowLocal = toLocalInput(new Date().toISOString());

  return (
    <form className={styles.editor} onSubmit={onSubmit} noValidate>
      {draftShown && draft && (
        <div className={styles.draftBar} role="status">
          <span>{fmtHM(draft.savedAt)}에 임시저장한 글이 있어요</span>
          <div className={styles.draftBtns}>
            <PillButton
              size="sm"
              onClick={() => {
                setForm(fromInput(draft, draft.spotId ? spotNameOf(draft.spotId) : null));
                setDraftShown(false);
              }}
            >
              불러오기
            </PillButton>
            <PillButton
              size="sm"
              onClick={() => {
                clearDraft();
                setDraftShown(false);
              }}
            >
              지우기
            </PillButton>
          </div>
        </div>
      )}

      {mode === "edit" && (
        <p className={styles.editNotice}>저장하면 글에 (수정됨) 표시가 붙어요.</p>
      )}

      {/* 글 종류 세그먼트 */}
      <div className={authStyles.field}>
        <span className={authStyles.fieldLabel}>글 종류</span>
        <div className={styles.segment} role="radiogroup" aria-label="글 종류">
          {POST_TYPES.map((t) => (
            <button
              key={t.type}
              type="button"
              role="radio"
              aria-checked={form.type === t.type}
              className={form.type === t.type ? styles.segOn : styles.seg}
              style={form.type === t.type ? { borderColor: t.color } : undefined}
              onClick={() => set("type", t.type)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* 명소 태그 */}
      <div className={authStyles.field}>
        <span className={authStyles.fieldLabel}>
          명소 태그{" "}
          <span className={authStyles.optional}>
            {form.type === "meetup" ? "모임은 필수" : "선택"}
          </span>
        </span>
        <SpotPicker spot={form.spot} onChange={(s) => set("spot", s)} />
        <p className={authStyles.helpLine}>태그하면 글에 그 명소의 오늘 밤 지수가 함께 보여요.</p>
      </div>

      {/* 모임 */}
      {form.type === "meetup" && (
        <fieldset className={styles.subForm}>
          <legend className={authStyles.fieldLabel}>모임</legend>
          <div className={styles.subGrid}>
            <label className={styles.subField}>
              <span>날짜 · 시각</span>
              <input
                type="datetime-local"
                className={authStyles.input}
                value={form.meetupAt}
                min={nowLocal}
                onChange={(e) => set("meetupAt", e.target.value)}
              />
            </label>
            <label className={styles.subField}>
              <span>집결 장소</span>
              <input
                className={authStyles.input}
                value={form.meetPoint}
                maxLength={60}
                placeholder="예: 죽령휴게소 주차장"
                onChange={(e) => set("meetPoint", e.target.value)}
              />
            </label>
            <label className={styles.subField}>
              <span>정원</span>
              <input
                type="number"
                inputMode="numeric"
                className={authStyles.input}
                value={form.capacity}
                min={MEETUP_CAPACITY.min}
                max={MEETUP_CAPACITY.max}
                onChange={(e) => set("capacity", e.target.value)}
              />
            </label>
          </div>
          <p className={authStyles.helpLine}>
            야간·산간 활동은 위험할 수 있어요. 서비스는 만남을 중개하지 않아요 (specs/06 안전 고지).
          </p>
        </fieldset>
      )}

      {/* 투표 */}
      {form.type === "question" && (
        <fieldset className={styles.subForm}>
          <legend className={authStyles.fieldLabel}>투표</legend>
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={form.pollOn}
              onChange={(e) => set("pollOn", e.target.checked)}
            />
            <span>
              투표 붙이기 ({POLL_OPTIONS_MIN}~{POLL_OPTIONS_MAX}개 선택지)
            </span>
          </label>
          {form.pollOn && (
            <div className={styles.pollEdit}>
              {form.pollOptions.map((o, i) => (
                <div key={i} className={styles.pollEditRow}>
                  <input
                    className={authStyles.input}
                    value={o}
                    maxLength={40}
                    placeholder={`선택지 ${i + 1}`}
                    aria-label={`선택지 ${i + 1}`}
                    onChange={(e) =>
                      set(
                        "pollOptions",
                        form.pollOptions.map((x, j) => (j === i ? e.target.value : x)),
                      )
                    }
                  />
                  {form.pollOptions.length > POLL_OPTIONS_MIN && (
                    <button
                      type="button"
                      className={styles.pickedRemove}
                      aria-label={`선택지 ${i + 1} 지우기`}
                      onClick={() =>
                        set(
                          "pollOptions",
                          form.pollOptions.filter((_, j) => j !== i),
                        )
                      }
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              {form.pollOptions.length < POLL_OPTIONS_MAX && (
                <PillButton size="sm" onClick={() => set("pollOptions", [...form.pollOptions, ""])}>
                  선택지 추가
                </PillButton>
              )}
            </div>
          )}
        </fieldset>
      )}

      {/* 본문 */}
      <div className={authStyles.field}>
        <label htmlFor="post-body" className={authStyles.fieldLabel}>
          본문
        </label>
        <textarea
          id="post-body"
          className={styles.textarea}
          value={form.body}
          maxLength={BODY_MAX}
          rows={8}
          placeholder="어디서, 무엇을, 어떻게 봤는지 자유롭게 적어 주세요."
          onChange={(e) => set("body", e.target.value)}
          aria-describedby="post-body-help"
        />
        <div className={authStyles.help} id="post-body-help">
          <span>외부 링크는 nofollow로 표시돼요</span>
          <span className="tabular">
            {bodyLen.toLocaleString()}/{BODY_MAX.toLocaleString()}
          </span>
        </div>
      </div>

      {/* 사진 */}
      <div className={authStyles.field}>
        <span className={authStyles.fieldLabel}>
          사진 <span className={authStyles.optional}>최대 {PHOTO_MAX}장</span>
        </span>
        <div className={styles.photoRow}>
          <input
            ref={fileInput}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            className="sr-only"
            onChange={onFileChange}
            aria-label="사진 고르기"
          />
          <PillButton
            size="sm"
            onClick={() => fileInput.current?.click()}
            disabled={photos.length >= PHOTO_MAX}
          >
            {photos.length >= PHOTO_MAX ? `${PHOTO_MAX}장 다 골랐어요` : "사진 고르기"}
          </PillButton>
          <span className={authStyles.helpLine}>
            JPG · PNG · WEBP. 업로드는 아직 연결 전이라 미리보기만 돼요 (presign TODO)
          </span>
        </div>
        {photos.length > 0 && (
          <ul className={styles.previews}>
            {photos.map((p, i) => (
              <li key={p.url}>
                <img src={p.url} alt={`고른 사진 ${i + 1}`} />
                <button
                  type="button"
                  className={styles.previewRemove}
                  aria-label={`사진 ${i + 1} 빼기`}
                  onClick={() => removePhoto(i)}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
        {photoError && (
          <p className={styles.inlineError} role="alert">
            {photoError}
          </p>
        )}
      </div>

      {/* 체크 2개 */}
      <div className={styles.checks}>
        <label className={styles.check}>
          <input
            type="checkbox"
            checked={form.reviewOn}
            onChange={(e) => set("reviewOn", e.target.checked)}
          />
          <span>후기 정보 포함 — 방문일을 적으면 그날 밤 지수·달·구름이 글에 붙어요</span>
        </label>
        {form.reviewOn && (
          <label className={`${styles.subField} ${styles.visitedField}`}>
            <span>방문일</span>
            <input
              type="date"
              className={authStyles.input}
              value={form.visitedOn}
              max={todayYmd()}
              onChange={(e) => set("visitedOn", e.target.value)}
            />
          </label>
        )}
        <label className={styles.check} data-disabled={form.type !== "photo" || undefined}>
          <input
            type="checkbox"
            checked={form.type === "photo" && form.photoContest}
            disabled={form.type !== "photo"}
            onChange={(e) => set("photoContest", e.target.checked)}
          />
          <span>
            이달의 사진에 응모{" "}
            <span className={authStyles.optional}>
              {form.type === "photo" ? "사진 응모 글만" : "'사진 응모' 종류를 고르면 켜져요"}
            </span>
          </span>
        </label>
      </div>

      {error && (
        <p className={styles.inlineError} role="alert">
          {error}
        </p>
      )}

      <div className={styles.editorActions}>
        <div className={styles.editorLeft}>
          {mode === "write" ? (
            <>
              <PillButton size="sm" onClick={onSaveDraft} disabled={form.body.trim() === ""}>
                임시저장
              </PillButton>
              {savedAt && (
                <span className={styles.savedMsg} role="status">
                  {fmtHM(savedAt)} 임시저장됨
                </span>
              )}
            </>
          ) : (
            <PillButton size="sm" className={styles.dangerPill} onClick={() => setConfirming(true)}>
              삭제
            </PillButton>
          )}
        </div>
        <div className={styles.editorRight}>
          <PillLink
            size="sm"
            to={mode === "edit" && postId ? `/community/${postId}` : "/community"}
          >
            취소
          </PillLink>
          <PillButton size="sm" tone="primary" type="submit" disabled={!canSubmit}>
            {mode === "edit" ? "저장" : "올리기"}
          </PillButton>
        </div>
      </div>

      {confirming && postId && (
        <DeleteModal
          postId={postId}
          onClose={() => setConfirming(false)}
          onDeleted={() => navigate("/community", { replace: true })}
        />
      )}
    </form>
  );
}

/* ── 진입 ──────────────────────────────── */
function EditGate({ id }: { id: string }) {
  const me = useMe();
  const post = usePost(id);
  if (!post) {
    return (
      <Card className={styles.notFound}>
        <img src={potatoSad} alt="" width={96} height={96} className="pixelated" />
        <Label>NOT FOUND</Label>
        <h1 className={styles.h1}>글이 없어요</h1>
        <PillLink to="/community" tone="primary">
          피드로 가기
        </PillLink>
      </Card>
    );
  }
  // 내 글이 아니면 상세로
  if (!me || me.id !== post.author.id) return <Navigate to={`/community/${id}`} replace />;
  return <Editor key={post.id} mode="edit" initial={fromPost(post)} postId={post.id} />;
}

function WriteGate() {
  const [draft] = useState(loadDraft);
  return <Editor mode="write" initial={EMPTY} draft={draft} />;
}

function Gate() {
  const me = useMe();
  const { pathname } = useLocation();
  const { id } = useParams();
  if (!me) return <Navigate to={`/login?next=${encodeURIComponent(pathname)}`} replace />;
  // 온보딩 전은 OnboardingGuard가 먼저 보내지만, 진입부에서도 한 번 더 확인한다
  if (me.nickname === null) return <Navigate to="/onboarding" replace />;
  return id ? <EditGate id={id} /> : <WriteGate />;
}

/** `/community/write` · `/community/:id/edit` — 같은 폼 (Phase 2) */
export default function PostEditorPage() {
  const { id } = useParams();
  return (
    <div className={styles.editorPage}>
      <header className={styles.head}>
        <div>
          <Label>COMMUNITY · {id ? "EDIT" : "WRITE"}</Label>
          <h1 className={styles.h1}>{id ? "글 수정" : "글쓰기"}</h1>
        </div>
        <ExampleCaption />
      </header>
      <Card className={styles.editorCard}>
        <Suspense fallback={null}>
          <Gate />
        </Suspense>
      </Card>
      <p className={styles.fine}>
        <Link to="/guide">커뮤니티 가이드</Link>를 지켜 주세요. 신고가 3건 모이면 글이 숨겨지고
        운영자가 확인해요.
      </p>
    </div>
  );
}
