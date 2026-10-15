type PixelContext = CanvasRenderingContext2D;
const ink = "#263c29", shade = "#356343", green = "#559947", light = "#91bc58", sun = "#c9d878";

function rect(c: PixelContext, color: string, x: number, y: number, w = 1, h = 1) {
  c.fillStyle = color;
  c.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
}

function oval(c: PixelContext, color: string, x: number, y: number, rx: number, ry: number) {
  for (let dy = -ry; dy <= ry; dy++) {
    const dx = Math.floor(rx * Math.sqrt(Math.max(0, 1 - dy * dy / (ry * ry))));
    rect(c, color, x - dx, y + dy, dx * 2 + 1);
  }
}

function line(c: PixelContext, color: string, x1: number, y1: number, x2: number, y2: number, width = 1) {
  const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
  for (let i = 0; i <= steps; i++) rect(c, color, x1 + (x2 - x1) * i / (steps || 1), y1 + (y2 - y1) * i / (steps || 1), width, width);
}

function leaf(c: PixelContext, x: number, y: number, direction: number, size = 7, red = false) {
  const dark = red ? "#673f4b" : ink, mid = red ? "#a15b68" : green;
  for (let i = 0; i < size; i++) {
    const w = Math.max(1, Math.round(Math.sin(i / size * Math.PI) * size * .43));
    rect(c, dark, x + direction * i - w, y - i, w * 2 + 2);
    if (w > 1) rect(c, mid, x + direction * i - w + 1, y - i, w * 2);
    rect(c, red ? "#d38882" : light, x + direction * i, y - i);
  }
}

function fruit(c: PixelContext, x: number, y: number, color: string, highlight: string, radius = 4) {
  oval(c, "#55362d", x, y, radius + 1, radius);
  oval(c, color, x, y - 1, radius, radius - 1);
  rect(c, highlight, x - 2, y - 3, 2, 2);
  rect(c, green, x - 1, y - radius, 3);
}

export function createCropSprite(crop: string, variety = "", variant = 0) {
  const canvas = document.createElement("canvas"); canvas.width = 40; canvas.height = 56;
  const c = canvas.getContext("2d")!;
  const name = crop.toLowerCase(), purple = /purple|garnet|black|rainbow/i.test(variety);
  oval(c, "#31493266", 21, 52, 14, 3);
  const rosette = (red = false, base = 48) => {
    for (const [x, y, d, s] of [[19, base, -1, 14], [20, base, 1, 15], [17, base + 1, -1, 10], [22, base + 1, 1, 10], [20, base - 2, 0, 17]]) leaf(c, x, y, d, s, red);
  };
  const bush = (height = 36, red = false) => {
    line(c, ink, 20, 51, 20, 51 - height, 3); line(c, shade, 20, 50, 20, 51 - height, 2);
    for (let i = 0; i < 5; i++) {
      const y = 47 - Math.round(i * height / 6), side = i % 2 ? 1 : -1;
      line(c, shade, 20, y + 2, 20 + side * 8, y - 2, 2);
      leaf(c, 20 + side * 5, y, side, 9, red); leaf(c, 20 - side * 2, y - 1, -side, 7, red);
    }
  };
  if (/asparagus/.test(name) && !/pea/.test(name)) {
    for (let i = 0; i < 5; i++) {
      const x = 9 + i * 5, top = 11 + (i * 7 + variant * 3) % 15;
      line(c, ink, x, 50, x + 2, top, 4); line(c, purple ? "#81608c" : green, x + 1, 49, x + 3, top + 2, 2);
      for (let y = top + 2; y < top + 12; y += 3) { rect(c, purple ? "#b399b5" : light, x + 1, y, 2, 2); rect(c, shade, x + 3, y + 1); }
      rect(c, ink, x + 2, top - 2, 2, 3); rect(c, light, x + 2, top - 1);
    }
  } else if (/tomato|pepper|capsicum|potato|eggplant|aubergine/.test(name)) {
    if (/tomato/.test(name)) { rect(c, "#72553d", 23, 8, 2, 45); rect(c, "#c19760", 23, 8); }
    bush(/potato/.test(name) ? 24 : 36);
    for (const [x, y] of [[11, 29], [27, 36], [16, 44], [26, 20]]) {
      if (/potato/.test(name)) { rect(c, "#c5a7d1", x, y, 4, 3); rect(c, "#eee3b3", x + 1, y); }
      else if (/pepper|capsicum/.test(name)) { oval(c, "#653b2f", x, y, 5, 6); for (let i = -1; i <= 1; i++) oval(c, variant % 2 ? "#e0ac42" : "#c95343", x + i * 2, y - 1, 2, 5); rect(c, "#f3bd7d", x - 2, y - 4, 1, 4); line(c, shade, x, y - 6, x + 1, y - 9, 2); }
      else fruit(c, x, y, purple ? "#81474e" : "#d6573f", purple ? "#bc7c72" : "#f59b64", 4);
    }
    rect(c, "#e9d279", 16, 18, 3, 3);
  } else if (/lettuce|cabbage|spinach|chard|kale|brussels/.test(name)) {
    if (/kale|brussels/.test(name)) {
      bush(30);
      for (let y = 29; y < 50; y += 5) { oval(c, shade, 18, y, 3, 3); rect(c, light, 17, y - 1, 2); }
    } else {
      rosette(purple);
      if (!/cos|loose|spinach|chard/i.test(variety + name)) {
        oval(c, purple ? "#573d62" : ink, 20, 38, 10, 10);
        oval(c, purple ? "#986080" : green, 20, 37, 9, 9);
        for (let i = 0; i < 4; i++) {
          line(c, purple ? "#c38d9d" : light, 13 + i * 3, 39, 17 + i * 2, 30);
          line(c, shade, 13 + i * 3, 40, 18 + i * 2, 43);
        }
      }
      if (/chard/.test(name)) for (let x = 15; x < 27; x += 5) line(c, "#c55d52", 20, 49, x, 34, 2);
    }
  } else if (/broccoli|cauliflower|artichoke/.test(name)) {
    rosette(false);
    line(c, shade, 20, 48, 20, 28, 3);
    if (/artichoke/.test(name)) {
      for (const [x, y] of [[20, 24], [10, 35], [29, 33]]) {
        oval(c, ink, x, y, 5, 7); oval(c, green, x, y - 1, 4, 6);
        for (let i = 0; i < 4; i++) { rect(c, light, x - 3 + i * 2, y - 4 + i % 2 * 3, 2, 3); rect(c, shade, x - 2 + i * 2, y + 2); }
      }
    } else {
      const cream = /cauliflower/.test(name);
      for (let i = 0; i < 9; i++) {
        const x = 11 + i % 3 * 8, y = 29 + Math.floor(i / 3) * 4 - (i % 3 === 1 ? 4 : 0);
        oval(c, cream ? "#837965" : ink, x, y, 5, 4); oval(c, cream ? "#e1dcb8" : shade, x, y - 1, 4, 3);
        rect(c, cream ? "#fff0ce" : light, x - 2, y - 3, 2, 2); rect(c, cream ? "#bcb796" : green, x + 1, y, 2);
      }
    }
  } else if (/carrot|beet|radish/.test(name)) {
    if (/carrot/.test(name)) {
      for (let y = 40; y < 53; y++) { const w = Math.max(1, 5 - Math.floor((y - 40) / 3)); rect(c, "#934b2e", 20 - w, y, w * 2); rect(c, "#e28c3c", 21 - w, y, w); }
      rect(c, "#ffbd65", 18, 41, 2, 4); line(c, "#697b37", 20, 42, 20, 27, 2);
      for (let i = 0; i < 5; i++) { leaf(c, 20, 35 - i * 3, -1, 6 + i % 2); leaf(c, 20, 36 - i * 3, 1, 6); }
    } else { fruit(c, 20, 46, /beet/.test(name) ? "#933e56" : "#dd6269", "#ef9a8e", 7); rect(c, "#ece0ba", 19, 49, 3, 5); rosette(/beet/.test(name), 41); }
  } else if (/pumpkin|melon|zucchini|courgette|cucumber/.test(name)) {
    const climbing = /cucumber/.test(name);
    if (climbing) bush(30); else rosette();
    line(c, shade, 8, 50, 33, 45, 2);
    const squash = /pumpkin/.test(name), cucumber = /cucumber|zucchini|courgette/.test(name);
    for (const [x, y] of climbing ? [[10, 28], [30, 40]] : [[10, 46], [30, 48]]) {
      if (cucumber) { oval(c, ink, x, y - 3, 4, 8); oval(c, shade, x, y - 4, 3, 7); rect(c, light, x - 1, y - 9, 1, 8); }
      else { fruit(c, x, y, squash ? "#d78339" : "#b0b061", squash ? "#f4b65b" : "#e0ce86", 7); for (let dx = -3; dx <= 3; dx += 3) line(c, squash ? "#a25c2f" : "#88945d", x + dx, y - 5, x + dx, y + 3); }
    }
    rect(c, "#f6d975", 28, 30, 4, 4); rect(c, "#cb9636", 29, 31, 2, 2);
  } else if (/bean|pea/.test(name)) {
    bush(/asparagus pea/.test(name) ? 21 : 37);
    if (/climb|runner/.test(variety)) { rect(c, "#916b43", 22, 7, 2, 43); line(c, light, 17, 48, 24, 15); }
    for (let i = 0; i < 4; i++) {
      const x = 10 + i % 2 * 18, y = 23 + i * 6;
      line(c, ink, x, y, x + 2, y + 9, 3); line(c, purple ? "#9b689f" : light, x, y + 1, x + 1, y + 8, 2);
      if (/pea/.test(name)) for (let z = 2; z < 9; z += 3) rect(c, green, x, y + z);
    }
    rect(c, /scarlet/.test(variety.toLowerCase()) ? "#e87562" : "#eee3c4", 23, 18, 3, 3);
  } else if (/corn|maize/.test(name)) {
    line(c, ink, 20, 52, 20, 8, 3); line(c, light, 20, 51, 20, 8);
    for (let i = 0; i < 4; i++) { leaf(c, 20, 43 - i * 7, i % 2 ? 1 : -1, 11); }
    line(c, "#e5c78b", 20, 10, 15, 4); line(c, "#e5c78b", 21, 10, 25, 3);
    oval(c, shade, 24, 32, 4, 7); rect(c, "#e3bd50", 23, 27, 3, 8); for (let y = 28; y < 35; y += 2) rect(c, "#f4df81", 24, y);
  } else if (/onion|garlic|leek|chives/.test(name + variety)) {
    oval(c, "#7c664d", 20, 47, 7, 6); oval(c, /leek/.test(name) ? "#d5ddd1" : "#dec591", 20, 46, 6, 5);
    if (/garlic/.test(name)) for (let x = 16; x <= 24; x += 4) { oval(c, "#ece4c4", x, 47, 3, 4); rect(c, "#ac9d7a", x + 2, 46, 1, 4); }
    if (/leek/.test(name)) { rect(c, "#879b82", 17, 33, 7, 17); rect(c, "#e0e7c8", 18, 35, 5, 16); rect(c, "#f8efd1", 19, 41, 2, 10); }
    for (let i = 0; i < 6; i++) { line(c, ink, 17 + i, 42, 8 + i * 5, 18 + i % 3 * 4, 3); line(c, i % 2 ? light : green, 18 + i, 42, 9 + i * 5, 18 + i % 3 * 4); }
    rect(c, "#fff0cb", 17, 44, 2, 3);
  } else if (/raspberry|blackberry|blueberry|strawberry/.test(name)) {
    const strawberry = /strawberry/.test(name);
    if (strawberry) rosette(false); else bush(34);
    for (const [x, y] of strawberry ? [[10, 43], [28, 40], [26, 48], [14, 49]] : [[10, 34], [28, 28], [26, 44], [14, 46]]) {
      const blue = /blueberry/.test(name), dark = /blackberry/.test(name);
      oval(c, blue ? "#293c61" : dark ? "#493746" : "#793a3c", x, y, 4, 5);
      for (let i = 0; i < 8; i++) rect(c, blue ? i % 2 ? "#8299b9" : "#56709e" : dark ? "#a285a1" : i % 2 ? "#ed8b77" : "#c95159", x - 3 + i % 3 * 2, y - 3 + Math.floor(i / 3) * 2, 2, 2);
      rect(c, light, x - 2, y - 5, 4);
    }
  } else if (/amaranth/.test(name)) {
    bush(34, purple);
    for (let i = 0; i < 3; i++) { const x = 12 + i * 8, y = 16 + i % 2 * 5; line(c, shade, x, 42, x, y); for (let j = 0; j < 12; j++) rect(c, purple ? j % 2 ? "#c68486" : "#8e465c" : j % 2 ? sun : green, x - j % 3, y + j, 3 + j % 2, 2); }
  } else {
    rosette(false);
    if (!/herb|basil|thyme|parsley|angelica|anise|akeake/.test(name + variety)) {
      for (let i = 0; i < 4; i++) { const x = 9 + i * 7, y = 22 + i % 2 * 8; line(c, shade, x, 46, x, y + 3); oval(c, /agastache|hyssop/.test(name) ? "#a483bb" : "#e8c979", x, y, 3, 3); rect(c, "#f8e9b1", x, y, 2, 2); }
    }
  }
  return canvas;
}

export function createPixelTile(kind: "grass" | "soil" | "path", seed = 0) {
  const canvas = document.createElement("canvas"); canvas.width = canvas.height = 32;
  const c = canvas.getContext("2d")!;
  rect(c, kind === "grass" ? "#819c55" : kind === "soil" ? "#91603f" : "#d4b889", 0, 0, 32, 32);
  for (let i = 0; i < 35; i++) {
    const x = (i * 13 + seed * 7) % 31, y = (i * 19 + seed * 11) % 30;
    if (kind === "grass") { rect(c, i % 2 ? "#73944c" : "#94ab62", x, y, 2); if (i % 5 === 0) { rect(c, "#547b42", x, y + 1, 1, 3); rect(c, "#b2bb6c", x + 1, y, 1, 2); } }
    else rect(c, kind === "soil" ? i % 2 ? "#aa7550" : "#794d38" : i % 2 ? "#e3ca9a" : "#ba9b70", x, y, i % 3 + 1);
  }
  if (kind === "soil") { rect(c, "#734b36", 0, 30, 32, 2); rect(c, "#ac7950", 0, 0, 32); }
  return canvas;
}

export function createPixelTree(variant = 0) {
  const canvas = document.createElement("canvas"); canvas.width = 72; canvas.height = 96;
  const c = canvas.getContext("2d")!;
  oval(c, "#314d3666", 37, 89, 29, 6);
  rect(c, "#503d2e", 31, 45, 11, 43); rect(c, "#9a7046", 33, 45, 5, 42); rect(c, "#c69c63", 33, 61, 2, 21);
  line(c, "#674b32", 34, 66, 20, 48, 4); line(c, "#674b32", 38, 62, 50, 43, 4);
  for (const [x, y, r] of [[19, 47, 16], [51, 43, 17], [34, 29, 26], [21, 28, 17], [48, 24, 16], [35, 13, 13]]) {
    oval(c, ink, x, y, r, r * .72 | 0); oval(c, variant % 2 ? "#426e4e" : "#476f3f", x, y - 2, r - 2, r * .72 - 2 | 0);
    for (let i = 0; i < 25; i++) { const dx = (i * 7) % (r * 2) - r, dy = (i * 11) % r - r * .7; if (dx * dx + dy * dy < (r - 3) ** 2) rect(c, i % 3 ? "#688e4b" : "#8fa85c", x + dx, y + dy, 3, 2); }
  }
  return canvas;
}

export function createPixelStructure(kind: string) {
  const canvas = document.createElement("canvas"); canvas.width = 80; canvas.height = 80;
  const c = canvas.getContext("2d")!;
  oval(c, "#31493266", 42, 72, 33, 6);
  if (/hoop|tunnel|arch|net|cloche|cloth|shade/.test(kind)) {
    const covered = /tunnel|net|cloche|cloth|shade/.test(kind);
    for (let i = 3; i >= 0; i--) {
      const y = 64 - i * 9;
      if (covered) { oval(c, /shade/.test(kind) ? "#55736988" : "#b7d5bf88", 40, y - 10, 26, 22); rect(c, "#789b8566", 14, y - 10, 53, 14); }
      for (let x = -26; x <= 26; x++) { const h = Math.round(Math.sqrt(1 - x * x / (26 * 26)) * 27); rect(c, "#354c45", 40 + x, y - h, 2, 2); rect(c, "#b6c9ad", 40 + x, y - h - 1); }
      rect(c, "#354c45", 14, y - 3, 2, 7); rect(c, "#354c45", 65, y - 3, 2, 7);
    }
    if (/bean|cucumber/.test(kind)) for (let i = 0; i < 8; i++) leaf(c, i % 2 ? 64 : 15, 61 - i * 4, i % 2 ? -1 : 1, 6);
    if (/net/.test(kind)) for (let y = 22; y < 62; y += 5) line(c, "#759988", 19, y, 61, y);
  } else if (/greenhouse|cold-frame/.test(kind)) {
    rect(c, "#37544c", 11, 30, 58, 37); rect(c, "#9ebfa8", 14, 32, 52, 31);
    for (let y = 14; y <= 30; y++) rect(c, y % 2 ? "#b7d0b3" : "#8aa893", 40 - (y - 13) * 2, y, (y - 13) * 4);
    for (const x of [14, 31, 49, 65]) { rect(c, "#435e50", x, 31, 2, 33); rect(c, "#e5dbb3", x + 2, 34, 1, 28); }
    rect(c, "#dbe1bc", 15, 45, 51, 2); rect(c, "#486754", 34, 47, 13, 19); rect(c, "#a9c3a2", 36, 48, 9, 15);
  } else if (/tank|barrel/.test(kind) && !/half/.test(kind)) {
    rect(c, "#4e6664", 17, 29, 47, 33); oval(c, "#38524f", 40, 61, 23, 7); oval(c, "#8ba39a", 40, 27, 24, 9);
    rect(c, "#a9beb0", 22, 33, 3, 24); rect(c, "#364c46", 17, 43, 47, 2); rect(c, "#d3ba79", 53, 60, 10, 3);
  } else if (/pot|bag|planter|bed|barrel|tray|compost|beehive|bench/.test(kind)) {
    const hive = /beehive/.test(kind);
    rect(c, "#543b2b", 13, 39, 55, 28); rect(c, hive ? "#d0a34f" : "#a37449", 15, 41, 51, 24);
    for (let y = 44; y < 64; y += 6) rect(c, "#755232", 15, y, 51, 2);
    rect(c, "#ddbb80", 11, 36, 59, 4); rect(c, hive ? "#e8cd83" : "#65452e", 16, 29, 48, 8);
    if (hive) { rect(c, "#4b382c", 31, 61, 18, 3); rect(c, "#f0dca0", 11, 26, 59, 4); }
    else if (!/bench/.test(kind)) for (let i = 0; i < 4; i++) leaf(c, 22 + i * 12, 35, i % 2 ? 1 : -1, 7);
    else { rect(c, "#536b47", 23, 24, 8, 10); rect(c, "#c39658", 47, 21, 9, 13); }
    if (/pot|bag|round/.test(kind)) { rect(c, "#819c55", 13, 59, 5, 8); rect(c, "#819c55", 62, 59, 6, 8); }
  } else if (/pergola|frame|trellis/.test(kind)) {
    for (const x of [14, 60]) { rect(c, "#57402d", x, 17, 5, 50); rect(c, "#c79860", x, 17, 2, 46); }
    for (let y = 22; y < 54; y += 8) rect(c, "#b38a56", 18, y, 43, 2);
    rect(c, "#765338", 10, 14, 61, 6); rect(c, "#d1af74", 10, 13, 61, 2);
  } else {
    rect(c, "#533d2c", 11, 31, 57, 38); rect(c, "#b58c5d", 13, 31, 53, 35);
    for (let x = 17; x < 66; x += 7) rect(c, "#916a45", x, 33, 1, 31);
    for (let y = 11; y < 33; y++) { const w = 13 + (y - 11) * 2; rect(c, "#663d36", 40 - w, y, w * 2); rect(c, y % 4 === 0 ? "#b87556" : "#955d48", 41 - w, y, w * 2 - 2); }
    rect(c, "#513b2f", 24, 43, 17, 26); rect(c, "#805b3f", 26, 44, 13, 23); rect(c, "#e3bd78", 35, 57, 2, 2);
    rect(c, "#533f31", 47, 43, 13, 12); rect(c, "#aec5b4", 49, 45, 9, 8); rect(c, "#e4d7b5", 53, 45, 1, 8);
    if (/coop/.test(kind)) { rect(c, "#d2b686", 21, 69, 22, 3); for (let y = 70; y < 79; y += 3) rect(c, "#91704f", 23, y, 16, 2); }
  }
  return canvas;
}
