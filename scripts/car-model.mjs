// Builds public/models/lustro-car.glb (about 1.1 MB, 0.76 MB gzipped) from the Khronos "Car Concept"
// sample (CC BY 4.0, after "Free Concept Car 004" by Unity Fan, CC0):
// https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/CarConcept
//
// The tools aren't project dependencies; install them in a scratch folder and run from there:
//   npm i @gltf-transform/core@4 @gltf-transform/extensions@4 @gltf-transform/functions@4 meshoptimizer sharp
//   node car-model.mjs CarConcept.glb lustro-car.glb
//
// Logos (Khronos, 3D Commerce) and the plate are removed: the licence excludes them. Body panels
// keep every vertex (the reflections show any simplification); hidden parts go, the rest is simplified.
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

// hidden from every camera angle, or a logo
for (const n of root.listNodes())
  if (/License|Pedal|Floormats|HoodInterior|HoodUnder|Engine|SteeringHandle|SteeringEmblem|InteriorCage|InteriorFloor|BodyUnderside$/.test(n.getName()) && !n.listChildren().length) n.dispose();
for (const m of root.listMaterials()) {
  if (/Interior|Floormat|Panel Sides|Dashboard|Hardware|^$/.test(m.getName())) m.setOcclusionTexture(null);
  // the emissive textures are the logos
  m.setEmissiveTexture(null);
  if (!/light/i.test(m.getName())) m.setEmissiveFactor([0, 0, 0]);
  // the tyre wall texture carries logos too
  if (m.getName() === "Tireside") {
    m.setBaseColorTexture(null);
    m.setNormalTexture(null);
    m.setBaseColorFactor([0.035, 0.035, 0.035, 1]);
  }
  // the interior sits behind tinted glass
  if (/Interior|Floormat|Panel Sides/.test(m.getName())) m.setNormalTexture(null);
}
// colour variants and costly extensions: the scene gives paint and glass its own materials
for (const name of ["KHR_materials_variants", "KHR_materials_transmission", "KHR_materials_iridescence", "KHR_materials_emissive_strength"])
  root.listExtensionsUsed().find((e) => e.extensionName === name)?.dispose();
// three derives tangents
for (const mesh of root.listMeshes()) for (const p of mesh.listPrimitives()) p.setAttribute("TANGENT", null);

/** Simplify the meshes of nodes whose name matches. */
const simplifyNodes = (test, ratio, error) => (d) => {
  const seen = new Set();
  for (const n of d.getRoot().listNodes()) {
    const m = n.getMesh();
    if (!m || seen.has(m) || !test(n.getName())) continue;
    seen.add(m);
    for (const p of m.listPrimitives()) simplifyPrimitive(p, { simplifier: MeshoptSimplifier, ratio, error });
  }
};
/** Drop UV sets no texture reads. */
const dropUnusedUvs = (d) => {
  for (const mesh of d.getRoot().listMeshes())
    for (const p of mesh.listPrimitives()) {
      const m = p.getMaterial();
      const uses = new Set();
      if (m)
        for (const [tex, info] of [
          [m.getBaseColorTexture(), m.getBaseColorTextureInfo()],
          [m.getNormalTexture(), m.getNormalTextureInfo()],
          [m.getMetallicRoughnessTexture(), m.getMetallicRoughnessTextureInfo()],
          [m.getOcclusionTexture(), m.getOcclusionTextureInfo()],
        ])
          if (tex && info) uses.add(info.getTexCoord());
      if (!uses.has(0) && !uses.has(1)) p.setAttribute("TEXCOORD_0", null);
      if (!uses.has(1)) p.setAttribute("TEXCOORD_1", null);
    }
};

await doc.transform(
  prune(),
  dropUnusedUvs,
  dedup(),
  weld(),
  simplifyNodes((n) => !/^Body(?!Windshield)/.test(n), 0.55, 0.0006),
  simplifyNodes((n) => /Wiper/.test(n), 0.06, 0.01),
  simplifyNodes((n) => /Interior|BrakePad|Gasket|Handle01|Axles/.test(n), 0.2, 0.004),
  simplifyNodes((n) => /Rim/.test(n), 0.3, 0.003),
  prune(),
  textureCompress({ encoder: sharp, targetFormat: "webp", resize: [512, 512], quality: 80 }),
  quantize({ quantizePosition: 14, quantizeNormal: 12, quantizeTexcoord: 12 }),
  meshopt({ encoder: MeshoptEncoder, level: "high" }),
);
await io.write(out, doc);
