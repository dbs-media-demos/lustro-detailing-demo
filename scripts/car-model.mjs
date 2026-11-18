// Builds public/models/lustro-930.glb (1.37 MB, about 1 MB gzipped, 130k triangles) from "FREE 1975 Porsche 911 (930) Turbo" by
// Karol Miklas (Lionsharp Studios), CC BY 4.0, commercial use allowed with credit:
//   https://sketchfab.com/3d-models/free-1975-porsche-911-930-turbo-8568d9d14a994b9cae59499f0dbed21e
// (the Sketchfab glTF export; its asset.extras carry the author, licence and source above)
//
// The tools aren't project dependencies; install them in a scratch folder and run from there:
//   npm i @gltf-transform/core@4 @gltf-transform/extensions@4 @gltf-transform/functions@4 meshoptimizer sharp
//   node car-model.mjs scene.gltf lustro-930.glb
//
// Removed: every sticker (the carmaker's crest, dealer and author stickers), both number plates, the
// air freshener, the baked ground shadow with its signature (the scene bakes its own shadow), the
// transparent "coat" shell over the body (the scene gives the paint its own clearcoat), and the
// lettering on the tyre walls. Textures 512 px WebP; the body keeps every vertex
// (the reflections show any simplification), the interior is simplified; meshopt-compressed.
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { simplifyPrimitive, prune, dedup, weld, quantize, meshopt, textureCompress } from "@gltf-transform/functions";
import { MeshoptSimplifier, MeshoptEncoder } from "meshoptimizer";
import sharp from "sharp";

const [, , src, out] = process.argv;
await MeshoptSimplifier.ready;
await MeshoptEncoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ "meshopt.encoder": MeshoptEncoder });
const doc = await io.read(src);
const root = doc.getRoot();

const DROP = /^(930_stickers|plate|930_wunderbaum|material_0|coat)$/;
for (const n of root.listNodes()) {
  const m = n.getMesh();
  if (m && m.listPrimitives().every((p) => DROP.test(p.getMaterial()?.getName() ?? ""))) n.dispose();
}
for (const m of root.listMaterials()) {
  const name = m.getName();
  // the tyre wall carries the tyre maker's lettering: plain rubber, the tread stays in the normal map
  if (name === "930_tire") {
    m.setBaseColorTexture(null);
    m.setBaseColorFactor([0.03, 0.03, 0.03, 1]);
  }
  // the scene gives paint and glass their own materials
  if (name === "paint") m.setMetallicRoughnessTexture(null);
  if (name === "glass") {
    m.setBaseColorTexture(null);
    m.setMetallicRoughnessTexture(null);
  }
}
// costly extensions: the lamp lenses become plain transparent glass
for (const name of ["KHR_materials_transmission", "KHR_materials_variants"]) root.listExtensionsUsed().find((e) => e.extensionName === name)?.dispose();
// three derives tangents
for (const mesh of root.listMeshes()) for (const p of mesh.listPrimitives()) p.setAttribute("TANGENT", null);

/** Simplify the primitives whose material matches. */
const simplifyBy = (test, ratio, error) => (d) => {
  for (const mesh of d.getRoot().listMeshes())
    for (const p of mesh.listPrimitives()) if (test(p.getMaterial()?.getName() ?? "")) simplifyPrimitive(p, { simplifier: MeshoptSimplifier, ratio, error });
};

await doc.transform(
  prune(),
  dedup(),
  weld(),
  // the cabin sits behind tinted glass
  simplifyBy((m) => m === "930_plastics", 0.35, 0.002),
  simplifyBy((m) => /930_chromes|black/.test(m), 0.6, 0.0008),
  simplifyBy((m) => /930_rim|930_tire/.test(m), 0.6, 0.0006),
  prune(),
  // seen at hero size, 512 px is plenty (about 330 KB of textures in all)
  textureCompress({ encoder: sharp, targetFormat: "webp", resize: [512, 512], quality: 80 }),
  quantize({ quantizePosition: 14, quantizeNormal: 12, quantizeTexcoord: 12 }),
  meshopt({ encoder: MeshoptEncoder, level: "high" }),
);
await io.write(out, doc);
