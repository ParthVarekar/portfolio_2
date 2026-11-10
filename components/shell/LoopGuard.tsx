"use client";

import { useEffect } from "react";

/**
 * Pauses looping CSS animations on elements marked with `data-loop`
 * while they are off-screen. Zero layout cost, runs once.
 */
export function LoopGuard() {
  useEffect(() => {
    const targets = Array.from(document.querySelectorAll<HTMLElement>("[data-loop]"));
    if (targets.length === 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      for (const target of targets) target.style.animationPlayState = "paused";
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          (entry.target as HTMLElement).style.animationPlayState = entry.isIntersecting
            ? "running"
            : "paused";
        }
      },
      { threshold: 0 },
    );
    for (const target of targets) observer.observe(target);
    return () => observer.disconnect();
  }, []);

  return null;
}
