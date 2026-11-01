import type { ComponentPropsWithoutRef } from "react";
import { Link, type LinkProps } from "react-router-dom";
import styles from "./ui.module.css";

type Tone = "primary" | "secondary";
type Size = "sm" | "md" | "lg";

function pillClass(tone: Tone, size: Size, className?: string) {
  return [styles.pill, styles[tone], size !== "md" && styles[size], className]
    .filter(Boolean)
    .join(" ");
}

interface PillStyle {
  tone?: Tone;
  size?: Size;
}

/** pill 버튼 — primary(--blue) / secondary(--glass + --edge) */
export function PillButton({
  tone = "secondary",
  size = "md",
  className,
  type = "button",
  ...rest
}: ComponentPropsWithoutRef<"button"> & PillStyle) {
  return <button type={type} className={pillClass(tone, size, className)} {...rest} />;
}

/** pill 모양 외부 링크 (길찾기 등 바깥 주소) */
export function PillAnchor({
  tone = "secondary",
  size = "md",
  className,
  ...rest
}: ComponentPropsWithoutRef<"a"> & PillStyle) {
  return <a className={pillClass(tone, size, className)} {...rest} />;
}

/** pill 모양 라우터 링크 */
export function PillLink({
  tone = "secondary",
  size = "md",
  className,
  ...rest
}: LinkProps & PillStyle) {
  return <Link className={pillClass(tone, size, className)} {...rest} />;
}
