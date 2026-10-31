import type { ComponentPropsWithoutRef } from "react";
import styles from "./ui.module.css";

type Variant = "solid" | "glass" | "light";

const variantClass: Record<Variant, string | undefined> = {
  solid: undefined,
  glass: styles.glass,
  light: styles.light,
};

/** radius 22px · 1px edge · 그림자 없음 */
export function Card({
  variant = "solid",
  className,
  ...rest
}: ComponentPropsWithoutRef<"section"> & { variant?: Variant }) {
  return (
    <section
      className={[styles.card, variantClass[variant], className].filter(Boolean).join(" ")}
      {...rest}
    />
  );
}
