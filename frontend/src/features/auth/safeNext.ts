/** 로그인 후 돌아갈 곳 — 같은 사이트 경로만 허용 (specs/08 `next`) */
export function safeNext(raw: string | null): string {
  return raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";
}
