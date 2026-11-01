import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Avatar } from "../../components/ui/Avatar";
import { Card } from "../../components/ui/Card";
import { PillButton } from "../../components/ui/Pill";
import {
  deletePost,
  toggleJoinMeetup,
  toggleLike,
  toggleSaveSpot,
  vote,
  type MeetupInfo,
  type PollInfo,
  type Post,
  type PostSpotTag,
} from "../../data/community";
import { useMe } from "../auth/useMe";
import { POST_TYPE_COLOR, POST_TYPE_LABEL, fmtWhen, indexColor } from "./labels";
import { useWriteGate } from "./useCommunity";
import styles from "./community.module.css";

/* ── 작은 조각 ─────────────────────────── */
export function TypeTag({ type }: { type: Post["type"] }) {
  return (
    <span className={styles.typeTag} style={{ color: POST_TYPE_COLOR[type] }}>
      {POST_TYPE_LABEL[type]}
    </span>
  );
}

/** 명소 태그 칩 — 오늘 밤 지수(서버 값)를 색 점 + 숫자로 */
export function SpotChip({ spot }: { spot: PostSpotTag }) {
  return (
    <Link to={`/spots/${spot.id}`} className={styles.spotChip}>
      <span className={styles.indexDot} style={{ background: indexColor(spot.tonightIndex) }} />
      <span>{spot.name}</span>
      <span className={`${styles.indexNum} tabular`}>오늘 밤 {spot.tonightIndex}</span>
    </Link>
  );
}

/** 삭제 확인 — specs/06: 30일 소프트 삭제. 댓글·좋아요는 사라지고 감자·응모는 남는다 */
export function DeleteModal({
  postId,
  onClose,
  onDeleted,
}: {
  postId: string;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const onDelete = async () => {
    setBusy(true);
    try {
      await deletePost(postId);
      onDeleted();
    } catch {
      setBusy(false);
    }
  };
  return (
    <div className={styles.modalBackdrop} role="presentation" onClick={() => !busy && onClose()}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="post-delete-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="post-delete-title" className={styles.modalTitle}>
          이 글을 삭제할까요?
        </h2>
        <ul className={styles.modalList}>
          <li>댓글과 좋아요는 함께 사라져요.</li>
          <li>이 글로 심은 감자 기록과 이달의 사진 응모는 그대로 남아요.</li>
          <li>30일 안에는 설정에서 되살릴 수 있어요.</li>
        </ul>
        <div className={styles.modalActions}>
          <PillButton size="sm" onClick={onClose} disabled={busy}>
            남겨둘래요
          </PillButton>
          <PillButton size="sm" className={styles.dangerPill} onClick={onDelete} disabled={busy}>
            삭제할게요
          </PillButton>
        </div>
      </div>
    </div>
  );
}

/** 글 주소 복사 — clipboard가 막힌 환경이면 false */
async function copyLink(postId: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(`${location.origin}/community/${postId}`);
    return true;
  } catch {
    return false;
  }
}

/** 내 글의 ··· 메뉴 — 수정 · 삭제 · 링크 복사 */
function OwnerMenu({ post }: { post: Post }) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [copied, setCopied] = useState<"ok" | "fail" | null>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const onCopy = async () => {
    setCopied((await copyLink(post.id)) ? "ok" : "fail");
    setOpen(false);
    setTimeout(() => setCopied(null), 1800);
  };

  return (
    <div className={styles.menuWrap} ref={wrap}>
      <button
        type="button"
        className={styles.menuBtn}
        aria-label="내 글 메뉴"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        ···
      </button>
      {copied && (
        <span className={styles.toast} role="status">
          {copied === "ok" ? "링크를 복사했어요" : "복사가 막혀 있어요"}
        </span>
      )}
      {open && (
        <div className={styles.menuPop} role="menu">
          <Link role="menuitem" to={`/community/${post.id}/edit`} className={styles.menuItem}>
            수정
          </Link>
          <button
            type="button"
            role="menuitem"
            className={styles.menuItem}
            onClick={() => {
              setOpen(false);
              setConfirming(true);
            }}
          >
            삭제
          </button>
          <button type="button" role="menuitem" className={styles.menuItem} onClick={onCopy}>
            링크 복사
          </button>
        </div>
      )}
      {confirming && (
        <DeleteModal
          postId={post.id}
          onClose={() => setConfirming(false)}
          onDeleted={() => navigate("/community", { replace: true })}
        />
      )}
    </div>
  );
}

/* ── 모임 카드 · 투표 바 ───────────────── */
function MeetupCard({ postId, meetup }: { postId: string; meetup: MeetupInfo }) {
  const gate = useWriteGate();
  const [error, setError] = useState<string | null>(null);
  const onJoin = () =>
    gate(async () => {
      try {
        await toggleJoinMeetup(postId);
        setError(null);
      } catch (e) {
        setError(
          e instanceof Error && e.message === "MEETUP_FULL" ? "정원이 찼어요" : "지난 모임이에요",
        );
      }
    });
  const label =
    meetup.status === "ended"
      ? "끝난 모임"
      : meetup.joinedByMe
        ? "참여 취소"
        : meetup.status === "full"
          ? "정원이 찼어요"
          : "참여하기";
  return (
    <div className={styles.meetup}>
      <dl className={styles.meetupGrid}>
        <div>
          <dt>날짜</dt>
          <dd className="tabular">{fmtWhen(meetup.at)}</dd>
        </div>
        <div>
          <dt>집결</dt>
          <dd>{meetup.meetPoint}</dd>
        </div>
        <div>
          <dt>정원</dt>
          <dd className="tabular">
            {meetup.joined}/{meetup.capacity}명
          </dd>
        </div>
      </dl>
      <div className={styles.meetupAction}>
        <PillButton
          size="sm"
          tone={meetup.joinedByMe ? "secondary" : "primary"}
          onClick={onJoin}
          disabled={meetup.status === "ended" || (meetup.status === "full" && !meetup.joinedByMe)}
        >
          {label}
        </PillButton>
        {error && (
          <span className={styles.inlineError} role="alert">
            {error}
          </span>
        )}
      </div>
    </div>
  );
}

function PollBars({ postId, poll }: { postId: string; poll: PollInfo }) {
  const gate = useWriteGate();
  const max = Math.max(1, ...poll.options.map((o) => o.votes));
  return (
    <div className={styles.poll} role="group" aria-label="투표">
      {poll.options.map((o) => {
        const pct = poll.total === 0 ? 0 : Math.round((o.votes / poll.total) * 100);
        const mine = poll.myVote === o.id;
        return (
          <button
            key={o.id}
            type="button"
            className={mine ? styles.pollOptOn : styles.pollOpt}
            aria-pressed={mine}
            onClick={() => gate(() => vote(postId, o.id))}
          >
            <span className={styles.pollFill} style={{ width: `${(o.votes / max) * 100}%` }} />
            <span className={styles.pollLabel}>{o.label}</span>
            <span className={`${styles.pollPct} tabular`}>{pct}%</span>
          </button>
        );
      })}
      <span className={styles.pollTotal}>
        {poll.total}명 참여{poll.myVote ? " · 다른 선택지를 누르면 옮겨요" : ""}
      </span>
    </div>
  );
}

/* ── 글 카드 ───────────────────────────── */
interface Props {
  post: Post;
  /** 상세 화면 — 본문을 다 보여주고 댓글 링크는 앵커 */
  detail?: boolean;
}

export function PostCard({ post, detail = false }: Props) {
  const me = useMe();
  const gate = useWriteGate();
  const mine = me !== null && me.id === post.author.id;
  const detailHref = `/community/${post.id}`;

  return (
    <Card className={styles.post} aria-labelledby={`post-${post.id}-author`}>
      <header className={styles.postHead}>
        <Avatar
          avatarUrl={post.author.avatarUrl}
          potatoAvatar={post.author.potatoAvatar}
          size={32}
        />
        <div className={styles.postWho}>
          <span className={styles.nick} id={`post-${post.id}-author`}>
            {post.author.nickname}
          </span>
          <TypeTag type={post.type} />
          {post.photoContest && post.type !== "photo" && (
            <span className={styles.contestTag}>이달의 사진 응모</span>
          )}
        </div>
        <span className={`${styles.when} tabular`}>
          {fmtWhen(post.createdAt)}
          {post.editedAt && <span className={styles.edited}> (수정됨)</span>}
        </span>
        {mine && <OwnerMenu post={post} />}
      </header>

      {post.spot && <SpotChip spot={post.spot} />}

      {detail ? (
        <p className={styles.body}>{post.body}</p>
      ) : (
        <Link to={detailHref} className={styles.bodyClamp}>
          {post.body}
        </Link>
      )}

      {post.photos.length > 0 && (
        <div className={styles.photos} data-count={Math.min(post.photos.length, 3)}>
          {post.photos.slice(0, detail ? 10 : 3).map((src, i) => (
            <img key={i} src={src} alt="" className={styles.photo} loading="lazy" />
          ))}
          {!detail && post.photos.length > 3 && (
            <span className={styles.morePhotos}>+{post.photos.length - 3}</span>
          )}
        </div>
      )}

      {post.meetup && <MeetupCard postId={post.id} meetup={post.meetup} />}
      {post.poll && <PollBars postId={post.id} poll={post.poll} />}

      <footer className={styles.actions}>
        <button
          type="button"
          className={post.likedByMe ? styles.actionOn : styles.action}
          aria-pressed={post.likedByMe}
          onClick={() => gate(() => toggleLike(post.id))}
        >
          <span aria-hidden="true">♥</span> 좋아요 <span className="tabular">{post.likeCount}</span>
        </button>
        <Link to={detail ? "#comments" : `${detailHref}#comments`} className={styles.action}>
          <span aria-hidden="true">💬</span> 댓글{" "}
          <span className="tabular">{post.commentCount}</span>
        </Link>
        {post.spot && (
          <button
            type="button"
            className={post.spotSavedByMe ? styles.actionOn : styles.action}
            aria-pressed={post.spotSavedByMe}
            onClick={() => gate(() => toggleSaveSpot(post.id))}
          >
            <span aria-hidden="true">{post.spotSavedByMe ? "★" : "☆"}</span>{" "}
            {post.spotSavedByMe ? "명소 저장됨" : "명소 저장"}
          </button>
        )}
      </footer>
    </Card>
  );
}
