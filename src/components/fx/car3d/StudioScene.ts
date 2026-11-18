import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

/**
 * Hero centrepiece (desktop only, loaded behind the 3D gate in Hero.tsx).
 *
 * A gloss-black 1975 Porsche 911 Turbo on a slow turntable in a dark detail studio: a big overhead
 * softbox and two long side strips live in the reflections, soft contact shadows hold it to the
 * turntable. Across the body runs a strip of volt masking tape, the 50/50 every detailer shoots: in
 * front of it the paint is corrected (mirror gloss), behind it the paint is as it came in (a milky
 * haze, softer reflections, and swirl marks: fine arcs that light up wherever a softbox is reflected).
 *
 * On arrival the turntable spins up and the polish line advances over the door; scroll
 * (`setProgress`, 0 → 1) carries it to the tail while the camera glides in and down, so the whole car
 * ends up corrected; the pointer turns the studio's lights a little (every reflection slides over the
 * paint) and leans the camera. `onLine` reports where the tape is on screen for the HTML labels.
 *
 * Draws every frame only while something moves, only while on screen and the tab is visible.
 *
 * Model: "FREE 1975 Porsche 911 (930) Turbo" by Lionsharp Studios (CC BY 4.0), crest, lettering and
 * plates removed, compressed by scripts/car-model.mjs.
 */
export type Studio = {
  setProgress: (p: number) => void;
  setPointer: (x: number, y: number) => void;
  setVisible: (v: boolean) => void;
  resize: () => void;
  /** Starts the arrival: the turntable spins up and the polish line moves over the door. */
  intro: () => void;
  /** One finished frame for the stills: `gloss` renders the car fully corrected (phones, /v2). */
  still: (view: StillView, gloss?: boolean) => void;
  dispose: () => void;
};

/** Where the tape line sits on the canvas (CSS px), and which side of it is the corrected paint. */
export type LineSpot = { x: number; y: number; afterLeft: boolean; alpha: number };

/** A frame of reference the canvas crops like `object-fit: cover`, so it lines up with the still. */
export type Frame = { w: number; h: number; x: number; y: number; shift: number; xNarrow?: number };
export type StillView = "desktop" | "phone";

// xNarrow: below a 3:2 hero the crop moves right (the .hero-still container query in globals.css)
export const DESKTOP_FRAME: Frame = { w: 2400, h: 1500, x: 0.6, y: 0.5, shift: 0.205, xNarrow: 0.82 };
export const PHONE_FRAME: Frame = { w: 1200, h: 960, x: 0.5, y: 0.5, shift: 0 };

const INK = new THREE.Color("#07080a");
const CYC_LOW = new THREE.Color("#121419");
const VOLT = new THREE.Color("#d4fa4c");
const TARGET = new THREE.Vector3(0, 0.6, 0);
// camera poses: azimuth from the nose (+z) toward the driver's side (+x), elevation, distance
const POSE_A = { az: 0.9, el: 0.12, dist: 13.3, fov: 22, tx: -0.05 };
const POSE_B = { az: 1.2, el: 0.05, dist: 11.2, fov: 22, tx: 0.3 };
const PHONE_POSE = { az: 0.9, el: 0.12, dist: 9.6, fov: 24, tx: 0 };
// the polish line, as a share of the car's length from the nose
const LINE_REST = 0.44; // the still: nose, front wing and half the door done
const LINE_INTRO = 0.6; // after the arrival
const LINE_END = 1.06; // past the tail
const INTRO_S = 3;
// the turntable: one turn in about 50 s once it's up to speed
const TURN_SPEED = (Math.PI * 2) / 50;
const SPIN_UP_S = 1.6;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
// the watch after the canvas appears: under 45 fps on average, a 3rd frame over 100 ms or one over
// 400 ms, or over 3 ms of the scene's own work per frame, means a weak machine. The first frames
// pay one-off costs (the GPU's first real draw: 371 ms on a refresh on a PC that then ran 112 fps,
// 18 Nov) and don't count, and a hitch or two (a font, an image decode) isn't a slow machine.
const WATCH_MS = 2000;
const WARM_FRAMES = 5;
const MIN_FPS = 45;
const MAX_FRAME_MS = 100;
const MAX_HITCHES = 3;
const MAX_COST_MS = 3;
const SOFTWARE_GL = /swiftshader|llvmpipe|softpipe|software|basic render|mesa offscreen/i;

/** Lets the browser draw a frame and handle input between the heavy setup steps. */
const breathe = () =>
  new Promise<void>((r) => {
    if (typeof window.requestIdleCallback === "function") window.requestIdleCallback(() => r(), { timeout: 120 });
    else window.setTimeout(r, 16);
  });
let meshoptWorkers = false;
const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);

/**
 * The 50/50 on the paint, in the turntable's frame (nose to +z). Behind the line (z < uLine): a
 * milky haze, a rougher clearcoat and swirl marks, arcs of random radius around random centres
 * that only show where something bright is reflected, as real swirls do. On the line: the tape.
 */
const PAINT_VERT = /* glsl */ `
uniform mat4 uToCar;
varying vec3 vCar;
varying vec3 vCarN;
`;
const PAINT_FRAG = /* glsl */ `
uniform float uLine;
uniform vec3 uTape;
varying vec3 vCar;
varying vec3 vCarN;
float h21(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
// swirl arcs on the plane facing the normal's main axis
float swirls(vec3 p, vec3 n) {
  vec3 a = abs(n);
  vec2 q = a.x > a.y && a.x > a.z ? p.zy : (a.y > a.z ? p.xz : p.xy);
  q *= 3.2; // cells of about 30 cm
  vec2 c = floor(q);
  float s = 0.0;
  for (int j = -1; j <= 1; j++)
    for (int i = -1; i <= 1; i++) {
      vec2 id = c + vec2(float(i), float(j));
      vec2 o = id + vec2(h21(id), h21(id + 17.1)) - q;
      float d = length(o);
      if (d > 0.95) continue;
      float rings = d * 26.0;
      float k = floor(rings);
      float ang = atan(o.y, o.x);
      // each ring only in a few arcs, and only some rings at all
      float seg = floor((ang + 3.1416) * 1.27 + h21(id + k) * 6.0);
      float on = step(0.62, h21(id * 1.7 + vec2(k, seg)));
      float f = abs(fract(rings) - 0.5);
      float w = fwidth(rings) * 0.9 + 0.035;
      s += on * (1.0 - smoothstep(0.0, w, f - 0.03)) * (1.0 - d);
    }
  return min(s, 1.0);
}
`;

type PaintUniforms = { uToCar: { value: THREE.Matrix4 }; uLine: { value: number }; uTape: { value: THREE.Color } };

/** Gives the car's paint its 50/50: corrected in front of the tape line, as it came in behind it. */
function withCorrection(mat: THREE.MeshPhysicalMaterial, u: PaintUniforms) {
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, u);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>\n${PAINT_VERT}`)
      .replace(
        "#include <project_vertex>",
        `#include <project_vertex>
  vCar = (uToCar * modelMatrix * vec4(transformed, 1.0)).xyz;
  vCarN = normalize(mat3(uToCar) * mat3(modelMatrix) * objectNormal);`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\n${PAINT_FRAG}`)
      .replace(
        "#include <lights_physical_fragment>",
        `#include <lights_physical_fragment>
  // a softer grazing response, so the rolled panel edges don't outline every panel in white
  material.clearcoatF90 = 0.4;
  float dz = vCar.z - uLine;
  float haze = 1.0 - smoothstep(-0.012, 0.0, dz);
  float tape = 1.0 - smoothstep(0.011, 0.0135, abs(dz - 0.011));
  material.clearcoatRoughness = mix(material.clearcoatRoughness, 0.24, haze);
  material.roughness = mix(material.roughness, 0.62, haze);`,
      )
      .replace(
        "#include <opaque_fragment>",
        `#ifdef USE_CLEARCOAT
  // swirls catch the reflected softboxes; the haze lifts the black toward a milky grey
  outgoingLight += swirls(vCar, vCarN) * haze * clearcoatSpecularIndirect * 3.2;
#endif
  outgoingLight = mix(outgoingLight, outgoingLight * 0.82 + vec3(0.022, 0.023, 0.025), haze);
  // the tape: matte volt, lit a little by the room so it reads on black
  float lit = 0.55 + 0.45 * clamp(dot(normal, vec3(0.0, 0.0, 1.0)) * 0.5 + 0.5, 0.0, 1.0);
  outgoingLight = mix(outgoingLight, uTape * lit, tape);
#include <opaque_fragment>`,
      );
  };
  mat.customProgramCacheKey = () => "lustro-5050";
  return mat;
}

/** A soft-edged emissive panel: the falloff is what makes a softbox read as a softbox in paint. */
function softbox(w: number, h: number, intensity: number, edge = 0.18) {
  return new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      uniforms: { uI: { value: intensity }, uE: { value: edge } },
      vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: `uniform float uI; uniform float uE; varying vec2 vUv;
        void main(){ vec2 e = smoothstep(vec2(0.0), vec2(uE), vUv) * smoothstep(vec2(0.0), vec2(uE), 1.0 - vUv);
          gl_FragColor = vec4(vec3(uI * e.x * e.y), 1.0); }`,
    }),
  );
}

/**
 * Compiles a bake's shaders off the main thread (KHR_parallel_shader_compile). They are compiled as
 * for a render target, which is where the bake draws, so the bake finds them ready.
 */
async function precompile(renderer: THREE.WebGLRenderer, scene: THREE.Object3D, camera: THREE.Camera) {
  const rt = new THREE.WebGLRenderTarget(1, 1);
  const prev = renderer.getRenderTarget();
  renderer.setRenderTarget(rt);
  const ready = renderer.compileAsync(scene, camera);
  renderer.setRenderTarget(prev);
  await ready;
  rt.dispose();
}

type PmremInternals = { _ggxMaterial: THREE.ShaderMaterial | null; _integrationMaterial: THREE.ShaderMaterial | null; _boxMesh: THREE.Mesh };

/** The room as the paint sees it: a big overhead softbox, two long side strips, dark walls and floor. */
async function studioEnvironment(renderer: THREE.WebGLRenderer) {
  const env = new THREE.Scene();
  env.background = new THREE.Color("#050607");
  const room = new THREE.Mesh(new THREE.BoxGeometry(18, 7, 22), new THREE.MeshBasicMaterial({ color: "#121418", side: THREE.BackSide }));
  room.position.y = 3.4;
  env.add(room);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(18, 22), new THREE.MeshBasicMaterial({ color: "#14161a" }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0.01;
  env.add(floor);
  // overhead: one large panel
  const top = softbox(3.8, 6.8, 9, 0.22);
  top.rotation.x = Math.PI / 2;
  top.position.y = 4.2;
  env.add(top);
  // long horizontal strips either side: the line every car photographer puts along a flank
  for (const side of [-1, 1]) {
    const strip = softbox(9, 0.6, 8.5, 0.3);
    strip.position.set(side * 4.4, 1.25, 0);
    strip.rotation.y = side * (Math.PI / 2);
    env.add(strip);
  }
  // kickers low at the front and back pick out the bumpers
  for (const z of [-7, 7]) {
    const k = softbox(5, 0.9, 1.8, 0.4);
    k.position.set(0, 0.7, z);
    env.add(k);
  }
  const pmrem = new THREE.PMREMGenerator(renderer);
  const bake = () => pmrem.fromScene(env, 0, 0.1, 40, { size: 512, position: new THREE.Vector3(0, 0.9, 0) });
  // PMREM makes its filter shaders on first use: a dry run with drawing switched off creates them,
  // then they compile in the background with the room's own, and the real bake only draws
  const draw = renderer.render;
  renderer.render = () => {};
  bake().dispose();
  renderer.render = draw;
  const pm = pmrem as unknown as PmremInternals;
  const filters = new THREE.Group();
  for (const m of [pm._ggxMaterial, pm._integrationMaterial]) if (m) filters.add(new THREE.Mesh(pm._boxMesh.geometry, m));
  env.add(filters);
  await precompile(renderer, env, new THREE.PerspectiveCamera(90, 1, 0.1, 40));
  env.remove(filters);
  await breathe();
  const rt = bake();
  pmrem.dispose();
  env.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.geometry.dispose();
      (o.material as THREE.Material).dispose();
    }
  });
  return rt;
}


/** Soft contact shadow, baked once: depth from below, blurred into a tight and a wide layer. */
async function contactShadows(renderer: THREE.WebGLRenderer, car: THREE.Object3D, size: THREE.Vector3) {
  const W = size.x + 1.6;
  const D = size.z + 1.6;
  const H = 1.4;
  const res = 512;
  const opts = { type: THREE.HalfFloatType } as const;
  const rtA = new THREE.WebGLRenderTarget(res, res, opts);
  const rtB = new THREE.WebGLRenderTarget(res, res, opts);
  const cam = new THREE.OrthographicCamera(-W / 2, W / 2, D / 2, -D / 2, 0, H);
  cam.rotation.x = Math.PI / 2; // looking up from the floor
  const depth = new THREE.MeshDepthMaterial();
  depth.onBeforeCompile = (s) => {
    s.fragmentShader = s.fragmentShader.replace(
      "gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );",
      "gl_FragColor = vec4( vec3( 0.0 ), pow( 1.0 - fragCoordZ, 2.2 ) );",
    );
  };
  const shadowScene = new THREE.Scene();
  const holder = new THREE.Group();
  holder.add(car.clone());
  shadowScene.add(holder);
  shadowScene.overrideMaterial = depth;
  const blur = new THREE.ShaderMaterial({
    uniforms: { tMap: { value: null }, uDir: { value: new THREE.Vector2() } },
    vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }",
    fragmentShader: `uniform sampler2D tMap; uniform vec2 uDir; varying vec2 vUv;
      void main(){ vec4 s = vec4(0.0); float t = 0.0;
        for (int i = -6; i <= 6; i++) { float w = exp(-float(i*i) / 18.0); s += texture2D(tMap, vUv + uDir * float(i)) * w; t += w; }
        gl_FragColor = s / t; }`,
    depthTest: false,
    depthWrite: false,
  });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), blur);
  quad.frustumCulled = false;
  const quadScene = new THREE.Scene();
  quadScene.add(quad);
  const ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  // compile() skips overrideMaterial, so the depth shader goes in on a stand-in quad of its own
  const depthProbe = new THREE.Mesh(quad.geometry, depth);
  quadScene.add(depthProbe);
  await precompile(renderer, quadScene, ortho);
  quadScene.remove(depthProbe);
  await breathe();

  const prevColor = renderer.getClearColor(new THREE.Color());
  const prevAlpha = renderer.getClearAlpha();
  renderer.setClearColor(0x000000, 0);
  renderer.setRenderTarget(rtA);
  renderer.render(shadowScene, cam);
  const pass = (from: THREE.WebGLRenderTarget, to: THREE.WebGLRenderTarget, px: number) => {
    blur.uniforms.tMap.value = from.texture;
    blur.uniforms.uDir.value.set(px / res, 0);
    renderer.setRenderTarget(rtB);
    renderer.render(quadScene, ortho);
    blur.uniforms.tMap.value = rtB.texture;
    blur.uniforms.uDir.value.set(0, px / res);
    renderer.setRenderTarget(to);
    renderer.render(quadScene, ortho);
  };
  const tight = new THREE.WebGLRenderTarget(res, res, opts);
  const wide = new THREE.WebGLRenderTarget(res, res, opts);
  pass(rtA, tight, 0.6);
  pass(tight, tight, 0.8);
  pass(rtA, wide, 2.2);
  pass(wide, wide, 3.2);
  pass(wide, wide, 4.0);
  renderer.setRenderTarget(null);
  renderer.setClearColor(prevColor, prevAlpha);

  const group = new THREE.Group();
  const geo = new THREE.PlaneGeometry(W, D).rotateX(Math.PI / 2);
  for (const [rt, opacity, y] of [
    [wide, 0.95, 0.002],
    [tight, 0.9, 0.004],
  ] as const) {
    const plane = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: rt.texture, transparent: true, opacity, depthWrite: false }));
    plane.scale.y = -1;
    plane.position.y = y;
    plane.renderOrder = 1;
    group.add(plane);
  }
  shadowScene.clear();
  depth.dispose();
  blur.dispose();
  quad.geometry.dispose();
  rtA.dispose();
  rtB.dispose();
  return { group, dispose: () => [tight, wide].forEach((t) => t.dispose()) };
}

export async function createStudio(
  canvas: HTMLCanvasElement,
  opts: {
    model: string | ArrayBuffer;
    frame?: Frame;
    progress?: () => number;
    onFirstFrame?: () => void;
    /** The first seconds ran too slowly (see WATCH_MS): the caller fades back to the still. */
    onSlow?: () => void;
    /** Every drawn frame: where the tape line is, for the labels riding it. */
    onLine?: (spot: LineSpot) => void;
    /** Stop early if the caller no longer wants the scene. */
    cancelled?: () => boolean;
  },
): Promise<Studio> {
  // a real graphics chip or nothing: software rendering keeps the still
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "high-performance", failIfMajorPerformanceCaveat: true });
  const gl = renderer.getContext();
  const info = gl.getExtension("WEBGL_debug_renderer_info");
  if (SOFTWARE_GL.test(String(gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER)))) {
    renderer.dispose();
    renderer.forceContextLoss();
    throw new Error("software WebGL");
  }
  renderer.debug.checkShaderErrors = false;
  const abort = () => {
    if (!opts.cancelled?.()) return;
    renderer.dispose();
    renderer.forceContextLoss();
    throw new Error("cancelled");
  };
  renderer.setClearColor(INK, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  await breathe();
  abort();

  const scene = new THREE.Scene();
  scene.background = INK;
  scene.fog = new THREE.Fog(CYC_LOW, 10, 24);
  // each material gets the room itself (scene.environment would override envMapIntensity)
  const envRT = await studioEnvironment(renderer);
  const envMap = envRT.texture;

  // the cove: an infinity wall that glows faintly just above the floor line, black overhead
  const cyc = new THREE.Mesh(
    new THREE.CylinderGeometry(15, 15, 14, 64, 1, true),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: { uLow: { value: CYC_LOW }, uTop: { value: INK } },
      vertexShader: "varying float vY; void main(){ vY = position.y + 7.0; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: `uniform vec3 uLow; uniform vec3 uTop; varying float vY;
        void main(){ float k = smoothstep(0.0, 4.2, vY); gl_FragColor = vec4(mix(uLow, uTop, k), 1.0);
        #include <colorspace_fragment>
        }`,
    }),
  );
  cyc.position.y = 7 - 0.01;
  scene.add(cyc);

  const camera = new THREE.PerspectiveCamera(POSE_A.fov, DESKTOP_FRAME.w / DESKTOP_FRAME.h, 0.1, 80);

  // floor: dark epoxy that catches the softboxes, fading into the cove
  const envMats: THREE.MeshStandardMaterial[] = [];
  const floorMat = new THREE.MeshStandardMaterial({ color: "#0b0c0f", roughness: 0.32, metalness: 0, envMap, envMapIntensity: 0.2 });
  envMats.push(floorMat);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(16, 64).rotateX(-Math.PI / 2), floorMat);
  scene.add(floor);

  await breathe();
  abort();

  // the car (the meshopt streams decode in workers, off the main thread)
  const loader = new GLTFLoader();
  if (!meshoptWorkers) {
    const decoder = MeshoptDecoder as typeof MeshoptDecoder & { useWorkers: (n: number) => void };
    decoder.useWorkers(2);
    meshoptWorkers = true;
  }
  loader.setMeshoptDecoder(MeshoptDecoder);
  // the caller may have fetched the file already, alongside this chunk
  const gltf = typeof opts.model === "string" ? await loader.loadAsync(opts.model) : await loader.parseAsync(opts.model, "");
  const car = gltf.scene;
  await breathe();
  abort();

  const pu: PaintUniforms = { uToCar: { value: new THREE.Matrix4() }, uLine: { value: 0 }, uTape: { value: VOLT.clone().multiplyScalar(0.95) } };
  const paint = withCorrection(
    new THREE.MeshPhysicalMaterial({ color: "#0a0b0d", metalness: 0.55, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 1.3 }),
    pu,
  );
  const glass = new THREE.MeshPhysicalMaterial({ color: "#05070a", metalness: 0, roughness: 0.02, transparent: true, opacity: 0.84, clearcoat: 1, clearcoatRoughness: 0, envMapIntensity: 1.4, depthWrite: false });
  const lampMats: THREE.MeshStandardMaterial[] = [];
  car.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return;
    const m = o.material as THREE.MeshStandardMaterial;
    const name = m.name;
    if (name === "paint") {
      // the model's baked occlusion keeps the panel gaps and the wheel arches dark
      paint.aoMap = m.aoMap;
      paint.userData.paint = true; // scripts/paint-mask.mjs finds the paint by this
      o.material = paint;
    } else if (name === "glass") {
      o.material = glass;
      o.renderOrder = 2;
    } else if (name === "930_lights") {
      // headlamps and tail lamps glow in their own colours (the texture is the light pattern)
      m.emissive.set("#ffffff");
      m.emissiveMap = m.map;
      m.userData.on = 0.55;
      lampMats.push(m);
    } else if (name === "930_lights_refraction") {
      // the lamp lenses: clear glass over the reflectors
      m.color.set("#0a0c0f");
      m.metalness = 0;
      m.roughness = 0.04;
      m.opacity = 0.22;
    }
    if (!lampMats.includes(m) && m.emissive) m.emissive.setRGB(0, 0, 0);
    if ("envMap" in o.material) {
      const mm = o.material as THREE.MeshStandardMaterial;
      mm.envMap = envMap;
      if (mm !== paint && mm !== glass) mm.envMapIntensity = 0.85;
      if (!envMats.includes(mm)) envMats.push(mm);
    }
  });

  // a real 930's length (4.29 m), centred on the turntable, wheels on the floor, nose to +z
  car.updateMatrixWorld(true);
  const raw = new THREE.Box3().setFromObject(car, true);
  car.scale.multiplyScalar(4.29 / (raw.max.z - raw.min.z));
  car.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(car, true);
  const center = box.getCenter(new THREE.Vector3());
  car.position.x -= center.x;
  car.position.z -= center.z;
  car.position.y -= box.min.y;
  car.updateMatrixWorld(true);
  // the radio antenna on the wing: a hair-thin wire that breaks into a dashed line on screen
  const part = new THREE.Box3();
  const ps = new THREE.Vector3();
  car.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return;
    part.setFromObject(o, true).getSize(ps);
    if (ps.y > 0.3 && ps.x < 0.08 && ps.z < 0.08) o.visible = false;
  });
  const size = box.getSize(new THREE.Vector3());
  const noseZ = size.z / 2;
  const carRoot = new THREE.Group();
  carRoot.add(car);
  // the turntable: everything on it turns together (the shadow is baked in its frame)
  const table = new THREE.Group();
  table.add(carRoot);
  scene.add(table);

  // a soft round pool of light on the floor, so the shadow has something to fall on
  const pool = new THREE.Mesh(
    new THREE.CircleGeometry(5.2, 64).rotateX(-Math.PI / 2),
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: { uColor: { value: new THREE.Color("#3a3f48") } },
      vertexShader: "varying vec2 vP; void main(){ vP = position.xz / 5.2; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: `uniform vec3 uColor; varying vec2 vP;
        void main(){ float d = length(vP); float a = pow(1.0 - smoothstep(0.0, 1.0, d), 1.6);
          gl_FragColor = vec4(uColor, a * 0.85);
          #include <colorspace_fragment>
        }`,
    }),
  );
  pool.position.y = 0.001;
  scene.add(pool);
  // the turntable's rim: a thin brushed-steel edge that catches the softboxes as it turns
  const rimMat = new THREE.MeshStandardMaterial({ color: "#2a2e34", metalness: 1, roughness: 0.28, envMap, envMapIntensity: 0.9 });
  envMats.push(rimMat);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(3.05, 0.018, 8, 160).rotateX(Math.PI / 2), rimMat);
  rim.position.y = 0.012;
  table.add(rim);

  await breathe();
  abort();
  const shadows = await contactShadows(renderer, carRoot, size);
  table.add(shadows.group);

  // ── state ──
  let frame = opts.frame ?? DESKTOP_FRAME;
  let progress = opts.progress?.() ?? 0;
  let shown = progress;
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  let introT = -1; // -1: not started, else seconds since start
  let turn = 0;
  let visible = true;
  let raf = 0;
  let last = 0;
  let first = true;
  let disposed = false;
  // the frame watch: starts with the first visible frame, paused while off screen or hidden
  const watch = { on: !!opts.onSlow, t0: 0, n: 0, worst: 0, cost: 0, hitches: 0 };

  /** The line at a share of the car's length from the nose. */
  const setLine = (u: number) => {
    pu.uLine.value = noseZ - u * size.z;
  };

  const placeCamera = (p: number, view: StillView | "live") => {
    const P = view === "phone" ? PHONE_POSE : null;
    const t = ease(clamp01(p));
    const az = P ? P.az : THREE.MathUtils.lerp(POSE_A.az, POSE_B.az, t) + pointer.x * 0.05;
    const el = P ? P.el : THREE.MathUtils.lerp(POSE_A.el, POSE_B.el, t) + pointer.y * 0.02;
    const dist = P ? P.dist : THREE.MathUtils.lerp(POSE_A.dist, POSE_B.dist, t);
    const tx = P ? P.tx : THREE.MathUtils.lerp(POSE_A.tx, POSE_B.tx, t);
    camera.fov = P ? P.fov : POSE_A.fov;
    camera.position.set(Math.sin(az) * Math.cos(el) * dist, TARGET.y + Math.sin(el) * dist, Math.cos(az) * Math.cos(el) * dist);
    camera.lookAt(TARGET.x + tx, TARGET.y, TARGET.z);
  };

  /** The studio's lights turn with the pointer: every reflection slides over the paint. */
  const setLights = (yaw: number) => {
    for (const m of envMats) m.envMapRotation.y = yaw;
  };

  const applyFrame = (w: number, h: number) => {
    // crop the reference frame exactly like object-fit: cover + object-position
    const s = Math.max(w / frame.w, h / frame.h);
    const vw = w / s;
    const vh = h / s;
    camera.aspect = frame.w / frame.h;
    // shift: the car sits right of centre in the frame, clear of the headline
    const x = frame.xNarrow !== undefined && w / h <= 1.5 ? frame.xNarrow : frame.x;
    camera.setViewOffset(frame.w, frame.h, (frame.w - vw) * x - frame.shift * frame.w, (frame.h - vh) * frame.y, vw, vh);
    camera.updateProjectionMatrix();
  };

  const size2D = () => {
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5, Math.sqrt(4_200_000 / (w * h)));
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    applyFrame(w, h);
  };
  const resize = () => {
    size2D();
    request();
  };

  // where the tape is on screen: its foot on the side facing the camera, and which way the nose points
  const v = new THREE.Vector3();
  const nose = new THREE.Vector3();
  const reportLine = () => {
    if (!opts.onLine) return;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const toScreen = (p: THREE.Vector3) => p.applyMatrix4(table.matrixWorld).project(camera);
    // the camera's side of the car, in the turntable's frame
    const camLocal = table.worldToLocal(camera.position.clone());
    const side = Math.sign(camLocal.x) || 1;
    toScreen(v.set(side * (size.x / 2) * 0.9, 0.08, pu.uLine.value));
    const a = toScreen(nose.set(0, 0.5, noseZ)).x;
    const b = toScreen(new THREE.Vector3(0, 0.5, -noseZ)).x;
    // fades out when the car points at the camera (the line then runs across, not along)
    const spread = Math.abs(a - b);
    const inside = pu.uLine.value < noseZ - 0.05 && pu.uLine.value > -noseZ + 0.05;
    opts.onLine({ x: ((v.x + 1) / 2) * w, y: ((1 - v.y) / 2) * h, afterLeft: a < b, alpha: inside ? clamp01((spread - 0.18) / 0.2) : 0 });
  };

  const setLamps = (on: number) => {
    for (const m of lampMats) m.emissiveIntensity = (m.userData.on as number) * on;
  };

  const render = () => {
    table.rotation.y = turn;
    table.updateMatrixWorld(true);
    pu.uToCar.value.copy(table.matrixWorld).invert();
    renderer.render(scene, camera);
    reportLine();
  };

  // the line from the scroll (after the arrival has moved it on)
  const lineAt = (p: number, from: number) => THREE.MathUtils.lerp(from, LINE_END, ease(clamp01(p / 0.8)));

  const step = (now: number) => {
    const now0 = performance.now();
    raf = 0;
    if (disposed) return;
    const ms = last ? now - last : 0;
    const dt = Math.min(0.05, last ? ms / 1000 : 0.016);
    last = now;
    let busy = false;

    // keep drawing through the watch (the same picture when nothing moves), so every frame counts
    if (watch.on) busy = true;
    if (watch.on && ms) {
      watch.n++;
      if (watch.n === WARM_FRAMES) watch.t0 = now;
      if (watch.n > WARM_FRAMES) {
        watch.worst = Math.max(watch.worst, ms);
        if (ms > MAX_FRAME_MS) watch.hitches++;
        const span = now - watch.t0;
        const fps = ((watch.n - WARM_FRAMES) * 1000) / Math.max(1, span);
        // the scene's own main-thread time per frame: on a slow CPU it leaves the page no room,
        // even where the screen refresh hides it (about 1 ms on a desktop, 8 ms at 4x CPU slowdown)
        const cost = watch.cost / Math.max(1, watch.n - WARM_FRAMES - 1);
        if (watch.hitches >= MAX_HITCHES || watch.worst > MAX_FRAME_MS * 4 || (span >= WATCH_MS && (fps < MIN_FPS || cost > MAX_COST_MS))) {
          watch.on = false;
          performance.mark("3d:slow", { detail: { fps, cost, worst: watch.worst, hitches: watch.hitches } });
          opts.onSlow?.();
          return;
        }
        if (span >= WATCH_MS) {
          watch.on = false;
          performance.mark("3d:watch-ok", { detail: { fps, cost, worst: watch.worst, hitches: watch.hitches } });
        }
      }
    }

    progress = opts.progress?.() ?? progress;
    const dp = progress - shown;
    shown += dp * Math.min(1, dt * 6);
    if (Math.abs(dp) > 0.0005) busy = true;
    else shown = progress;

    pointer.x += (pointer.tx - pointer.x) * Math.min(1, dt * 3);
    pointer.y += (pointer.ty - pointer.y) * Math.min(1, dt * 3);
    if (Math.abs(pointer.tx - pointer.x) + Math.abs(pointer.ty - pointer.y) > 0.0008) busy = true;

    let line = lineAt(shown, LINE_INTRO);
    if (introT >= 0) {
      introT += dt;
      // the turntable spins up from the still's pose and keeps turning; scrolling adds a little
      const spin = Math.min(1, introT / SPIN_UP_S);
      turn += TURN_SPEED * dt * spin * spin;
      // arrival: the polish line moves over the door (a slow pass with the machine's to-and-fro)
      const k = clamp01(introT / INTRO_S);
      if (k < 1) {
        const from = THREE.MathUtils.lerp(LINE_REST, LINE_INTRO, easeOut(k)) + Math.sin(k * Math.PI * 3) * 0.018 * (1 - k);
        line = lineAt(shown, from);
      }
      busy = true;
    } else line = lineAt(shown, LINE_REST);
    setLine(line);
    setLights(pointer.x * 0.55);
    placeCamera(shown, "live");
    render();
    if (watch.on && watch.n > WARM_FRAMES) watch.cost += performance.now() - now0;
    if (first) {
      first = false;
      performance.mark("3d:first-frame");
      opts.onFirstFrame?.();
    }
    if (busy && visible) request();
    else last = 0;
  };

  function request() {
    if (!raf && visible && !disposed) raf = requestAnimationFrame(step);
  }

  // first frame: the still's state (turntable at rest, line on the door), lamps on
  setLamps(1);
  setLine(lineAt(progress, LINE_REST));
  size2D();
  placeCamera(shown, "live");
  await breathe();
  abort();
  // compile every shader off the main thread (KHR_parallel_shader_compile), then upload the
  // textures a few at a time and draw one frame while the canvas is still invisible: nothing is
  // left to compile or upload when the canvas fades in or the visitor scrolls
  await renderer.compileAsync(scene, camera);
  abort();
  const textures = new Set<THREE.Texture>();
  scene.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return;
    for (const m of Array.isArray(o.material) ? o.material : [o.material]) for (const v of Object.values(m)) if (v instanceof THREE.Texture) textures.add(v);
  });
  let slice = performance.now();
  for (const t of textures) {
    renderer.initTexture(t);
    if (performance.now() - slice > 8) {
      await breathe();
      slice = performance.now();
    }
  }
  abort();
  render();
  await nextFrame();
  abort();
  request();

  return {
    setProgress: (p) => {
      progress = p;
      request();
    },
    setPointer: (x, y) => {
      pointer.tx = x;
      pointer.ty = y;
      request();
    },
    setVisible: (v) => {
      if (v === visible) return void (v && request());
      visible = v;
      if (v) request();
      else {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        last = 0;
      }
      // a watch interrupted by scrolling away or switching tabs starts over when it comes back
      if (watch.on) watch.n = watch.worst = watch.cost = watch.hitches = 0;
    },
    resize,
    intro: () => {
      if (introT >= 0) return;
      introT = 0;
      request();
    },
    still: (view, gloss = view === "phone") => {
      frame = view === "phone" ? PHONE_FRAME : DESKTOP_FRAME;
      pointer.x = pointer.y = pointer.tx = pointer.ty = 0;
      turn = 0;
      setLamps(1);
      setLights(0);
      setLine(gloss ? LINE_END : LINE_REST);
      placeCamera(0, view);
      applyFrame(canvas.width, canvas.height);
      render();
    },
    dispose: () => {
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      shadows.dispose();
      envRT.dispose();
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          const ms = Array.isArray(o.material) ? o.material : [o.material];
          for (const m of ms) {
            for (const v of Object.values(m)) if (v instanceof THREE.Texture) v.dispose();
            m.dispose();
          }
        }
      });
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
