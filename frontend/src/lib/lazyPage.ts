import { createElement, lazy, type ComponentType, type ReactElement } from "react";

/**
 * 코드 분할 페이지 엘리먼트 — `element: lazyPage(() => import("./Page"))`.
 * Phase 2 라우트처럼 플래그 뒤의 페이지를 첫 번들에서 떼어낼 때 쓴다. 바깥 <Suspense>가 받아준다.
 */
export function lazyPage(load: () => Promise<{ default: ComponentType }>): ReactElement {
  return createElement(lazy(load));
}
