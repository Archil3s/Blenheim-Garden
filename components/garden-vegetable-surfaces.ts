import * as THREE from "three";

export type VegetableSurface = "leaf" | "palmate" | "parallel" | "skin" | "net";
type Finish = "foliage" | "wax" | "silver" | "striped" | "root" | "paper" | "berry" | "bloom" | "floret" | "gloss" | "net";
const cache = new Map<string, ReturnType<typeof makeMaps>>();

function finishFor(surface: VegetableSurface, crop: string): Finish {
  if (surface === "net") return "net";
  if (surface !== "skin") {
    if (["cabbage", "kale", "broccoli", "cauliflower", "leek"].includes(crop)) return "wax";
    return ["artichoke", "thyme", "zucchini"].includes(crop) ? "silver" : "foliage";
  }
  if (["pumpkin", "zucchini", "cucumber", "melon"].includes(crop)) return "striped";
  if (["carrot", "beet", "radish"].includes(crop)) return "root";
  if (["onion", "garlic", "leek"].includes(crop)) return "paper";
  if (crop === "blueberry") return "bloom";
  if (["strawberry", "raspberry"].includes(crop)) return "berry";
  return ["broccoli", "cauliflower"].includes(crop) ? "floret" : "gloss";
}

function makeMaps(surface: VegetableSurface, finish: Finish) {
  const canvas = document.createElement("canvas"), relief = document.createElement("canvas");
  canvas.width = canvas.height = relief.width = relief.height = 512;
  const ctx = canvas.getContext("2d")!, height = relief.getContext("2d")!;
  ctx.scale(2, 2); height.scale(2, 2);
  const leaf = surface !== "skin" && surface !== "net";
  ctx.fillStyle = leaf ? "#e3e9d1" : "#f5eddb"; ctx.fillRect(0, 0, 256, 256);
  height.fillStyle = "#808080"; height.fillRect(0, 0, 256, 256);
  let seed = 9173;
  const random = () => ((seed = Math.imul(seed, 1664525) + 1013904223 >>> 0) / 4294967296);
  const stroke = (points: number[], width: number, color: string, elevation = 165) => {
    for (const target of [ctx, height]) {
      target.strokeStyle = target === ctx ? color : `rgb(${elevation},${elevation},${elevation})`;
      target.lineWidth = width; target.lineCap = "round"; target.beginPath(); target.moveTo(points[0], points[1]);
      if (points.length === 4) target.lineTo(points[2], points[3]);
      else target.bezierCurveTo(points[2], points[3], points[4], points[5], points[6], points[7]);
      target.stroke();
    }
  };
  // Broad pigment variation remains visible when mipmaps reduce the fine pores.
  for (let i = 0; i < 150; i++) {
    const x = random() * 256, y = random() * 256, radius = 8 + random() * 25;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, i % 3 ? leaf ? "rgba(33,85,42,.17)" : "rgba(126,74,24,.15)" : "rgba(255,237,163,.25)");
    gradient.addColorStop(1, "rgba(255,255,255,0)"); ctx.fillStyle = gradient; ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }
  if (leaf) {
    const gradient = ctx.createLinearGradient(0, 0, 256, 0);
    gradient.addColorStop(0, "rgba(38,81,35,.30)"); gradient.addColorStop(.45, "rgba(245,246,173,.06)");
    gradient.addColorStop(.55, "rgba(245,246,173,.06)"); gradient.addColorStop(1, "rgba(38,81,35,.30)");
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, 256, 256);
    if (surface === "parallel") {
      for (let i = 0; i < 31; i++) {
        const x = i * 8.5;
        stroke([x, 256, x + (128 - x) * .08, 172, x + (128 - x) * .2, 65, x + (128 - x) * .3, 0], i === 15 ? 2.2 : .7, i % 3 ? "rgba(245,249,198,.38)" : "rgba(46,93,46,.30)", i % 3 ? 153 : 111);
      }
    } else if (surface === "palmate") {
      for (const [x, y] of [[8, 146], [40, 45], [128, 0], [216, 45], [248, 146]]) {
        stroke([128, 256, 128 + (x - 128) * .3, 181, x, y + 20, x, y], 2, "rgba(243,246,188,.62)", 190);
        for (let i = 2; i < 9; i++) {
          const t = i / 10, px = 128 + (x - 128) * t, py = 256 + (y - 256) * t;
          stroke([px, py, px + (x < 128 ? -23 : 23), py - 18], .65, "rgba(233,241,181,.40)", 158);
        }
      }
    } else {
      stroke([128, 0, 125, 86, 131, 172, 128, 256], 2.3, "rgba(246,248,197,.72)", 196);
      for (let i = 1; i <= 11; i++) for (const side of [-1, 1]) {
        const y = i * 21;
        stroke([128, y, 128 + side * 36, y + 2, 128 + side * 82, y + 24, 128 + side * 125, y + 37], .95, "rgba(233,242,175,.57)", 172);
        for (let j = 1; j < 7; j++) {
          const x = 128 + side * j * 18, start = y + j * 4;
          stroke([x, start, x + side * 6, start - 2, x + side * 13, start - 9, x + side * 19, start - 12], .4, "rgba(218,233,163,.36)", 149);
        }
      }
    }
    if (finish === "silver" || finish === "wax") for (let i = 0; i < 90; i++) {
      const x = random() * 256, y = random() * 256;
      ctx.fillStyle = finish === "silver" ? "rgba(211,233,218,.19)" : "rgba(210,228,230,.12)";
      ctx.beginPath(); ctx.ellipse(x, y, 2 + random() * 6, 1 + random() * 4, random() * 6, 0, Math.PI * 2); ctx.fill();
    }
  } else if (finish === "striped") {
    for (let i = 0; i < 12; i++) {
      const x = i * 23;
      stroke([x, -8, x + 15, 72, x - 15, 192, x, 264], 4 + i % 3, "rgba(76,111,35,.28)", 142);
      stroke([x + 6, -8, x + 21, 72, x - 9, 192, x + 6, 264], 1.4, "rgba(255,240,163,.35)", 154);
    }
  } else if (finish === "root") {
    for (let i = 0; i < 36; i++) {
      const y = i * 7.5, x = random() * 160;
      stroke([x, y, x + 35, y + 2, x + 60, y - 2, x + 96, y], .8, "rgba(111,62,30,.38)", 90);
    }
  } else if (finish === "paper") {
    for (let i = 0; i < 90; i++) {
      const x = i * 3;
      stroke([x, 0, x + 6, 80, x - 5, 174, x, 256], i % 5 ? .45 : 1.3, i % 5 ? "rgba(134,101,55,.22)" : "rgba(255,253,221,.68)", i % 5 ? 116 : 174);
    }
  } else if (finish === "net") {
    for (let i = -256; i < 512; i += 22) for (const side of [-1, 1]) {
      stroke([i, 0, i + side * 60 + 5, 80, i + side * 110 - 9, 174, i + side * 180, 256], 2.5, "rgba(253,239,187,.84)", 203);
      stroke([i + 3, 0, i + side * 60 + 8, 80, i + side * 110 - 6, 174, i + side * 180 + 3, 256], .6, "rgba(113,88,42,.42)", 100);
    }
  } else if (finish === "bloom") {
    const bloom = ctx.createLinearGradient(0, 0, 256, 256);
    bloom.addColorStop(0, "rgba(195,212,250,.40)"); bloom.addColorStop(.5, "rgba(245,247,255,.10)"); bloom.addColorStop(1, "rgba(83,89,167,.22)");
    ctx.fillStyle = bloom; ctx.fillRect(0, 0, 256, 256);
  }
  for (let i = 0; i < 4200; i++) {
    const x = random() * 256, y = random() * 256, bright = i % 3 === 0;
    ctx.fillStyle = bright ? "rgba(255,250,215,.14)" : "rgba(32,59,25,.10)";
    ctx.fillRect(x, y, .4 + random() * .9, .5 + random() * .9);
    height.fillStyle = bright ? "rgba(255,255,255,.11)" : "rgba(0,0,0,.09)";
    height.fillRect(x, y, 1, 1);
  }
  const normalCanvas = document.createElement("canvas"), roughCanvas = document.createElement("canvas");
  normalCanvas.width = normalCanvas.height = roughCanvas.width = roughCanvas.height = 512;
  const nc = normalCanvas.getContext("2d")!, rc = roughCanvas.getContext("2d")!;
  const pixels = height.getImageData(0, 0, 512, 512).data;
  const normal = nc.createImageData(512, 512), rough = rc.createImageData(512, 512);
  const read = (x: number, y: number) => pixels[((y + 512) % 512 * 512 + (x + 512) % 512) * 4] / 255;
  const baseRoughness = finish === "gloss" || finish === "berry" ? .43 : finish === "paper" || finish === "root" ? .88 : finish === "wax" || finish === "bloom" ? .76 : .66;
  for (let y = 0; y < 512; y++) for (let x = 0; x < 512; x++) {
    const n = new THREE.Vector3((read(x - 1, y) - read(x + 1, y)) * 4, (read(x, y + 1) - read(x, y - 1)) * 4, 1).normalize();
    const offset = (y * 512 + x) * 4, r = THREE.MathUtils.clamp(baseRoughness + (read(x, y) - .5) * .4, .25, .95) * 255;
    normal.data.set([(n.x * .5 + .5) * 255, (n.y * .5 + .5) * 255, (n.z * .5 + .5) * 255, 255], offset);
    rough.data.set([r, r, r, 255], offset);
  }
  nc.putImageData(normal, 0, 0); rc.putImageData(rough, 0, 0);
  const map = new THREE.CanvasTexture(canvas), normalMap = new THREE.CanvasTexture(normalCanvas), roughnessMap = new THREE.CanvasTexture(roughCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  for (const texture of [map, normalMap, roughnessMap]) {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping; texture.anisotropy = 4;
    texture.name = `${surface}-${finish}-${texture === map ? "pigment" : texture === normalMap ? "relief" : "roughness"}`;
  }
  return { map, normalMap, roughnessMap, normalScale: new THREE.Vector2(leaf ? .48 : .33, leaf ? .48 : .33) };
}

export function vegetableSurfaceMaps(surface: VegetableSurface, crop: string) {
  const finish = finishFor(surface, crop), key = `${surface}:${finish}`;
  let maps = cache.get(key);
  if (!maps) { maps = makeMaps(surface, finish); cache.set(key, maps); }
  return maps;
}
