"use client";

import Link from "next/link";
import { ArrowDown, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { WindmillViewer } from "./WindmillViewer";
import { Readout } from "./Readout";
import { Machine } from "@/components/machine/Machine";

export function HeroBento() {
  const [machineOpen, setMachineOpen] = useState(false);
  // mounted once, on the first open — the model never loads unasked
  const [machineMounted, setMachineMounted] = useState(false);
  const wakeButtonRef = useRef<HTMLButtonElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const prevOpen = useRef(false);

  const toggleMachine = () => {
    if (machineOpen) {
      setMachineOpen(false);
      return;
    }
    setMachineMounted(true);
    setMachineOpen(true);
  };

  // Escape closes the machine again — same as the button
  useEffect(() => {
    if (!machineOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMachineOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [machineOpen]);

  // move focus into the newly visible face, after React has committed it —
  // focusing a hidden element is a no-op, so this must run post-commit
  useEffect(() => {
    if (machineOpen) {
      prevOpen.current = true;
      const timer = window.setTimeout(() => closeButtonRef.current?.focus({ preventScroll: true }), 90);
      return () => window.clearTimeout(timer);
    }
    if (prevOpen.current) {
      prevOpen.current = false;
      const timer = window.setTimeout(() => wakeButtonRef.current?.focus({ preventScroll: true }), 90);
      return () => window.clearTimeout(timer);
    }
  }, [machineOpen]);

  return (
    <section className="hero shell" aria-labelledby="hero-title">
      <div className="hero-stage">
        <div className="hero-card settle" style={{ animationDelay: "30ms" }}>
          {/* the welcome face — the card before the machine is awake */}
          <div className="hero-face" hidden={machineOpen} aria-hidden={machineOpen}>
            <h1 className="hero-title" id="hero-title" aria-label="This page runs a machine.">
              <span className="hero-title-line" aria-hidden="true">
                This page
              </span>
              <span className="hero-title-line" aria-hidden="true">
                runs a
              </span>
              <span className="hero-title-line" aria-hidden="true">
                machine<span className="hero-period">.</span>
              </span>
            </h1>

            <p className="hero-sub">
              A real language model, inside your browser. Ask it about the systems I build.
              Nothing leaves your device.
            </p>

            <div className="hero-actions">
              <button
                className="btn btn--lime"
                id="machine-wake"
                ref={wakeButtonRef}
                type="button"
                aria-expanded={machineOpen}
                aria-controls="machine"
                onClick={toggleMachine}
              >
                <Sparkles size={16} aria-hidden="true" />
                {machineOpen ? "Hide the machine" : "Wake the machine"}
              </button>
              <Link className="btn btn--white" href="/work">
                Read the work
                <ArrowDown size={16} aria-hidden="true" />
              </Link>
            </div>
          </div>

          {/* the machine face — the same card, turned on */}
          <div
            className="hero-face hero-face--machine"
            hidden={!machineOpen}
            aria-hidden={!machineOpen}
          >
            <div className="machine-face-head">
              <button
                className="machine-close"
                id="machine-close"
                ref={closeButtonRef}
                type="button"
                aria-expanded={machineOpen}
                aria-controls="machine"
                onClick={toggleMachine}
              >
                <X size={14} aria-hidden="true" />
                Hide the machine
              </button>
            </div>
            {machineMounted ? <Machine embedded compact autoWake /> : null}
          </div>
        </div>

        <div className="core-card settle" style={{ animationDelay: "100ms" }}>
          <WindmillViewer />
        </div>
      </div>

      <Readout />
    </section>
  );
}
