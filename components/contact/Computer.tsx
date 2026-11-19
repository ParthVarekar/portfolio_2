"use client";

import { useEffect, useRef, useState } from "react";
import { site } from "@/content/site";

const RESUME = "/resume/parth-varekar-resume.pdf";

const BRIGHTNESS_LEVELS = [
  { label: "Dim", value: 0.78 },
  { label: "Low", value: 0.88 },
  { label: "Normal", value: 1 },
  { label: "Bright", value: 1.15 },
  { label: "Vivid", value: 1.32 },
] as const;

const CONTRAST_LEVELS = [
  { label: "Soft", value: 0.8 },
  { label: "Low", value: 0.9 },
  { label: "Normal", value: 1 },
  { label: "Sharp", value: 1.13 },
  { label: "Vivid", value: 1.28 },
] as const;

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

const ICON_SIZE = 19;

/** The actual app marks, drawn at their own brand colours. */
function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" width={ICON_SIZE} height={ICON_SIZE} aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"
      />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" width={ICON_SIZE} height={ICON_SIZE} aria-hidden="true">
      <path
        fill="#fff"
        d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
      />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" width={ICON_SIZE} height={ICON_SIZE} aria-hidden="true">
      <path
        fill="#fff"
        d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"
      />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" width={ICON_SIZE} height={ICON_SIZE} aria-hidden="true">
      <path
        fill="#fff"
        d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
      />
    </svg>
  );
}

function AcrobatIcon() {
  return (
    <svg viewBox="0 0 24 24" width={ICON_SIZE} height={ICON_SIZE} aria-hidden="true">
      <path
        fill="#fff"
        d="M23.63 15.3c-.71-.745-2.166-1.17-4.224-1.17-1.1 0-2.377.106-3.761.354a19.443 19.443 0 0 1-2.307-2.661c-.532-.71-.994-1.49-1.42-2.236.817-2.484 1.207-4.507 1.207-5.962 0-1.632-.603-3.336-2.342-3.336-.532 0-1.065.32-1.349.781-.78 1.384-.425 4.4.923 7.381a60.277 60.277 0 0 1-1.703 4.507c-.568 1.349-1.207 2.733-1.917 4.01C2.834 18.53.314 20.34.03 21.758c-.106.533.071 1.03.462 1.42.142.107.639.533 1.49.533 2.59 0 5.323-4.188 6.707-6.707 1.065-.355 2.13-.71 3.194-.994a34.963 34.963 0 0 1 3.407-.745c2.732 2.448 5.145 2.839 6.352 2.839 1.49 0 2.023-.604 2.2-1.1.32-.64.106-1.349-.213-1.704zm-1.42 1.03c-.107.532-.64.887-1.384.887-.213 0-.39-.036-.604-.071-1.348-.32-2.626-.994-3.903-2.059a17.717 17.717 0 0 1 2.98-.248c.746 0 1.385.035 1.81.142.497.106 1.278.426 1.1 1.348zm-7.524-1.668a38.01 38.01 0 0 0-2.945.674 39.68 39.68 0 0 0-2.52.745 40.05 40.05 0 0 0 1.207-2.555c.426-.994.78-2.023 1.136-2.981.354.603.745 1.207 1.135 1.739a50.127 50.127 0 0 0 1.987 2.378zM10.038 1.46a.768.768 0 0 1 .674-.425c.745 0 .887.851.887 1.526 0 1.135-.355 2.874-.958 4.861-1.03-2.768-1.1-5.074-.603-5.962zM6.134 17.997c-1.81 2.981-3.549 4.826-4.613 4.826a.872.872 0 0 1-.532-.177c-.213-.213-.32-.461-.249-.745.213-1.065 2.271-2.555 5.394-3.904Z"
      />
    </svg>
  );
}

export function Computer() {
  const [clock, setClock] = useState("--:--");
  const [phase, setPhase] = useState<Phase>("boot");

  useEffect(() => {
    setClock(istTime());
    const timer = window.setInterval(() => setClock(istTime()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  // boot: the tube warms up, the welcome fades in, then the desktop
  useEffect(() => {
    if (phase !== "boot") return;
    const timer = window.setTimeout(() => setPhase("on"), 1750);
    return () => window.clearTimeout(timer);
  }, [phase]);

  const [brightnessIdx, setBrightnessIdx] = useState(2);
  const [contrastIdx, setContrastIdx] = useState(2);
  const [osd, setOsd] = useState<{ label: string; pct: number; filled: number; key: number } | null>(null);
  const osdTimer = useRef<number | null>(null);
  const osdKey = useRef(0);

  useEffect(
    () => () => {
      if (osdTimer.current !== null) window.clearTimeout(osdTimer.current);
    },
    [],
  );

  const showOsd = (label: string, pct: number, filled: number) => {
    osdKey.current += 1;
    setOsd({ label, pct, filled, key: osdKey.current });
    if (osdTimer.current !== null) window.clearTimeout(osdTimer.current);
    osdTimer.current = window.setTimeout(() => setOsd(null), 1700);
  };

  const brightness = BRIGHTNESS_LEVELS[brightnessIdx];
  const contrast = CONTRAST_LEVELS[contrastIdx];

  const cycleBrightness = () => {
    if (phase === "off") return;
    const next = (brightnessIdx + 1) % BRIGHTNESS_LEVELS.length;
    setBrightnessIdx(next);
    showOsd("Brightness", Math.round(BRIGHTNESS_LEVELS[next].value * 100), (next + 1) * 2);
  };

  const cycleContrast = () => {
    if (phase === "off") return;
    const next = (contrastIdx + 1) % CONTRAST_LEVELS.length;
    setContrastIdx(next);
    showOsd("Contrast", Math.round(CONTRAST_LEVELS[next].value * 100), (next + 1) * 2);
  };

  const hour = istHour();
  const awake = hour >= 23 || hour < 6;

  const togglePower = () => {
    if (phase === "boot") return;
    if (phase === "off") {
      setPhase("boot");
      return;
    }
    setPhase("off");
  };

  return (
    <div className="crt-scene">
      <div className="crt">
        <div className="crt-body">
          <div
            className="crt-screen"
            data-phase={phase}
            style={{ filter: `brightness(${brightness.value}) contrast(${contrast.value})` }}
          >
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
                <p className="crt-boot-welcome">Welcome to Parth&apos;s Computer</p>
              </div>
            ) : null}

            <div className="crt-desktop">
              <ul className="crt-icons">
                <li>
                  <a className="crt-app" href={`mailto:${site.email}`} title="Gmail">
                    <span className="crt-app-glyph">
                      <MailIcon />
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
                    <span className="crt-app-glyph crt-app-glyph--linkedin">
                      <LinkedInIcon />
                    </span>
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
                    <span className="crt-app-glyph crt-app-glyph--whatsapp">
                      <WhatsAppIcon />
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
                    <span className="crt-app-glyph crt-app-glyph--github">
                      <GitHubIcon />
                    </span>
                    <span className="crt-app-label">GitHub</span>
                  </a>
                </li>
                <li>
                  <a
                    className="crt-app"
                    href={RESUME}
                    target="_blank"
                    rel="noreferrer"
                    title="Résumé (PDF)"
                  >
                    <span className="crt-app-glyph crt-app-glyph--acrobat">
                      <AcrobatIcon />
                    </span>
                    <span className="crt-app-label">Résumé</span>
                  </a>
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
                <span className="crt-clock" suppressHydrationWarning>
                  {clock} IST
                </span>
              </span>
            </div>

            {osd ? (
              <div className="crt-osd" role="status" aria-live="polite" key={osd.key}>
                <div className="crt-osd-row">
                  <span>{osd.label}</span>
                  <span>{osd.pct}%</span>
                </div>
                <div className="crt-osd-bar" aria-hidden="true">
                  {Array.from({ length: 10 }, (_, i) => (
                    <i key={i} data-on={i < osd.filled} />
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="crt-chin">
            <span className="crt-slot" aria-hidden="true">
              <span className="crt-slot-fill" />
            </span>
            <button
              type="button"
              className="crt-knob"
              style={{ transform: `rotate(${(brightnessIdx - 2) * 38}deg)` }}
              onClick={cycleBrightness}
              disabled={phase === "off"}
              aria-label={`Brightness: ${brightness.label}. Press to change.`}
              title={`Brightness — ${brightness.label}`}
            >
              <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true">
                <circle cx="12" cy="12" r="4.4" fill="currentColor" />
                <g stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                  <path d="M12 2.4v2.6" />
                  <path d="M12 19v2.6" />
                  <path d="M2.4 12h2.6" />
                  <path d="M19 12h2.6" />
                  <path d="M5.03 5.03l1.84 1.84" />
                  <path d="M17.13 17.13l1.84 1.84" />
                  <path d="M5.03 18.97l1.84-1.84" />
                  <path d="M17.13 6.87l1.84-1.84" />
                </g>
              </svg>
            </button>
            <button
              type="button"
              className="crt-knob"
              style={{ transform: `rotate(${(contrastIdx - 2) * 38}deg)` }}
              onClick={cycleContrast}
              disabled={phase === "off"}
              aria-label={`Contrast: ${contrast.label}. Press to change.`}
              title={`Contrast — ${contrast.label}`}
            >
              <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true">
                <circle cx="12" cy="12" r="8.4" fill="none" stroke="currentColor" strokeWidth="1.7" />
                <path d="M12 3.6a8.4 8.4 0 0 1 0 16.8z" fill="currentColor" />
              </svg>
            </button>
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
    </div>
  );
}
