import Link from "next/link";
import { ArrowDown, Sparkles } from "lucide-react";
import { WindmillViewer } from "./WindmillViewer";
import { Readout } from "./Readout";
import { DotMatrix } from "./DotMatrix";
import { MachineStatus } from "@/components/machine/MachineStatus";

export function HeroBento() {
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
            <Link className="btn btn--lime" href="/machine">
              <Sparkles size={16} aria-hidden="true" />
              Wake the machine
            </Link>
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
            <span className="label">The machine · Idle</span>
            <MachineStatus compact />
          </div>

          <WindmillViewer />

          <div className="core-bottom">
            <div className="core-statusline">
              <span>Core idle</span>
              <span>Waiting for a question</span>
            </div>
            <DotMatrix lit={0} />
            <div className="core-pills">
              <span className="pill pill--outline">SmolLM2 · 135M</span>
              <span className="pill pill--outline">4K context</span>
              <span className="pill pill--outline">Local only</span>
            </div>
          </div>
        </div>
      </div>

      <Readout />

    </section>
  );
}
