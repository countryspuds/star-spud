/** 시각 표시는 데이터 기준 지역(한국)으로 고정한다 — 브라우저 시간대와 무관 */
const TZ = "Asia/Seoul";

const hmFmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: TZ,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});
const partsFmt = new Intl.DateTimeFormat("ko-KR", {
  timeZone: TZ,
  year: "numeric",
  month: "numeric",
  day: "numeric",
  weekday: "short",
});

export const toMs = (iso: string) => Date.parse(iso);

const ymdFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** 오늘 날짜 "YYYY-MM-DD" (KST) */
export function todayYmd(now: Date = new Date()): string {
  return ymdFmt.format(now);
}

/** 달 "YYYY-MM" (KST) — 시각 문자열이나 Date를 한국 시각의 달로. 월별 집계는 모두 이걸로 */
export function monthKst(t: Date | string = new Date()): string {
  return ymdFmt.format(typeof t === "string" ? new Date(t) : t).slice(0, 7);
}

/** "YYYY-MM-DD"에 n일 더한 날짜 */
export function addDays(ymd: string, n: number): string {
  return ymdFmt.format(new Date(Date.parse(`${ymd}T12:00:00+09:00`) + n * 86_400_000));
}

/** 두 날짜(YYYY-MM-DD) 차이 — b − a (일) */
export function diffDays(a: string, b: string): number {
  return Math.round(
    (Date.parse(`${b}T12:00:00+09:00`) - Date.parse(`${a}T12:00:00+09:00`)) / 86_400_000,
  );
}

/** "21:12" */
export function fmtHM(t: string | number): string {
  return hmFmt.format(typeof t === "string" ? toMs(t) : t);
}

function dateParts(iso: string) {
  const parts = partsFmt.formatToParts(toMs(iso));
  const get = (t: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === t)?.value ?? "";
  return { y: get("year"), m: get("month"), d: get("day"), wd: get("weekday") };
}

/** "10.31 (토)" */
export function fmtMDW(iso: string): string {
  const { m, d, wd } = dateParts(iso);
  return `${m}.${d} (${wd})`;
}

/** 같은 날짜(KST)인지 */
export function sameDay(a: string, b: string): boolean {
  const pa = dateParts(a);
  const pb = dateParts(b);
  return pa.y === pb.y && pa.m === pb.m && pa.d === pb.d;
}

/** 축 [start, end] 위 t의 위치 0~100 (%) — 범위 밖도 그대로 돌려준다 */
export function pct(t: number, start: number, end: number): number {
  return ((t - start) / (end - start)) * 100;
}

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** 128분 → "2시간 8분" */
export function fmtDuration(ms: number): string {
  const total = Math.round(ms / 60000);
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m}분`;
  return m === 0 ? `${h}시간` : `${h}시간 ${m}분`;
}

/** "2026-10-18" → "OCTOBER" */
export function monthNameEn(ymd: string): string {
  return new Date(`${ymd}T12:00:00+09:00`)
    .toLocaleString("en-US", { month: "long", timeZone: TZ })
    .toUpperCase();
}
