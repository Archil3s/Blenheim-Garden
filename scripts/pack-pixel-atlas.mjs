import sharp from "sharp";

const [source, destination, columnArg, rowArg, rowBoundsArg, cellWidthArg] = process.argv.slice(2);
if (!source || !destination || !columnArg || !rowArg) throw new Error("Usage: node scripts/pack-pixel-atlas.mjs source.png output.webp columns rows");
const columns = Number(columnArg), rows = Number(rowArg);
if (!Number.isInteger(columns) || !Number.isInteger(rows) || columns < 1 || rows < 1) throw new Error("Invalid atlas grid");
const metadata = await sharp(source).metadata();
if (!metadata.hasAlpha) throw new Error("Sprite atlas must have transparency");
const rowBounds = rowBoundsArg ? rowBoundsArg.split(",").map(Number) : Array.from({ length: rows + 1 }, (_, row) => Math.round(row * metadata.height / rows));
if (rowBounds.length !== rows + 1 || rowBounds[0] !== 0 || rowBounds[rows] !== metadata.height || rowBounds.some((value, index) => !Number.isInteger(value) || (index > 0 && value <= rowBounds[index - 1]))) throw new Error("Invalid source row boundaries");
const cellWidth = Number(cellWidthArg ?? 128), cellHeight = cellWidth * 1.25, composites = [];
if (!Number.isInteger(cellWidth) || !Number.isInteger(cellHeight) || cellWidth < 32) throw new Error("Invalid sprite cell size");
for (let row = 0; row < rows; row++) for (let column = 0; column < columns; column++) {
  const left = Math.round(column * metadata.width / columns), top = rowBounds[row];
  const width = Math.round((column + 1) * metadata.width / columns) - left, height = rowBounds[row + 1] - top;
  const cell = await sharp(source).extract({ left, top, width, height }).png().toBuffer();
  // Isolate the main sprite's bounds so neighbouring row fragments stay out.
  const { data } = await sharp(cell).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const visited = new Uint8Array(width * height);
  let largest = { count: 0, left: 0, top: 0, right: width - 1, bottom: height - 1 };
  for (let pixel = 0; pixel < visited.length; pixel++) {
    if (visited[pixel] || data[pixel * 4 + 3] < 32) continue;
    const queue = [pixel], region = { count: 0, left: width, top: height, right: 0, bottom: 0 }; visited[pixel] = 1;
    for (let cursor = 0; cursor < queue.length; cursor++) {
      const index = queue[cursor], x = index % width, y = Math.floor(index / width);
      region.count++; region.left = Math.min(region.left, x); region.top = Math.min(region.top, y); region.right = Math.max(region.right, x); region.bottom = Math.max(region.bottom, y);
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
        const nx = x + dx, ny = y + dy, next = ny * width + nx;
        if (nx >= 0 && nx < width && ny >= 0 && ny < height && !visited[next] && data[next * 4 + 3] >= 32) { visited[next] = 1; queue.push(next); }
      }
    }
    if (region.count > largest.count) largest = region;
  }
  if (!largest.count) throw new Error(`Empty sprite at ${column},${row}`);
  const bounds = { left: largest.left, top: largest.top, width: largest.right - largest.left + 1, height: largest.bottom - largest.top + 1 };
  const input = await sharp(cell).extract(bounds).resize({ width: cellWidth - 16, height: cellHeight - 24, fit: "inside", kernel: "nearest", withoutEnlargement: true }).png().toBuffer();
  const sprite = await sharp(input).metadata();
  composites.push({ input, left: column * cellWidth + Math.floor((cellWidth - sprite.width) / 2), top: row * cellHeight + cellHeight - 8 - sprite.height });
}
await sharp({ create: { width: columns * cellWidth, height: rows * cellHeight, channels: 4, background: "#00000000" } }).composite(composites).webp({ lossless: true }).toFile(destination);
console.log(`Packed ${columns * rows} sprites into ${destination}`);
