/**
 * 활동 탭 — 명세 §15 (Phase 2). 후기·댓글·좋아요·응모를 내 기록·커뮤니티·장터 mock에서 모아 만든다.
 * TODO(Phase 2 백엔드): GET /api/v1/me/activity — 서버가 한 번에 내려준다.
 */
import { getMe, subscribeMe } from "./auth";
import { getContestEntries, getFeed, getPost, subscribeCommunity, type Post } from "./community";
import { getListing, getListings, subscribeMarket } from "./market";
import { getMyPotatoes, getPotato, subscribeMyPotatoes } from "./potatoes";
import type { ActivityItem, MyActivity } from "./types";

export type { ActivityItem, ActivityTab, MyActivity } from "./types";

let promise: Promise<MyActivity> | null = null;
const listeners = new Set<() => void>();

function changed(): void {
  promise = null;
  listeners.forEach((l) => l());
}
subscribeMe(changed);
subscribeCommunity(changed);
subscribeMarket(changed);
subscribeMyPotatoes(changed);

export function subscribeActivity(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const excerpt = (s: string, n = 60) => (s.length > n ? `${s.slice(0, n)}…` : s);
const byAtDesc = (a: ActivityItem, b: ActivityItem) => Date.parse(b.at) - Date.parse(a.at);

const POST_TYPE: Record<Post["type"], string> = {
  review: "후기",
  question: "질문",
  meetup: "모임",
  photo: "사진 응모",
  chat: "잡담",
};

async function build(): Promise<MyActivity> {
  const me = await getMe();
  const empty: MyActivity = {
    reviews: [],
    comments: [],
    likes: [],
    entries: [],
    contest: { month: new Date().toISOString().slice(0, 7), slots: 2, entries: [] },
    reactions: { likes: 0, comments: 0, saves: 0 },
  };
  if (!me) return empty;

  // 후기 = 내 감자 기록(먹이)
  const potatoes = await getMyPotatoes();
  const details = await Promise.all(potatoes.map((p) => getPotato(p.id)));
  const reviews: ActivityItem[] = details.flatMap((d) =>
    d
      ? d.feeds.map((f) => ({
          id: f.id,
          link: `/me/potatoes/${d.id}`,
          title: d.spot.name,
          body: excerpt(f.review),
          at: `${f.visitedOn}T12:00:00+09:00`,
          tag: `${f.visitedOn.replaceAll("-", ".")} 방문`,
        }))
      : [],
  );

  const posts = await getFeed("latest");
  const mine = posts.filter((p) => p.author.id === me.id);
  // 댓글 = 내가 남긴 댓글 (상세를 읽어야 보인다 — 피드의 글 상세를 모은다)
  const postDetails = await Promise.all(posts.map((p) => getPost(p.id)));
  const comments: ActivityItem[] = postDetails.flatMap((d) =>
    d
      ? d.comments
          .filter((c) => c.author.id === me.id)
          .map((c) => ({
            id: c.id,
            link: `/community/${d.id}#comments`,
            title: excerpt(d.body, 40),
            body: excerpt(c.body),
            at: c.createdAt,
            tag: `${POST_TYPE[d.type]} · ${d.author.nickname}`,
          }))
      : [],
  );
  const likes: ActivityItem[] = posts
    .filter((p) => p.likedByMe)
    .map((p) => ({
      id: p.id,
      link: `/community/${p.id}`,
      title: excerpt(p.body, 50),
      body: `${p.author.nickname} · 좋아요 ${p.likeCount}`,
      at: p.createdAt,
      tag: POST_TYPE[p.type],
    }));
  // 응모는 글을 삭제해도 남는다 (삭제 모달 안내와 같은 규칙) — 삭제된 글은 응모 목록으로 보낸다
  const contestEntries = getContestEntries(me.id);
  const entries: ActivityItem[] = contestEntries.map((e) => ({
    id: e.postId,
    link: e.postDeleted ? "/community?tab=photo" : `/community/${e.postId}`,
    title: e.title,
    body: e.postDeleted
      ? "글은 삭제됨 · 응모는 유지"
      : `좋아요 ${e.likeCount} · 댓글 ${e.commentCount}`,
    at: e.createdAt,
    tag: e.month.replace("-", ".") + " 응모",
  }));

  const month = new Date().toISOString().slice(0, 7);
  const listings = await getListings({
    q: "",
    category: null,
    sido: null,
    price: null,
    trade: null,
    sellingOnly: false,
  });
  // 내 상품의 찜 — 판매자 id는 목록에 없어 상세로 확인한다
  const myListings = (await Promise.all(listings.map((l) => getListing(l.id)))).filter(
    (l) => l && l.seller.id === me.id,
  );

  return {
    reviews: reviews.sort(byAtDesc),
    comments: comments.sort(byAtDesc),
    likes: likes.sort(byAtDesc),
    entries: entries.sort(byAtDesc),
    contest: {
      month,
      slots: 2,
      // 월 2장 제한은 community.ts가 저장 단계에서 막으므로 여기 수는 실제 응모 수와 같다
      entries: contestEntries
        .filter((e) => e.month === month)
        .map((e) => ({ postId: e.postDeleted ? null : e.postId, src: e.src, title: e.title })),
    },
    reactions: {
      likes: mine.reduce((n, p) => n + p.likeCount, 0),
      comments: mine.reduce((n, p) => n + p.commentCount, 0),
      saves: myListings.reduce((n, l) => n + (l?.likeCount ?? 0), 0),
    },
  };
}

/** 내 활동 — 같은 Promise를 돌려주고, 바탕 데이터가 바뀌면 새로 만든다 */
export function getMyActivity(): Promise<MyActivity> {
  promise ??= build();
  return promise;
}
