/**
 * 내 감자 — specs/04 모델. Phase 1: mock JSON. Phase 2: `GET /api/v1/me/potatoes`.
 * 정렬(상태 우선 → 최근 방문)은 서버가 한 것으로 보고 여기서 같은 규칙으로 흉내 낸다.
 */
import potatoesJson from "./potatoes.json";
import type { Potato } from "./types";

export type { Potato, PotatoState } from "./types";

const STATE_ORDER: Record<Potato["state"], number> = { hungry: 0, sprouted: 0, normal: 1 };

let potatoesPromise: Promise<Potato[]> | null = null;

export function getMyPotatoes(): Promise<Potato[]> {
  potatoesPromise ??= Promise.resolve(
    [...(potatoesJson as Potato[])].sort(
      (a, b) =>
        STATE_ORDER[a.state] - STATE_ORDER[b.state] ||
        b.lastVisitedOn.localeCompare(a.lastVisitedOn),
    ),
  );
  return potatoesPromise;
}

/** 방치 상태(배고픔 숫자에 세는 것) — specs/04: hungry 또는 sprouted */
export const isNeglected = (p: Potato) => p.state !== "normal";
