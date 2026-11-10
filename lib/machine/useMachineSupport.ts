"use client";

import { useEffect, useState } from "react";
import { detectWebGPU, type MachineSupport } from "@/lib/machine/detect";

export function useMachineSupport(): MachineSupport {
  const [support, setSupport] = useState<MachineSupport>("checking");

  useEffect(() => {
    let cancelled = false;
    detectWebGPU().then((result) => {
      if (!cancelled) setSupport(result);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return support;
}
