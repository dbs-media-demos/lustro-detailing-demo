"use client";

import { useEffect, useRef, type CSSProperties, type ElementType, type ReactNode } from "react";
import { isPhone, prefersReducedMotion } from "@/lib/motion";

/**
 * Fades and lifts its content in as it scrolls into view. Content is visible by default: the
 * hidden state (.rv) is only added to elements that start below the fold, after hydration.
 * Phones get one per section: only the Reveal marked `phone` moves there, the rest just sit still.
 */
export function Reveal({ children, as: Tag = "div", className, delay = 0, id, phone = false }: { children: ReactNode; as?: ElementType; className?: string; delay?: number; id?: string; phone?: boolean }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion() || (isPhone() && !phone)) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return;
    el.classList.add("rv");
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        el.classList.add("rv-in");
        io.disconnect();
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [phone]);
  return (
    <Tag ref={ref} id={id} className={className} style={delay ? ({ "--d": `${delay}s` } as CSSProperties) : undefined}>
      {children}
    </Tag>
  );
}
