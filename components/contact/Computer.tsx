"use client";

import { useEffect, useState } from "react";
import { FileText, Mail, MessageCircle, X } from "lucide-react";
import { site } from "@/content/site";
import { resume } from "@/content/resume";

const RESUME = "/resume/parth-varekar-resume.pdf";

const BOOT_LINES = [
  "PV-BIOS 1.0 · Parth Varekar",
  "memory check ............ ok",
  "notes .................. 45 loaded",
  "sleep .................. not found",
  "timeline ............... 62%",
];

type Phase = "boot" | "on" | "off";

function istTime() {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
}

function istHour() {
  return Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      hour12: false,
    }).format(new Date()),
  );
}

export function Computer() {
  const [clock, setClock] = useState("--:--");
  const [resumeOpen, setResumeOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>("boot");
  const [step, setStep] = useState(0);

  useEffect(() => {
    setClock(istTime());
    const timer = window.setInterval(() => setClock(istTime()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  // boot sequence: lines appear one by one, then the welcome, then the desktop
  useEffect(() => {
    if (phase !== "boot") return;
    if (step <= BOOT_LINES.length) {
      const timer = window.setTimeout(() => setStep((value) => value + 1), 230);
      return () => window.clearTimeout(timer);
    }
    const timer = window.setTimeout(() => setPhase("on"), 900);
    return () => window.clearTimeout(timer);
  }, [phase, step]);

  useEffect(() => {
    if (!resumeOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setResumeOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [resumeOpen]);

  const hour = istHour();
  const awake = hour >= 23 || hour < 6;

  const togglePower = () => {
    if (phase === "boot") return;
    if (phase === "off") {
      setStep(0);
      setPhase("boot");
      return;
    }
    setPhase("off");
  };

  return (
    <div className="crt-scene">
      <div className="crt">
        <div className="crt-body">
          <div className="crt-screen" data-phase={phase}>
            <svg className="crt-wallpaper" viewBox="0 0 400 300" aria-hidden="true">
              <defs>
                <radialGradient id="crtPlanet" cx="50%" cy="32%">
                  <stop offset="0%" stopColor="#f4ffb8" />
                  <stop offset="52%" stopColor="#d9f24c" />
                  <stop offset="100%" stopColor="#a6c81d" />
                </radialGradient>
              </defs>
              <circle cx="62" cy="34" r="2" fill="#ffffff" opacity="0.9" />
              <circle cx="128" cy="20" r="1.6" fill="#ffffff" opacity="0.7" />
              <circle cx="300" cy="46" r="1.8" fill="#ffffff" opacity="0.8" />
              <circle cx="352" cy="24" r="1.4" fill="#ffffff" opacity="0.6" />
              <path d="M232 28c3 4 3 8 0 12-3-4-3-8 0-12Z" fill="#eaff7a" opacity="0.95" />
              <path d="M92 78c2.4 3.2 2.4 6.4 0 9.6-2.4-3.2-2.4-6.4 0-9.6Z" fill="#eaff7a" opacity="0.8" />
              <ellipse
                cx="200"
                cy="150"
                rx="126"
                ry="44"
                fill="none"
                stroke="#eaff7a"
                strokeWidth="1.1"
                opacity="0.6"
                transform="rotate(-16 200 150)"
              />
              <circle cx="316" cy="124" r="7" fill="#eaff7a" />
              <circle cx="200" cy="238" r="104" fill="url(#crtPlanet)" />
              <g fill="#eef5ff" opacity="0.94">
                <ellipse cx="92" cy="244" rx="62" ry="30" />
                <ellipse cx="138" cy="232" rx="44" ry="22" />
                <ellipse cx="312" cy="252" rx="70" ry="32" />
                <ellipse cx="352" cy="240" rx="40" ry="20" />
              </g>
            </svg>

            {phase === "boot" ? (
              <div className="crt-boot" role="status" aria-live="polite">
                <span className="crt-boot-flicker" aria-hidden="true" />
                <div className="crt-boot-lines">
                  {BOOT_LINES.slice(0, step).map((line) => (
                    <div className="crt-boot-line" key={line}>
                      {line}
                    </div>
                  ))}
                  {step > BOOT_LINES.length ? (
                    <div className="crt-boot-welcome">Welcome to Parth&apos;s computer.</div>
                  ) : null}
                </div>
              </div>
            ) : null}

            <div className="crt-desktop">
              <ul className="crt-icons">
                <li>
                  <a className="crt-app" href={`mailto:${site.email}`} title="Email">
                    <span className="crt-app-glyph">
                      <Mail size={15} aria-hidden="true" />
                    </span>
                    <span className="crt-app-label">Mail</span>
                  </a>
                </li>
                <li>
                  <a
                    className="crt-app"
                    href={site.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    title="LinkedIn"
                  >
                    <span className="crt-app-glyph crt-app-glyph--text">in</span>
                    <span className="crt-app-label">LinkedIn</span>
                  </a>
                </li>
                <li>
                  <a
                    className="crt-app"
                    href={`https://wa.me/91${site.phone.replace(/[^0-9]/g, "").slice(-10)}`}
                    target="_blank"
                    rel="noreferrer"
                    title="WhatsApp"
                  >
                    <span className="crt-app-glyph">
                      <MessageCircle size={15} aria-hidden="true" />
                    </span>
                    <span className="crt-app-label">WhatsApp</span>
                  </a>
                </li>
                <li>
                  <a
                    className="crt-app"
                    href={site.github}
                    target="_blank"
                    rel="noreferrer"
                    title="GitHub"
                  >
                    <span className="crt-app-glyph crt-app-glyph--text">GH</span>
                    <span className="crt-app-label">GitHub</span>
                  </a>
                </li>
                <li>
                  <button
                    type="button"
                    className="crt-app"
                    onClick={() => setResumeOpen(true)}
                    title="Résumé"
                  >
                    <span className="crt-app-glyph">
                      <FileText size={15} aria-hidden="true" />
                    </span>
                    <span className="crt-app-label">Résumé</span>
                  </button>
                </li>
              </ul>
            </div>

            <div className="crt-taskbar">
              <span className="crt-taskbar-dots" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
              <span className="crt-taskbar-right" aria-hidden="true">
                <span className="crt-sleep">{awake ? "sleep: off" : "sleep: soon"}</span>
                <span className="crt-battery">
                  <i className="crt-battery-cell">
                    <i className="crt-battery-fill" />
                  </i>
                  12%
                </span>
                <span className="crt-clock" suppressHydrationWarning>
                  {clock} IST
                </span>
              </span>
            </div>
          </div>

          <div className="crt-chin">
            <span className="crt-slot" aria-hidden="true">
              <span className="crt-slot-fill" />
            </span>
            <span className="crt-knob" aria-hidden="true" />
            <span className="crt-knob" aria-hidden="true" />
            <button
              type="button"
              className="crt-power"
              data-on={phase !== "off"}
              onClick={togglePower}
              aria-pressed={phase === "on"}
              aria-label={phase === "off" ? "Power on" : "Power off"}
              title={phase === "off" ? "Power on" : "Power off"}
            >
              <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
                <path
                  d="M12 4v8"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  fill="none"
                />
                <path
                  d="M7.2 7.4a6.4 6.4 0 1 0 9.6 0"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="crt-stand" aria-hidden="true">
          <span className="crt-rim" />
        </div>
        <span className="crt-shadow" aria-hidden="true" />
      </div>

      {resumeOpen ? (
        <div
          className="resume-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Résumé — Parth Varekar"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setResumeOpen(false);
          }}
        >
          <div className="resume-sheet">
            <div className="resume-bar">
              <span className="resume-title">résumé — parth varekar</span>
              <span className="resume-actions">
                <a href={RESUME} target="_blank" rel="noreferrer">
                  PDF
                </a>
                <a href={RESUME} download>
                  Download
                </a>
                <button type="button" onClick={() => setResumeOpen(false)} aria-label="Close résumé">
                  <X size={14} aria-hidden="true" />
                </button>
              </span>
            </div>
            <div className="resume-scroll">
              <article className="resume-doc">
                <header className="resume-head">
                  <h2 className="resume-name">{resume.name}</h2>
                  <p className="resume-role">{resume.role}</p>
                  <p className="resume-contact">
                    {resume.location} · {resume.phone} · {resume.email}
                  </p>
                  <p className="resume-links">
                    {resume.links.map((link) => (
                      <a key={link.href} href={link.href} target="_blank" rel="noreferrer">
                        {link.label}
                      </a>
                    ))}
                  </p>
                </header>

                <section className="resume-section">
                  <h3>Summary</h3>
                  {resume.summary.map((line) => (
                    <p key={line.slice(0, 32)}>{line}</p>
                  ))}
                </section>

                <section className="resume-section">
                  <h3>Engineering highlights</h3>
                  <ul className="resume-highlights">
                    {resume.highlights.map((item) => (
                      <li key={item.label}>
                        <strong>{item.label}</strong> — {item.text}
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="resume-section">
                  <h3>Technical skills</h3>
                  <dl className="resume-skills">
                    {resume.skills.map((group) => (
                      <div key={group.label}>
                        <dt>{group.label}</dt>
                        <dd>{group.items.join(" · ")}</dd>
                      </div>
                    ))}
                  </dl>
                </section>

                <section className="resume-section">
                  <h3>Projects</h3>
                  {resume.projects.map((project) => (
                    <div className="resume-project" key={project.name}>
                      <div className="resume-project-head">
                        {project.href ? (
                          <a href={project.href} target="_blank" rel="noreferrer">
                            {project.name}
                          </a>
                        ) : (
                          <span>{project.name}</span>
                        )}
                        <span className="resume-project-role">{project.role}</span>
                      </div>
                      {project.bullets.map((bullet) => (
                        <p key={bullet.slice(0, 40)}>{bullet}</p>
                      ))}
                    </div>
                  ))}
                </section>

                <section className="resume-section">
                  <h3>Experience</h3>
                  {resume.experience.map((job) => (
                    <div className="resume-job" key={job.role}>
                      <div className="resume-job-head">
                        <strong>{job.role}</strong>
                        <span>
                          {job.org} · {job.place} · {job.dates}
                        </span>
                      </div>
                      {job.bullets.map((bullet) => (
                        <p key={bullet.slice(0, 32)}>{bullet}</p>
                      ))}
                    </div>
                  ))}
                </section>

                <section className="resume-section">
                  <h3>Education &amp; certifications</h3>
                  <div className="resume-job">
                    <div className="resume-job-head">
                      <strong>{resume.education.degree}</strong>
                      <span>{resume.education.school}</span>
                    </div>
                    <p>{resume.education.meta.join(" · ")}</p>
                  </div>
                  {resume.certifications.map((cert) => (
                    <div className="resume-job" key={cert.label}>
                      <div className="resume-job-head">
                        <strong>{cert.label}</strong>
                        <span>{cert.detail}</span>
                      </div>
                    </div>
                  ))}
                </section>
              </article>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
