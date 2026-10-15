import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";

const root = path.resolve(import.meta.dirname, "..");
const source = fs.readFileSync(path.join(root, "public/models/tomato/index.html"), "utf8");
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL });
try {
  for (const [name, rows, cols, sphere, fruit] of [
    ["refined", 24, 4, [14, 10], [32, 22]],
    ["garden", 18, 4, [6, 4], [20, 14]],
    ["mobile", 10, 2, [5, 3], [12, 8]],
  ]) {
    const html = source.replace("rows=28,cols=6", `rows=${rows},cols=${cols}`)
      .replace("SphereGeometry(1,14,10)", `SphereGeometry(1,${sphere.join(",")})`)
      .replace("SphereGeometry(1,32,22)", `SphereGeometry(1,${fruit.join(",")})`)
      .replaceAll("TubeGeometry(curve,seg,", name === "refined" ? "TubeGeometry(curve,seg," : "TubeGeometry(curve,Math.max(2,Math.round(seg*.55)),")
      .replaceAll(",8,false)", name === "refined" ? ",8,false)" : ",5,false)");
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.route("http://tomato.local/**", route => {
      const pathname = new URL(route.request().url()).pathname;
      if (pathname.endsWith("/index.html")) return route.fulfill({ contentType: "text/html", body: html });
      const filename = path.join(root, "public", pathname);
      return route.fulfill({ contentType: "application/javascript", body: fs.readFileSync(filename) });
    });
    await page.goto("http://tomato.local/models/tomato/index.html");
    await page.waitForFunction(() => window.frameModel?.ready);
    const encoded = await page.evaluate(() => window.frameModel.export());
    const buffer = Buffer.from(encoded, "base64");
    const report = await page.evaluate(async encoded => window.frameModel.validate(Uint8Array.from(atob(encoded), c => c.charCodeAt(0)).buffer), encoded);
    if (errors.length || Math.abs(report.min[1]) > .0001 || !report.triangles) throw new Error(JSON.stringify({ errors, report }));
    fs.writeFileSync(path.join(root, `public/models/tomato/tomato-${name}.glb`), buffer);
    console.log(JSON.stringify({ name, bytes: buffer.length, ...report }));
    await page.close();
  }
} finally {
  await browser.close();
}
