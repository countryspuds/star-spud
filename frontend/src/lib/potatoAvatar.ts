import type { PotatoAvatar } from "../data/types";
import potatoBasic from "../assets/potato/potato.svg";
import potatoHappy from "../assets/potato/potato-happy.svg";
import potatoSad from "../assets/potato/potato-sad.svg";

/** 감자 아바타 종류 → 도트 감자 SVG (specs/08 `potato_avatar`) */
export const POTATO_AVATAR_SRC: Record<PotatoAvatar, string> = {
  basic: potatoBasic,
  happy: potatoHappy,
  sad: potatoSad,
};

export const POTATO_AVATAR_LABEL: Record<PotatoAvatar, string> = {
  basic: "기본",
  happy: "웃는",
  sad: "시무룩",
};

export const POTATO_AVATARS: readonly PotatoAvatar[] = ["basic", "happy", "sad"];
