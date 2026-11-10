"use client";

import { useEffect, useState } from "react";
import { FileText, Mail, MessageCircle, X } from "lucide-react";
import { site } from "@/content/site";
import { resume } from "@/content/resume";

const RESUME = "/resume/parth-varekar-resume.pdf";

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

export function Laptop() {
  const [clock, setClock] = useState("--:--");
  const [resumeOpen, setResumeOpen] = useState(false);

  useEffect(() => {
    setClock(istTime());
    const timer = window.setInterval(() => setClock(istTime()), 1000);
    return () => window.clearInterval(timer);
  }, []);

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

  return (
    <div className="laptop-scene">
      <div className="laptop">
        <div className="laptop-lid">
          <span className="laptop-camera" aria-hidden="true" />
          <span className="laptop-lid-edge" aria-hidden="true" />

          <div className="laptop-screen">
            <div className="lap-topbar">
              <span className="lap-tab">
                pv@local: ~/parth
                <span className="lap-cursor" aria-hidden="true" />
              </span>
              <span className="lap-toast" aria-hidden="true">
                npm ERR! sleep not found
              </span>
            </div>

            <div className="lap-desktop">
              <ul className="lap-icons">
                <li>
                  <a className="lap-app" href={`mailto:${site.email}`} title="Email">
                    <span className="lap-app-glyph">
                      <Mail size={14} aria-hidden="true" />
                    </span>
                    <span className="lap-app-label">Mail</span>
                  </a>
                </li>
                <li>
                  <a
                    className="lap-app"
                    href={site.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    title="LinkedIn"
                  >
                    <span className="lap-app-glyph lap-app-glyph--text">in</span>
                    <span className="lap-app-label">LinkedIn</span>
                  </a>
                </li>
                <li>
                  <a
                    className="lap-app"
                    href={`https://wa.me/91${site.phone.replace(/[^0-9]/g, "").slice(-10)}`}
                    target="_blank"
                    rel="noreferrer"
                    title="WhatsApp"
                  >
                    <span className="lap-app-glyph">
                      <MessageCircle size={14} aria-hidden="true" />
                    </span>
                    <span className="lap-app-label">WhatsApp</span>
                  </a>
                </li>
                <li>
                  <a
                    className="lap-app"
                    href={site.github}
                    target="_blank"
                    rel="noreferrer"
                    title="GitHub"
                  >
                    <span className="lap-app-glyph lap-app-glyph--text">GH</span>
                    <span className="lap-app-label">GitHub</span>
                  </a>
                </li>
                <li>
                  <button
                    type="button"
                    className="lap-app"
                    onClick={() => setResumeOpen(true)}
                    title="Résumé"
                  >
                    <span className="lap-app-glyph">
                      <FileText size={14} aria-hidden="true" />
                    </span>
                    <span className="lap-app-label">Résumé</span>
                  </button>
                </li>
              </ul>

              <div className="lap-widget" aria-hidden="true">
                <div className="lap-widget-row">
                  <span>timeline</span>
                  <span className="lap-widget-value">62%</span>
                </div>
                <div className="lap-widget-bar">
                  <span />
                </div>
                <div className="lap-widget-checks">
                  <span>ship</span>
                  <span className="lap-tick">✓</span>
                  <span>sleep</span>
                  <span className="lap-tick lap-tick--off">✗</span>
                </div>
              </div>
            </div>

            <div className="lap-taskbar">
              <span className="lap-taskbar-dots" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
              <span className="lap-taskbar-right" aria-hidden="true">
                <span className="lap-sleep">{awake ? "sleep: off" : "sleep: soon"}</span>
                <span className="lap-battery">
                  <i className="lap-battery-cell">
                    <i className="lap-battery-fill" />
                  </i>
                  12%
                </span>
                <span className="lap-clock" suppressHydrationWarning>
                  {clock} IST
                </span>
              </span>
            </div>
          </div>

          <span className="laptop-hinge laptop-hinge--left" aria-hidden="true" />
          <span className="laptop-hinge laptop-hinge--right" aria-hidden="true" />
        </div>

        <div className="laptop-base" aria-hidden="true">
          <div className="laptop-keyboard">
            {Array.from({ length: 28 }, (_, index) => (
              <span key={index} className={index === 13 ? "key key--lime" : "key"} />
            ))}
            <span className="key key--wide" />
          </div>
          <div className="laptop-trackpad" />
          <span className="laptop-lip" />
        </div>

        <span className="laptop-shadow" aria-hidden="true" />
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
