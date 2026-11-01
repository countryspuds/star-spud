import type { PotatoAvatar } from "../../data/types";
import { POTATO_AVATAR_SRC } from "../../lib/potatoAvatar";
import styles from "./ui.module.css";

interface Props {
  /** 업로드한 사진이 있으면 원형으로, 없으면 감자 아바타를 픽셀로 그린다 (명세 §13) */
  avatarUrl: string | null;
  potatoAvatar: PotatoAvatar;
  size: number;
  className?: string;
}

export function Avatar({ avatarUrl, potatoAvatar, size, className }: Props) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt=""
        width={size}
        height={size}
        className={[styles.avatarPhoto, className].filter(Boolean).join(" ")}
      />
    );
  }
  return (
    <img
      src={POTATO_AVATAR_SRC[potatoAvatar]}
      alt=""
      width={size}
      height={size}
      className={["pixelated", className].filter(Boolean).join(" ")}
    />
  );
}
