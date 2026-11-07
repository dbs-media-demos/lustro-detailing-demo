"use client";

import { useEffect, type RefObject } from "react";
import { isPhone, prefersReducedMotion } from "@/lib/motion";

/**
 * For "before → after" touches that play once when a block scrolls in. Content looks finished by
 * default; after hydration, blocks that start below the fold get `waiting` (the before state),
 * and when they arrive it's swapped for `arrived` (which may start an animation).
 * Reduced motion and blocks already on screen stay in the finished state, and so do phones unless
 * the touch asks for them (`onPhones`: there is only one, the rinse on the wash photo).
 */
export function useArrive(ref: RefObject<HTMLElement | null>, waiting: string, arrived?: string, margin = "0px 0px -15% 0px", onPhones = false) {
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion() || (isPhone() && !onPhones)) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.85) return;
    el.classList.add(waiting);
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        el.classList.remove(waiting);
        if (arrived) el.classList.add(arrived);
        io.disconnect();
      },
      { rootMargin: margin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, waiting, arrived, margin, onPhones]);
}
