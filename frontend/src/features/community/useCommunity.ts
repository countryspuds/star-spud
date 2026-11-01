import { use, useCallback, useSyncExternalStore } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  getFeed,
  getPost,
  getRail,
  subscribeCommunity,
  type CommunityRail,
  type FeedTab,
  type Post,
  type PostDetail,
} from "../../data/community";
import { useMe } from "../auth/useMe";

/** 피드 — 탭이 바뀌면 새 Promise, 글이 바뀌면 다시 렌더. Suspense 안에서 쓴다 */
export function useFeed(tab: FeedTab): Post[] {
  const get = useCallback(() => getFeed(tab), [tab]);
  return use(useSyncExternalStore(subscribeCommunity, get, get));
}

/** 글 상세 — 없으면 null */
export function usePost(id: string): PostDetail | null {
  const get = useCallback(() => getPost(id), [id]);
  return use(useSyncExternalStore(subscribeCommunity, get, get));
}

export function useRail(): CommunityRail {
  return use(useSyncExternalStore(subscribeCommunity, getRail, getRail));
}

/**
 * 쓰기 동작(좋아요·저장·투표·참여·댓글) 앞의 문지기 — 비로그인은 /login?next=, 온보딩 전은 /onboarding.
 * 통과하면 action을 실행한다.
 */
export function useWriteGate(): (action: () => void | Promise<void>) => void {
  const me = useMe();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  return useCallback(
    (action) => {
      if (!me) {
        navigate(`/login?next=${encodeURIComponent(pathname + search)}`);
        return;
      }
      if (me.nickname === null) {
        navigate("/onboarding");
        return;
      }
      void action();
    },
    [me, navigate, pathname, search],
  );
}
