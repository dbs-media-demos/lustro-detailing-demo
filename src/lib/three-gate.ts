"use client";

/**
 * The only door to three.js. Nothing imports a 3D module statically: callers run `after3DGate`
 * in an effect, and the `import()` happens inside its callback, so phones, tablets, reduced
 * motion and Save-Data never download a byte of it.
 */
export const DESKTOP_3D_QUERY = "(min-width: 1024px) and (hover: hover) and (pointer: fine)";
const NO_3D = "lustro:no3d";
const SLOW = "lustro:3d-slow";
const SLOW_LIMIT = 2;

// This page load ran slow: the scenes after it on this page stay stills too (counted once per load)
let slowHere = false;

/**
 * `"gpu"`: no real graphics chip or no WebGL. Every 3D scene stays a still for the rest of the
 * visit, on every page and preview. `"slow"`: this page load couldn't keep a scene smooth (or the
 * CPU check failed). That only costs this page load; the visit goes to stills after 2 slow loads.
 * On 18 Nov one slow start (the GPU's first draw on a refresh) kept a fast PC on the still for
 * the whole tab.
 */
export function mark3DOff(why: "gpu" | "slow") {
  try {
    if (why === "gpu") sessionStorage.setItem(NO_3D, "gpu");
    else if (!slowHere) sessionStorage.setItem(SLOW, String(Number(sessionStorage.getItem(SLOW) || 0) + 1));
  } catch {
    // private mode without storage: this page still falls back, the next one tries again
  }
  if (why === "slow") slowHere = true;
}

function is3DOff() {
  if (slowHere) return true;
  try {
    // only "gpu" counts under the old key: a tab's old "1" (one slow start) doesn't hold any more
    return sessionStorage.getItem(NO_3D) === "gpu" || Number(sessionStorage.getItem(SLOW) || 0) >= SLOW_LIMIT;
  } catch {
    return false;
  }
}

export function can3D() {
  if (typeof window === "undefined") return false;
  if (!window.matchMedia(DESKTOP_3D_QUERY).matches) return false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  if (conn?.saveData) return false;
  if (is3DOff()) return false;
  return typeof WebGL2RenderingContext !== "undefined";
}

/**
 * A few milliseconds of the kind of math a 3D frame does, timed before three.js is even fetched.
 * About 0.9 ms on a current desktop, 3.5 ms with Chrome's 4x CPU slowdown: past 2.5 ms the scene
 * would cost the page its smoothness, so a slow CPU keeps the still without the warm-up. (A weak
 * graphics chip is caught later, by the scene's first two seconds of frames.)
 */
function cpuFastEnough() {
  const m = new Float32Array(16 * 400);
  const run = () => {
    const t = performance.now();
    for (let k = 0; k < 400 * 6; k++) {
      const o = (k % 400) * 16;
      for (let i = 0; i < 16; i++) m[o + i] = m[o + i] * 0.98 + Math.sin(k + i) * 0.01;
    }
    return performance.now() - t;
  };
  run(); // warms the JIT
  const times = [run(), run(), run(), run(), run()].sort((a, b) => a - b);
  return times[2] <= 2.5;
}

/**
 * After the page has loaded (and the browser has had a breath), call `yes` on a big screen with a
 * mouse and a quick enough CPU, otherwise `no`. Returns a cancel function.
 */
export function after3DGate(yes: () => void, no?: () => void) {
  let cancelled = false;
  let idle = 0;
  const run = () => {
    if (cancelled) return;
    if (can3D() && cpuFastEnough()) return yes();
    if (can3D()) mark3DOff("slow"); // the CPU failed: this load stays on the still (two such loads: the visit)
    no?.();
  };
  const onLoad = () => {
    if (typeof window.requestIdleCallback === "function") idle = window.requestIdleCallback(run, { timeout: 600 });
    else idle = window.setTimeout(run, 120);
  };
  if (document.readyState === "complete") onLoad();
  else window.addEventListener("load", onLoad, { once: true });
  return () => {
    cancelled = true;
    window.removeEventListener("load", onLoad);
    if (typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(idle);
    window.clearTimeout(idle);
  };
}
