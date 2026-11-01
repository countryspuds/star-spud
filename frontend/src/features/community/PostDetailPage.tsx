import { Suspense, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import potatoSad from "../../assets/potato/potato-sad.svg";
import { MoonIcon } from "../../components/gauge/MoonIcon";
import { Avatar } from "../../components/ui/Avatar";
import { Card } from "../../components/ui/Card";
import { ExampleCaption, Label } from "../../components/ui/Label";
import { PillButton, PillLink } from "../../components/ui/Pill";
import {
  COMMENT_MAX,
  addComment,
  toggleCommentLike,
  type PostComment,
  type PostDetail,
} from "../../data/community";
import { useMe } from "../auth/useMe";
import { DeleteModal, PostCard } from "./PostCard";
import { fmtWhen, indexColor } from "./labels";
import { usePost, useWriteGate } from "./useCommunity";
import styles from "./community.module.css";

/* ── 그날 밤 메타 + 편의 4타일 ─────────── */
function NightMeta({ post }: { post: PostDetail }) {
  if (!post.night && !post.facilities) return null;
  const n = post.night;
  return (
    <Card variant="glass" className={styles.metaCard}>
      {n && (
        <div className={styles.metaRow}>
          <Label>
            {post.reviewInfo
              ? `${post.reviewInfo.visitedOn.replaceAll("-", ".")} 그날 밤`
              : "그날 밤"}
          </Label>
          <div className={styles.metaItems}>
            <span className={styles.metaItem}>
              <span className={styles.metaKey}>지수</span>
              <strong className="tabular" style={{ color: indexColor(n.index) }}>
                {n.index}
              </strong>
            </span>
            <span className={styles.metaItem}>
              <span className={styles.metaKey}>달</span>
              <MoonIcon illum={n.moonIllum} waxing={n.waxing} size={18} />
              <strong className="tabular">{n.moonIllum}%</strong>
            </span>
            <span className={styles.metaItem}>
              <span className={styles.metaKey}>구름</span>
              <strong className="tabular">{n.cloudPct === null ? "—" : `${n.cloudPct}%`}</strong>
            </span>
          </div>
        </div>
      )}
      {post.facilities && (
        <ul className={styles.tiles} aria-label="명소 편의">
          <li className={styles.tile}>
            <span className={styles.tileKey}>주차</span>
            <span className={styles.tileVal}>
              {post.facilities.parking === null ? "정보 없음" : `${post.facilities.parking}대`}
            </span>
          </li>
          <li className={styles.tile}>
            <span className={styles.tileKey}>화장실</span>
            <span className={styles.tileVal}>{post.facilities.toilet ? "있음" : "없음"}</span>
          </li>
          <li className={styles.tile}>
            <span className={styles.tileKey}>차박</span>
            <span className={styles.tileVal}>{post.facilities.carCamping ? "가능" : "불가"}</span>
          </li>
          <li className={styles.tile}>
            <span className={styles.tileKey}>편의점</span>
            <span className={styles.tileVal}>
              {post.facilities.storeNearby ? "근처 있음" : "없음"}
            </span>
          </li>
        </ul>
      )}
    </Card>
  );
}

/* ── 댓글 ───────────────────────────────── */
type Sort = "popular" | "latest";

function CommentRow({ postId, c }: { postId: string; c: PostComment }) {
  const gate = useWriteGate();
  return (
    <li className={styles.comment}>
      <Avatar avatarUrl={c.author.avatarUrl} potatoAvatar={c.author.potatoAvatar} size={28} />
      <div className={styles.commentText}>
        <div className={styles.commentHead}>
          <span className={styles.nick}>{c.author.nickname}</span>
          <span className={`${styles.when} tabular`}>{fmtWhen(c.createdAt)}</span>
        </div>
        <p className={styles.commentBody}>{c.body}</p>
        <button
          type="button"
          className={c.likedByMe ? styles.actionOn : styles.action}
          aria-pressed={c.likedByMe}
          onClick={() => gate(() => toggleCommentLike(postId, c.id))}
        >
          <span aria-hidden="true">♥</span> <span className="tabular">{c.likeCount}</span>
        </button>
      </div>
    </li>
  );
}

function CommentForm({ postId }: { postId: string }) {
  const me = useMe();
  const gate = useWriteGate();
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    gate(async () => {
      if (body.trim() === "" || busy) return;
      setBusy(true);
      try {
        await addComment(postId, body);
        setBody("");
      } finally {
        setBusy(false);
      }
    });
  };
  if (!me) {
    return (
      <p className={styles.commentLogin}>
        <Link to={`/login?next=${encodeURIComponent(`/community/${postId}`)}`}>로그인</Link>하면
        댓글을 남길 수 있어요.
      </p>
    );
  }
  return (
    <form className={styles.commentForm} onSubmit={onSubmit}>
      <Avatar avatarUrl={me.avatarUrl} potatoAvatar={me.potatoAvatar} size={28} />
      <textarea
        className={styles.commentInput}
        value={body}
        maxLength={COMMENT_MAX}
        rows={2}
        placeholder="댓글을 남겨 보세요 (500자)"
        aria-label="댓글"
        onChange={(e) => setBody(e.target.value)}
      />
      <PillButton size="sm" tone="primary" type="submit" disabled={body.trim() === "" || busy}>
        등록
      </PillButton>
    </form>
  );
}

function Comments({ post }: { post: PostDetail }) {
  const [sort, setSort] = useState<Sort>("popular");
  // 표시 순서만 — 시각 표기(+09:00 / Z)가 섞이므로 파싱해서 비교
  const ms = (iso: string) => Date.parse(iso);
  const list = [...post.comments].sort((a, b) =>
    sort === "popular"
      ? b.likeCount - a.likeCount || ms(a.createdAt) - ms(b.createdAt)
      : ms(b.createdAt) - ms(a.createdAt),
  );
  return (
    <Card className={styles.commentsCard} id="comments">
      <div className={styles.commentsHead}>
        <h2 className={styles.h2}>
          댓글 <span className="tabular">{post.comments.length}</span>
        </h2>
        <div className={styles.sort} role="radiogroup" aria-label="댓글 정렬">
          {(
            [
              ["popular", "인기순"],
              ["latest", "최신순"],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={sort === k}
              className={sort === k ? styles.sortOn : styles.sortBtn}
              onClick={() => setSort(k)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      {list.length === 0 ? (
        <p className={styles.railEmpty}>첫 댓글을 남겨 보세요</p>
      ) : (
        <ul className={styles.comments}>
          {list.map((c) => (
            <CommentRow key={c.id} postId={post.id} c={c} />
          ))}
        </ul>
      )}
      <CommentForm postId={post.id} />
    </Card>
  );
}

/* ── 페이지 ─────────────────────────────── */
function NotFound() {
  return (
    <Card className={styles.notFound}>
      <img src={potatoSad} alt="" width={96} height={96} className="pixelated" />
      <Label>NOT FOUND</Label>
      <h1 className={styles.h1}>글이 없어요</h1>
      <p>삭제됐거나 주소가 잘못됐어요. 삭제한 글은 30일 안에 되살릴 수 있어요.</p>
      <PillLink to="/community" tone="primary">
        피드로 가기
      </PillLink>
    </Card>
  );
}

function Detail({ id }: { id: string }) {
  const post = usePost(id);
  const me = useMe();
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  if (!post) return <NotFound />;
  const mine = me !== null && me.id === post.author.id;
  return (
    <>
      <header className={styles.head}>
        <Link to="/community" className={styles.back}>
          ← 피드
        </Link>
        {mine && (
          <div className={styles.ownerActions}>
            <PillLink size="sm" to={`/community/${post.id}/edit`}>
              수정
            </PillLink>
            <PillButton size="sm" className={styles.dangerPill} onClick={() => setConfirming(true)}>
              삭제
            </PillButton>
          </div>
        )}
      </header>
      <PostCard post={post} detail />
      <NightMeta post={post} />
      <Comments post={post} />
      <ExampleCaption />
      {confirming && (
        <DeleteModal
          postId={post.id}
          onClose={() => setConfirming(false)}
          onDeleted={() => navigate("/community", { replace: true })}
        />
      )}
    </>
  );
}

/** `/community/:id` — 글 상세 + 그날 밤 메타 + 편의 4타일 + 댓글 (Phase 2) */
export default function PostDetailPage() {
  const { id = "" } = useParams();
  return (
    <div className={styles.detailPage}>
      <Suspense fallback={null}>
        <Detail id={id} />
      </Suspense>
    </div>
  );
}
