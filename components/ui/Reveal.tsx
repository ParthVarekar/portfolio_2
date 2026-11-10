"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Small on-scroll reveal: 14px rise, one pass, never replays.
 * Anything already visible (or reduced motion) appears instantly.
 */
export function Reveal({
  as: Tag = "div",
  className = "",
  delay = 0,
  children,
}: {
  as?: "div" | "section";
  className?: string;
  delay?: number;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.classList.add("is-visible");
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.05 },
    );
    observer.observe(el);
    // Safety net: if the browser stalls the render pipeline, still show the content.
    const timer = window.setTimeout(() => el.classList.add("is-visible"), 1500);
    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <Tag
      ref={ref as never}
      className={`reveal${className ? ` ${className}` : ""}`}
      style={{ transitionDelay: delay > 0 ? `${delay}ms` : undefined }}
    >
      {children}
    </Tag>
  );
}
