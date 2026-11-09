import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

/**
 * Hero centrepiece (desktop only, loaded behind the 3D gate in Hero.tsx).
 *
 * A gloss-black car in a dark detail studio: a big overhead softbox and two long side strips live
 * in the reflections, an inspection light arch (two posts and a span, like a detailer's light
 * tunnel) travels along the car, and soft contact shadows hold it to the epoxy floor. On arrival the
 * arch makes one pass and the lamps blink; scroll (`setProgress`, 0 → 1) runs it from the front
 * wheels to past the tail while the camera glides down the flank, so the light pours along the
 * clearcoat; the pointer leans the camera a few degrees, which slides every reflection over the paint.
 *
 * The arch is analytic (closest point on each segment to the reflected ray, widened by roughness),
 * injected into the clearcoat and the glass: sharp, cheap, and it moves without re-baking the
 * environment. Renders only when something changes and only while on screen.
 *
 * Model: "Car Concept" from the Khronos glTF Sample Assets (CC BY 4.0), after "Free Concept Car 004"
 * by Unity Fan (CC0). Logos and plate removed, compressed by scripts/car-model.mjs.
 */
export type Studio = {
  setProgress: (p: number) => void;
  setPointer: (x: number, y: number) => void;
  setVisible: (v: boolean) => void;
  resize: () => void;
  /** Plays the arrival once: the strip light passes over the car and the lamps come on. */
  intro: () => void;
  /** One finished frame for the stills (phone and fallback). */
  still: (view: StillView) => void;
  dispose: () => void;
};

/** A frame of reference the canvas crops like `object-fit: cover`, so it lines up with the still. */
export type Frame = { w: number; h: number; x: number; y: number; shift: number; xNarrow?: number };
export type StillView = "desktop" | "phone";

// xNarrow: below a 3:2 hero the crop moves right (the .hero-still container query in globals.css)
export const DESKTOP_FRAME: Frame = { w: 2400, h: 1500, x: 0.6, y: 0.5, shift: 0.19, xNarrow: 0.82 };
export const PHONE_FRAME: Frame = { w: 1200, h: 960, x: 0.5, y: 0.5, shift: 0 };

const INK = new THREE.Color("#07080a");
const CYC_LOW = new THREE.Color("#121419");
const TARGET = new THREE.Vector3(0, 0.62, 0);
// camera poses: azimuth from the nose (+z) toward the driver's side (+x), elevation, distance
const POSE_A = { az: 0.95, el: 0.13, dist: 13, fov: 22, tx: -0.1 };
const POSE_B = { az: 1.5, el: 0.08, dist: 13.8, fov: 22, tx: 0.25 };
const PHONE_POSE = { az: 0.95, el: 0.13, dist: 9.8, fov: 24, tx: 0 };
// the inspection arch: two posts beside the car and a span over it, travelling along the car
const ARCH_W = 1.75;
const ARCH_H = 2.1;
const ARCH_Z0 = 1.35; // resting over the front wheels
const ARCH_Z1 = -3.4; // past the tail
const ARCH_IN = 4.6; // ahead of the nose
const INTRO_S = 3.2;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
// the watch after the canvas appears: under 45 fps on average, one frame over 100 ms, or over 3 ms
// of the scene's own work per frame, means a weak machine
const WATCH_MS = 2000;
const WARM_FRAMES = 3;
const MIN_FPS = 45;
const MAX_FRAME_MS = 100;
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
 * A line light seen in a glossy surface: the closest point on the segment to the reflected ray,
 * a soft-edged core whose angular width grows with roughness, a faint halo, and Fresnel.
 */
const ARCH_GLSL = /* glsl */ `
uniform vec3 uArch[4];
uniform float uArchW;
uniform vec3 uArchColor;
float lineLight(vec3 P, vec3 N, vec3 R, vec3 A, vec3 B, float rough) {
  vec3 d = B - A;
  vec3 w0 = A - P;
  float a = dot(d, d);
  float b = dot(d, R);
  float den = max(a - b * b, 1e-5);
  float s = clamp((b * dot(R, w0) - dot(d, w0)) / den, 0.0, 1.0);
  vec3 Lp = A + s * d - P;
  float dist = length(Lp);
  vec3 L = Lp / dist;
  if (dot(N, L) <= 0.0) return 0.0;
  float ang = acos(clamp(dot(R, L), -1.0, 1.0));
  float w = uArchW / dist + rough * rough * 1.6;
  float core = 1.0 - smoothstep(w * 0.55, w * 1.35, ang);
  float halo = exp(-ang * ang / (w * w * 18.0 + 1e-4)) * 0.16;
  return core + halo;
}
vec3 archLight(vec3 P, vec3 N, vec3 V, float rough) {
  vec3 R = reflect(-V, N);
  float l = lineLight(P, N, R, uArch[0], uArch[1], rough)
          + lineLight(P, N, R, uArch[1], uArch[2], rough)
          + lineLight(P, N, R, uArch[2], uArch[3], rough);
  float nv = clamp(dot(N, V), 0.0, 1.0);
  float fres = 0.04 + 0.96 * pow(1.0 - nv, 5.0);
  // tight panel edges sweep through every angle inside a pixel: let them go quiet, not outline
  float edge = 1.0 - smoothstep(0.04, 0.22, length(fwidth(N)));
  return uArchColor * min(l, 1.2) * fres * edge / (1.0 + rough * 6.0);
}
`;

type ArchUniforms = {
  uArch: { value: THREE.Vector3[] };
  uArchW: { value: number };
  uArchColor: { value: THREE.Color };
};

/** Adds the arch to a standard/physical material: on the clearcoat when there is one. */
function withArch(mat: THREE.MeshStandardMaterial, u: ArchUniforms, gain = 1) {
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, u);
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\n${ARCH_GLSL}`)
      // a softer grazing response, so the rolled panel edges don't outline every panel in white
      .replace("#include <lights_physical_fragment>", "#include <lights_physical_fragment>\n  material.clearcoatF90 = 0.4;")
      .replace(
      "#include <opaque_fragment>",
      `#ifdef USE_CLEARCOAT
  outgoingLight += archLight(-vViewPosition, clearcoatNormal, normalize(vViewPosition), material.clearcoatRoughness) * material.clearcoat * ${gain.toFixed(2)};
#else
  outgoingLight += archLight(-vViewPosition, normal, normalize(vViewPosition), material.roughness) * ${gain.toFixed(2)};
#endif
#include <opaque_fragment>`,
    );
  };
  mat.customProgramCacheKey = () => `arch${gain}`;
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

  // the inspection arch (world corners, and the same in view space for the shaders)
  const arch: ArchUniforms = {
    uArch: { value: [0, 1, 2, 3].map(() => new THREE.Vector3()) },
    uArchW: { value: 0.06 },
    uArchColor: { value: new THREE.Color(1, 1, 1).multiplyScalar(24) },
  };
  const archWorld = [0, 1, 2, 3].map(() => new THREE.Vector3());

  // floor: dark epoxy that catches the softboxes, fading into the cove
  const floorMat = new THREE.MeshStandardMaterial({ color: "#0b0c0f", roughness: 0.32, metalness: 0, envMap, envMapIntensity: 0.2 });
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

  const paint = withArch(
    new THREE.MeshPhysicalMaterial({ color: "#0b0c0e", metalness: 0.6, roughness: 0.34, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 1.25 }),
    arch,
  );
  const paintTrim = withArch(
    new THREE.MeshPhysicalMaterial({ color: "#050506", metalness: 0.2, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.1 }),
    arch,
  );
  const glass = withArch(
    new THREE.MeshPhysicalMaterial({ color: "#05070a", metalness: 0, roughness: 0.02, transparent: true, opacity: 0.82, clearcoat: 1, clearcoatRoughness: 0.0, envMapIntensity: 1.4, depthWrite: false }),
    arch,
  );
  const lampMats: THREE.MeshStandardMaterial[] = [];
  car.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return;
    const m = o.material as THREE.MeshStandardMaterial;
    const name = m.name;
    if (/^Paint 1/.test(name)) {
      paint.aoMap = m.aoMap;
      o.material = paint;
    } else if (/^Paint 2/.test(name)) {
      paintTrim.aoMap = m.aoMap;
      o.material = paintTrim;
    } else if (name === "Glass") {
      o.material = glass;
      o.renderOrder = 2;
    } else if (name === "Brake") {
      // the studio's one colour, on the calipers
      m.color.set("#c8f03e");
      m.metalness = 0.1;
      m.roughness = 0.35;
    } else if (/Interior 3|Interior 2|Interior 1|Panel Sides/.test(name)) {
      m.color.set(/Interior 3/.test(name) ? "#1b1815" : "#0c0c0d");
    } else if (name === "Headlight" || name === "Signallight" || name === "Brakelight") {
      m.emissive.set(name === "Brakelight" ? "#ff2a1a" : name === "Signallight" ? "#ff9a2a" : "#f4f8ff");
      m.emissiveIntensity = 0;
      m.userData.on = name === "Headlight" ? 6 : name === "Brakelight" ? 1.4 : 0;
      lampMats.push(m);
    } else if (name === "Rim2") {
      m.color.set("#8a8f96");
      m.roughness = 0.18;
    } else if (name === "Mirror") {
      m.roughness = 0.02;
    }
    if (!lampMats.includes(m) && m.emissive) m.emissive.setRGB(0, 0, 0);
    if (m.envMapIntensity !== undefined && !/^Paint|Glass/.test(name)) m.envMapIntensity = 0.8;
  });
  for (const m of [paint, paintTrim, glass]) m.envMap = envMap;
  car.traverse((o) => {
    if (o instanceof THREE.Mesh && "envMap" in o.material) (o.material as THREE.MeshStandardMaterial).envMap = envMap;
  });

  // nose to +z, wheels on the floor, centred
  const fl = car.getObjectByName("WheelFrontL");
  const rl = car.getObjectByName("WheelRearL");
  car.updateMatrixWorld(true);
  if (fl && rl) {
    const a = fl.getWorldPosition(new THREE.Vector3());
    const b = rl.getWorldPosition(new THREE.Vector3());
    car.rotation.y = Math.atan2(a.x - b.x, a.z - b.z) * -1;
    car.updateMatrixWorld(true);
  }
  const box = new THREE.Box3().setFromObject(car, true);
  const center = box.getCenter(new THREE.Vector3());
  car.position.x -= center.x;
  car.position.z -= center.z;
  car.position.y -= box.min.y;
  car.updateMatrixWorld(true);
  const size = box.getSize(new THREE.Vector3());
  const carRoot = new THREE.Group();
  carRoot.add(car);
  scene.add(carRoot);

  // a soft pool of light on the floor under the car, so the shadow has something to fall on
  const pool = new THREE.Mesh(
    new THREE.PlaneGeometry(9, 12).rotateX(-Math.PI / 2),
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: { uColor: { value: new THREE.Color("#3a3f48") } },
      vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: `uniform vec3 uColor; varying vec2 vUv;
        void main(){ float d = length((vUv - 0.5) * 2.0); float a = pow(1.0 - smoothstep(0.0, 1.0, d), 1.6);
          gl_FragColor = vec4(uColor, a * 0.85);
          #include <colorspace_fragment>
        }`,
    }),
  );
  pool.position.y = 0.001;
  scene.add(pool);

  await breathe();
  abort();
  const shadows = await contactShadows(renderer, carRoot, size);
  scene.add(shadows.group);

  // ── state ──
  let frame = opts.frame ?? DESKTOP_FRAME;
  let progress = opts.progress?.() ?? 0;
  let shown = progress;
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  let introT = -1; // -1: not started, else seconds since start
  let introDone = false;
  let visible = true;
  let raf = 0;
  let last = 0;
  let first = true;
  let disposed = false;
  // the frame watch: starts with the first visible frame, paused while off screen or hidden
  const watch = { on: !!opts.onSlow, t0: 0, n: 0, worst: 0, cost: 0 };

  const setArch = (z: number) => {
    archWorld[0].set(-ARCH_W, 0.25, z);
    archWorld[1].set(-ARCH_W, ARCH_H, z);
    archWorld[2].set(ARCH_W, ARCH_H, z);
    archWorld[3].set(ARCH_W, 0.25, z);
  };

  const placeCamera = (p: number, view: StillView | "live") => {
    const P = view === "phone" ? PHONE_POSE : null;
    const t = ease(clamp01(p));
    const az = P ? P.az : THREE.MathUtils.lerp(POSE_A.az, POSE_B.az, t) + pointer.x * 0.07;
    const el = P ? P.el : THREE.MathUtils.lerp(POSE_A.el, POSE_B.el, t) + pointer.y * 0.025;
    const dist = P ? P.dist : THREE.MathUtils.lerp(POSE_A.dist, POSE_B.dist, t);
    const tx = P ? P.tx : THREE.MathUtils.lerp(POSE_A.tx, POSE_B.tx, t);
    camera.fov = P ? P.fov : POSE_A.fov;
    camera.position.set(Math.sin(az) * Math.cos(el) * dist, TARGET.y + Math.sin(el) * dist, Math.cos(az) * Math.cos(el) * dist);
    camera.lookAt(TARGET.x + tx, TARGET.y, TARGET.z);
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

  const updateArchUniforms = () => {
    camera.updateMatrixWorld();
    archWorld.forEach((p, i) => arch.uArch.value[i].copy(p).applyMatrix4(camera.matrixWorldInverse));
  };

  const setLamps = (v: number) => {
    for (const m of lampMats) m.emissiveIntensity = (m.userData.on as number) * v;
  };

  const render = () => {
    updateArchUniforms();
    renderer.render(scene, camera);
  };

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
        const span = now - watch.t0;
        const fps = ((watch.n - WARM_FRAMES) * 1000) / Math.max(1, span);
        // the scene's own main-thread time per frame: on a slow CPU it leaves the page no room,
        // even where the screen refresh hides it (about 1 ms on a desktop, 8 ms at 4x CPU slowdown)
        const cost = watch.cost / Math.max(1, watch.n - WARM_FRAMES - 1);
        if (watch.worst > MAX_FRAME_MS || (span >= WATCH_MS && (fps < MIN_FPS || cost > MAX_COST_MS))) {
          watch.on = false;
          performance.mark("3d:slow", { detail: { fps, cost, worst: watch.worst } });
          opts.onSlow?.();
          return;
        }
        if (span >= WATCH_MS) {
          watch.on = false;
          performance.mark("3d:watch-ok", { detail: { fps, cost, worst: watch.worst } });
        }
      }
    }

    progress = opts.progress?.() ?? progress;
    const dp = progress - shown;
    shown += dp * Math.min(1, dt * 7);
    if (Math.abs(dp) > 0.0005) busy = true;
    else shown = progress;

    pointer.x += (pointer.tx - pointer.x) * Math.min(1, dt * 3.2);
    pointer.y += (pointer.ty - pointer.y) * Math.min(1, dt * 3.2);
    if (Math.abs(pointer.tx - pointer.x) + Math.abs(pointer.ty - pointer.y) > 0.0008) busy = true;

    // scroll: the arch runs from the front wheels to past the tail as the camera glides down the flank
    let archZ = THREE.MathUtils.lerp(ARCH_Z0, ARCH_Z1, ease(clamp01(shown / 0.85)));
    if (introT >= 0 && !introDone) {
      introT += dt;
      // arrival, from the same frame as the still: one pass of the arch, back to the tail, then in
      // again over the nose to settle where it was; the lamps blink once on the way
      const k = clamp01(introT / INTRO_S);
      archZ = k < 0.5 ? THREE.MathUtils.lerp(archZ, ARCH_Z1, ease(k / 0.5)) : THREE.MathUtils.lerp(ARCH_IN, archZ, easeOut((k - 0.5) / 0.5));
      setLamps(k < 0.6 || k > 0.8 ? 1 : 0.25 + Math.abs(Math.sin((k - 0.6) * Math.PI * 10)) * 0.75);
      if (k >= 1) {
        introDone = true;
        setLamps(1);
      }
      busy = true;
    }
    setArch(archZ);
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

  // first frame: finished state (matches the still), lamps on
  setLamps(1);
  setArch(ARCH_Z0);
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
      if (watch.on) watch.n = watch.worst = watch.cost = 0;
    },
    resize,
    intro: () => {
      if (introT >= 0) return;
      introT = 0;
      request();
    },
    still: (view) => {
      frame = view === "phone" ? PHONE_FRAME : DESKTOP_FRAME;
      pointer.x = pointer.y = pointer.tx = pointer.ty = 0;
      setLamps(1);
      setArch(ARCH_Z0);
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
