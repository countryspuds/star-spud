import { moonFileName, moonPhaseLabel } from "../../lib/moon";

const MOON_URLS = import.meta.glob<string>("../../assets/moon/*.svg", {
  eager: true,
  query: "?url",
  import: "default",
});

/** 12×12 픽셀 달 아이콘 */
export function MoonIcon({
  illum,
  waxing,
  size = 22,
  className,
}: {
  illum: number;
  waxing: boolean;
  size?: number;
  className?: string;
}) {
  const name = moonFileName(illum, waxing);
  const src = MOON_URLS[`../../assets/moon/${name}.svg`];
  return (
    <img
      src={src}
      width={size}
      height={size}
      alt={`달 ${Math.round(illum)}% · ${moonPhaseLabel(illum, waxing)}`}
      className={["pixelated", className].filter(Boolean).join(" ")}
      draggable={false}
    />
  );
}
