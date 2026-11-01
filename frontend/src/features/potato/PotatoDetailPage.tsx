import { Suspense, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import potatoSad from "../../assets/potato/potato-sad.svg";
import { PotatoIllust } from "../../components/potato/PotatoIllust";
import { Card } from "../../components/ui/Card";
import { ExampleCaption, Label } from "../../components/ui/Label";
import { PillButton, PillLink } from "../../components/ui/Pill";
import {
  deleteFeed,
  updateFeed,
  updatePotato,
  type Feed,
  type PotatoDetail,
} from "../../data/potatoes";
import { FOOD_LABEL, foodIconSrc } from "../../lib/food";
import { iGa } from "../../lib/josa";
import { LEVEL_NAME } from "../../lib/potatoIllust";
import { todayYmd } from "../../lib/time";
import { usePotato } from "./useMyPotatoes";
import styles from "./potato.module.css";

const fmtDate = (ymd: string) => ymd.replaceAll("-", ".");
/** 이보다 길면 3줄로 접고 "더 보기" */
const FOLD_LENGTH = 90;

const EDIT_ERROR: Record<string, string> = {
  FEED_ALREADY_EXISTS: "그날 기록이 이미 있어요",
  VISIT_DATE_IN_FUTURE: "방문일은 오늘까지만 고를 수 있어요",
  VISIT_DATE_TOO_OLD: "2000년 1월 1일 이후만 기록할 수 있어요",
  VISIT_DATE_INVALID: "방문일을 골라 주세요",
  REVIEW_LENGTH: "후기는 2~2000자로 적어 주세요",
};

/* ── 기록 수정 (행 자리에서) ───────────── */
function FeedEditor({ feed, onClose }: { feed: Feed; onClose: () => void }) {
  const [visitedOn, setVisitedOn] = useState(feed.visitedOn);
  const [review, setReview] = useState(feed.review);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const trimmed = review.trim();
  const canSave = visitedOn !== "" && trimmed.length >= 2 && trimmed.length <= 2000 && !saving;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      await updateFeed(feed.id, { visitedOn, review: trimmed });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "UNKNOWN");
      setSaving(false);
    }
  };

  return (
    <li className={styles.feedRow}>
      <img src={foodIconSrc(feed.food)} alt="" width={28} height={28} className="pixelated" />
      <form onSubmit={onSubmit} noValidate className={styles.editor}>
        <input
          type="date"
          className={styles.input}
          value={visitedOn}
          max={todayYmd()}
          min="2000-01-01"
          onChange={(e) => setVisitedOn(e.target.value)}
          aria-label="방문일"
        />
        <textarea
          className={styles.textarea}
          rows={4}
          value={review}
          onChange={(e) => setReview(e.target.value)}
          aria-label="후기"
        />
        <span className={styles.hint}>방문일을 바꾸면 먹이 종류가 다시 정해져요</span>
        {error && (
          <span className={styles.error} role="alert">
            {EDIT_ERROR[error] ?? "저장하지 못했어요"}
          </span>
        )}
        <div className={styles.editorBtns}>
          <PillButton size="sm" onClick={onClose}>
            취소
          </PillButton>
          <PillButton size="sm" type="submit" tone="primary" disabled={!canSave}>
            {saving ? "저장 중…" : "저장"}
          </PillButton>
        </div>
      </form>
    </li>
  );
}

/* ── 기록 한 행 ───────────────────────── */
function FeedRow({
  feed,
  onEdit,
  onDelete,
}: {
  feed: Feed;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const foldable = feed.review.length > FOLD_LENGTH;
  return (
    <li className={styles.feedRow}>
      <img
        src={foodIconSrc(feed.food)}
        alt={`${FOOD_LABEL[feed.food]} 먹이`}
        width={28}
        height={28}
        className="pixelated"
      />
      <div className={styles.feedText}>
        <span className={styles.mono}>
          {fmtDate(feed.visitedOn)} · {FOOD_LABEL[feed.food]}
        </span>
        <p className={open || !foldable ? styles.review : styles.reviewFolded}>{feed.review}</p>
        {foldable && (
          <button type="button" className={styles.fold} onClick={() => setOpen(!open)}>
            {open ? "접기" : "더 보기"}
          </button>
        )}
        {feed.photoUrls.length > 0 && (
          <div className={styles.thumbs}>
            {feed.photoUrls.map((src, i) => (
              <img key={i} src={src} alt="" width={48} height={48} loading="lazy" />
            ))}
          </div>
        )}
      </div>
      <div className={styles.feedActions}>
        <button type="button" className={styles.textBtn} onClick={onEdit}>
          수정
        </button>
        <span aria-hidden="true">·</span>
        <button type="button" className={styles.textBtn} onClick={onDelete}>
          삭제
        </button>
      </div>
    </li>
  );
}

/* ── 본문 ─────────────────────────────── */
function DetailBody({ id }: { id: string }) {
  const potato = usePotato(id);
  const navigate = useNavigate();
  const [editing, setEditing] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Feed | null>(null);
  const [busy, setBusy] = useState(false);
  // 마지막 기록을 지워 감자가 사라지면 "없음" 화면을 거치지 않고 감자밭으로
  const [leaving, setLeaving] = useState(false);

  if (!potato) {
    if (leaving) return null;
    return (
      <Card className={styles.notFound}>
        <img src={potatoSad} alt="" width={96} height={96} className="pixelated" />
        <h1 className={styles.h1}>이 감자는 찾을 수 없어요</h1>
        <PillLink to="/me" tone="primary">
          내 감자밭으로
        </PillLink>
      </Card>
    );
  }

  const isLast = potato.feeds.length === 1;

  const togglePublic = async () => {
    setBusy(true);
    try {
      await updatePotato(potato.id, { isPublic: !potato.isPublic });
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    const last = potato.feeds.length === 1;
    if (last) setLeaving(true);
    try {
      const { potatoId } = await deleteFeed(deleting.id);
      if (potatoId === null) {
        navigate("/me", { replace: true });
        return;
      }
      setDeleting(null);
    } catch {
      setLeaving(false);
    } finally {
      setBusy(false);
    }
  };

  const bubble = potato.nextMajorEvent
    ? `${potato.nextMajorEvent.title}${iGa(potato.nextMajorEvent.title)} D-${potato.nextMajorEvent.dday}에 와요`
    : "조건 좋은 밤에 다시 가볼까요?";

  return (
    <div className={styles.detail}>
      <Card variant="glass" className={styles.detailHead}>
        <PotatoIllust level={potato.level} state={potato.state} size={96} />
        <div className={styles.detailText}>
          <Link to={`/spots/${potato.spot.id}`} className={styles.detailSpot}>
            {potato.spot.name} →
          </Link>
          <span className={styles.mono}>
            Lv{potato.level} {LEVEL_NAME[potato.level]} · 먹이 {potato.foodCount} · 마지막 방문{" "}
            {fmtDate(potato.lastVisitedOn)}
          </span>
          {potato.state === "hungry" && (
            <div className={styles.stateRow}>
              <span className={styles.stateBadge}>배고파요</span>
              <span className={styles.speech}>{bubble}</span>
            </div>
          )}
          {potato.state === "sprouted" && (
            <div className={styles.stateRow}>
              <span className={styles.stateBadge}>싹이 났어요 · 오래 안 갔어요</span>
            </div>
          )}
        </div>
        <div className={styles.publicCol}>
          <span className={styles.hint}>{potato.isPublic ? "공개" : "비공개"}</span>
          <button
            type="button"
            role="switch"
            aria-checked={potato.isPublic}
            aria-label="감자 공개"
            className={potato.isPublic ? styles.toggleOn : styles.toggle}
            onClick={togglePublic}
            disabled={busy}
          >
            <span className={styles.knob} />
          </button>
        </div>
      </Card>

      <Card variant="glass" className={styles.feeds}>
        <div className={styles.feedsHead}>
          <Label>먹이 · {potato.foodCount}</Label>
          <span className={styles.mono}>최신순</span>
        </div>
        <ul className={styles.feedList}>
          {potato.feeds.map((f) =>
            editing === f.id ? (
              <FeedEditor key={f.id} feed={f} onClose={() => setEditing(null)} />
            ) : (
              <FeedRow
                key={f.id}
                feed={f}
                onEdit={() => setEditing(f.id)}
                onDelete={() => setDeleting(f)}
              />
            ),
          )}
        </ul>
        <ExampleCaption />
      </Card>

      <div className={styles.detailFoot}>
        <PillLink to={`/spots/${potato.spot.id}/plant`} tone="primary" size="lg">
          먹이 주기
        </PillLink>
      </div>

      {deleting && (
        <div
          className={styles.modalBackdrop}
          role="presentation"
          onClick={() => !busy && setDeleting(null)}
        >
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="feed-delete-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="feed-delete-title" className={styles.modalTitle}>
              기록 삭제
            </h2>
            <p className={styles.modalBody}>
              {isLast
                ? "마지막 기록을 지우면 감자도 사라져요. 정말 지울까요?"
                : `${fmtDate(deleting.visitedOn)} 기록을 지울까요? 먹이가 하나 줄고 등급이 다시 계산돼요.`}
            </p>
            <div className={styles.modalActions}>
              <PillButton onClick={() => setDeleting(null)} disabled={busy}>
                취소
              </PillButton>
              <PillButton className={styles.dangerPill} onClick={confirmDelete} disabled={busy}>
                {busy ? "지우는 중…" : isLast ? "감자까지 삭제" : "삭제"}
              </PillButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** `/me/potatoes/:id` 감자 상세 — 명세 §18.3. ProfileLayout 안(사이드바 공용) */
export function PotatoDetailPage() {
  const { id = "" } = useParams();
  return (
    <Suspense fallback={null}>
      <DetailBody key={id} id={id} />
    </Suspense>
  );
}

export type { PotatoDetail };
