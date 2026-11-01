import { Suspense, useState, useTransition, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Card } from "../../components/ui/Card";
import { ExampleCaption, Label } from "../../components/ui/Label";
import { PillButton } from "../../components/ui/Pill";
import { toggleListingLike, type MarketFilter, type MarketListing } from "../../data/market";
import { SIDO, isSidoCode, type SidoCode } from "../../data/regions";
import { GEAR_CATEGORIES, GEAR_LABEL, gearIconSrc, isGearCategory } from "../../lib/gear";
import { fmtMDW } from "../../lib/time";
import authStyles from "../auth/auth.module.css";
import { useWriteGate } from "../community/useCommunity";
import {
  CONDITION_LABEL,
  PRICE_BANDS,
  SAFETY_LINES,
  STATUS_LABEL,
  TRADE_LABEL,
  fmtWon,
  isPriceBand,
} from "./labels";
import { useListings } from "./useMarket";
import styles from "./market.module.css";

const SIDO_CODES = Object.keys(SIDO) as SidoCode[];

/** URL `?q&cat&sido&price&trade&selling=1` → 필터 */
function parseFilter(sp: URLSearchParams): MarketFilter {
  const cat = sp.get("cat");
  const sido = sp.get("sido");
  const price = sp.get("price");
  const trade = sp.get("trade");
  return {
    q: sp.get("q") ?? "",
    category: isGearCategory(cat) ? cat : null,
    sido: sido && isSidoCode(sido) ? sido : null,
    price: isPriceBand(price) ? price : null,
    trade: trade === "meet" || trade === "delivery" ? trade : null,
    sellingOnly: sp.get("selling") === "1",
  };
}

/* ── 상품 카드 ─────────────────────────── */
function ListingCard({ item }: { item: MarketListing }) {
  const gate = useWriteGate();
  const sold = item.status === "sold";
  const sido = isSidoCode(item.sido) ? SIDO[item.sido].short : item.sido;
  return (
    <li className={sold ? styles.cardSold : styles.card}>
      <Link to={`/market/${item.id}`} className={styles.cardLink}>
        <div className={styles.thumb}>
          <img src={gearIconSrc(item.category)} alt="" width={56} height={56} />
          {item.status !== "selling" && (
            <span className={styles.badge}>{STATUS_LABEL[item.status]}</span>
          )}
          <span className={styles.photoCount}>사진 {item.photoCount}</span>
        </div>
        <div className={styles.cardBody}>
          <span className={styles.cardTitle}>{item.title}</span>
          <span className={`${styles.price} tabular`}>{fmtWon(item.price)}</span>
          <span className={styles.cardMeta}>
            {CONDITION_LABEL[item.condition]} · {sido} · {TRADE_LABEL[item.trade]}
          </span>
          <span className={`${styles.cardTime} tabular`}>{fmtMDW(item.createdAt)}</span>
        </div>
      </Link>
      <button
        type="button"
        className={item.likedByMe ? styles.likeOn : styles.like}
        aria-pressed={item.likedByMe}
        aria-label={`찜 ${item.likeCount}`}
        onClick={() => gate(() => toggleListingLike(item.id))}
      >
        <span aria-hidden="true">{item.likedByMe ? "♥" : "♡"}</span>
        <span className="tabular">{item.likeCount}</span>
      </button>
    </li>
  );
}

function ListingGrid({ filter }: { filter: MarketFilter }) {
  const items = useListings(filter);
  if (items.length === 0) {
    return (
      <Card className={styles.empty}>
        <p>조건에 맞는 상품이 없어요</p>
        <span>검색어나 필터를 바꿔 보세요.</span>
      </Card>
    );
  }
  return (
    <ul className={styles.grid}>
      {items.map((item) => (
        <ListingCard key={item.id} item={item} />
      ))}
    </ul>
  );
}

/** `/market` — 검색 · 카테고리 칩 7 · 필터 · 3열 카드 · 안전 거래 띠 (Phase 2 · specs/07) */
export default function MarketPage() {
  const [params, setParams] = useSearchParams();
  const filter = parseFilter(params);
  const [q, setQ] = useState(filter.q);
  const [pending, startTransition] = useTransition();

  const update = (
    patch: Partial<Record<"q" | "cat" | "sido" | "price" | "trade" | "selling", string | null>>,
  ) =>
    startTransition(() => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [k, v] of Object.entries(patch)) {
            if (v) next.set(k, v);
            else next.delete(k);
          }
          return next;
        },
        { replace: true },
      );
    });

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    update({ q: q.trim() || null });
  };

  const activeFilters =
    (filter.sido ? 1 : 0) +
    (filter.price ? 1 : 0) +
    (filter.trade ? 1 : 0) +
    (filter.sellingOnly ? 1 : 0);

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <div>
          <Label>MARKET · PHASE 2</Label>
          <h1 className={styles.h1}>장터</h1>
        </div>
        <ExampleCaption />
      </header>

      <div className={styles.toolbar}>
        <form className={styles.search} onSubmit={onSearch} role="search">
          <input
            type="search"
            className={`${authStyles.input} ${styles.searchInput}`}
            value={q}
            placeholder="장비 이름으로 검색"
            aria-label="상품 검색"
            onChange={(e) => setQ(e.target.value)}
          />
          <PillButton size="sm" type="submit">
            검색
          </PillButton>
        </form>
        {/* 판매 등록 화면은 아직 없다 — 채팅과 같이 뒤 Phase */}
        <PillButton size="sm" tone="primary" disabled title="곧 열려요" className={styles.sellBtn}>
          판매하기 · 곧 열려요
        </PillButton>
      </div>

      <div className={styles.chips} role="group" aria-label="카테고리">
        <button
          type="button"
          className={filter.category === null ? styles.chipOn : styles.chip}
          aria-pressed={filter.category === null}
          onClick={() => update({ cat: null })}
        >
          전체
        </button>
        {GEAR_CATEGORIES.map((c) => (
          <button
            key={c.category}
            type="button"
            className={filter.category === c.category ? styles.chipOn : styles.chip}
            aria-pressed={filter.category === c.category}
            onClick={() => update({ cat: filter.category === c.category ? null : c.category })}
          >
            <img src={gearIconSrc(c.category)} alt="" width={16} height={16} />
            {c.label}
          </button>
        ))}
      </div>

      <div className={styles.filters}>
        <label className={styles.filter}>
          <span>지역</span>
          <select
            className={authStyles.select}
            value={filter.sido ?? ""}
            onChange={(e) => update({ sido: e.target.value || null })}
          >
            <option value="">전체</option>
            {SIDO_CODES.map((code) => (
              <option key={code} value={code}>
                {SIDO[code].short}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.filter}>
          <span>가격</span>
          <select
            className={authStyles.select}
            value={filter.price ?? ""}
            onChange={(e) => update({ price: e.target.value || null })}
          >
            <option value="">전체</option>
            {PRICE_BANDS.map((b) => (
              <option key={b.band} value={b.band}>
                {b.label}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.filter}>
          <span>거래 방식</span>
          <select
            className={authStyles.select}
            value={filter.trade ?? ""}
            onChange={(e) => update({ trade: e.target.value || null })}
          >
            <option value="">전체</option>
            <option value="meet">직거래</option>
            <option value="delivery">택배</option>
          </select>
        </label>
        <label className={`${styles.filter} ${styles.filterCheck}`}>
          <input
            type="checkbox"
            checked={filter.sellingOnly}
            onChange={(e) => update({ selling: e.target.checked ? "1" : null })}
          />
          <span>판매중만</span>
        </label>
        {activeFilters > 0 && (
          <button
            type="button"
            className={styles.reset}
            onClick={() => update({ sido: null, price: null, trade: null, selling: null })}
          >
            필터 초기화 ({activeFilters})
          </button>
        )}
      </div>

      <Card variant="glass" className={styles.safety} role="note">
        <Label>SAFE TRADE</Label>
        <span>{SAFETY_LINES[0]} 선입금 요구는 거절하세요.</span>
        <Link to="/guide" className={styles.safetyLink}>
          거래 가이드 →
        </Link>
      </Card>

      <div className={styles.gridWrap} data-pending={pending || undefined}>
        <Suspense fallback={null}>
          <ListingGrid filter={filter} />
        </Suspense>
      </div>
      <p className={styles.fine}>
        {filter.category ? `${GEAR_LABEL[filter.category]} · ` : ""}가격·상태·거래 수는 모두 예시
        데이터예요. 채팅 연결은 Phase 3.
      </p>
    </div>
  );
}
