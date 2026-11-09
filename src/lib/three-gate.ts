"use client";

/**
 * The only door to three.js. Nothing imports a 3D module statically: callers run `after3DGate`
 * in an effect, and the `import()` happens inside its callback, so phones, tablets, reduced
 * motion and Save-Data never download a byte of it.
 */
export const DESKTOP_3D_QUERY = "(min-width: 1024px) and (hover: hover) and (pointer: fine)";

export function can3D() {
  if (typeof window === "undefined") return false;
  if (!window.matchMedia(DESKTOP_3D_QUERY).matches) return false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  if (conn?.saveData) return false;
  return typeof WebGL2RenderingContext !== "undefined";
}

/**
 * After the page has loaded (and the browser has had a breath), call `yes` on a big screen with a
 * mouse, otherwise `no`. Returns a cancel function.
 */
export function after3DGate(yes: () => void, no?: () => void) {
  let cancelled = false;
  let idle = 0;
  const run = () => {
    if (cancelled) return;
    if (can3D()) yes();
    else no?.();
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
