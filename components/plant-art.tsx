import type { CSSProperties } from "react";
import { rasmussenPlantIcon } from "@/lib/garden/rasmussen-plant-icons";
import { getPlantIconV2 } from "@/lib/garden/plant-icon-v2";
import { plantIconBackground, plantIconSprite } from "@/lib/garden/plant-icons";
import { catalogueArt } from "@/lib/garden/catalogue-art";
import { referencePlantSprite, referenceSpriteStyle } from "@/lib/garden/reference-sprites";
import { ReferenceArt } from "./reference-art";

type PlantArtProps = {
  crop: string;
  variety?: string | null;
  fallback: string;
  className?: string;
  style?: CSSProperties;
};

export function PlantArt({ crop, variety, fallback, className, style }: PlantArtProps) {
  const custom = rasmussenPlantIcon(crop, variety);
  if (custom) return <span className={className} aria-hidden="true" title={variety ?? crop} style={{
    display: "inline-block", width: "1em", height: "1em", flex: "0 0 auto", verticalAlign: "middle",
    background: `url(${custom}) center / contain no-repeat`, ...style,
  }} />;
  const reference = referencePlantSprite(crop, variety);
  if (reference) return <span className={`reference-plant-art ${className ?? ""}`} data-reference-sprite={reference.code}
    aria-hidden="true" title={`${crop}${variety ? ` · ${variety}` : ""}`}
    style={{ display: "inline-block", width: "1em", height: "1em",
      flex: "0 0 auto", verticalAlign: "middle", ...referenceSpriteStyle(reference), ...style }}>
      <ReferenceArt code={reference.code} className="reference-high-art" />
    </span>;
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
  if (!sprite) {
    const src = catalogueArt[crop.toLowerCase()];
    if (!src) return <span className={className} style={style} aria-hidden="true">{fallback}</span>;
    return <span className={className} aria-hidden="true" style={{
      display: "inline-block", width: "1em", height: "1em", flex: "0 0 auto",
      background: `url(${src}) center / contain no-repeat`, ...style,
    }} />;
  }
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
