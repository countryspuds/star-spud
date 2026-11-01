import { Suspense, useTransition } from "react";
import { Link, useSearchParams } from "react-router-dom";
import potatoBasic from "../../assets/potato/potato.svg";
import { Avatar } from "../../components/ui/Avatar";
import { Card } from "../../components/ui/Card";
import { ExampleCaption, Label } from "../../components/ui/Label";
import type { FeedTab } from "../../data/community";
import { useMe } from "../auth/useMe";
import { PostCard } from "./PostCard";
import { Rail } from "./Rail";
import { TABS, isFeedTab } from "./labels";
import { useFeed } from "./useCommunity";
import styles from "./community.module.css";

/** 상단 글쓰기 박스 — 누르면 /community/write (비로그인·온보딩 전은 그쪽에서 돌려보낸다) */
function WriteBox() {
  const me = useMe();
  return (
    <Card variant="glass" className={styles.writeBox}>
      {me ? (
        <Avatar avatarUrl={me.avatarUrl} potatoAvatar={me.potatoAvatar} size={36} />
      ) : (
        <img src={potatoBasic} alt="" width={36} height={36} className="pixelated" />
      )}
      <Link to="/community/write" className={styles.writePrompt}>
        {me?.nickname ? `${me.nickname}님, 오늘 밤은 어땠나요?` : "다녀온 밤을 남겨 보세요"}
      </Link>
      <Link to="/community/write" className={styles.writeBtn}>
        글쓰기
      </Link>
    </Card>
  );
}

function FeedList({ tab }: { tab: FeedTab }) {
  const posts = useFeed(tab);
  if (posts.length === 0) {
    return (
      <Card className={styles.empty}>
        <p>아직 글이 없어요</p>
        <span>첫 글을 남겨 보세요.</span>
      </Card>
    );
  }
  return (
    <ul className={styles.feed}>
      {posts.map((p) => (
        <li key={p.id}>
          <PostCard post={p} />
        </li>
      ))}
    </ul>
  );
}

/** `/community` — 피드 + 우측 레일 (Phase 2 · specs/06 디자인 메모) */
export default function CommunityPage() {
  const [params, setParams] = useSearchParams();
  const raw = params.get("tab");
  const tab: FeedTab = isFeedTab(raw) ? raw : "recommended";
  const [pending, startTransition] = useTransition();
  const setTab = (t: FeedTab) =>
    startTransition(() => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (t === "recommended") next.delete("tab");
          else next.set("tab", t);
          return next;
        },
        { replace: true },
      );
    });

  return (
    <div className={styles.page}>
      <div className={styles.column}>
        <header className={styles.head}>
          <div>
            <Label>COMMUNITY · PHASE 2</Label>
            <h1 className={styles.h1}>커뮤니티</h1>
          </div>
          <ExampleCaption />
        </header>
        <Suspense fallback={null}>
          <WriteBox />
        </Suspense>
        <div className={styles.tabs} role="tablist" aria-label="피드 종류">
          {TABS.map((t) => (
            <button
              key={t.tab}
              type="button"
              role="tab"
              aria-selected={t.tab === tab}
              className={t.tab === tab ? styles.tabOn : styles.tab}
              onClick={() => setTab(t.tab)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className={styles.feedWrap} data-pending={pending || undefined}>
          <Suspense fallback={null}>
            <FeedList tab={tab} />
          </Suspense>
        </div>
      </div>
      <Suspense fallback={null}>
        <Rail />
      </Suspense>
    </div>
  );
}
