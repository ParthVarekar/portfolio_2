"use client";

import Link from "next/link";
import { ArrowDown, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { WindmillViewer } from "./WindmillViewer";
import { Readout } from "./Readout";
import { DotMatrix } from "./DotMatrix";
import { MachineStatus } from "@/components/machine/MachineStatus";
import { Machine } from "@/components/machine/Machine";
import type { MachinePhase } from "@/lib/machine/types";

/** the windmill card is a live gauge for the chat below it */
function coreReadout(phase: MachinePhase, progress: number) {
  switch (phase) {
    case "loading":
      return {
        state: "Waking the machine…",
        hint: `${Math.round(progress * 100)}% of the way`,
        lit: Math.max(1, Math.round(progress * 55)),
        total: 55,
      };
    case "generating":
      return { state: "Working", hint: "Streaming tokens locally", lit: 55, total: 55 };
    case "ready":
      return { state: "Core ready", hint: "Model is in your browser", lit: 55, total: 55 };
    case "error":
      return { state: "Offline", hint: "The demo still works", lit: 0, total: 55 };
    default:
      return { state: "Core idle", hint: "Waiting for a question", lit: 0, total: 55 };
  }
}

export function HeroBento() {
  const [machineOpen, setMachineOpen] = useState(false);
  // mounted once, on the first open — the model never loads unasked
  const [dockMounted, setDockMounted] = useState(false);
  const [machinePhase, setMachinePhase] = useState<MachinePhase>("idle");
  const [machineProgress, setMachineProgress] = useState(0);
  const dockRef = useRef<HTMLDivElement | null>(null);

  const core = coreReadout(machinePhase, machineProgress);

  const toggleMachine = () => {
    if (machineOpen) {
      setMachineOpen(false);
      return;
    }
    setDockMounted(true);
    setMachineOpen(true);
  };

  // on open: the chat is mounted and waking; jump to it so the user sees it.
  // "instant" because the page's scroll-behavior:smooth would animate, and
  // the dock's own entrance animation plays as it arrives anyway
  useEffect(() => {
    if (!machineOpen) return;
    const element = dockRef.current;
    if (!element) return;
    element.scrollIntoView({ behavior: "instant", block: "start" });
  }, [machineOpen]);

  // Escape hides the dock again — same as the button
  useEffect(() => {
    if (!machineOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMachineOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [machineOpen]);

  return (
    <section className="hero shell" aria-labelledby="hero-title">
      <div className="hero-stage">
        <div className="hero-card settle" style={{ animationDelay: "30ms" }}>
          <div className="hero-eyebrow">
            <span className="label">Parth Varekar · Mumbai, IN</span>
            <span className="hero-availability">
              <span className="status-dot status-dot--lime" aria-hidden="true" />
              Open to work
            </span>
          </div>

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
              type="button"
              aria-expanded={machineOpen}
              aria-controls="machine-dock"
              onClick={toggleMachine}
            >
              <Sparkles size={16} aria-hidden="true" />
              {machineOpen ? "Hide the machine" : "Wake the machine"}
            </button>
            <Link className="btn btn--white" href="#work">
              Read the work
              <ArrowDown size={16} aria-hidden="true" />
            </Link>
          </div>

          <div className="hero-foot">
            <span className="scroll-cue">
              <ArrowDown size={13} aria-hidden="true" data-loop />
              Scroll to open
            </span>
            <span className="hero-fact">
              Built in Mumbai
              <br />
              Runs in your browser
            </span>
          </div>
        </div>

        <div className="core-card settle" style={{ animationDelay: "100ms" }}>
          <div className="core-top">
            <span className="label">
              {machinePhase === "loading"
                ? "The machine · Waking"
                : machinePhase === "generating"
                  ? "The machine · Working"
                  : machinePhase === "ready"
                    ? "The machine · Ready"
                    : machinePhase === "error"
                      ? "The machine · Offline"
                      : "The machine · Idle"}
            </span>
            <MachineStatus compact />
          </div>

          <WindmillViewer />

          <div className="core-bottom">
            <div className="core-statusline">
              <span>{core.state}</span>
              <span>{core.hint}</span>
            </div>
            <DotMatrix lit={core.lit} total={core.total} />
            <div className="core-pills">
              <span className="pill pill--outline">SmolLM2 · 135M</span>
              <span className="pill pill--outline">4K context</span>
              <span className="pill pill--outline">Local only</span>
            </div>
          </div>
        </div>
      </div>

      {dockMounted ? (
        <div className="machine-dock-wrap" ref={dockRef} hidden={!machineOpen} id="machine-dock">
          <Machine
            embedded
            autoWake
            onPhaseChange={setMachinePhase}
            onProgress={setMachineProgress}
          />
        </div>
      ) : null}

      <Readout />
    </section>
  );
}
