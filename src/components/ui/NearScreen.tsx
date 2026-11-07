"use client";

import { Activity, lazy, useEffect, useRef, useState, type ComponentType, type CSSProperties, type ReactNode } from "react";
import { isPhone } from "@/lib/motion";

/** The first hydration is over: anything rendered from now on has no server HTML to sit on. */
let hydrated = false;

const Pass = ({ children }: { children: ReactNode }) => children;

type Gate = { open: boolean; release: () => void; Wait: ComponentType<{ children: ReactNode }> };

function makeGate(): Gate {
  const gate: Gate = { open: typeof window === "undefined" || hydrated || !isPhone(), release: () => {}, Wait: Pass };
  if (!gate.open) {
    // lazy, not use(): a boundary suspended this way keeps its HTML and lets the rest of the page go
    // on. use() can hold up React's whole hydration pass, and then no block ever hydrates.
    const opened = new Promise<{ default: typeof Pass }>((r) => (gate.release = () => r({ default: Pass })));
    gate.Wait = lazy(() => opened);
  }
  return gate;
}

/**
 * One block of the page on phones, so loading doesn't freeze: the browser skips its style and
 * layout until it's near the screen (`.near` in globals.css; `height` holds its place: its content
 * height at 375 px, without the padding) and React leaves its server HTML untouched until then.
 * The HTML is already complete, so nothing looks different, and a tap inside it hydrates it right away.
 * Above phone width none of this applies: the block hydrates with the page, as if this weren't here.
 */
export function NearScreen({ height, children }: { height: number; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [gate] = useState(makeGate);
  useEffect(() => {
    hydrated = true;
    if (gate.open) return;
    const el = ref.current?.firstElementChild;
    if (!el) return gate.release();
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        gate.release();
      },
      { rootMargin: "60% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [gate]);
  return (
    <div ref={ref} className="near contents" style={{ "--near-h": `${height}px` } as CSSProperties}>
      {/* Activity, not Suspense: it hydrates on its own just the same, but the server keeps the HTML in
          place, where Suspense would send big blocks at the end of the page for a script to move back. */}
      <Activity>
        <gate.Wait>{children}</gate.Wait>
      </Activity>
    </div>
  );
}
