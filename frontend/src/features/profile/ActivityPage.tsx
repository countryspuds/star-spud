import { Suspense, use, useSyncExternalStore, useTransition } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Card } from "../../components/ui/Card";
import { ExampleCaption, Label } from "../../components/ui/Label";
import { PillLink } from "../../components/ui/Pill";
import {
  getMyActivity,
  subscribeActivity,
  type ActivityItem,
  type ActivityTab,
  type MyActivity,
} from "../../data/activity";
import { fmtMDW, monthNameEn } from "../../lib/time";
import profileStyles from "./profile.module.css";
import styles from "./activity.module.css";

const TABS: { tab: ActivityTab; label: string }[] = [
  { tab: "reviews", label: "후기" },
  { tab: "comments", label: "댓글" },
  { tab: "likes", label: "좋아요" },
  { tab: "entries", label: "응모" },
];
const isTab = (v: string | null): v is ActivityTab => v !== null && TABS.some((t) => t.tab === v);

const EMPTY_TEXT: Record<ActivityTab, string> = {
  reviews: "아직 남긴 후기가 없어요. 다녀온 밤을 감자로 기록해 보세요.",
  comments: "아직 쓴 댓글이 없어요.",
  likes: "아직 좋아요한 글이 없어요.",
  entries: "아직 응모한 사진이 없어요. 사진 응모 글을 쓰면 여기 모여요.",
};

function useActivity(): MyActivity {
  return use(useSyncExternalStore(subscribeActivity, getMyActivity, getMyActivity));
}

function Row({ item }: { item: ActivityItem }) {
  return (
    <li>
      <Link to={item.link} className={styles.row}>
        <div className={styles.rowText}>
          <span className={styles.rowTitle}>{item.title}</span>
          <span className={styles.rowBody}>{item.body}</span>
        </div>
        <span className={`${styles.rowMeta} tabular`}>
          {item.tag} · {fmtMDW(item.at)}
        </span>
      </Link>
    </li>
  );
}

function Body({ tab }: { tab: ActivityTab }) {
  const a = useActivity();
  const list = a[tab];
  const monthNum = Number(a.contest.month.slice(5));
  const reactions = [
    ["좋아요", a.reactions.likes, "내 글이 받은"],
    ["댓글", a.reactions.comments, "내 글에 달린"],
    ["찜", a.reactions.saves, "내 상품이 받은"],
  ] as const;

  return (
    <>
      <div className={styles.top}>
        {/* 이달의 사진 응모 2칸 */}
        <Card variant="glass" className={styles.contest}>
          <div className={styles.cardHead}>
            <Label>
              {monthNameEn(`${a.contest.month}-01`)} · {monthNum}월 이달의 사진 응모
            </Label>
            <span className={`${styles.mono} tabular`}>
              {a.contest.entries.length}/{a.contest.slots}
            </span>
          </div>
          <ul className={styles.slots}>
            {Array.from({ length: a.contest.slots }, (_, i) => {
              const e = a.contest.entries[i];
              return (
                <li key={i} className={e ? styles.slotOn : styles.slot}>
                  {e && e.postId ? (
                    <Link to={`/community/${e.postId}`} className={styles.slotLink}>
                      {e.src && <img src={e.src} alt="" />}
                      <span>{e.title}</span>
                    </Link>
                  ) : e ? (
                    <div
                      className={styles.slotLink}
                      aria-label="글은 삭제됐지만 응모는 남아 있어요"
                    >
                      {e.src && <img src={e.src} alt="" />}
                      <span>{e.title} · 글 삭제됨</span>
                    </div>
                  ) : (
                    <Link to="/community/write" className={styles.slotEmpty}>
                      <span className={styles.plus} aria-hidden="true">
                        +
                      </span>
                      <span>응모하기</span>
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
          <span className={styles.mono}>
            한 달에 2장까지 · 사진 응모 글을 쓰면 자동으로 들어와요
          </span>
        </Card>

        {/* 받은 반응 3타일 */}
        <Card variant="glass" className={styles.reactions}>
          <Label>REACTIONS · 받은 반응</Label>
          <ul className={styles.tiles}>
            {reactions.map(([k, v, sub]) => (
              <li key={k} className={styles.tile}>
                <span className={styles.tileKey}>{k}</span>
                <span className={`${styles.tileVal} tabular`}>{v}</span>
                <span className={styles.tileSub}>{sub}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card variant="glass" className={styles.listCard}>
        {list.length === 0 ? (
          <div className={styles.empty}>
            <p>{EMPTY_TEXT[tab]}</p>
            {tab === "reviews" && (
              <PillLink size="sm" to="/map">
                지도에서 명소 고르기
              </PillLink>
            )}
          </div>
        ) : (
          <ul className={styles.rows}>
            {list.map((item) => (
              <Row key={item.id} item={item} />
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}

/** `/me/activity` — 후기·댓글·좋아요·응모 탭 + 이달의 사진 응모 2칸 + 받은 반응 3타일 (Phase 2 · 명세 §15) */
export default function ActivityPage() {
  const [params, setParams] = useSearchParams();
  const raw = params.get("tab");
  const tab: ActivityTab = isTab(raw) ? raw : "reviews";
  const [pending, startTransition] = useTransition();
  const setTab = (t: ActivityTab) =>
    startTransition(() => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (t === "reviews") next.delete("tab");
          else next.set("tab", t);
          return next;
        },
        { replace: true },
      );
    });

  return (
    <>
      <header className={profileStyles.head}>
        <div>
          <Label>ACTIVITY</Label>
          <h1 className={profileStyles.h1}>활동</h1>
        </div>
        <ExampleCaption />
      </header>
      <div className={styles.tabs} role="tablist" aria-label="활동 종류">
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
      <div className={styles.body} data-pending={pending || undefined}>
        <Suspense fallback={null}>
          <Body tab={tab} />
        </Suspense>
      </div>
    </>
  );
}
