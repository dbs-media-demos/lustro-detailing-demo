"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import hood from "@/assets/photos/wipe-hood.jpg";
import { Reveal } from "@/components/ui/Reveal";
import { Roll } from "@/components/ui/Roll";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { useArrive } from "@/components/ui/useArrive";
import { useT } from "@/lib/i18n";
import { isPhone, isTouch, prefersReducedMotion, usePhone } from "@/lib/motion";

/*
 * The signature moment: a gloss-black hood that rolls in dusty. As you scroll, snow foam slides
 * down over the dirt, a rinse sheet sweeps it away left to right, water beads roll off and a
 * band of studio light crosses the clean paint while the gloss meter climbs from 14 to 96 GU.
 * Before the rinse you can wipe the dust off yourself (mouse, or a sideways swipe on phones).
 *
 * One <canvas> over the photo. The dust and foam are generated once per size (seeded noise,
 * streaks, water spots, bubbles), so each frame is a few clipped drawImage calls. It only draws
 * while the section is on screen, at 30 fps on touch devices.
 * Reduced motion: no pinning or scrubbing; the panel sits half rinsed (a before/after) and can
 * still be wiped by hand.
 * Phones: none of this runs. WashStacked has the same words stacked, and one CSS rinse.
 */

const STEPS = ["Dust", "Foam", "Rinse", "Gloss"] as const;
const LINES = [
  "Every car rolls in like this.",
  "Snow foam lifts the grit first,",
  "so nothing scratches on the way off.",
  "And leaves like this.",
] as const;

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (a: number, b: number, v: number) => {
  const x = clamp((v - a) / (b - a));
  return x * x * (3 - 2 * x);
};

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeCanvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
}

/** A small random RGBA tile that, stretched with smoothing on, becomes soft organic blotches. */
function noiseTile(w: number, h: number, rand: () => number, rgb: [number, number, number], aMin: number, aMax: number, jitter = 12) {
  const c = makeCanvas(w, h);
  const ctx = c.getContext("2d")!;
  const img = ctx.createImageData(w, h);
  for (let i = 0; i < w * h; i++) {
    const j = (rand() - 0.5) * jitter;
    img.data[i * 4] = rgb[0] + j;
    img.data[i * 4 + 1] = rgb[1] + j;
    img.data[i * 4 + 2] = rgb[2] + j;
    img.data[i * 4 + 3] = 255 * (aMin + rand() * (aMax - aMin));
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

function makeDust(W: number, H: number, s: number) {
  const rand = rng(7);
  const c = makeCanvas(W, H);
  const g = c.getContext("2d")!;
  g.imageSmoothingEnabled = true;
  g.imageSmoothingQuality = "high";
  // a dusty film, heavier in patches
  g.drawImage(noiseTile(26, 18, rand, [128, 116, 98], 0.36, 0.82), 0, 0, W, H);
  g.drawImage(noiseTile(90, 60, rand, [92, 80, 64], 0, 0.36), 0, 0, W, H);
  g.drawImage(noiseTile(Math.round(W / 5), Math.round(H / 5), rand, [160, 150, 132], 0, 0.22, 30), 0, 0, W, H);
  // road grime climbing up from the bottom
  const road = g.createLinearGradient(0, H, 0, H * 0.45);
  road.addColorStop(0, "rgba(70,56,40,0.62)");
  road.addColorStop(1, "rgba(70,56,40,0)");
  g.fillStyle = road;
  g.fillRect(0, 0, W, H);
  // dried rain trails
  for (let i = 0; i < 80; i++) {
    const x = rand() * W;
    const y = rand() * H * 0.55;
    const len = H * (0.12 + rand() * 0.35);
    const w = (1.2 + rand() * 3) * s;
    const tr = g.createLinearGradient(0, y, 0, y + len);
    tr.addColorStop(0, "rgba(206,196,176,0.32)");
    tr.addColorStop(1, "rgba(206,196,176,0)");
    g.strokeStyle = tr;
    g.lineWidth = w;
    g.lineCap = "round";
    g.beginPath();
    g.moveTo(x, y);
    g.quadraticCurveTo(x + (rand() - 0.5) * 14 * s, y + len / 2, x + (rand() - 0.5) * 10 * s, y + len);
    g.stroke();
  }
  // water spots
  for (let i = 0; i < 260; i++) {
    const r = (1.5 + rand() * 6) * s;
    g.beginPath();
    g.arc(rand() * W, rand() * H, r, 0, Math.PI * 2);
    g.fillStyle = "rgba(214,204,184,0.1)";
    g.fill();
    g.lineWidth = Math.max(1, 0.8 * s);
    g.strokeStyle = "rgba(220,210,190,0.38)";
    g.stroke();
  }
  return c;
}

function makeFoam(W: number, H: number, s: number) {
  const rand = rng(11);
  const c = makeCanvas(W, H);
  const g = c.getContext("2d")!;
  g.imageSmoothingEnabled = true;
  g.imageSmoothingQuality = "high";
  g.drawImage(noiseTile(40, 26, rand, [246, 248, 250], 0.92, 1), 0, 0, W, H);
  g.drawImage(noiseTile(140, 90, rand, [196, 206, 216], 0, 0.22), 0, 0, W, H);
  // clusters of bubbles with a little shade under each, so the foam has volume
  for (let i = 0; i < 2600; i++) {
    const r = (2 + rand() * rand() * 13) * s;
    const x = rand() * W;
    const y = rand() * H;
    g.beginPath();
    g.arc(x + r * 0.2, y + r * 0.25, r, 0, Math.PI * 2);
    g.fillStyle = "rgba(150,164,180,0.22)";
    g.fill();
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fillStyle = "rgba(255,255,255,0.92)";
    g.fill();
  }
  for (let i = 0; i < 1100; i++) {
    const r = (1.5 + rand() * rand() * 10) * s;
    const x = rand() * W;
    const y = rand() * H;
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.lineWidth = Math.max(0.8, 0.9 * s);
    g.strokeStyle = `rgba(150,162,176,${0.25 + rand() * 0.3})`;
    g.stroke();
    g.beginPath();
    g.arc(x - r * 0.35, y - r * 0.35, r * 0.28, 0, Math.PI * 2);
    g.fillStyle = "rgba(255,255,255,0.9)";
    g.fill();
  }
  return c;
}

type Bead = { x: number; y: number; r: number; v: number };

export function WashScene() {
  const t = useT();
  const outer = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const meter = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const glint = useRef<HTMLDivElement>(null);
  const cursor = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  const [still, setStill] = useState(false);
  const [wiped, setWiped] = useState(false);
  const phone = usePhone();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- media query is client-only
    setStill(prefersReducedMotion());
  }, []);

  useEffect(() => {
    const cv = canvas.current;
    const pn = panel.current;
    const ot = outer.current;
    if (!cv || !pn || !ot || isPhone()) return;
    const reduced = prefersReducedMotion();
    const touch = isTouch();
    const ctx = cv.getContext("2d")!;

    let W = 0;
    let H = 0;
    let s = 1;
    let dust: HTMLCanvasElement | null = null;
    let foam: HTMLCanvasElement | null = null;
    let dirt: HTMLCanvasElement | null = null; // dust minus what's been wiped by hand
    let beads: Bead[] = [];
    let p = reduced ? 0.6 : 0;
    let wipeBonus = 0;
    let visible = false;
    let raf = 0;
    let last = 0;
    let lastStep = -1;

    const build = () => {
      const r = pn.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const dpr = Math.min(window.devicePixelRatio || 1, touch ? 1.25 : 1.5);
      const w = Math.round(r.width * dpr);
      const h = Math.round(r.height * dpr);
      if (dust && Math.abs(w - W) < 40 && Math.abs(h - H) < 40) return;
      W = cv.width = w;
      H = cv.height = h;
      s = dpr * Math.max(0.7, Math.min(1.3, r.width / 1200));
      dust = makeDust(W, H, s);
      foam = makeFoam(W, H, s);
      dirt = makeCanvas(W, H);
      dirt.getContext("2d")!.drawImage(dust, 0, 0);
      const rand = rng(23);
      beads = Array.from({ length: touch ? 90 : 170 }, () => ({ x: rand() * W, y: rand() * H, r: (2 + rand() * rand() * 9) * s, v: 0.4 + rand() * 1.2 }));
    };

    // the rinse front: a wavy, slightly diagonal line that sweeps left → right
    const rinseX = (y: number, x0: number, time: number) => x0 + Math.sin(y / (H * 0.11) + time * 1.6) * W * 0.012 - (y / H) * W * 0.12;
    // the foam front: slides down with a few drips hanging under it
    const drips = [0.12, 0.31, 0.46, 0.63, 0.81, 0.93];
    const foamY = (x: number, y0: number, time: number) => {
      let y = y0 + Math.sin(x / (W * 0.07) + time) * H * 0.012;
      for (let i = 0; i < drips.length; i++) {
        const d = (x - drips[i] * W) / (W * 0.025);
        y += Math.exp(-d * d) * H * (0.05 + (i % 3) * 0.03);
      }
      return y;
    };

    const draw = (time: number) => {
      if (!dust || !foam || !dirt) return;
      const f = reduced ? 0 : smooth(0.1, 0.36, p);
      const r = smooth(0.4, 0.78, p);
      const clean = smooth(0.4, 0.94, p);
      const x0 = -W * 0.1 + r * W * 1.32;
      const y0 = -H * 0.25 + f * H * 1.35;
      ctx.clearRect(0, 0, W, H);

      // everything the rinse hasn't reached yet: dirt, then foam on top
      if (r < 1) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(W, 0);
        for (let y = 0; y <= H; y += H / 24) ctx.lineTo(rinseX(y, x0, time), y);
        ctx.lineTo(W, H);
        ctx.closePath();
        ctx.clip();
        ctx.globalAlpha = 1 - f * 0.4;
        ctx.drawImage(dirt, 0, 0);
        ctx.globalAlpha = 1;
        if (f > 0) {
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(0, 0);
          for (let x = 0; x <= W; x += W / 60) ctx.lineTo(x, foamY(x, y0, time * 0.5));
          ctx.lineTo(W, 0);
          ctx.closePath();
          ctx.clip();
          ctx.globalAlpha = 0.96;
          ctx.drawImage(foam, 0, 0);
          ctx.restore();
        }
        ctx.restore();
      }

      // the sheet of water right behind the rinse front
      if (r > 0 && r < 1) {
        const band = W * 0.1;
        ctx.save();
        ctx.beginPath();
        for (let y = 0; y <= H; y += H / 24) ctx.lineTo(rinseX(y, x0, time), y);
        for (let y = H; y >= 0; y -= H / 24) ctx.lineTo(rinseX(y, x0, time) - band, y);
        ctx.closePath();
        ctx.clip();
        const gr = ctx.createLinearGradient(x0 - band, 0, x0, 0);
        gr.addColorStop(0, "rgba(220,234,255,0)");
        gr.addColorStop(1, "rgba(220,234,255,0.34)");
        ctx.fillStyle = gr;
        ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = "rgba(255,255,255,0.35)";
        ctx.lineWidth = 1.2 * s;
        for (let i = 0; i < 14; i++) {
          const yy = ((i / 14) * H + time * 160 * s) % H;
          ctx.beginPath();
          ctx.moveTo(x0 - band, yy);
          ctx.lineTo(x0, yy + H * 0.04);
          ctx.stroke();
        }
        ctx.restore();
      }

      // beads on the rinsed paint, sliding off as it dries
      const fade = 1 - smooth(0.8, 0.96, p);
      if (r > 0 && fade > 0) {
        const roll = smooth(0.78, 0.96, p);
        for (const b of beads) {
          if (b.x > rinseX(b.y, x0, time) - W * 0.02) continue;
          const y = b.y + roll * b.v * H * 0.5;
          if (y - b.r > H) continue;
          ctx.globalAlpha = fade;
          ctx.beginPath();
          ctx.arc(b.x + b.r * 0.25, y + b.r * 0.35, b.r, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(0,0,0,0.35)";
          ctx.fill();
          const hl = ctx.createRadialGradient(b.x - b.r * 0.35, y - b.r * 0.4, 0, b.x, y, b.r);
          hl.addColorStop(0, "rgba(255,255,255,0.95)");
          hl.addColorStop(0.3, "rgba(230,240,255,0.25)");
          hl.addColorStop(1, "rgba(200,220,255,0.06)");
          ctx.beginPath();
          ctx.arc(b.x, y, b.r, 0, Math.PI * 2);
          ctx.fillStyle = hl;
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      }

      // readouts: gloss units and the light crossing the finished paint
      const gu = Math.round(14 + Math.min(18, wipeBonus) * (1 - clean) + 82 * clean);
      if (meter.current) meter.current.textContent = String(gu);
      if (bar.current) bar.current.style.transform = `scaleX(${gu / 100})`;
      if (glint.current) {
        const g = smooth(0.82, 1, p);
        glint.current.style.opacity = String(g > 0 && g < 1 ? 1 : 0);
        glint.current.style.transform = `translate3d(${-60 + g * 160}%,0,0)`;
      }
      const st = p < 0.12 ? 0 : p < 0.4 ? 1 : p < 0.8 ? 2 : 3;
      if (st !== lastStep) {
        lastStep = st;
        setStep(st);
      }
    };

    const loop = (now: number) => {
      raf = 0;
      if (!visible) return;
      if (!touch || now - last > 32) {
        last = now;
        draw(reduced ? 0 : now / 1000);
      }
      if (!reduced) raf = requestAnimationFrame(loop);
    };
    const kick = () => {
      if (!raf && visible) raf = requestAnimationFrame(loop);
    };

    const onScroll = () => {
      if (reduced) return;
      const r = ot.getBoundingClientRect();
      const span = r.height - window.innerHeight;
      p = span > 0 ? clamp(-r.top / span) : 0;
    };

    // wiping by hand: a soft microfiber brush that erases the dust layer
    let lastPt: { x: number; y: number } | null = null;
    const wipe = (e: PointerEvent) => {
      const c = cursor.current;
      const rect = cv.getBoundingClientRect();
      if (c && !touch) c.style.transform = `translate3d(${e.clientX - rect.left}px,${e.clientY - rect.top}px,0)`;
      if (!dirt || p > 0.42) return;
      const k = W / rect.width;
      const pt = { x: (e.clientX - rect.left) * k, y: (e.clientY - rect.top) * k };
      const d = dirt.getContext("2d")!;
      const rad = Math.min(W, H) * (touch ? 0.09 : 0.075);
      d.globalCompositeOperation = "destination-out";
      const from = lastPt ?? pt;
      const dist = Math.hypot(pt.x - from.x, pt.y - from.y);
      const n = Math.max(1, Math.ceil(dist / (rad * 0.3)));
      for (let i = 1; i <= n; i++) {
        const x = from.x + ((pt.x - from.x) * i) / n;
        const y = from.y + ((pt.y - from.y) * i) / n;
        const gr = d.createRadialGradient(x, y, 0, x, y, rad);
        gr.addColorStop(0, "rgba(0,0,0,0.55)");
        gr.addColorStop(1, "rgba(0,0,0,0)");
        d.fillStyle = gr;
        d.fillRect(x - rad, y - rad, rad * 2, rad * 2);
      }
      d.globalCompositeOperation = "source-over";
      wipeBonus += dist / W;
      lastPt = pt;
      setWiped(true);
      if (reduced) draw(0);
    };
    const endWipe = () => {
      lastPt = null;
    };

    const ro = new ResizeObserver(() => {
      build();
      onScroll();
      draw(0);
    });
    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting;
        if (visible) {
          build();
          onScroll();
          draw(0);
          kick();
        }
      },
      { rootMargin: "50% 0px" },
    );
    io.observe(pn);
    ro.observe(pn);
    window.addEventListener("scroll", onScroll, { passive: true });
    cv.addEventListener("pointermove", wipe);
    cv.addEventListener("pointerleave", endWipe);
    cv.addEventListener("pointerup", endWipe);
    cv.addEventListener("pointercancel", endWipe);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
      cv.removeEventListener("pointermove", wipe);
      cv.removeEventListener("pointerleave", endWipe);
      cv.removeEventListener("pointerup", endWipe);
      cv.removeEventListener("pointercancel", endWipe);
    };
  }, [phone]);

  return (
    <section aria-labelledby="wash-title" className="relative bg-ink phone:order-4">
      <WashStacked />
      <div ref={outer} className={clsx("relative phone:hidden", still ? "" : "h-[340vh] md:h-[380vh]")}>
        <div className={clsx("top-0 flex h-[100svh] flex-col overflow-hidden", !still && "sticky")}>
          <div ref={panel} className="group relative flex-1 overflow-hidden">
            <Image src={hood} alt={t("The gloss-black hood and windscreen of an SUV under studio lights")} fill sizes="100vw" quality={75} className="object-cover object-[50%_65%]" />
            <canvas ref={canvas} aria-hidden className="absolute inset-0 h-full w-full touch-pan-y md:cursor-none" />
            <div ref={glint} aria-hidden className="pointer-events-none absolute inset-y-0 -left-1/2 w-full opacity-0 mix-blend-screen" style={{ background: "linear-gradient(100deg, transparent 35%, rgba(255,255,255,0.28) 48%, rgba(212,250,76,0.18) 50%, rgba(255,255,255,0.22) 52%, transparent 65%)" }} />
            <div
              ref={cursor}
              aria-hidden
              className={clsx(
                "pointer-events-none absolute left-0 top-0 hidden h-24 w-24 items-center justify-center rounded-full border border-pearl/60 bg-pearl/10 backdrop-blur-[2px] transition-opacity duration-300 md:flex",
                step > 1 ? "opacity-0" : "opacity-0 group-hover:opacity-100",
              )}
              style={{ marginLeft: "-3rem", marginTop: "-3rem" }}
            >
              <span className="t-label text-[0.6rem] text-pearl">{t("Wipe")}</span>
            </div>
            <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(7,8,10,0.82)_0%,rgba(7,8,10,0.2)_34%,rgba(7,8,10,0)_60%,rgba(7,8,10,0.75)_100%)]" />

            <div className="pointer-events-none absolute inset-x-0 top-0 px-[var(--gutter)] pt-[calc(var(--header-h)+1.5rem)]">
              <p className="t-label text-volt">{t("01 — The wash")}</p>
              <h2 id="wash-title" className="t-display t-md relative mt-4 max-w-[15ch]">
                <span className="sr-only">{t(LINES[0])} {t(LINES[3])}</span>
                <span aria-hidden className="grid">
                  {LINES.map((l, i) => (
                    <span key={l} className={clsx("col-start-1 row-start-1 transition-[opacity,transform] duration-700", i === step ? "opacity-100" : "translate-y-3 opacity-0", i === 3 && "t-gloss")}>
                      {t(l)}
                    </span>
                  ))}
                </span>
              </h2>
            </div>

            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col gap-5 px-[var(--gutter)] pb-36 md:items-end md:pb-10">
              <ol className="t-label flex gap-4 text-[0.66rem] sm:gap-6" aria-label={t("Wash steps")}>
                {STEPS.map((sName, i) => (
                  <li key={sName} className={clsx("flex items-center gap-2 transition-colors duration-500", i <= step ? "text-pearl" : "text-pearl/35")}>
                    <span className={clsx("h-1.5 w-1.5 rounded-full transition-colors", i === step ? "bg-volt" : i < step ? "bg-pearl" : "bg-pearl/30")} aria-hidden />
                    {t(sName)}
                  </li>
                ))}
              </ol>
              <div className="w-full max-w-xs">
                <p className="t-label flex items-baseline justify-between text-[0.66rem] text-mist">
                  <span>{t("Gloss meter")}</span>
                  <span>
                    <span ref={meter} className="font-display text-3xl font-extrabold tracking-tight text-pearl tabular-nums">
                      14
                    </span>{" "}
                    GU
                  </span>
                </p>
                <span className="mt-2 block h-1 overflow-hidden rounded-full bg-pearl/15">
                  <span ref={bar} className="block h-full origin-left rounded-full bg-volt" style={{ transform: "scaleX(0.14)" }} />
                </span>
              </div>
            </div>

            <p className={clsx("t-label pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-pearl/30 bg-ink/50 px-4 py-2.5 text-[0.66rem] backdrop-blur transition-opacity duration-500", wiped || step > 1 ? "opacity-0" : "opacity-100")}>
              <span className="hidden md:inline">{t("Move across the paint to wipe it")}</span>
              <span className="md:hidden">{t("Swipe sideways to wipe")}</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * The scene on phones: the same words, one on top of the other, nothing pinned. The dust rinses
 * off the photo once as it arrives and the gloss meter climbs with it (transform only).
 */
function WashStacked() {
  const t = useT();
  const ref = useRef<HTMLDivElement>(null);
  useArrive(ref, "rinse-wait", undefined, "0px 0px -25% 0px", true);
  return (
    <div className="hidden px-[var(--gutter)] py-10 phone:block">
      <Reveal phone>
        <SectionLabel text={t("01 — The wash")} />
        <h2 className="t-display t-lg mt-2.5">
          {t(LINES[0])} <span className="text-mist">{t(LINES[3])}</span>
        </h2>
      </Reveal>
      <div ref={ref} className="mt-4">
        <div className="relative aspect-[16/10] overflow-hidden rounded-2xl">
          <Image src={hood} alt={t("The gloss-black hood and windscreen of an SUV under studio lights")} fill sizes="(max-width: 767px) 100vw, 60vw" quality={60} className="object-cover object-[50%_65%]" />
          <div aria-hidden className="rinse">
            <div className="rinse-dust" />
          </div>
        </div>
        <p className="t-lead mt-3">
          {t(LINES[1])} {t(LINES[2])}
        </p>
        <div className="mt-3.5">
          <p className="t-label flex items-baseline justify-between text-[0.66rem] text-mist">
            <span>{t("Gloss meter")}</span>
            <span className="text-pearl">
              <Roll value="96" className="gloss-roll font-display text-2xl font-extrabold tracking-tight" /> GU
            </span>
          </p>
          <span aria-hidden className="mt-1.5 block h-1 overflow-hidden rounded-full bg-pearl/15">
            <span className="gauge-bar block h-full origin-left rounded-full bg-volt" style={{ transform: "scaleX(0.96)" }} />
          </span>
        </div>
        <ol className="t-label mt-3 flex justify-between text-[0.64rem] text-pearl" aria-label={t("Wash steps")}>
          {STEPS.map((sName, i) => (
            <li key={sName} className="flex items-center gap-1.5">
              <span className={clsx("h-1.5 w-1.5 rounded-full", i === 3 ? "bg-volt" : "bg-pearl/50")} aria-hidden />
              {t(sName)}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
