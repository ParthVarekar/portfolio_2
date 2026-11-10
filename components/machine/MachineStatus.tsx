"use client";

import { useMachineSupport } from "@/lib/machine/useMachineSupport";

export function MachineStatus({ compact = false }: { compact?: boolean }) {
  const support = useMachineSupport();

  if (support === "checking") {
    return (
      <span className="pill pill--outline">
        <span className="status-dot status-dot--blue" aria-hidden="true" />
        {compact ? "CHECKING" : "CHECKING WEBGPU"}
      </span>
    );
  }

  if (support === "webgpu") {
    return (
      <span className="pill pill--outline">
        <span className="status-dot status-dot--lime" aria-hidden="true" />
        WEBGPU READY
      </span>
    );
  }

  return (
    <span className="pill pill--outline">
      <span className="status-dot status-dot--coral" aria-hidden="true" />
      DEMO MODE
    </span>
  );
}
