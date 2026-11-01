/**
 * 길찾기 — specs/05 MVP: 카카오맵 딥링크만.
 * 모바일은 앱 스킴을 열고, 1.5초 안에 페이지가 숨겨지지 않으면(앱 없음) 웹 길찾기로 폴백. 데스크톱은 웹 길찾기 새 탭.
 * 출발지는 지정하지 않는다(카카오맵이 현재 위치 사용).
 */
export const IS_MOBILE =
  typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

const APP_TIMEOUT_MS = 1500;

export const kakaoRouteApp = (lat: number, lng: number) =>
  `kakaomap://route?ep=${lat},${lng}&by=CAR`;

export const kakaoRouteWeb = (name: string, lat: number, lng: number) =>
  `https://map.kakao.com/link/to/${encodeURIComponent(name)},${lat},${lng}`;

/** 모바일에서 버튼으로 호출 — 앱 → (없으면) 웹 */
export function openKakaoRouteApp(spot: { name: string; lat: number; lng: number }): void {
  window.location.href = kakaoRouteApp(spot.lat, spot.lng);
  window.setTimeout(() => {
    if (!document.hidden) window.location.href = kakaoRouteWeb(spot.name, spot.lat, spot.lng);
  }, APP_TIMEOUT_MS);
}
