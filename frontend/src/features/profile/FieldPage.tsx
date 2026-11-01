import { Suspense } from "react";
import { Label } from "../../components/ui/Label";
import { PillLink } from "../../components/ui/Pill";
import { useMyPotatoes } from "../potato/useMyPotatoes";
import { FieldMap } from "./FieldMap";
import { PotatoList } from "./PotatoList";
import styles from "./profile.module.css";

function FieldBody() {
  const potatoes = useMyPotatoes();
  return (
    <>
      <header className={styles.head}>
        <div>
          <Label>
            MY FIELD · {potatoes.length} {potatoes.length === 1 ? "POTATO" : "POTATOES"}
          </Label>
          <h1 className={styles.h1}>내 감자밭</h1>
        </div>
        <PillLink to="/map" tone="primary">
          감자 심기
        </PillLink>
      </header>
      <div className={styles.fieldGrid}>
        <FieldMap potatoes={potatoes} />
        <PotatoList potatoes={potatoes} />
      </div>
    </>
  );
}

/** `/me` 감자밭 — 명세 §15 */
export function FieldPage() {
  return (
    <Suspense fallback={null}>
      <FieldBody />
    </Suspense>
  );
}
