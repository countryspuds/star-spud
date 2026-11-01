import { use, useCallback, useSyncExternalStore } from "react";
import {
  getMyPotatoes,
  getPotato,
  subscribeMyPotatoes,
  type Potato,
  type PotatoDetail,
} from "../../data/potatoes";

/** 내 감자 목록 — 심기·먹이·수정·삭제가 일어나면 다시 렌더된다. Suspense 안에서 쓴다 */
export function useMyPotatoes(): Potato[] {
  return use(useSyncExternalStore(subscribeMyPotatoes, getMyPotatoes, getMyPotatoes));
}

/** 감자 상세 — 같은 id에는 같은 Promise, 바뀌면 새 Promise. 없으면 null */
export function usePotato(id: string): PotatoDetail | null {
  const get = useCallback(() => getPotato(id), [id]);
  return use(useSyncExternalStore(subscribeMyPotatoes, get, get));
}
