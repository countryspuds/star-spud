import { Suspense, use } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getCalendar, invalidateCalendar, type CalendarDay, type CalendarMonth } from "../data";
import { MoonIcon } from "../components/gauge/MoonIcon";
import { Card } from "../components/ui/Card";
import { ErrorBoundary } from "../components/ui/ErrorBoundary";
import { ExampleCaption, Label } from "../components/ui/Label";
import { PillButton } from "../components/ui/Pill";
import styles from "./CalendarPage.module.css";

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTH_EN = [
  "JANUARY",
  "FEBRUARY",
  "MARCH",
  "APRIL",
  "MAY",
  "JUNE",
  "JULY",
  "AUGUST",
  "SEPTEMBER",
  "OCTOBER",
  "NOVEMBER",
  "DECEMBER",
];

/** "캘린더 읽는 법" 용어 8개 — 명세 §11.1 */
const GLOSSARY: [string, string][] = [
  ["월령", "신월(삭)에서 지난 날수. 0에 가까우면 달이 없고 14.8쯤이 보름이에요."],
  ["달 조도 %", "달 원반 중 햇빛을 받아 밝은 비율. 낮을수록 하늘이 어두워요."],
  ["상현·하현", "달이 반만 보이는 날. 상현은 초저녁에, 하현은 자정 넘어 떠요."],
  ["천문박명", "해가 지평선 아래 18°까지 내려가 하늘이 완전히 어두워지는 시각."],
  ["극대기", "유성우가 가장 많이 떨어지는 시기. 전후 하루까지 볼 만해요."],
  ["ZHR", "이상적인 조건에서 1시간에 보이는 유성 수. 실제로는 이보다 적어요."],
  ["합·충", "행성이 해와 같은 방향(합) 또는 반대 방향(충)에 오는 때. 충이면 밤새 보여요."],
  ["근지점·원지점", "달이 지구에 가장 가까운·먼 지점. 근지점 보름달이 슈퍼문이에요."],
];

/** ?y=&m= 파싱 — 없거나 이상하면 2026-11 (mock이 있는 달) */
function parseYM(sp: URLSearchParams): { year: number; month: number } {
  const y = Number(sp.get("y"));
  const m = Number(sp.get("m"));
  if (Number.isInteger(y) && y >= 1900 && y <= 2200 && Number.isInteger(m) && m >= 1 && m <= 12) {
    return { year: y, month: m };
  }
  return { year: 2026, month: 11 };
}

function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const i = year * 12 + (month - 1) + delta;
  return { year: Math.floor(i / 12), month: (i % 12) + 1 };
}

const monthHref = ({ year, month }: { year: number; month: number }) =>
  `/calendar?y=${year}&m=${month}`;

/** 월 첫날 요일(0=일)과 일수 — 로컬 시간대가 아닌 날짜 산술만 쓴다 */
function monthShape(year: number, month: number) {
  const first = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return { first, days };
}

function DayCell({ day, dow, first }: { day: CalendarDay | null; dow: number; first: boolean }) {
  if (!day) return <div className={styles.cellEmpty} aria-hidden="true" />;
  const n = Number(day.date.slice(-2));
  const important = day.events.some((e) => e.important);
  const cls = [
    styles.cell,
    day.shootingWindow && styles.cellWindow,
    important && styles.cellImportant,
  ]
    .filter(Boolean)
    .join(" ");
  const dateCls = [styles.date, dow === 0 && styles.sun, dow === 6 && styles.sat]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={cls}>
      {first && (
        <span className={styles.windowPill}>딥스카이 · 은하수 촬영 적기 (하현 → 상현)</span>
      )}
      <div className={styles.cellTop}>
        <span className={`${dateCls} tabular`}>{n}</span>
        <span className={`${styles.moon} tabular`}>
          <MoonIcon illum={day.moonIllum} waxing={day.waxing} size={20} />
          {day.moonIllum}%
        </span>
      </div>
      {day.events.length > 0 && (
        <ul className={styles.events}>
          {day.events.map((e) => (
            <li key={e.title}>
              <span className={e.important ? styles.eventTitleImportant : styles.eventTitle}>
                {e.title}
              </span>
              <span className={styles.eventDesc}>
                {e.time ? `${e.time} · ` : ""}
                {e.desc}
              </span>
            </li>
          ))}
        </ul>
      )}
      <dl className={`${styles.times} tabular`}>
        <div>
          <dt>일출</dt>
          <dd>{day.sunrise}</dd>
        </div>
        <div>
          <dt>월출</dt>
          <dd>{day.moonrise}</dd>
        </div>
        <div>
          <dt>일몰</dt>
          <dd>{day.sunset}</dd>
        </div>
        <div>
          <dt>월몰</dt>
          <dd>{day.moonset}</dd>
        </div>
      </dl>
    </div>
  );
}

function MonthGrid({
  year,
  month,
  data,
}: {
  year: number;
  month: number;
  data: CalendarMonth | null;
}) {
  const { first, days } = monthShape(year, month);
  const byDate = new Map((data?.days ?? []).map((d) => [d.date, d]));
  const cells: (CalendarDay | null)[] = [];
  for (let i = 0; i < first; i++) cells.push(null);
  for (let d = 1; d <= days; d++) {
    cells.push(
      byDate.get(`${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`) ?? null,
    );
  }
  let windowStarted = false;

  return (
    <>
      <div className={styles.weekdays} aria-hidden="true">
        {WEEKDAYS.map((w, i) => (
          <span key={w} className={i === 0 ? styles.sun : i === 6 ? styles.sat : undefined}>
            {w}
          </span>
        ))}
      </div>
      <div className={styles.grid} role="grid" aria-label={`${year}년 ${month}월 천문 캘린더`}>
        {cells.map((day, i) => {
          const isFirst = !!day?.shootingWindow && !windowStarted;
          if (day?.shootingWindow) windowStarted = true;
          else windowStarted = false;
          return <DayCell key={i} day={day} dow={i % 7} first={isFirst} />;
        })}
      </div>
      <p className={styles.caption}>
        {data ? (
          <>
            {data.source} · 일출몰·월출몰은 서울 기준 <ExampleCaption />
          </>
        ) : (
          <>
            {year}년 {month}월은 데이터 없음 · 지금은 2026년 11월만 예시 데이터로 볼 수 있어요
          </>
        )}
      </p>
    </>
  );
}

function CalendarBody({ year, month }: { year: number; month: number }) {
  const data = use(getCalendar(year, month));
  const events = data?.events ?? [];

  return (
    <>
      <MonthGrid year={year} month={month} data={data} />

      <div className={styles.bottom}>
        <Card variant="glass" className={styles.panel}>
          <div className={styles.panelHead}>
            <h2 className={styles.panelTitle}>이번 달 천문현상</h2>
            <span className={styles.panelMeta}>
              <Label>{events.length} EVENTS</Label>
              <PillButton size="sm" disabled title="Phase 2에서 제공">
                알림 설정
              </PillButton>
            </span>
          </div>
          {events.length === 0 ? (
            <p className={styles.empty}>이 달 현상 데이터가 없어요.</p>
          ) : (
            <ul className={styles.eventList}>
              {events.map((e) => (
                <li key={`${e.date}-${e.title}`}>
                  <span className={`${styles.eventDate} tabular`}>
                    {Number(e.date.slice(5, 7))}.{Number(e.date.slice(8, 10))}
                  </span>
                  <span className={styles.eventBody}>
                    <strong className={e.important ? styles.eventTitleImportant : undefined}>
                      {e.title}
                    </strong>
                    <span>
                      {e.time ? `${e.time} · ` : ""}
                      {e.desc}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card variant="glass" className={styles.panel}>
          <div className={styles.panelHead}>
            <h2 className={styles.panelTitle}>캘린더 읽는 법</h2>
          </div>
          <dl className={styles.glossary}>
            {GLOSSARY.map(([term, desc]) => (
              <div key={term}>
                <dt>{term}</dt>
                <dd>{desc}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>
    </>
  );
}

export function CalendarPage() {
  const [sp] = useSearchParams();
  const { year, month } = parseYM(sp);

  return (
    <Card className={styles.page}>
      <header className={styles.head}>
        <div className={styles.headLeft}>
          <span className={`${styles.monthNum} tabular`}>{month}</span>
          <div className={styles.headTitles}>
            <Label>
              {year} · {MONTH_EN[month - 1]}
            </Label>
            <h1 className={styles.title}>천문 캘린더</h1>
          </div>
          <nav className={styles.monthNav} aria-label="월 이동">
            <Link to={monthHref(shiftMonth(year, month, -1))} aria-label="이전 달">
              ‹
            </Link>
            <Link to={monthHref(shiftMonth(year, month, 1))} aria-label="다음 달">
              ›
            </Link>
          </nav>
        </div>
        <ul className={styles.legend}>
          <li>
            <i className={styles.legendWindow} /> 딥스카이·은하수 촬영 적기
          </li>
          <li>
            <i className={styles.legendImportant} /> 중요 천문현상
          </li>
          <li>
            <MoonIcon illum={57} waxing size={12} /> 달 조도 %
          </li>
          <li>일출·일몰 / 월출·월몰 · 서울 기준</li>
        </ul>
      </header>

      {/* key: 달이 바뀌면 오류 상태도 초기화. 실패한 요청은 캐시에서 비워 '다시 시도'가 실제로 재요청하게 */}
      <ErrorBoundary
        key={`${year}-${month}`}
        onError={() => invalidateCalendar(year, month)}
        fallback={(_, retry) => (
          <p className={styles.error} role="alert">
            {year}년 {month}월 캘린더를 불러오지 못했어요.
            <PillButton size="sm" onClick={retry}>
              다시 시도
            </PillButton>
          </p>
        )}
      >
        <Suspense fallback={<p className={styles.caption}>불러오는 중…</p>}>
          <CalendarBody year={year} month={month} />
        </Suspense>
      </ErrorBoundary>
    </Card>
  );
}
