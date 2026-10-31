import star5km from "../assets/maps/starscore-5km.svg";
import lp5km from "../assets/maps/lightpollution-5km.svg";
import weather from "../assets/maps/weather-placeholder.png";
import terrain from "../assets/maps/terrain-placeholder.png";
import field5km from "../assets/maps/myfield-5km.svg";
import type { MapTab } from "./mapRoute";

/** 줌 ≥ 2.5에서 1 km 격자로 바꿀 자리 (Phase 2) */
export const LOD_1KM_SCALE = 2.5;

/**
 * 탭·배율에 맞는 지도 이미지.
 * TODO(Phase 2): scale ≥ LOD_1KM_SCALE이면 1 km 격자 이미지(lightpollution-1km 등)를 돌려준다.
 */
export function getLayerSrc(tab: MapTab, scale: number): string {
  void scale; // Phase 1은 5 km 한 단계뿐
  switch (tab) {
    case "star":
      return star5km;
    case "lp":
      return lp5km;
    case "weather":
      return weather;
    case "terrain":
      return terrain;
    case "field":
      return field5km;
  }
}

/** 픽셀(도트) 지도인지 — pixelated 렌더링 여부 */
export const isPixelLayer = (tab: MapTab) => tab === "star" || tab === "lp" || tab === "field";
