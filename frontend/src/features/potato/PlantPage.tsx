import {
  Suspense,
  use,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
} from "react";
import { Link, Navigate, useLocation, useParams } from "react-router-dom";
import { PotatoIllust } from "../../components/potato/PotatoIllust";
import { Card } from "../../components/ui/Card";
import { ExampleCaption, Label } from "../../components/ui/Label";
import { PillButton, PillLink } from "../../components/ui/Pill";
import { plantOrFeed, type PlantResult, type Potato } from "../../data/potatoes";
import { getSpot, nightDates, type SpotDetail } from "../../data/spots";
import { FOOD_LABEL, foodIconSrc } from "../../lib/food";
import { iGa } from "../../lib/josa";
import { LEVEL_NAME } from "../../lib/potatoIllust";
import { todayYmd } from "../../lib/time";
import { useMe } from "../auth/useMe";
import { useMyPotatoes } from "./useMyPotatoes";
import styles from "./potato.module.css";

const MAX_PHOTOS = 5;
const REVIEW_MIN = 2;
const REVIEW_MAX = 2000;
const MIN_DATE = "2000-01-01";

/** 서버 오류 코드 → 문구 (specs/04 엣지 케이스) */
const ERROR_TEXT: Record<string, string> = {
  VISIT_DATE_IN_FUTURE: "방문일은 오늘까지만 고를 수 있어요",
  VISIT_DATE_TOO_OLD: "2000년 1월 1일 이후만 기록할 수 있어요",
  VISIT_DATE_INVALID: "방문일을 골라 주세요",
  REVIEW_LENGTH: "후기는 2~2000자로 적어 주세요",
  TOO_MANY_PHOTOS: "사진은 5장까지예요",
  SPOT_NOT_FOUND: "명소를 찾을 수 없어요",
};

interface Photo {
  file: File;
  url: string;
}

/** HEIC/HEIF — 클라이언트 JPEG 변환은 TODO. 지금은 거부 문구만 (specs/01) */
const isHeic = (f: File) =>
  f.type === "image/heic" || f.type === "image/heif" || /\.hei[cf]$/i.test(f.name);

/* ── 폼 ─────────────────────────────── */
function PlantForm({
  spot,
  mine,
  onDone,
}: {
  spot: SpotDetail;
  mine: Potato | undefined;
  onDone: (r: PlantResult) => void;
}) {
  const today = todayYmd();
  const [visitedOn, setVisitedOn] = useState(today);
  const [review, setReview] = useState("");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(mine?.isPublic ?? true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  // 미리보기 object URL은 화면을 떠날 때 모두 해제
  const photosRef = useRef<Photo[]>([]);
  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);
  useEffect(() => () => photosRef.current.forEach((p) => URL.revokeObjectURL(p.url)), []);

  const dateError =
    visitedOn === ""
      ? "방문일을 골라 주세요"
      : visitedOn > today
        ? ERROR_TEXT.VISIT_DATE_IN_FUTURE
        : visitedOn < MIN_DATE
          ? ERROR_TEXT.VISIT_DATE_TOO_OLD
          : null;
  const trimmed = review.trim();
  const reviewError =
    trimmed.length > 0 && trimmed.length < REVIEW_MIN
      ? "후기는 2자 이상 적어 주세요"
      : review.length > REVIEW_MAX
        ? "후기는 2000자까지예요"
        : null;
  const canSubmit = !dateError && !reviewError && trimmed.length >= REVIEW_MIN && !submitting;

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const files = Array.from(list);
    const heic = files.find(isHeic);
    const images = files.filter((f) => f.type.startsWith("image/") && !isHeic(f));
    const room = MAX_PHOTOS - photos.length;
    if (heic) setPhotoError("HEIC 사진은 아직 못 올려요. JPG로 바꿔서 올려 주세요");
    else if (images.length > room) setPhotoError(`사진은 ${MAX_PHOTOS}장까지예요`);
    else setPhotoError(null);
    const next = images.slice(0, room).map((file) => ({ file, url: URL.createObjectURL(file) }));
    if (next.length) setPhotos((prev) => [...prev, ...next]);
  };
  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    addFiles(e.target.files);
    e.target.value = "";
  };
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  };
  const removePhoto = (i: number) => {
    URL.revokeObjectURL(photos[i].url);
    setPhotos(photos.filter((_, j) => j !== i));
    setPhotoError(null);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);
    try {
      // TODO(Phase 1 후반): photos를 POST /api/v1/uploads/presign → PUT으로 올리고 키를 photoKeys에 넣는다
      const result = await plantOrFeed(spot.id, {
        visitedOn,
        review: trimmed,
        photoKeys: [],
        isPublic,
      });
      onDone(result); // 성공 화면으로 바뀌므로 submitting은 되돌리지 않는다
    } catch (err) {
      setError(err instanceof Error ? err.message : "UNKNOWN");
      setSubmitting(false);
    }
  };

  const feeding = mine !== undefined;
  const title = feeding
    ? `먹이 주기 · Lv${mine.level}${mine.level < 4 ? ` → Lv${mine.level + 1}` : ""}`
    : `${spot.name}에 감자 심기`;
  const duplicate = error === "FEED_ALREADY_EXISTS";
  const footError =
    error && !duplicate ? (ERROR_TEXT[error] ?? "저장하지 못했어요. 다시 시도해 주세요") : null;

  return (
    <Card className={styles.plant}>
      <header className={styles.plantHead}>
        {feeding ? (
          <PotatoIllust level={mine.level} state={mine.state} size={64} />
        ) : (
          <PotatoIllust level={1} state="normal" size={64} className={styles.silhouette} />
        )}
        <div className={styles.plantTitle}>
          <h1 className={styles.h1}>{title}</h1>
          <span className={styles.mono}>기록 1건 = 먹이 1개{feeding ? ` · ${spot.name}` : ""}</span>
        </div>
      </header>

      <form onSubmit={onSubmit} noValidate className={styles.form}>
        <div className={styles.field}>
          <label htmlFor="plant-date" className={styles.fieldLabel}>
            방문일
          </label>
          <input
            id="plant-date"
            type="date"
            className={styles.input}
            value={visitedOn}
            max={today}
            min={MIN_DATE}
            onChange={(e) => {
              setVisitedOn(e.target.value);
              if (duplicate) setError(null);
            }}
            aria-invalid={!!dateError || duplicate}
            aria-describedby="plant-date-error"
          />
          {(dateError || duplicate) && (
            <span id="plant-date-error" className={styles.error} role="alert">
              {duplicate ? (
                <>
                  그날 기록이 이미 있어요 →{" "}
                  <Link to={`/me/potatoes/${mine?.id ?? ""}`} className={styles.errorLink}>
                    수정하기
                  </Link>
                </>
              ) : (
                dateError
              )}
            </span>
          )}
        </div>

        <div className={styles.field}>
          <div className={styles.fieldRow}>
            <label htmlFor="plant-review" className={styles.fieldLabel}>
              후기
            </label>
            <span className={`${styles.counter} tabular`} data-over={review.length > REVIEW_MAX}>
              {review.length} / {REVIEW_MAX}
            </span>
          </div>
          <textarea
            id="plant-review"
            className={styles.textarea}
            rows={4}
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="하늘은 어땠는지, 주차·화장실·진입로는 어땠는지."
            aria-invalid={!!reviewError}
            aria-describedby={reviewError ? "plant-review-error" : undefined}
          />
          {reviewError && (
            <span id="plant-review-error" className={styles.error} role="alert">
              {reviewError}
            </span>
          )}
        </div>

        <div className={styles.field}>
          <span className={styles.fieldLabel}>
            사진 <span className={styles.optional}>선택 · 최대 {MAX_PHOTOS}장 · 첫 장이 대표</span>
          </span>
          <div
            className={styles.dropzone}
            data-over={dragOver}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
          >
            <input
              ref={fileInput}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              className="sr-only"
              onChange={onFileChange}
              aria-label="사진 파일 선택"
            />
            <button
              type="button"
              className={styles.dropBtn}
              onClick={() => fileInput.current?.click()}
              disabled={photos.length >= MAX_PHOTOS}
            >
              {photos.length >= MAX_PHOTOS
                ? `${MAX_PHOTOS}장까지 넣었어요`
                : "여기에 끌어다 놓거나 눌러서 고르기"}
            </button>
          </div>
          {photos.length > 0 && (
            <ul className={styles.previews}>
              {photos.map((p, i) => (
                <li key={p.url}>
                  <img src={p.url} alt={`선택한 사진 ${i + 1}`} />
                  {i === 0 && <span className={styles.coverTag}>대표</span>}
                  <button
                    type="button"
                    className={styles.previewRemove}
                    onClick={() => removePhoto(i)}
                    aria-label={`${p.file.name} 빼기`}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
          {photoError && (
            <span className={styles.error} role="alert">
              {photoError}
            </span>
          )}
        </div>

        <div className={styles.publicRow}>
          <div className={styles.publicText}>
            <span className={styles.fieldLabel}>이 감자를 공개할게요</span>
            <span className={styles.hint}>
              공개 감자는 명소 상세에 보여요. 비공개면 내 감자밭에서만.
            </span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={isPublic}
            aria-label="감자 공개"
            className={isPublic ? styles.toggleOn : styles.toggle}
            onClick={() => setIsPublic(!isPublic)}
          >
            <span className={styles.knob} />
          </button>
        </div>

        <div className={styles.formFoot}>
          {footError ? (
            <span className={styles.error} role="alert">
              {footError}
            </span>
          ) : (
            <ExampleCaption />
          )}
          <div className={styles.formBtns}>
            <PillLink to={`/spots/${spot.id}`}>취소</PillLink>
            <PillButton type="submit" tone="primary" disabled={!canSubmit}>
              {submitting ? "저장하는 중…" : feeding ? "먹이 주기" : "감자 심기"}
            </PillButton>
          </div>
        </div>
      </form>
    </Card>
  );
}

/* ── 성공 화면 (같은 카드 자리) ──────────── */
function Success({ spot, result }: { spot: SpotDetail; result: PlantResult }) {
  const { potato, feed, isNewPotato, levelUp } = result;
  const levelName = LEVEL_NAME[potato.level];
  const title = isNewPotato
    ? "첫 감자를 심었어요"
    : levelUp
      ? `Lv${potato.level} ${levelName}${iGa(levelName)} 됐어요`
      : `Lv4는 최고 등급이에요. 먹이 ${potato.foodCount}개`;
  return (
    <Card className={`${styles.plant} ${styles.success}`}>
      <div className={styles.successArt}>
        <PotatoIllust level={potato.level} state={potato.state} size={96} />
        <img
          src={foodIconSrc(feed.food)}
          alt={`${FOOD_LABEL[feed.food]} 먹이`}
          width={44}
          height={44}
          className={`pixelated ${styles.successFood}`}
        />
      </div>
      <Label>{isNewPotato ? "PLANTED" : "FED"}</Label>
      <h1 className={styles.h1}>{title}</h1>
      <p className={styles.successBody}>
        {potato.spot.name}의 감자가 {FOOD_LABEL[feed.food]} 먹이를 먹었어요
        {isNewPotato ? ` · Lv1 ${LEVEL_NAME[1]}` : ""}
      </p>
      <div className={styles.successActions}>
        <PillLink to="/me" tone="primary">
          내 감자밭 보기
        </PillLink>
        <PillLink to={`/spots/${spot.id}`}>명소로 돌아가기</PillLink>
      </div>
      <ExampleCaption />
    </Card>
  );
}

function PlantBody({ spotId }: { spotId: string }) {
  const me = useMe();
  const { pathname } = useLocation();
  const [date] = useState(() => nightDates()[0]);
  const spot = use(getSpot(spotId, date));
  const mine = useMyPotatoes().find((p) => p.spot.id === spotId);
  const [result, setResult] = useState<PlantResult | null>(null);

  // 비로그인은 로그인으로(돌아올 곳 포함). 온보딩 전은 OnboardingGuard가 /onboarding으로 보낸다
  if (!me) return <Navigate to={`/login?next=${encodeURIComponent(pathname)}`} replace />;
  if (!spot) {
    return (
      <Card className={`${styles.plant} ${styles.success}`}>
        <h1 className={styles.h1}>이 명소는 찾을 수 없어요</h1>
        <PillLink to="/map" tone="primary">
          지도로 가기
        </PillLink>
      </Card>
    );
  }
  if (result) return <Success spot={spot} result={result} />;
  return <PlantForm spot={spot} mine={mine} onDone={setResult} />;
}

/** `/spots/:id/plant` 감자 심기 / 먹이 주기 — 명세 §18.2. 모바일·데스크톱 모두 전체 페이지(카드 640px 가운데) */
export function PlantPage() {
  const { id = "" } = useParams();
  return (
    <div className={styles.page}>
      <Suspense fallback={null}>
        <PlantBody key={id} spotId={id} />
      </Suspense>
    </div>
  );
}
