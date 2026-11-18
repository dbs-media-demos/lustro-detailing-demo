"use client";

import { useEffect, useRef, useState } from "react";
import { useT } from "@/lib/i18n";
import { prefersReducedMotion } from "@/lib/motion";

/**
 * The /v2 hero's centrepiece on desktop, without any 3D: the swirl check every detailer does under a
 * handheld LED torch, drawn in canvas 2D over the same still of the gloss-black car.
 *
 * Where the paint hasn't been corrected yet, the torch's reflection is hazy and ringed by swirl marks
 * (fine concentric scratches that light up around a point light, the thing customers are shown before
 * a correction). A tape line runs across the car: in front of it the paint is corrected and the same
 * torch is a crisp, clean point. On arrival the torch slides from the doors to the nose while the
 * polish line advances, so the swirls vanish as it crosses; then it drifts across the line on its own,
 * follows the cursor when there is one, and scrolling finishes the correction to the tail.
 *
 * The light only lands on paint: everything is cut by `public/hero/paint-mask.webp`, rendered from
 * the 3D scene in the still's exact frame (scripts/paint-mask.mjs), and cropped here exactly like the
 * still's `object-fit: cover`. Draws only while the hero is on screen and the tab visible; with
 * reduced motion it is one still frame, half before and half after.
 */
const MASK = "/hero/paint-mask.webp?v=1";
const MW = 1200; // mask = the still at half size
const MH = 750;
// the car in mask pixels, and where the torch may go (the flank and the front wing)
const CAR = { x0: 500, x1: 1180, y0: 280, y1: 515 };
const ROAM = { x0: 560, x1: 1080, y0: 360, y1: 455 };
const LINE_FROM = 505; // nothing corrected yet (the nose)
const LINE_TO = 950; // after the arrival: the nose, the front wing and half the door are done
const LINE_END = 1190; // past the tail: the whole car corrected
const LABEL_Y = 528; // under the sills
const INTRO = 3.2;
const ARCS = 440;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

type Arc = { r: number; a: number; len: number; w: number; alpha: number; ph: number; hue: string | null };

function makeArcs(): Arc[] {
  // a fixed seed: the same swirl pattern on every visit
  let s = 7;
  const rnd = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
  return Array.from({ length: ARCS }, () => {
    const r = 0.22 + 2.7 * Math.pow(rnd(), 0.85);
    return {
      r,
      a: rnd() * Math.PI * 2,
      len: 0.07 + rnd() * rnd() * 0.55,
      w: 0.5 + rnd() * 0.8,
      alpha: (0.25 + rnd() * 0.55) * Math.pow(1 - r / 3, 1.4),
      ph: rnd() * Math.PI * 2,
      // a few holograms: the faint rainbow a rotary polisher leaves
      hue: rnd() < 0.16 ? `hsla(${Math.floor(rnd() * 360)}, 70%, 78%,` : null,
    };
  });
}

/** Sits inside the hero's stage (the layer that holds the still), which it measures and drifts. */
export default function PaintCheck() {
  const t = useT();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const afterRef = useRef<HTMLSpanElement>(null);
  const beforeRef = useRef<HTMLSpanElement>(null);
  const hintRef = useRef<HTMLSpanElement>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const stg = canvas?.closest<HTMLElement>(".hero-stage");
    const sec = canvas?.closest("section");
    const ctx = canvas?.getContext("2d");
    if (!canvas || !sec || !stg || !ctx) return;
    const still = prefersReducedMotion();
    const arcs = makeArcs();
    const mask = new Image();
    let disposed = false;
    let raf = 0;
    let visible = true;
    let ready = false;
    let t0 = 0;
    let last = 0;
    // layout: the still's cover crop, in CSS pixels of the stage
    let W = 0;
    let H = 0;
    let sc = 1;
    let ox = 0;
    let oy = 0;
    let dpr = 1;
    let beforeW = 0;
    let hintW = 0;
    const layout = () => {
      beforeW = beforeRef.current?.offsetWidth ?? 0;
      hintW = hintRef.current?.offsetWidth ?? 0;
      W = stg.clientWidth;
      H = stg.clientHeight;
      dpr = Math.min(1.5, window.devicePixelRatio || 1);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      sc = Math.max(W / MW, H / MH);
      // the same object-position as .hero-still (82% below a 3:2 hero, else 60%)
      ox = (W - MW * sc) * (W / H <= 1.5 ? 0.82 : 0.6);
      oy = (H - MH * sc) * 0.5;
    };
    // torch and line, in mask pixels
    const torch = { x: 1050, y: 420, tx: 1050, ty: 420 };
    let line = still ? LINE_TO : LINE_FROM;
    let pointerAt = -1e9;
    let scrollP = 0;
    let shown = 0;
    let hintGone = false;

    const draw = (now: number) => {
      const X = (mx: number) => ox + mx * sc;
      const Y = (my: number) => oy + my * sc;
      const rx = X(CAR.x0);
      const ry = Y(CAR.y0);
      const rw = (CAR.x1 - CAR.x0) * sc;
      const rh = (CAR.y1 - CAR.y0) * sc;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(0, 0, W, H);
      ctx.save();
      ctx.beginPath();
      ctx.rect(rx, ry, rw, rh);
      ctx.clip();

      const cx = X(torch.x);
      const cy = Y(torch.y);
      const lx = X(line);
      const rad = Math.max(26, H * 0.045);
      const k = shown;

      // ── before: a hazy reflection ringed by swirl marks ──
      if (lx < rx + rw) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(lx, ry, rx + rw - lx, rh);
        ctx.clip();
        let g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad * 2.4);
        g.addColorStop(0, `rgba(255,255,255,${0.26 * k})`);
        g.addColorStop(0.35, `rgba(235,240,245,${0.1 * k})`);
        g.addColorStop(1, "rgba(235,240,245,0)");
        ctx.fillStyle = g;
        ctx.fillRect(cx - rad * 2.4, cy - rad * 2.4, rad * 4.8, rad * 4.8);
        ctx.globalCompositeOperation = "lighter";
        // the swirls shimmer as the light moves: a different set of scratches catches it
        const sh = torch.x * 0.031 + torch.y * 0.047;
        for (const a of arcs) {
          const al = a.alpha * k * (0.35 + 0.65 * Math.abs(Math.sin(a.ph + sh)));
          if (al < 0.02) continue;
          ctx.beginPath();
          ctx.ellipse(cx, cy, a.r * rad, a.r * rad * 0.74, 0, a.a, a.a + a.len);
          ctx.lineWidth = a.w;
          ctx.strokeStyle = a.hue ? `${a.hue}${al * 0.8})` : `rgba(238,242,246,${al})`;
          ctx.stroke();
        }
        ctx.globalCompositeOperation = "source-over";
        g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad * 0.62);
        g.addColorStop(0, `rgba(255,255,255,${0.62 * k})`);
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g;
        ctx.fillRect(cx - rad, cy - rad, rad * 2, rad * 2);
        ctx.restore();
      }

      // ── after: the same torch, a crisp clean point in deep black ──
      if (lx > rx) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(rx, ry, lx - rx, rh);
        ctx.clip();
        // a tight bloom, then the torch's lens itself, sharp-edged: the paint is a mirror again
        let g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad * 1.25);
        g.addColorStop(0, `rgba(255,255,255,${0.3 * k})`);
        g.addColorStop(0.4, `rgba(240,248,255,${0.08 * k})`);
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g;
        ctx.fillRect(cx - rad * 1.25, cy - rad * 1.25, rad * 2.5, rad * 2.5);
        ctx.globalCompositeOperation = "lighter";
        g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad * 0.42);
        g.addColorStop(0, `rgba(255,255,255,${k})`);
        g.addColorStop(0.62, `rgba(255,255,255,${0.95 * k})`);
        g.addColorStop(0.84, `rgba(236,252,190,${0.35 * k})`);
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g;
        ctx.save();
        // squashed and leaning with the flank, like a reflection on a curved panel, not a sticker
        ctx.translate(cx, cy);
        ctx.rotate(-0.12);
        ctx.scale(1, 0.62);
        ctx.translate(-cx, -cy);
        ctx.beginPath();
        ctx.arc(cx, cy, rad * 0.42, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        ctx.globalCompositeOperation = "source-over";
        ctx.restore();
      }

      // ── the tape line between them, on the paint only ──
      if (lx > rx && lx < rx + rw) {
        const g = ctx.createLinearGradient(lx - 10, 0, lx + 10, 0);
        g.addColorStop(0, "rgba(212,250,76,0)");
        g.addColorStop(0.5, `rgba(212,250,76,${0.3 * k})`);
        g.addColorStop(1, "rgba(212,250,76,0)");
        ctx.fillStyle = g;
        ctx.fillRect(lx - 10, ry, 20, rh);
        ctx.fillStyle = `rgba(222,252,120,${0.95 * k})`;
        ctx.fillRect(lx - 0.75, ry, 1.5, rh);
      }

      // cut it all to the paint (fading where the panels turn away)
      ctx.globalCompositeOperation = "destination-in";
      ctx.drawImage(mask, ox, oy, MW * sc, MH * sc);
      ctx.restore();

      // the labels ride the line, just under the sills
      const ly = Y(LABEL_Y);
      // "before" leaves as the line nears the tail (or would run off the screen)
      const room = (w: number) => clamp01((W - 28 - (lx + 14 + w)) / 40);
      const fade = clamp01((CAR.x1 - 40 - line) / 60) * k;
      if (afterRef.current) {
        afterRef.current.style.transform = `translate3d(${lx - 14}px, ${ly}px, 0) translateX(-100%)`;
        afterRef.current.style.opacity = String(clamp01((line - CAR.x0 - 60) / 80) * k);
      }
      if (beforeRef.current) {
        beforeRef.current.style.transform = `translate3d(${lx + 14}px, ${ly}px, 0)`;
        beforeRef.current.style.opacity = String(fade * room(beforeW));
      }
      if (hintRef.current) {
        hintRef.current.style.transform = `translate3d(${lx + 14}px, ${ly + 22}px, 0)`;
        hintRef.current.style.opacity = String(hintGone ? 0 : fade * room(hintW) * 0.85);
      }
      void now;
    };

    const tick = (now: number) => {
      raf = 0;
      if (disposed || !visible) return;
      const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
      last = now;
      const s = (now - t0) / 1000;
      shown = clamp01(s / 0.6);
      // the arrival: the polish line runs over the nose while the torch slides forward across it
      const introLine = LINE_FROM + (LINE_TO - LINE_FROM) * ease(clamp01((s - 0.5) / 2.1));
      // scrolling finishes the job, to past the tail
      line = Math.min(LINE_END, introLine + (LINE_END - LINE_TO) * scrollP);
      if (s < INTRO && now - pointerAt > 3500) {
        const p = ease(clamp01((s - 0.3) / 2.9));
        torch.tx = 1050 + (880 - 1050) * p;
        torch.ty = 420 + (412 - 420) * p;
      } else if (now - pointerAt > 3500) {
        // on its own: a slow pass back and forth over the line, so the difference keeps showing
        const u = s - INTRO;
        torch.tx = 965 - 85 * Math.cos(u * 0.55);
        torch.ty = 414 + 18 * Math.sin(u * 0.83);
      }
      const f = 1 - Math.exp(-dt * (s < INTRO ? 14 : 5));
      torch.x += (torch.tx - torch.x) * f;
      torch.y += (torch.ty - torch.y) * f;
      draw(now);
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (!raf && visible && ready && !still) raf = requestAnimationFrame(tick);
    };

    const onPointer = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const r = stg.getBoundingClientRect();
      const mx = (e.clientX - r.left - ox) / sc;
      const my = (e.clientY - r.top - oy) / sc;
      // only near the car: reading the headline or reaching for a button leaves the torch alone
      if (mx < CAR.x0 - 100 || my < CAR.y0 - 140 || my > CAR.y1 + 110) return;
      torch.tx = Math.min(ROAM.x1, Math.max(ROAM.x0, mx));
      torch.ty = Math.min(ROAM.y1, Math.max(ROAM.y0, my));
      pointerAt = performance.now();
      if (!hintGone && mx > CAR.x0 && mx < CAR.x1) hintGone = true;
    };
    const onScroll = () => {
      const y = window.scrollY;
      const h = sec.offsetHeight;
      // the stage drifts at a third of the page's speed, as on the 3D hero
      stg.style.transform = `translate3d(0, ${Math.min(y, h) * 0.32}px, 0)`;
      scrollP = clamp01(y / (h * 0.55));
    };
    const onResize = () => {
      layout();
      if (still && ready) draw(0);
    };
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting && !document.hidden;
      if (visible) {
        last = 0;
        start();
      }
    });
    const onVis = () => {
      visible = !document.hidden && sec.getBoundingClientRect().bottom > 0;
      if (visible) {
        last = 0;
        start();
      }
    };

    layout();
    mask.decoding = "async";
    mask.src = MASK;
    mask
      .decode()
      .then(() => {
        if (disposed) return;
        ready = true;
        setOn(true);
        if (still) {
          // one frame, half before and half after, the torch sitting on the line
          shown = 1;
          torch.x = LINE_TO - 4;
          torch.y = 415;
          draw(0);
          return;
        }
        t0 = performance.now();
        start();
      })
      .catch(() => {});

    window.addEventListener("resize", onResize);
    if (!still) {
      window.addEventListener("pointermove", onPointer, { passive: true });
      window.addEventListener("scroll", onScroll, { passive: true });
      document.addEventListener("visibilitychange", onVis);
      io.observe(sec);
      onScroll();
    }
    return () => {
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVis);
      stg.style.transform = "";
    };
  }, []);

  const label = "t-label pointer-events-none absolute left-0 top-0 whitespace-nowrap text-[0.66rem] will-change-transform";
  return (
    <div aria-hidden className={`absolute inset-0 transition-opacity duration-500 ${on ? "opacity-100" : "opacity-0"}`}>
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full mix-blend-screen" />
      <span ref={afterRef} className={`${label} text-pearl`} style={{ opacity: 0 }}>
        <span className="mr-2 inline-block h-1.5 w-1.5 -translate-y-px rounded-full bg-volt align-middle" />
        {t("After · corrected")}
      </span>
      <span ref={beforeRef} className={`${label} text-mist`} style={{ opacity: 0 }}>
        {t("Before · swirl marks")}
      </span>
      <span ref={hintRef} className={`${label} text-mist/80 transition-opacity duration-500`} style={{ opacity: 0 }}>
        {t("Move the light over the paint")}
      </span>
    </div>
  );
}
