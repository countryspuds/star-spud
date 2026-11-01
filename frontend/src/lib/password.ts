import { PASSWORD_RE } from "../data/auth";

/** 강도 바 4칸 — 8자 · 영문 · 숫자 · (12자 이상 또는 특수문자). ok는 가입 규칙(8자+영문+숫자) */
export function passwordStrength(pw: string): {
  score: 0 | 1 | 2 | 3 | 4;
  ok: boolean;
  label: string;
} {
  const checks = [
    pw.length >= 8,
    /[A-Za-z]/.test(pw),
    /\d/.test(pw),
    pw.length >= 12 || /[^A-Za-z0-9]/.test(pw),
  ];
  const score = checks.filter(Boolean).length as 0 | 1 | 2 | 3 | 4;
  const label =
    pw === "" ? "" : score <= 1 ? "약함" : score === 2 ? "보통" : score === 3 ? "좋음" : "강함";
  return { score, ok: PASSWORD_RE.test(pw), label };
}
