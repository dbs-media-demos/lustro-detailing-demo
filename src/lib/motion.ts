"use client";

import { useSyncExternalStore } from "react";

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const isTouch = () => typeof window !== "undefined" && window.matchMedia("(hover: none)").matches;

/** Phone mode: the same test as Tailwind's `phone:` variant (globals.css). */
const PHONE = "(max-width: 767.98px), (hover: none)";

export const isPhone = () => typeof window !== "undefined" && window.matchMedia(PHONE).matches;

const subscribe = (on: () => void) => {
  const mq = window.matchMedia(PHONE);
  mq.addEventListener("change", on);
  return () => mq.removeEventListener("change", on);
};

/** Re-renders when a window crosses into or out of phone mode. False on the server. */
export const usePhone = () => useSyncExternalStore(subscribe, isPhone, () => false);
