// Renders the paint mask for the /v2 hero (src/components/home/PaintCheck.tsx) from the live 3D scene,
// in exactly the framing of the desktop still (studio-car-gloss.jpg, DESKTOP_FRAME), so the 2D swirl light
// only ever lands on the car's paint:
//   public/hero/paint-mask.webp   1200 x 750, white, alpha = paint × how squarely it faces the camera
// Run again with car-stills.mjs whenever a pose, a frame or the model changes.
//
// Needs playwright somewhere node can resolve it (no bundler: three is served from node_modules
// through an import map and the scene is transpiled with the project's own TypeScript):
//   NODE_PATH=<scratch>/node_modules node scripts/paint-mask.mjs
import { createRequire } from "module";
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const require = createRequire(path.join(process.env.NODE_PATH ?? process.cwd(), "x.js"));
const local = createRequire(path.join(ROOT, "x.js"));
const { chromium } = require("playwright");
const ts = local("typescript");
const sharp = local("sharp");

const scene = ts.transpileModule(fs.readFileSync(path.join(ROOT, "src/components/fx/car3d/StudioScene.ts"), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;

const page_ = `<!doctype html><body style="margin:0;background:#000">
<script type="importmap">{"imports":{"three":"/nm/three/build/three.module.js","three/":"/nm/three/"}}</script>
<canvas id="c"></canvas>
<script type="module">
import * as THREE from "three";
import { createStudio } from "/scene.js";
// the scene keeps its own scene and camera: catch them on the way into render()
let last = null;
const hook = THREE.Scene.prototype.onBeforeRender;
THREE.Scene.prototype.onBeforeRender = function (r, s, c, rt) { if (!rt && c && c.isPerspectiveCamera) last = { r, s, c }; return hook.apply(this, arguments); };
window.mask = async (w, h) => {
  const cv = document.getElementById("c");
  cv.style.width = w + "px"; cv.style.height = h + "px"; cv.width = w; cv.height = h;
  const st = await createStudio(cv, { model: "/models/lustro-930.glb" });
  st.resize(); st.still("desktop", true);
  const { r, s, c } = last;
  // paint: white, fading where the panel turns away (the light can't sit on an edge); the rest black
  const paint = new THREE.ShaderMaterial({
    vertexShader: "varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix * normal); vV = -mv.xyz; gl_Position = projectionMatrix * mv; }",
    fragmentShader: "varying vec3 vN; varying vec3 vV; void main(){ float f = abs(dot(normalize(vN), normalize(vV))); gl_FragColor = vec4(vec3(smoothstep(0.08, 0.5, f)), 1.0); }",
  });
  const black = new THREE.MeshBasicMaterial({ color: 0 });
  s.background = new THREE.Color(0);
  s.traverse((o) => {
    if (!o.isMesh) return;
    const m = o.material;
    const isPaint = !!m?.userData?.paint;
    // the floor, shadows and the room never count
    o.material = isPaint ? paint : black;
  });
  r.toneMapping = THREE.NoToneMapping;
  r.outputColorSpace = THREE.LinearSRGBColorSpace;
  r.setClearColor(0, 1);
  r.render(s, c);
  return cv.toDataURL("image/png");
};
window.ready = true;
</script>`;

const browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on("console", (m) => m.type() === "error" && console.error(m.text()));
page.on("pageerror", (e) => console.error(e));
await page.route("http://mask.local/**", (r) => {
  const u = new URL(r.request().url()).pathname;
  if (u === "/") return r.fulfill({ contentType: "text/html", body: page_ });
  if (u === "/scene.js") return r.fulfill({ contentType: "text/javascript", body: scene });
  if (u.startsWith("/nm/")) return r.fulfill({ contentType: "text/javascript", body: fs.readFileSync(path.join(ROOT, "node_modules", u.slice(4))) });
  return r.fulfill({ body: fs.readFileSync(path.join(ROOT, "public", u)) });
});
await page.goto("http://mask.local/");
await page.waitForFunction(() => window.ready);
const url = await page.evaluate(() => window.mask(2400, 1500));
await browser.close();

// grey → alpha on white, a touch of blur so the edges never cut hard
const grey = await sharp(Buffer.from(url.split(",")[1], "base64")).resize(1200, 750).greyscale().blur(1.2).extractChannel(0).raw().toBuffer();
fs.mkdirSync(path.join(ROOT, "public/hero"), { recursive: true });
await sharp(Buffer.alloc(1200 * 750 * 3, 255), { raw: { width: 1200, height: 750, channels: 3 } })
  .joinChannel(grey, { raw: { width: 1200, height: 750, channels: 1 } })
  .webp({ quality: 80, alphaQuality: 70 })
  .toFile(path.join(ROOT, "public/hero/paint-mask.webp"));
// a preview of what got masked, for checking by eye (not shipped)
await sharp(grey, { raw: { width: 1200, height: 750, channels: 1 } }).png().toFile(path.join(process.env.TEMP ?? "/tmp", "paint-mask-preview.png"));
console.log("public/hero/paint-mask.webp");
