// Renders the hero stills from the live 3D scene (src/components/fx/car3d/StudioScene.ts), so the
// still in the server HTML, the phone hero and the canvas that fades in over it are the same frame:
//   src/assets/photos/studio-car.jpg        2400 x 1500, desktop framing (DESKTOP_FRAME)
//   src/assets/photos/studio-car-phone.jpg  1080 x 864, phone framing (PHONE_FRAME)
// Run again after changing the scene, a pose or a frame.
//
// Needs esbuild and playwright (with a Chromium) somewhere node can resolve them, e.g. a scratch folder:
//   npm i esbuild playwright sharp && npx playwright install chromium
//   NODE_PATH=<scratch>/node_modules node scripts/car-stills.mjs
// It bundles the scene, serves it to Chromium from memory (no server), and uses the real GPU.
import { createRequire } from "module";
import fs from "fs";
import path from "path";

const require = createRequire(path.join(process.env.NODE_PATH ?? process.cwd(), "x.js"));
const esbuild = require("esbuild");
const { chromium } = require("playwright");
const sharp = require("sharp");
const ROOT = process.cwd();

const entry = `
import { createStudio } from "${path.join(ROOT, "src/components/fx/car3d/StudioScene.ts").replace(/\\/g, "/")}";
window.snap = async (view, w, h) => {
  const c = document.getElementById("c");
  c.style.width = w + "px"; c.style.height = h + "px"; c.width = w; c.height = h;
  const s = window.S ?? (window.S = await createStudio(c, { model: "/models/lustro-car.glb" }));
  s.resize(); s.still(view);
  return c.toDataURL("image/png");
};`;
const { outputFiles } = await esbuild.build({
  stdin: { contents: entry, resolveDir: ROOT, loader: "ts" },
  bundle: true,
  write: false,
  format: "iife",
  nodePaths: [path.join(ROOT, "node_modules")],
});

// CHROMIUM=<path to chrome> uses an existing browser instead of the one playwright installs
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined, args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.route("http://stills.local/**", (r) => {
  const u = new URL(r.request().url()).pathname;
  if (u === "/") return r.fulfill({ contentType: "text/html", body: `<body style="margin:0"><canvas id="c"></canvas><script src="/b.js"></script>` });
  if (u === "/b.js") return r.fulfill({ contentType: "text/javascript", body: outputFiles[0].text });
  return r.fulfill({ body: fs.readFileSync(path.join(ROOT, "public", u)) });
});
await page.goto("http://stills.local/");
for (const [view, w, h, file, width] of [
  ["desktop", 2400, 1500, "studio-car.jpg", 2400],
  ["phone", 1200, 960, "studio-car-phone.jpg", 1080],
]) {
  const url = await page.evaluate(([v, w, h]) => window.snap(v, w, h), [view, w, h]);
  await sharp(Buffer.from(url.split(",")[1], "base64")).resize(width).jpeg({ quality: 90, mozjpeg: true }).toFile(path.join(ROOT, "src/assets/photos", file));
  console.log(file);
}
await browser.close();
