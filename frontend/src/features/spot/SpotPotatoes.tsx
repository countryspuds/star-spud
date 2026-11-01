import { use, useState, type FormEvent } from "react";
import { PotatoIllust } from "../../components/potato/PotatoIllust";
import { Card } from "../../components/ui/Card";
import { ExampleCaption, Label } from "../../components/ui/Label";
import { PillButton } from "../../components/ui/Pill";
import {
  getSpotPotatoes,
  reportSpot,
  type SpotDetail,
  type SpotPotatoPage,
  type SpotReportReason,
} from "../../data/spots";
import { useMe } from "../auth/useMe";
import { REPORT_REASONS } from "./labels";
import styles from "./spot.module.css";

const fmtDate = (ymd: string) => ymd.replaceAll("-", ".");

/* ── 신고 모달 ───────────────────────── */
type ReportState = "idle" | "sending" | "done" | "duplicate";

function ReportModal({ spotId, onClose }: { spotId: string; onClose: () => void }) {
  const [reason, setReason] = useState<SpotReportReason>("wrong_location");
  const [state, setState] = useState<ReportState>("idle");

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setState("sending");
    try {
      await reportSpot(spotId, reason);
      setState("done");
    } catch (err) {
      // specs/01: 사용자당 명소당 1건 — 재시도는 409
      setState(
        err instanceof Error && err.message === "REPORT_ALREADY_EXISTS" ? "duplicate" : "idle",
      );
    }
  };

  return (
    <div className={styles.modalBackdrop} role="presentation" onClick={onClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="report-title" className={styles.modalTitle}>
          명소 신고
        </h2>
        {state === "done" || state === "duplicate" ? (
          <>
            <p className={styles.modalBody}>
              {state === "done"
                ? "신고를 접수했어요. 확인한 뒤 명소 정보에 반영할게요."
                : "이미 신고한 명소예요. 확인 중이니 조금만 기다려 주세요."}
            </p>
            <div className={styles.modalActions}>
              <PillButton tone="primary" onClick={onClose}>
                닫기
              </PillButton>
            </div>
          </>
        ) : (
          <form onSubmit={onSubmit}>
            <p className={styles.modalBody}>어떤 점이 잘못됐나요?</p>
            <div className={styles.reasons} role="radiogroup" aria-label="신고 사유">
              {REPORT_REASONS.map((r) => (
                <label key={r.reason} className={styles.reason}>
                  <input
                    type="radio"
                    name="reason"
                    value={r.reason}
                    checked={reason === r.reason}
                    onChange={() => setReason(r.reason)}
                  />
                  <span>{r.label}</span>
                </label>
              ))}
            </div>
            <div className={styles.modalActions}>
              <PillButton onClick={onClose}>취소</PillButton>
              <PillButton type="submit" tone="primary" disabled={state === "sending"}>
                {state === "sending" ? "보내는 중…" : "신고하기"}
              </PillButton>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

/* ── 공개 감자 목록 ─────────────────────── */
interface Loaded {
  first: SpotPotatoPage;
  more: SpotPotatoPage[];
}

/** "이곳의 감자밭" — 공개 감자, 최신 기록순, 커서 페이징 (명세 §18.1 · specs/04) */
export function SpotPotatoes({ spot }: { spot: SpotDetail }) {
  const me = useMe();
  const first = use(getSpotPotatoes(spot.id));
  // 첫 페이지가 바뀌면(로그인 사용자 변경 등) 더 불러온 페이지는 버린다
  const [loaded, setLoaded] = useState<Loaded>({ first, more: [] });
  if (loaded.first !== first) setLoaded({ first, more: [] });
  const pages = loaded.first === first ? [first, ...loaded.more] : [first];
  const items = pages.flatMap((p) => p.items);
  const nextCursor = pages[pages.length - 1].nextCursor;
  const [loadingMore, setLoadingMore] = useState(false);
  const [reporting, setReporting] = useState(false);

  const loadMore = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await getSpotPotatoes(spot.id, nextCursor);
      setLoaded((prev) => (prev.first === first ? { ...prev, more: [...prev.more, page] } : prev));
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <Card variant="glass" className={styles.potatoes} id="potatoes">
      <div className={styles.potatoesHead}>
        <div className={styles.potatoesTitle}>
          <Label>이곳의 감자밭</Label>
          <h2 className={styles.h2}>공개 감자 {first.total}</h2>
        </div>
        <span className={styles.sort}>최신 기록순</span>
      </div>

      {items.length === 0 ? (
        <p className={styles.empty}>아직 공개 감자가 없어요. 첫 감자를 심어볼까요?</p>
      ) : (
        <ul className={styles.rows}>
          {items.map((p) => (
            <li key={p.id} className={styles.row}>
              <PotatoIllust level={p.level} state={p.state} />
              <div className={styles.rowText}>
                <span className={styles.nick}>{p.nickname}</span>
                <span className={styles.visited}>{fmtDate(p.lastVisitedOn)}</span>
                <p className={styles.excerpt}>{p.latestReview}</p>
                {p.photos.length > 0 && (
                  <div className={styles.thumbs}>
                    {p.photos.slice(0, 3).map((src, i) => (
                      <img key={i} src={src} alt="" width={48} height={48} loading="lazy" />
                    ))}
                  </div>
                )}
              </div>
              <span className={styles.rowMeta}>
                Lv{p.level} · 먹이 {p.foodCount}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className={styles.potatoesFoot}>
        {nextCursor ? (
          <PillButton size="sm" onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? "불러오는 중…" : "더 보기"}
          </PillButton>
        ) : (
          <ExampleCaption />
        )}
        {me && (
          <button type="button" className={styles.report} onClick={() => setReporting(true)}>
            이 명소 신고
          </button>
        )}
      </div>

      {reporting && <ReportModal spotId={spot.id} onClose={() => setReporting(false)} />}
    </Card>
  );
}
