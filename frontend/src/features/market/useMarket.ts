import { use, useCallback, useSyncExternalStore } from "react";
import {
  getListing,
  getListings,
  subscribeMarket,
  type MarketFilter,
  type MarketListing,
  type MarketListingDetail,
} from "../../data/market";

/** 목록 — 필터가 바뀌면 새 Promise, 찜이 바뀌면 다시 렌더. Suspense 안에서 쓴다 */
export function useListings(filter: MarketFilter): MarketListing[] {
  const { q, category, sido, price, trade, sellingOnly } = filter;
  const get = useCallback(
    () => getListings({ q, category, sido, price, trade, sellingOnly }),
    [q, category, sido, price, trade, sellingOnly],
  );
  return use(useSyncExternalStore(subscribeMarket, get, get));
}

/** 상품 상세 — 없으면 null */
export function useListing(id: string): MarketListingDetail | null {
  const get = useCallback(() => getListing(id), [id]);
  return use(useSyncExternalStore(subscribeMarket, get, get));
}
