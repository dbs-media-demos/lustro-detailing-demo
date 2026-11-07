"use client";

import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { useT } from "@/lib/i18n";
import { isPhone, isTouch, prefersReducedMotion } from "@/lib/motion";

/*
 * The 50/50 rain test detailers do with masking tape: rain falls on a dark panel. Left of the
 * tape (bare clear coat) drops flatten into smears that stay; right of it (ceramic coating) they
 * pull into round beads, merge, and roll off once they're heavy. Drag the tape to coat more of
 * the panel; move the pointer across it to tilt the panel and steer the beads.
 * Canvas only runs while on screen (30 fps on touch); reduced motion gets one still frame.
 * Phones don't rain all the time: a short shower as the panel arrives and while the tape is moving.
 */

type Bead = { x: number; y: number; r: number; vx: number; vy: number };
type Smear = { x: number; y: number; r: number; a: number; seed: number };
type Splash = { x: number; y: number; t: number };

export function RainTest() {
  const t = useT();
  const panel = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const split = useRef(0.5);
  const tilt = useRef(0);
  const [tape, setTape] = useState(0.5);
  const dragging = useRef(false);
  const shower = useRef<() => void>(() => {});

  useEffect(() => {
    split.current = tape;
    shower.current();
  }, [tape]);

  useEffect(() => {
    const cv = canvas.current;
    const pn = panel.current;
    if (!cv || !pn) return;
    const ctx = cv.getContext("2d")!;
    const touch = isTouch();
    const phone = isPhone();
    const reduced = prefersReducedMotion();
    let W = 0;
    let H = 0;
    let s = 1;
    let beads: Bead[] = [];
    let smears: Smear[] = [];
    let splashes: Splash[] = [];
    let visible = false;
    let raf = 0;
    let last = 0;
    let acc = 0;
    let until = Infinity;

    const resize = () => {
      const r = pn.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, touch ? 1.25 : 1.75);
      const w = Math.round(r.width * dpr);
      const h = Math.round(r.height * dpr);
      if (w === W && h === H) return;
      const kx = W ? w / W : 1;
      const ky = H ? h / H : 1;
      beads.forEach((b) => ((b.x *= kx), (b.y *= ky)));
      smears.forEach((m) => ((m.x *= kx), (m.y *= ky)));
      W = cv.width = w;
      H = cv.height = h;
      s = dpr * Math.max(0.75, Math.min(1.25, r.width / 900));
    };

    const coated = (x: number) => x > split.current * W;

    const drop = () => {
      const x = Math.random() * W;
      const y = Math.random() * H;
      const r = (2 + Math.random() * 2.8) * s;
      splashes.push({ x, y, t: 0 });
      if (coated(x)) {
        const hit = beads.find((b) => Math.hypot(b.x - x, b.y - y) < b.r + r);
        if (hit) hit.r = Math.sqrt(hit.r * hit.r + r * r);
        else beads.push({ x, y, r, vx: 0, vy: 0 });
      } else {
        const hit = smears.find((m) => Math.hypot(m.x - x, m.y - y) < m.r);
        if (hit) {
          hit.r = Math.min(46 * s, Math.sqrt(hit.r * hit.r + 9 * r * r));
          hit.a = Math.min(1, hit.a + 0.12);
        } else smears.push({ x, y, r: r * 3.2, a: 0.55, seed: Math.random() * 10 });
      }
    };

    const step = (dt: number) => {
      // rain
      acc += dt * (touch ? 22 : 34);
      while (acc > 1) {
        drop();
        acc -= 1;
      }
      const g = 900 * s;
      const gx = tilt.current * 0.9;
      const heavy = 7 * s;
      for (const b of beads) {
        if (!coated(b.x)) {
          // rolled onto bare paint: it flattens out and sticks
          smears.push({ x: b.x, y: b.y, r: b.r * 2.6, a: 0.7, seed: Math.random() * 10 });
          b.r = 0;
          continue;
        }
        if (b.r > heavy || Math.abs(gx) > 0.35) {
          const push = Math.min(1, (b.r - heavy * 0.6) / heavy);
          if (push > 0) {
            b.vy += g * push * dt;
            b.vx += g * gx * push * dt;
          }
        }
        b.vx *= 0.92;
        b.vy *= 0.94;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
      }
      // moving beads swallow the ones they touch (and the dirt with them)
      for (let i = 0; i < beads.length; i++) {
        const a = beads[i];
        if (!a.r || (Math.abs(a.vx) + Math.abs(a.vy) < 5)) continue;
        for (let j = 0; j < beads.length; j++) {
          const b = beads[j];
          if (i === j || !b.r) continue;
          if (Math.abs(a.x - b.x) < a.r + b.r && Math.hypot(a.x - b.x, a.y - b.y) < a.r + b.r) {
            a.r = Math.min(14 * s, Math.sqrt(a.r * a.r + b.r * b.r));
            b.r = 0;
          }
        }
      }
      beads = beads.filter((b) => b.r > 0 && b.y - b.r < H && b.x > -20 && b.x < W + 20);
      const cap = phone ? 160 : 420;
      if (beads.length > cap) beads.splice(0, beads.length - cap);
      for (const m of smears) m.a = Math.max(0, m.a - dt * 0.012);
      smears = smears.filter((m) => m.a > 0.05 && !coated(m.x));
      if (smears.length > cap) smears.splice(0, smears.length - cap);
      splashes = splashes.filter((p) => (p.t += dt) < 0.28);
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      // falling rain streaks
      ctx.strokeStyle = "rgba(210,225,245,0.12)";
      ctx.lineWidth = 1 * s;
      const now = performance.now() / 1000;
      for (let i = 0; i < 40; i++) {
        const x = ((i * 97.13) % 1) * W + ((now * 60 * s + i * 37) % W) * 0.1;
        const y = ((now * (700 + (i % 5) * 80) * s + i * 211) % (H + 80 * s)) - 40 * s;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - 6 * s, y + 28 * s);
        ctx.stroke();
      }
      // flat smears on bare paint: dull, irregular, they stay
      for (const m of smears) {
        // a flat puddle: faint film with a brighter dried edge, at its own angle
        ctx.beginPath();
        ctx.ellipse(m.x, m.y, m.r, m.r * (0.55 + (m.seed % 1) * 0.35), m.seed, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(178,194,214,${0.12 * m.a})`;
        ctx.fill();
        ctx.lineWidth = 1.2 * s;
        ctx.strokeStyle = `rgba(214,226,240,${0.26 * m.a})`;
        ctx.stroke();
      }
      // round beads on the coating
      for (const b of beads) {
        ctx.beginPath();
        ctx.arc(b.x + b.r * 0.22, b.y + b.r * 0.32, b.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0,0,0,0.45)";
        ctx.fill();
        const body = ctx.createRadialGradient(b.x - b.r * 0.3, b.y - b.r * 0.35, b.r * 0.05, b.x, b.y, b.r);
        body.addColorStop(0, "rgba(255,255,255,0.95)");
        body.addColorStop(0.22, "rgba(190,210,235,0.32)");
        body.addColorStop(0.8, "rgba(40,60,90,0.12)");
        body.addColorStop(1, "rgba(220,235,255,0.5)");
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fillStyle = body;
        ctx.fill();
      }
      for (const p of splashes) {
        const k = p.t / 0.28;
        ctx.beginPath();
        ctx.arc(p.x, p.y, (2 + k * 9) * s, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(230,240,255,${0.4 * (1 - k)})`;
        ctx.lineWidth = 1 * s;
        ctx.stroke();
      }
    };

    const loop = (now: number) => {
      raf = 0;
      if (!visible || now > until) return;
      const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
      if (!touch || now - last > 32) {
        last = now;
        step(dt);
        draw();
      }
      raf = requestAnimationFrame(loop);
    };

    // the panel starts already rained on (smears on the left, beads on the right), not empty
    const seed = (n: number) => {
      for (let i = 0; i < n; i++) drop();
      splashes = [];
    };

    const start = () => {
      if (phone) until = performance.now() + 2200;
      if (visible && !raf) {
        last = 0;
        raf = requestAnimationFrame(loop);
      }
    };
    if (!reduced && phone) shower.current = start;

    const ro = new ResizeObserver(() => {
      const first = !W;
      resize();
      if (first) seed(reduced ? 520 : phone ? 150 : 320);
      if (reduced || phone) draw();
    });
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !reduced) start();
    });
    ro.observe(pn);
    io.observe(pn);
    return () => {
      cancelAnimationFrame(raf);
      shower.current = () => {};
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  const pos = (e: ReactPointerEvent) => {
    const r = panel.current!.getBoundingClientRect();
    return Math.min(0.9, Math.max(0.1, (e.clientX - r.left) / r.width));
  };
  const onMove = (e: ReactPointerEvent) => {
    const r = panel.current!.getBoundingClientRect();
    if (e.pointerType === "mouse") tilt.current = ((e.clientX - r.left) / r.width - 0.5) * 2 * 0.6;
    if (dragging.current) setTape(pos(e));
  };
  const onKey = (e: ReactKeyboardEvent) => {
    if (e.key === "ArrowLeft") setTape((v) => Math.max(0.1, v - 0.05));
    else if (e.key === "ArrowRight") setTape((v) => Math.min(0.9, v + 0.05));
    else return;
    e.preventDefault();
  };

  return (
    <section id="ceramic" aria-labelledby="ceramic-title" className="relative bg-ink px-[var(--gutter)] py-28 md:py-40 phone:order-6 phone:py-10">
      <div className="grid gap-8 md:grid-cols-12 md:items-end phone:gap-3.5">
        <Reveal phone className="md:col-span-7">
          <SectionLabel text={t("04 — Ceramic coating")} />
          <h2 id="ceramic-title" className="t-display t-lg mt-5 phone:mt-2.5">
            {t("Water should never")} <span className="t-gloss">{t("sit on your paint.")}</span>
          </h2>
        </Reveal>
        <Reveal className="md:col-span-4 md:col-start-9" delay={0.1}>
          <p className="t-lead">{t("A coating bonds a glass-hard layer to the clear coat. Rain beads up and rolls away, and takes the dirt with it. Drag the tape to coat more of the panel.")}</p>
        </Reveal>
      </div>

      <Reveal className="mt-14 phone:mt-4">
        <div
          ref={panel}
          onPointerMove={onMove}
          onPointerLeave={() => (tilt.current = 0)}
          onPointerUp={() => (dragging.current = false)}
          onPointerCancel={() => (dragging.current = false)}
          className="relative h-[68svh] min-h-[26rem] touch-pan-y select-none overflow-hidden rounded-3xl border border-line md:h-[72vh] phone:h-[17.5rem] phone:min-h-0 phone:rounded-2xl"
          style={{
            background:
              "linear-gradient(118deg, transparent 22%, rgba(255,255,255,0.07) 30%, transparent 38%), linear-gradient(118deg, transparent 58%, rgba(255,255,255,0.05) 63%, transparent 68%), radial-gradient(120% 90% at 25% 0%, #22324a 0%, #0d1520 50%, #05070b 100%)",
          }}
        >
          <canvas ref={canvas} aria-hidden className="absolute inset-0 h-full w-full" />
          <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 bg-ink/25" style={{ width: `${tape * 100}%` }} />

          <p className="t-label pointer-events-none absolute left-5 top-5 rounded-full bg-ink/60 px-3 py-2 text-[0.64rem] text-mist backdrop-blur md:left-7 md:top-7">{t("Bare clear coat")}</p>
          <p className="t-label pointer-events-none absolute right-5 top-5 rounded-full bg-volt px-3 py-2 text-[0.64rem] text-ink md:right-7 md:top-7">{t("Ceramic coated")}</p>

          <div
            role="slider"
            tabIndex={0}
            aria-label={t("Masking tape between bare and coated paint")}
            aria-valuemin={10}
            aria-valuemax={90}
            aria-valuenow={Math.round(tape * 100)}
            aria-valuetext={t("{n}% of the panel coated", { n: Math.round((1 - tape) * 100) })}
            onKeyDown={onKey}
            onPointerDown={(e) => {
              dragging.current = true;
              (e.target as Element).setPointerCapture?.(e.pointerId);
            }}
            onPointerMove={onMove}
            onPointerUp={() => (dragging.current = false)}
            className="absolute inset-y-0 z-10 flex w-12 -translate-x-1/2 cursor-ew-resize touch-none justify-center phone:touch-pan-y"
            style={{ left: `${tape * 100}%` }}
          >
            <span aria-hidden className="relative h-full w-4 bg-volt/85 shadow-[0_0_30px_rgba(212,250,76,0.25)] [mask-image:repeating-linear-gradient(180deg,#000_0_92%,transparent_92%_100%)]" />
            <span aria-hidden className="t-label absolute top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-volt text-[0.62rem] text-ink shadow-xl">
              50/50
            </span>
          </div>
        </div>
      </Reveal>

      <dl className="mt-10 grid grid-cols-1 gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-3 phone:mt-3 phone:rounded-2xl">
        {[
          ["9H", "Pencil hardness: it shrugs off wash marks"],
          ["5 yrs", "Of gloss, with one check-up wash a year"],
          ["110°", "Water contact angle: why rain beads"],
        ].map(([k, v], i) => (
          <Reveal key={k} delay={i * 0.08} className="bg-ink p-7 md:p-9 phone:flex phone:items-center phone:gap-3 phone:p-3.5 sm:phone:block">
            <dt className="font-display text-5xl font-extrabold tracking-tight phone:w-24 phone:shrink-0 phone:whitespace-nowrap phone:text-[1.3rem]">{t(k)}</dt>
            <dd className="mt-3 text-mist phone:mt-0 phone:text-[0.84rem] phone:leading-snug">{t(v)}</dd>
          </Reveal>
        ))}
      </dl>
    </section>
  );
}
