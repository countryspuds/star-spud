/** 마지막 글자에 받침이 있으면 "이", 없으면 "가" — "{이벤트}가 D-16에 와요" 같은 문구용 */
export function iGa(word: string): string {
  const code = word.charCodeAt(word.length - 1);
  if (code < 0xac00 || code > 0xd7a3) return "이";
  return (code - 0xac00) % 28 === 0 ? "가" : "이";
}
