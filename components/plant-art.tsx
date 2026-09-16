import type { CSSProperties } from "react";
import { getPlantIconV2 } from "@/lib/garden/plant-icon-v2";
import { plantIconBackground, plantIconSprite } from "@/lib/garden/plant-icons";

type PlantArtProps = {
  crop: string;
  variety?: string | null;
  fallback: string;
  className?: string;
  style?: CSSProperties;
};

export function PlantArt({ crop, variety, fallback, className, style }: PlantArtProps) {
  const vector = getPlantIconV2(crop, variety);
  if (vector) {
    return (
      <span
        className={className}
        aria-hidden="true"
        title={`${crop}${variety ? ` · ${variety}` : ""}`}
        style={{
          backgroundImage: `url(${vector.src})`,
          backgroundRepeat: "no-repeat",
          backgroundSize: "contain",
          backgroundPosition: "center",
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
