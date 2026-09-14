import type { CSSProperties } from "react";
import { plantIconBackground, plantIconSprite } from "@/lib/garden/plant-icons";

type PlantArtProps = {
  crop: string;
  variety?: string | null;
  fallback: string;
  className?: string;
  style?: CSSProperties;
};

export function PlantArt({ crop, variety, fallback, className, style }: PlantArtProps) {
  const sprite = plantIconSprite(crop, variety);
  if (!sprite) return <span className={className} style={style} aria-hidden="true">{fallback}</span>;
  return (
    <span
      className={className}
      aria-hidden="true"
      title={`${crop}${variety ? ` · ${variety}` : ""}`}
      style={{
        ...plantIconBackground(sprite),
        display: "inline-block",
        width: "1em",
        height: "1em",
        flex: "0 0 auto",
        verticalAlign: "middle",
        ...style,
      }}
    />
  );
}
