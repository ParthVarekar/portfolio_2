"use client";

import { useEffect, useRef } from "react";

/**
 * The page's backdrop: a dense field of ASCII glyphs, drawn on canvas behind
 * every card and never inside one.
 *
 * Three things make it read as a living surface rather than wallpaper:
 *
 *  1. Density is a function of position, not a constant — two slow waves
 *     cross at an angle and sweep bands of busy and empty glyphs across the
 *     page, so the field keeps changing and never settles.
 *  2. Glyphs follow the shape of the density field: `/` and `\` take the
 *     rising and falling flanks, `|` the steep parts, `~` the troughs, `o`
 *     the broad plateaus and the small marks the thin gaps.
 *  3. Hover only changes *tone* — a glyph near the cursor lightens toward the
 *     canvas and steps up a band so a heavier character takes its place. The
 *     colour stays in one family; nothing turns lime or blue.
 *
 * The density field is evaluated on a coarse grid and interpolated, so the
 * cost per frame is flat no matter how small the cells get.
 */

/* ---------- glyph vocabulary ---------- */
/** broad, flat areas — `o` is the workhorse */
const GLYPH_HEAVY = ["o", "o", "o", "o", "0", "#", "@"];
/** mid-weight fill */
const GLYPH_MID = ["+", "=", "*"];
/** light fill for the thinnest areas */
const GLYPH_LIGHT = [".", ".", ",", "'", "`", '"'];
/** contour glyphs — chosen by the local slope of the density field */
const GLYPH_RISE = ["/", "/", "1"];
const GLYPH_FALL = ["\\", "\\", "\\"];
const GLYPH_EDGE = ["|", "!", "i", "l"];
/** curvy and trough areas */
const GLYPH_CURVE = ["~", "~", "-", "_"];

/* ---------- grid ---------- */
const CELL_W = 6;
const CELL_H = 7.4;
const FONT_PX = 6.4;
/** the density field is sampled every N cells and interpolated */
const FIELD_STEP = 6;

/** how far the cursor reaches, px */
const RADIUS = 128;
/** idle repaint interval — the wave is slow, so 12fps is plenty */
const IDLE_MS = 1000 / 12;

/* ---------- tone ---------- */
/**
 * Tone is a mix toward the site's ink, so the field always reads as a
 * slightly darker version of the canvas — never a different hue. The
 * gradient in the reference comes from *density*: busy plateaus pack many
 * strokes together, thin gaps fall back toward the paper.
 */
const LUM_MIN = 172; // thin areas — barely off the paper
const LUM_MAX = 58; // dense plateaus
const ALPHA_MIN = 0.26;
const ALPHA_MAX = 0.86;

/** how far a hovered glyph lifts toward the canvas */
const HOVER_LIFT = 0.42;
/** how far a hovered glyph steps up into a heavier band */
const HOVER_BAND = 0.4;

const clamp = (v: number, lo = 0, hi = 1) => (v < lo ? lo : v > hi ? hi : v);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** cheap deterministic per-cell noise */
function hash(x: number, y: number) {
  let h = (x * 73856093) ^ (y * 19349663);
  h = (h ^ (h >> 13)) * 1274126177;
  h ^= h >> 16;
  return Math.abs(h);
}

/**
 * The density field at a point: two slow waves crossing at an angle, plus a
 * soft vignette so the field is busiest mid-page. 0 = bare canvas, 1 = solid.
 */
function densityAt(nx: number, ny: number, time: number) {
  const w1 = Math.sin((nx * 3.1 + ny * 1.9) * Math.PI + time * 0.9);
  const w2 = Math.sin((nx * -1.7 + ny * 3.4) * Math.PI - time * 0.62);
  let d = 0.5 + 0.5 * (w1 * 0.62 + w2 * 0.38);

  const dx = (nx - 0.5) * 1.9;
  const dy = (ny - 0.5) * 1.9;
  d *= 1 - clamp((Math.hypot(dx, dy) - 0.82) / 0.62) * 0.38;
  return clamp(d);
}

/**
 * Pick the glyph for a cell from its density and its slope.
 * `band` shifts the whole vocabulary up or down, which is how hover raises a
 * cell's presence without recolouring it.
 */
function glyphFor(
  cx: number,
  cy: number,
  d: number,
  slope: { dx: number; dy: number; mag: number },
  band: number,
) {
  const v = clamp(d + band);
  const r = hash(cx, cy) / 2147483647;

  // contour glyphs take over wherever the field has a real slope
  if (slope.mag > 0.05) {
    const dir = slope.dy !== 0 ? slope.dx / slope.dy : 9;
    if (Math.abs(dir) < 0.5) return GLYPH_EDGE[(r * GLYPH_EDGE.length) | 0];
    if (slope.dy > 0) return GLYPH_RISE[(r * GLYPH_RISE.length) | 0];
    return GLYPH_FALL[(r * GLYPH_FALL.length) | 0];
  }

  // troughs get the curvy marks, plateaus the heavy ones
  if (v < 0.18) return GLYPH_LIGHT[(r * GLYPH_LIGHT.length) | 0];
  if (v < 0.36) {
    return r < 0.4
      ? GLYPH_CURVE[(r * GLYPH_CURVE.length) | 0]
      : GLYPH_LIGHT[(r * GLYPH_LIGHT.length) | 0];
  }
  if (v < 0.6) return GLYPH_MID[(r * GLYPH_MID.length) | 0];
  return GLYPH_HEAVY[(r * GLYPH_HEAVY.length) | 0];
}

export function AsciiField() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const mono =
      getComputedStyle(document.documentElement).getPropertyValue("--font-geist-mono").trim() ||
      "ui-monospace, monospace";

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    let w = 0;
    let h = 0;
    let cols = 0;
    let rows = 0;
    let dpr = 1;

    // the coarse density field
    let fw = 0;
    let fh = 0;
    let fieldD = new Float32Array(0);
    let fieldSX = new Float32Array(0);
    let fieldSY = new Float32Array(0);
    let fieldMag = new Float32Array(0);

    let raf = 0;
    let lastPaint = 0;
    let startTime = performance.now();

    let px = -9999;
    let py = -9999;
    let glow = 0;
    let glowTarget = 0;

    /* ---------- the coarse field ---------- */
    const buildField = (t: number) => {
      for (let fy = 0; fy < fh; fy++) {
        const ny = (fy * FIELD_STEP * CELL_H) / h;
        for (let fx = 0; fx < fw; fx++) {
          const nx = (fx * FIELD_STEP * CELL_W) / w;
          const i = fy * fw + fx;
          const d = densityAt(nx, ny, t);
          fieldD[i] = d;
          // slope from two neighbours of the coarse grid
          const e = 1;
          const dx = fieldD[fy * fw + Math.min(fw - 1, fx + e)] - fieldD[fy * fw + Math.max(0, fx - e)];
          const dy = fieldD[Math.min(fh - 1, fy + e) * fw + fx] - fieldD[Math.max(0, fy - e) * fw + fx];
          fieldSX[i] = dx;
          fieldSY[i] = dy;
          fieldMag[i] = Math.hypot(dx, dy);
        }
      }
    };

    const sampleField = (cx: number, cy: number) => {
      const fx = cx / FIELD_STEP;
      const fy = cy / FIELD_STEP;
      const x0 = Math.min(fw - 1, Math.max(0, Math.floor(fx)));
      const y0 = Math.min(fh - 1, Math.max(0, Math.floor(fy)));
      const x1 = Math.min(fw - 1, x0 + 1);
      const y1 = Math.min(fh - 1, y0 + 1);
      const tx = fx - x0;
      const ty = fy - y0;

      const d =
        lerp(
          lerp(fieldD[y0 * fw + x0], fieldD[y0 * fw + x1], tx),
          lerp(fieldD[y1 * fw + x0], fieldD[y1 * fw + x1], tx),
          ty,
        );
      const sx = lerp(
        lerp(fieldSX[y0 * fw + x0], fieldSX[y0 * fw + x1], tx),
        lerp(fieldSX[y1 * fw + x0], fieldSX[y1 * fw + x1], tx),
        ty,
      );
      const sy = lerp(
        lerp(fieldSY[y0 * fw + x0], fieldSY[y0 * fw + x1], tx),
        lerp(fieldSY[y1 * fw + x0], fieldSY[y1 * fw + x1], tx),
        ty,
      );
      return { d, slope: { dx: sx, dy: sy, mag: Math.hypot(sx, sy) } };
    };

    /* ---------- one full repaint ---------- */
    const paint = (now: number) => {
      const t = reduceMotion ? 0 : (now - startTime) / 1000;
      buildField(t);

      ctx.clearRect(0, 0, w, h);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const hcx = px / CELL_W;
      const hcy = py / CELL_H;
      const reachX = RADIUS / CELL_W;
      const reachY = RADIUS / CELL_H;

      for (let cy = 0; cy < rows; cy++) {
        for (let cx = 0; cx < cols; cx++) {
          const { d, slope } = sampleField(cx, cy);
          if (d < 0.03) continue; // bare paper

          // how close is this cell to the cursor?
          let near = 0;
          if (glow > 0.004 && px > -999) {
            const ox = (cx - hcx) / reachX;
            const oy = (cy - hcy) / reachY;
            const dist = Math.hypot(ox, oy);
            if (dist < 1) {
              const f = 1 - dist;
              near = f * f * (3 - 2 * f) * glow;
            }
          }

          // hover steps the cell into a heavier band, so the character changes
          const band = near * HOVER_BAND;
          const glyph = glyphFor(cx, cy, d, slope, band);

          // tone: darker where denser, lifted toward the paper where hovered
          const jitter = 0.88 + ((hash(cx + 7, cy + 3) % 100) / 100) * 0.22;
          const lum = lerp(LUM_MIN, LUM_MAX, clamp(d + band * 0.5)) * jitter;
          const alpha = clamp(
            lerp(ALPHA_MIN, ALPHA_MAX, clamp(d + band * 0.5)) * (1 - near * 0.18),
            0,
            0.92,
          );

          // a hovered glyph also grows, so it holds its own in a busy field
          const size = FONT_PX + near * 1.7;
          ctx.font =
            size > FONT_PX + 0.15 ? `600 ${size.toFixed(2)}px ${mono}` : `400 ${FONT_PX}px ${mono}`;

          const l = Math.round(lum);
          ctx.fillStyle = `rgba(${l},${Math.round(l * 1.03)},${Math.round(l * 1.16)},${alpha.toFixed(3)})`;

          ctx.fillText(glyph, cx * CELL_W + CELL_W / 2, cy * CELL_H + CELL_H / 2 - near * 0.7);
        }
      }
      ctx.font = `400 ${FONT_PX}px ${mono}`;
    };

    /* ---------- the loop ---------- */
    const frame = (now: number) => {
      raf = 0;

      if (Math.abs(glow - glowTarget) > 0.004) {
        glow += (glowTarget - glow) * 0.2;
        if (Math.abs(glow - glowTarget) < 0.006) glow = glowTarget;
      } else {
        glow = glowTarget;
      }

      const due = now - lastPaint >= IDLE_MS;
      const hoverActive = glow > 0.004 || glowTarget > 0.004;
      if (due || (hoverActive && now - lastPaint >= 32)) {
        paint(now);
        lastPaint = now;
      }

      const settling = Math.abs(glow - glowTarget) > 0.004;
      if (!reduceMotion || settling) {
        raf = requestAnimationFrame(frame);
      }
    };

    const kick = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };

    /* ---------- sizing ---------- */
    const layout = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      cols = Math.ceil(w / CELL_W) + 1;
      rows = Math.ceil(h / CELL_H) + 1;
      fw = Math.ceil(cols / FIELD_STEP) + 2;
      fh = Math.ceil(rows / FIELD_STEP) + 2;
      fieldD = new Float32Array(fw * fh);
      fieldSX = new Float32Array(fw * fh);
      fieldSY = new Float32Array(fw * fh);
      fieldMag = new Float32Array(fw * fh);

      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      startTime = performance.now();
      paint(performance.now());
      lastPaint = performance.now();
    };

    /* ---------- pointer ---------- */
    const onMove = (event: PointerEvent) => {
      px = event.clientX;
      py = event.clientY;
      glowTarget = 1;
      kick();
    };

    const onLeave = () => {
      glowTarget = 0;
      kick();
    };

    let resizeTimer = 0;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(layout, 140);
    };

    const onVisibility = () => {
      if (document.hidden) {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
      } else {
        kick();
      }
    };

    layout();
    if (!reduceMotion) kick();

    if (finePointer && !reduceMotion) {
      window.addEventListener("pointermove", onMove, { passive: true });
      document.addEventListener("pointerleave", onLeave);
    }
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.clearTimeout(resizeTimer);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <div className="ascii-field" aria-hidden="true">
      <canvas ref={canvasRef} className="ascii-canvas" />
    </div>
  );
}