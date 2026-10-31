/** 17 시·도 코드 ↔ 이름. 코드는 cells-by-region-approx.json / 퍼즐 SVG의 data-region과 같다. */
export const SIDO = {
  seoul: { name: "서울특별시", short: "서울" },
  busan: { name: "부산광역시", short: "부산" },
  daegu: { name: "대구광역시", short: "대구" },
  incheon: { name: "인천광역시", short: "인천" },
  gwangju: { name: "광주광역시", short: "광주" },
  daejeon: { name: "대전광역시", short: "대전" },
  ulsan: { name: "울산광역시", short: "울산" },
  sejong: { name: "세종특별자치시", short: "세종" },
  gyeonggi: { name: "경기도", short: "경기" },
  gangwon: { name: "강원특별자치도", short: "강원" },
  chungbuk: { name: "충청북도", short: "충북" },
  chungnam: { name: "충청남도", short: "충남" },
  jeonbuk: { name: "전북특별자치도", short: "전북" },
  jeonnam: { name: "전라남도", short: "전남" },
  gyeongbuk: { name: "경상북도", short: "경북" },
  gyeongnam: { name: "경상남도", short: "경남" },
  jeju: { name: "제주특별자치도", short: "제주" },
} as const;

export type SidoCode = keyof typeof SIDO;

export function isSidoCode(code: string): code is SidoCode {
  return Object.hasOwn(SIDO, code);
}
