import { useEffect, useState } from "react";
import { checkNickname } from "../../data/auth";

/** 닉네임 규칙 — specs/08: 한글·영문·숫자 2~12자 (금칙어는 서버가 본다) */
export const NICKNAME_RE = /^[가-힣A-Za-z0-9]{2,12}$/;
export const NICKNAME_MAX = 12;
const CHECK_DEBOUNCE_MS = 400;

export type NickStatus = "idle" | "invalid" | "checking" | "available" | "taken";

/**
 * 입력이 멈추고 400ms 뒤 중복 확인 (명세 §14). 형식 검사는 렌더에서 바로, 중복 결과만 상태로 둔다.
 * `current`와 같으면(설정에서 안 바꾼 경우) 확인하지 않고 "idle".
 */
export function useNicknameCheck(nickname: string, current?: string): NickStatus {
  const [result, setResult] = useState<{ nickname: string; available: boolean } | null>(null);
  const unchanged = current !== undefined && nickname === current;
  const valid = nickname !== "" && NICKNAME_RE.test(nickname);
  useEffect(() => {
    if (!valid || unchanged) return;
    let cancelled = false;
    const t = setTimeout(() => {
      checkNickname(nickname).then(({ available }) => {
        if (!cancelled) setResult({ nickname, available });
      });
    }, CHECK_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [nickname, valid, unchanged]);
  if (nickname === "" || unchanged) return "idle";
  if (!valid) return "invalid";
  if (result?.nickname === nickname) return result.available ? "available" : "taken";
  return "checking";
}

export const NICK_STATUS_TEXT: Record<NickStatus, string> = {
  idle: "",
  invalid: "한글·영문·숫자 2~12자만 돼요",
  checking: "확인 중…",
  available: "✓ 사용 가능",
  taken: "이미 쓰는 닉네임이에요",
};
