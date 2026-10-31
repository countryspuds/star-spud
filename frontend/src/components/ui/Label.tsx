import type { ReactNode } from "react";
import styles from "./ui.module.css";

/** 대문자 mono 라벨 (11px, letter-spacing .12em) */
export function Label({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={[styles.label, className].filter(Boolean).join(" ")}>{children}</span>;
}

/** mock 값임을 알리는 캡션 */
export function ExampleCaption({ className }: { className?: string }) {
  return <span className={[styles.example, className].filter(Boolean).join(" ")}>예시 데이터</span>;
}
