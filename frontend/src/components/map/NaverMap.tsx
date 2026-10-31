import { getLayerSrc } from "../../lib/lod";

/**
 * 날씨·지형고도 탭의 지도 경계.
 * Phase 1: 같은 1056×976 좌표계의 placeholder 이미지를 MapCanvas 안에서 보여준다 (pan/zoom 공유).
 * TODO(Phase 2): 네이버 Maps JS v3로 교체 — new naver.maps.Map(el, { mapTypeId: naver.maps.MapTypeId.TERRAIN })
 *   (SDK가 pan/zoom을 직접 처리하므로 그때는 MapCanvas 밖에서 렌더한다)
 */
export function NaverMap({ mapType, scale }: { mapType: "weather" | "terrain"; scale: number }) {
  return (
    <img
      src={getLayerSrc(mapType, scale)}
      alt={mapType === "weather" ? "날씨 지도 자리표시 이미지" : "지형고도 지도 자리표시 이미지"}
      width={1056}
      height={976}
      draggable={false}
    />
  );
}
