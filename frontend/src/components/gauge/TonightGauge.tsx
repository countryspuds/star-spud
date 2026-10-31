import { use } from "react";
import { getTonight } from "../../data";
import { NightGauge } from "./NightGauge";

/** getTonight() 데이터를 NightGauge에 연결 */
export function TonightGauge() {
  const t = use(getTonight());
  const place = t.location.split(" ")[0];
  return <NightGauge times={t} place={place} />;
}
