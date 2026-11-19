"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";

declare global {
  interface Window {
    goatcounter?: {
      count?: (vars?: { path?: string; title?: string; event?: boolean }) => void;
    };
  }
}

const GOATCOUNTER_ENDPOINT =
  process.env.NEXT_PUBLIC_GOATCOUNTER_URL ?? "https://parthvarekar.goatcounter.com/count";

/**
 * Loads privacy-first, cookieless GoatCounter analytics and tracks Next.js App Router SPA route changes.
 */
export function GoatCounter() {
  const pathname = usePathname();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (typeof window !== "undefined" && window.goatcounter?.count) {
      window.goatcounter.count({
        path: pathname,
      });
    }
  }, [pathname]);

  return (
    <Script
      src="https://gc.zgo.at/count.js"
      data-goatcounter={GOATCOUNTER_ENDPOINT}
      strategy="afterInteractive"
    />
  );
}
