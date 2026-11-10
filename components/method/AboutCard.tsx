import Link from "next/link";
import { ArrowUpRight, Mail, MapPin } from "lucide-react";
import { site } from "@/content/site";

const tools = [
  "Python",
  "TypeScript",
  "PyTorch",
  "YOLO",
  "Qwen",
  "llama.cpp",
  "WebGPU",
  "React",
  "Next.js",
  "Tailwind",
  "Docker",
  "OpenCV",
  "PySide6",
  "ESP32",
];

export function AboutCard() {
  return (
    <div className="about-card">
      <div className="about-portrait">
        <div className="portrait-top">
          <span className="label label--ink">Portrait</span>
          <span className="portrait-status">
            <span className="status-dot status-dot--lime" aria-hidden="true" />
            Open to work
          </span>
        </div>

        <div className="monogram-big" aria-hidden="true">
          PV
        </div>

        <div className="portrait-meta">
          <span>Parth Varekar</span>
          <span className="portrait-coords">19.0176° N · 72.8562° E</span>
        </div>
      </div>

      <div className="about-body">
        <div>
          <span className="label">About</span>
          <h2 className="about-title">
            I build AI that runs close to the metal.
          </h2>
        </div>

        <p className="about-bio">
          I am an <strong>AI systems builder</strong> from Mumbai, studying Computer
          Engineering at K.C. College of Engineering, Mumbai University, class of 2028. I
          build local-first systems: offline procedure monitors, zero-cloud dictation,
          biodiversity intelligence, optical tracking and browser labs.
        </p>

        <p className="about-bio">
          The through-line is inspectability. A model is a sensor. The system around it has
          to explain what it saw, what it decided, and what it could not test. I would rather
          ship a small system that can prove its claim than a large one that cannot.
        </p>

        <div className="currently">
          <div className="currently-head">
            <span className="status-dot status-dot--blue" aria-hidden="true" />
            Currently
          </div>
          <p>
            Building local-first AI tools, finishing Chumps Lab Studio, and taking on client
            builds through ProtoVinci. Open to internships and collaborations.
          </p>
        </div>

        <div className="about-facts">
          <div className="about-fact">
            <MapPin size={13} aria-hidden="true" />
            Mumbai, India · IST
          </div>
          <a className="about-fact" href={`mailto:${site.email}`}>
            <Mail size={13} aria-hidden="true" />
            {site.email}
          </a>
        </div>

        <div className="tools" aria-label="Tools">
          {tools.map((tool) => (
            <span className="tool" key={tool}>
              {tool}
            </span>
          ))}
        </div>

        <div className="about-links">
          <Link className="about-link" href="/about">
            More about me
            <ArrowUpRight size={13} aria-hidden="true" />
          </Link>
          <a
            className="about-link"
            href={site.github}
            target="_blank"
            rel="noreferrer"
          >
            GitHub
            <ArrowUpRight size={13} aria-hidden="true" />
          </a>
          <a
            className="about-link"
            href={site.linkedin}
            target="_blank"
            rel="noreferrer"
          >
            LinkedIn
            <ArrowUpRight size={13} aria-hidden="true" />
          </a>
        </div>
      </div>
    </div>
  );
}
