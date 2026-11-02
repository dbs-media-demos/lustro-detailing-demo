// One "studio at night" grade for every photo: cooler, deeper blacks, a little less colour,
// so photos from different photographers read as one shoot. Output goes to src/assets/photos
// (statically imported: next/image gets width, height and a blur placeholder for free).
//
//   node scripts/grade.mjs            (reads scripts/raw/*.jpg, downloaded from photos.txt)
import sharp from "sharp";
import { readdir, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const rawDir = path.join(root, "scripts/raw");
const outDir = path.join(root, "src/assets/photos");
await mkdir(outDir, { recursive: true });

// Colour that carries the story (tan leather, red pad, blue beads) keeps more saturation.
const KEEP_COLOUR = new Set(["interior-tan", "polish-pad", "beads-hood", "beads-macro", "reflection", "interior-brush"]);

for (const file of (await readdir(rawDir)).filter((f) => f.endsWith(".jpg"))) {
  const slug = file.replace(/\.jpg$/, "");
  await sharp(path.join(rawDir, file))
    .rotate()
    .resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true })
    .modulate({ saturation: KEEP_COLOUR.has(slug) ? 0.85 : 0.55 })
    // Cool the shadows a touch (blue up, red down) and push contrast for that wet-paint depth.
    .recomb([
      [0.97, 0.02, 0.0],
      [0.0, 1.0, 0.02],
      [0.0, 0.03, 1.04],
    ])
    .linear(1.08, -8)
    .jpeg({ quality: 80, mozjpeg: true, progressive: true })
    .toFile(path.join(outDir, `${slug}.jpg`));
}

const rows = (await readFile(path.join(root, "scripts/photos.txt"), "utf8")).trim().split("\n").map((l) => l.trim().split("|"));
const md = [
  "# Photo sources",
  "",
  "All photos are from Unsplash under the Unsplash License (free for commercial use, no attribution required; credited here anyway).",
  "Each one is re-graded by `scripts/grade.mjs` into `src/assets/photos/`.",
  "",
  "| File | Source | Photographer |",
  "|---|---|---|",
  ...rows.map(([slug, , page, user]) => `| ${slug}.jpg | https://unsplash.com/photos/${page} | ${user} |`),
  "",
];
await writeFile(path.join(root, "src/assets/photos/SOURCES.md"), md.join("\n"));
console.log(`graded ${rows.length} photos`);
