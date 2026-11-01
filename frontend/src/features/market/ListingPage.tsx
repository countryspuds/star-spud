import { Suspense } from "react";
import { Link, useParams } from "react-router-dom";
import potatoSad from "../../assets/potato/potato-sad.svg";
import { Avatar } from "../../components/ui/Avatar";
import { Card } from "../../components/ui/Card";
import { ExampleCaption, Label } from "../../components/ui/Label";
import { PillButton, PillLink } from "../../components/ui/Pill";
import { toggleListingLike, type MarketListingDetail } from "../../data/market";
import { SIDO, isSidoCode } from "../../data/regions";
import { GEAR_LABEL, gearIconSrc } from "../../lib/gear";
import { fmtHM, fmtMDW } from "../../lib/time";
import { useMe } from "../auth/useMe";
import { useWriteGate } from "../community/useCommunity";
import { CONDITION_LABEL, SAFETY_LINES, STATUS_LABEL, TRADE_LABEL, fmtWon } from "./labels";
import { useListing } from "./useMarket";
import styles from "./market.module.css";

const PHOTO_SLOTS = 10;

/** 사진 자리 — 큰 아이콘 + 슬롯 10칸(있는 장 수만큼 채움). 실제 사진은 Phase 2 백엔드 */
function PhotoArea({ item }: { item: MarketListingDetail }) {
  return (
    <Card className={styles.photoArea} aria-label={`상품 사진 ${item.photoCount}장 자리`}>
      <div className={styles.photoMain}>
        <img src={gearIconSrc(item.category)} alt="" width={120} height={120} />
        {item.status !== "selling" && (
          <span className={styles.badgeLg}>{STATUS_LABEL[item.status]}</span>
        )}
      </div>
      <ul className={styles.slots} aria-hidden="true">
        {Array.from({ length: PHOTO_SLOTS }, (_, i) => (
          <li key={i} className={i < item.photoCount ? styles.slotOn : styles.slot}>
            {i < item.photoCount && (
              <img src={gearIconSrc(item.category)} alt="" width={20} height={20} />
            )}
          </li>
        ))}
      </ul>
      <span className={styles.photoNote}>
        사진 {item.photoCount}/{PHOTO_SLOTS} · 이미지는 백엔드 연결 뒤 (지금은 장비 아이콘 자리)
      </span>
    </Card>
  );
}

function SellerCard({ seller }: { seller: MarketListingDetail["seller"] }) {
  const me = useMe();
  const mine = me !== null && me.id === seller.id;
  const stats = [
    ["감자", seller.potatoCount],
    ["후기", seller.reviewCount],
    ["거래", seller.tradeCount],
  ] as const;
  const body = (
    <>
      <Avatar avatarUrl={seller.avatarUrl} potatoAvatar={seller.potatoAvatar} size={44} />
      <div className={styles.sellerText}>
        <span className={styles.sellerName}>{seller.nickname}</span>
        <dl className={styles.sellerStats}>
          {stats.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd className="tabular">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
      <span className={styles.sellerGo}>{mine ? "내 프로필 →" : "프로필 · Phase 3"}</span>
    </>
  );
  return (
    <Card variant="glass" className={styles.sellerCard}>
      <Label>SELLER · 판매자</Label>
      {/* 다른 사용자의 공개 프로필은 Phase 3(팔로우·피드)과 함께 — 지금은 내 프로필만 링크 */}
      {mine ? (
        <Link to="/me" className={styles.seller}>
          {body}
        </Link>
      ) : (
        <div className={styles.seller}>{body}</div>
      )}
    </Card>
  );
}

function NotFound() {
  return (
    <Card className={styles.notFound}>
      <img src={potatoSad} alt="" width={96} height={96} className="pixelated" />
      <Label>NOT FOUND</Label>
      <h1 className={styles.h1}>상품이 없어요</h1>
      <p>내려갔거나 주소가 잘못됐어요.</p>
      <PillLink to="/market" tone="primary">
        장터로 가기
      </PillLink>
    </Card>
  );
}

function Detail({ id }: { id: string }) {
  const item = useListing(id);
  const gate = useWriteGate();
  if (!item) return <NotFound />;
  const sido = isSidoCode(item.sido) ? SIDO[item.sido].short : item.sido;
  return (
    <>
      <header className={styles.head}>
        <Link to="/market" className={styles.back}>
          ← 장터
        </Link>
        <ExampleCaption />
      </header>
      <div className={styles.detailGrid}>
        <PhotoArea item={item} />
        <div className={styles.detailCol}>
          <Card className={styles.detailCard}>
            <div className={styles.tagRow}>
              <span className={styles.catTag}>
                <img src={gearIconSrc(item.category)} alt="" width={14} height={14} />
                {GEAR_LABEL[item.category]}
              </span>
              <span className={`${styles.views} tabular`}>
                조회 {item.viewCount.toLocaleString()} · {fmtMDW(item.createdAt)}{" "}
                {fmtHM(item.createdAt)}
              </span>
            </div>
            <h1 className={styles.title}>{item.title}</h1>
            <p className={`${styles.priceLg} tabular`}>
              {fmtWon(item.price)}
              {item.status !== "selling" && (
                <span className={styles.statusInline}>{STATUS_LABEL[item.status]}</span>
              )}
            </p>
            <ul className={styles.tiles}>
              <li className={styles.tile}>
                <span className={styles.tileKey}>상태</span>
                <span className={styles.tileVal}>{CONDITION_LABEL[item.condition]}</span>
              </li>
              <li className={styles.tile}>
                <span className={styles.tileKey}>거래</span>
                <span className={styles.tileVal}>{TRADE_LABEL[item.trade]}</span>
                <span className={styles.tileSub}>{sido}</span>
              </li>
              <li className={styles.tile}>
                <span className={styles.tileKey}>구성</span>
                <span className={styles.tileValSm}>{item.includes}</span>
              </li>
            </ul>
            <p className={styles.desc}>{item.description}</p>
            <div className={styles.actions}>
              <PillButton tone="primary" disabled title="Phase 3" className={styles.chatBtn}>
                채팅하기 · Phase 3
              </PillButton>
              <PillButton
                className={item.likedByMe ? styles.likePillOn : undefined}
                aria-pressed={item.likedByMe}
                onClick={() => gate(() => toggleListingLike(item.id))}
              >
                <span aria-hidden="true">{item.likedByMe ? "♥" : "♡"}</span> 찜{" "}
                <span className="tabular">{item.likeCount}</span>
              </PillButton>
            </div>
          </Card>
          <SellerCard seller={item.seller} />
          <Card variant="glass" className={styles.caution}>
            <Label>주의사항</Label>
            <ol className={styles.cautionList}>
              {SAFETY_LINES.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </>
  );
}

/** `/market/:id` — 상품 상세 (Phase 2 · specs/07). 채팅 연결은 Phase 3 */
export default function ListingPage() {
  const { id = "" } = useParams();
  return (
    <div className={styles.page}>
      <Suspense fallback={null}>
        <Detail id={id} />
      </Suspense>
    </div>
  );
}
