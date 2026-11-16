"use client";

import { useEffect, useRef } from "react";

/**
 * The page's backdrop: a field of ASCII glyphs with a small school of ASCII
 * fish swimming in it. Drawn on canvas behind every card and never inside
 * one.
 *
 *  1. Density is a field, not a constant. Two slow waves cross at an angle
 *     and sweep broad bands of busy and empty glyphs across the page, so the
 *     field keeps reorganising and never settles.
 *  2. The gradient is carried by that density: dense bands print dark and
 *     solid, thin gaps fall back almost to bare paper. Tone and density rise
 *     together, so the wave reads as a gradient rather than a texture.
 *  3. Glyphs follow the shape of the field — `/` and `\` on the rising and
 *     falling flanks, `|` on the steep parts, `~` in the troughs, `o` on the
 *     broad plateaus, the small marks in the thin gaps.
 *  4. The fish are real shapes, not glyph rows: a tapered body, a fluke with
 *     a narrow neck, an eye punched out as a hole. The body is filled with a
 *     Bayer dither, so the silhouette is solid in the middle and dissolves
 *     into stipple at the edge — the way a halftone reads. They are bluer
 *     than the waves, and where a fish crosses a wave it keeps its colour
 *     while the water passes back over it, so it looks like it is being
 *     seen through the surface.
 *  5. Hover leaves a trail: every recent pointer position keeps a fading
 *     lobe of light, so the cursor drags a short comet through the field.
 *     The change is *tone only* — glyphs lift toward the paper and step up a
 *     band into a heavier character. Nothing turns a different colour.
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
const CELL_W = 7.2;
const CELL_H = 8.8;
const FONT_PX = 7.4;
/** the density field is sampled every N cells and interpolated */
const FIELD_STEP = 6;

/** below this the cell is bare paper */
const EMPTY_BELOW = 0.11;

/** how far the cursor reaches, px */
const RADIUS = 124;
/** how long a hover lobe lives, ms */
const TRAIL_MS = 620;
/** how many pointer samples the trail keeps */
const TRAIL_MAX = 18;
/** idle repaint interval — the wave is slow, so 12fps is plenty */
const IDLE_MS = 1000 / 12;

/* ---------- tone ---------- */
/**
 * Tone is a mix toward the site ink, so the field always reads as a slightly
 * darker version of the canvas — never a different hue. The gradient comes
 * from density: busy plateaus print dark and solid, thin gaps fall back
 * toward the paper.
 */
const LUM_MIN = 198; // thin areas — barely off the paper
const LUM_MAX = 44; // dense plateaus
const ALPHA_MIN = 0.2;
const ALPHA_MAX = 0.95;
/** the paper's own luminance, so hover can lift a glyph without vanishing */
const PAPER_LUM = 214;

/** how far a hovered glyph lifts toward the paper */
const HOVER_LIFT = 0.5;
/** how far a hovered glyph steps up into a heavier band */
const HOVER_BAND = 0.42;

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
 * The density field at a point: two slow waves crossing at an angle, pushed
 * for contrast so the bands read as a gradient, then a soft vignette.
 * 0 = bare canvas, 1 = solid.
 */
function densityAt(nx: number, ny: number, time: number) {
  const w1 = Math.sin((nx * 1.5 + ny * 0.9) * Math.PI + time * 0.85);
  const w2 = Math.sin((nx * -0.85 + ny * 1.7) * Math.PI - time * 0.58);
  const wave = w1 * 0.66 + w2 * 0.34; // -1..1

  // contrast: push the bands apart so the wave is legible as a gradient
  let d = 0.5 + 0.5 * wave;
  d = clamp((d - 0.5) * 1.72 + 0.5);

  const dx = (nx - 0.5) * 1.9;
  const dy = (ny - 0.5) * 1.9;
  d *= 1 - clamp((Math.hypot(dx, dy) - 0.84) / 0.62) * 0.34;
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
  if (v < 0.2) return GLYPH_LIGHT[(r * GLYPH_LIGHT.length) | 0];
  if (v < 0.4) {
    return r < 0.4
      ? GLYPH_CURVE[(r * GLYPH_CURVE.length) | 0]
      : GLYPH_LIGHT[(r * GLYPH_LIGHT.length) | 0];
  }
  if (v < 0.62) return GLYPH_MID[(r * GLYPH_MID.length) | 0];
  return GLYPH_HEAVY[(r * GLYPH_HEAVY.length) | 0];
}

/* ---------- the fish ---------- */

/**
 * A 4x4 Bayer matrix. Comparing a cell's density against this ordered
 * threshold gives a regular halftone: solid in the body, stippling out at
 * the edge. Deterministic, so the fish never flicker.
 */
const BAYER = [
  0, 8, 2, 10,
  12, 4, 14, 6,
  3, 11, 1, 9,
  15, 7, 13, 5,
];

/** the body of a fish is built from vertical strokes, like the reference */
const FISH_BODY_GLYPH = ["|", "|", "|", "!", "|", "|"];

type FishSpec = {
  /** width and height in cells */
  w: number;
  h: number;
  /** how soft the edge of the silhouette is, in cells */
  soft: number;
  /** how blunt the tail root is, 0 = a point */
  base: number;
};

const FISH_SMALL: FishSpec = { w: 23, h: 9, soft: 1.2, base: 0.34 };
const FISH_BIG: FishSpec = { w: 35, h: 13, soft: 1.3, base: 0.34 };

/** distance from a point to a segment */
function distToSegment(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
) {
  const vx = bx - ax;
  const vy = by - ay;
  const wx = px - ax;
  const wy = py - ay;
  const len2 = vx * vx + vy * vy;
  const t = len2 === 0 ? 0 : clamp((wx * vx + wy * vy) / len2);
  return Math.hypot(px - (ax + vx * t), py - (ay + vy * t));
}

function pointInPoly(px: number, py: number, poly: number[][]) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

/** signed distance to a polygon — negative inside */
function sdPoly(px: number, py: number, poly: number[][]) {
  let d = Infinity;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    d = Math.min(d, distToSegment(px, py, a[0], a[1], b[0], b[1]));
  }
  return pointInPoly(px, py, poly) ? -d : d;
}

/**
 * The density of one fish at a point, in cell units: 1 is solid body, 0 is
 * outside. The body is a teardrop — blunt at the tail root, widest a little
 * forward of the middle, tapering to the nose. The fluke is a convex
 * trapezoid with a narrow neck, so there is a waist between tail and body.
 * The eye is punched out, so it reads as a hole.
 */
function fishDensity(px: number, py: number, spec: FishSpec) {
  const { w, h, soft, base } = spec;
  const x0 = w * 0.36; // tail root
  const x1 = w * 0.97; // nose
  const cy = h * 0.5;
  const maxH = h * 0.33;

  const t = clamp((px - x0) / (x1 - x0), 0, 1);
  const half = maxH * (base + (1 - base) * Math.pow(Math.max(0, 4 * t * (1 - t)), 0.42));
  let d = Math.abs(py - cy) - half;

  // the fluke: narrow at the body, wide at the tip
  const tail = [
    [x0 + 0.6, cy - maxH * 0.2],
    [x0 - w * 0.24, cy - maxH * 0.98],
    [x0 - w * 0.27, cy + maxH * 0.98],
    [x0 + 0.6, cy + maxH * 0.2],
  ];
  d = Math.min(d, sdPoly(px, py, tail));

  // the eye is a hole
  const ex = x1 - (x1 - x0) * 0.26;
  const ey = cy - h * 0.12;
  if (Math.hypot(px - ex, py - ey) < h * 0.115) return -1;

  // soften the edge over roughly a cell and a half
  return clamp(0.5 - d / soft);
}

const CREATURE_CYAN = [22, 92, 164] as const; // small fish
const CREATURE_PALE = [58, 128, 182] as const; // the bigger fish
/** the water that passes back over a creature, so it sits under the surface */
const WATER_HAZE = 0.14;

type Critter = {
  spec: FishSpec;
  color: readonly number[];
  x: number;
  y: number;
  baseY: number;
  dir: 1 | -1;
  speed: number;
  phase: number;
  bob: number;
  bobRate: number;
  drift: number;
};

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

    /** the fading hover trail */
    const trail: { x: number; y: number; t: number }[] = [];

    /** the school */
    const critters: Critter[] = [];
    /** the cells the creatures occupy: cell index -> glyph */
    const critterAt = new Map<number, string>();
    /** the colour of the creature in a given cell */
    const critterColor = new Map<number, readonly number[]>();

    /** seeded, so the school looks the same on every visit */
    let seed = 0x5eed1234;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };

    const spawn = (big: boolean, fromLeft: boolean): Critter => {
      const spec = big ? FISH_BIG : FISH_SMALL;
      const sw = spec.w * CELL_W;
      const dir: 1 | -1 = rand() < 0.74 ? 1 : -1;
      const x = fromLeft ? -sw - rand() * 260 : w + rand() * 260;
      const baseY = h * (0.12 + rand() * 0.74);
      return {
        spec,
        color: big ? CREATURE_PALE : CREATURE_CYAN,
        x,
        y: baseY,
        baseY,
        dir,
        speed: (big ? 8 + rand() * 10 : 12 + rand() * 20) * (dir > 0 ? 1 : -1),
        phase: rand() * Math.PI * 2,
        bob: 6 + rand() * 18,
        bobRate: 0.3 + rand() * 0.7,
        drift: 0.4 + rand() * 0.9,
      };
    };

    /* ---------- the coarse field ---------- */
    const buildField = (t: number) => {
      for (let fy = 0; fy < fh; fy++) {
        const ny = (fy * FIELD_STEP * CELL_H) / h;
        for (let fx = 0; fx < fw; fx++) {
          const nx = (fx * FIELD_STEP * CELL_W) / w;
          const i = fy * fw + fx;
          fieldD[i] = densityAt(nx, ny, t);
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

      const d = lerp(
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

    /** the strongest influence any trail lobe has on a cell */
    const trailInfluence = (x: number, y: number, now: number) => {
      let best = 0;
      for (let i = 0; i < trail.length; i++) {
        const p = trail[i];
        const age = (now - p.t) / TRAIL_MS;
        if (age > 1) continue;
        const d = Math.hypot(x - p.x, y - p.y);
        if (d > RADIUS) continue;
        const f = 1 - d / RADIUS;
        const radial = f * f * (3 - 2 * f);
        const fade = (1 - age) * (1 - age);
        const v = radial * fade;
        if (v > best) best = v;
      }
      return best;
    };

    /* ---------- move the school ---------- */
    const moveCritters = (dt: number, t: number) => {
      critterAt.clear();
      critterColor.clear();

      for (const c of critters) {
        c.x += c.speed * dt;

        // bobbing, with a slow drift so they do not all rise together
        c.baseY += Math.sin(t * c.drift + c.phase) * 5 * dt;
        c.baseY = clamp(c.baseY, h * 0.1, h * 0.9);
        c.y = c.baseY + Math.sin(t * c.bobRate + c.phase) * c.bob;

        const sw = c.spec.w * CELL_W;
        const sh = c.spec.h * CELL_H;

        // wrap around the edges
        if (c.speed > 0 && c.x > w + 10) {
          c.x = -sw - 10;
          c.baseY = h * (0.12 + rand() * 0.74);
        } else if (c.speed < 0 && c.x < -sw - 10) {
          c.x = w + 10;
          c.baseY = h * (0.12 + rand() * 0.74);
        }

        // stamp the fish into the cell map
        for (let ry = 0; ry < c.spec.h; ry++) {
          for (let rx = 0; rx < c.spec.w; rx++) {
            const density = fishDensity(rx + 0.5, ry + 0.5, c.spec);
            if (density <= 0) continue;
            const threshold = (BAYER[(ry & 3) * 4 + (rx & 3)] + 0.5) / 16;
            if (density < threshold) continue;

            const cellX = Math.floor((c.x + rx * CELL_W) / CELL_W);
            const cellY = Math.floor((c.y + ry * CELL_H) / CELL_H);
            if (cellX < 0 || cellY < 0 || cellX >= cols || cellY >= rows) continue;

            // the body is vertical strokes; the flanks pick up the contour marks
            const edge = density < 0.62;
            const glyph = edge
              ? hash(cellX + 3, cellY + 11) % 3 === 0
                ? c.dir > 0
                  ? "/"
                  : "\\"
                : "|"
              : FISH_BODY_GLYPH[hash(cellX, cellY) % FISH_BODY_GLYPH.length];

            const key = cellY * cols + cellX;
            critterAt.set(key, glyph);
            critterColor.set(key, c.color);
          }
        }
      }
    };

    /* ---------- one full repaint ---------- */
    const paint = (now: number) => {
      const t = reduceMotion ? 0 : (now - startTime) / 1000;
      buildField(t);

      ctx.clearRect(0, 0, w, h);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      for (let cy = 0; cy < rows; cy++) {
        for (let cx = 0; cx < cols; cx++) {
          const { d, slope } = sampleField(cx, cy);
          if (d < EMPTY_BELOW) continue; // bare paper

          const x = cx * CELL_W + CELL_W / 2;
          const y = cy * CELL_H + CELL_H / 2;

          // a fish in this cell takes priority over the wave
          const key = cy * cols + cx;
          const critter = critterAt.get(key);
          if (critter) {
            const color = critterColor.get(key) ?? CREATURE_CYAN;
            ctx.font = `700 ${FONT_PX + 0.5}px ${mono}`;
            ctx.fillStyle = `rgba(${color[0]},${color[1]},${color[2]},0.92)`;
            ctx.fillText(critter, x, y);
            // the water passes back over it — a fish seen through the waves
            const haze = glyphFor(cx, cy, d, slope, 0);
            ctx.font = `400 ${FONT_PX}px ${mono}`;
            ctx.fillStyle = `rgba(16,18,24,${WATER_HAZE.toFixed(3)})`;
            ctx.fillText(haze, x, y);
            continue;
          }

          // how strongly the trail reaches this cell
          const near = trail.length ? trailInfluence(x, y, now) : 0;

          // hover steps the cell into a heavier band, so the character changes
          const band = near * HOVER_BAND;
          const glyph = glyphFor(cx, cy, d, slope, band);

          // tone: darker where denser, lifted toward the paper where hovered
          const jitter = 0.9 + ((hash(cx + 7, cy + 3) % 100) / 100) * 0.18;
          const baseLum = lerp(LUM_MIN, LUM_MAX, clamp(d + band * 0.5)) * jitter;
          const baseAlpha = lerp(ALPHA_MIN, ALPHA_MAX, clamp(d + band * 0.5));

          const lum = lerp(baseLum, Math.min(PAPER_LUM, baseLum + 104), near * HOVER_LIFT);
          const alpha = clamp(baseAlpha * (1 - near * 0.1) + near * 0.22, 0, 0.97);

          // a hovered glyph also grows, so it holds its own in a busy field
          const size = FONT_PX + near * 1.9;
          ctx.font =
            size > FONT_PX + 0.15 ? `600 ${size.toFixed(2)}px ${mono}` : `400 ${FONT_PX}px ${mono}`;

          const l = Math.round(lum);
          ctx.fillStyle = `rgba(${l},${Math.round(l * 1.03)},${Math.round(l * 1.16)},${alpha.toFixed(3)})`;

          ctx.fillText(glyph, x, y - near * 0.8);
        }
      }
      ctx.font = `400 ${FONT_PX}px ${mono}`;
    };

    /* ---------- the loop ---------- */
    const frame = (now: number) => {
      raf = 0;

      const dt = Math.min(0.05, (now - lastPaint) / 1000) || 1 / 60;
      moveCritters(dt, reduceMotion ? 0 : (now - startTime) / 1000);

      const due = now - lastPaint >= IDLE_MS;
      const trailActive = trail.length > 0;
      if (due || (trailActive && now - lastPaint >= 32)) {
        paint(now);
        lastPaint = now;
      }

      // drop trail lobes that have expired
      if (trail.length && now - trail[0].t > TRAIL_MS) {
        while (trail.length && now - trail[0].t > TRAIL_MS) trail.shift();
      }

      const animating = !reduceMotion || trailActive;
      if (animating) {
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

      // stock the water
      critters.length = 0;
      const small = Math.max(3, Math.round(w / 200));
      for (let i = 0; i < small; i++) critters.push(spawn(false, i % 2 === 0));
      const big = Math.max(1, Math.round(w / 700));
      for (let i = 0; i < big; i++) critters.push(spawn(true, i % 2 === 1));

      startTime = performance.now();
      paint(performance.now());
      lastPaint = performance.now();
    };

    /* ---------- pointer ---------- */
    const onMove = (event: PointerEvent) => {
      const now = performance.now();
      const last = trail[trail.length - 1];
      // only sample when the pointer has actually moved
      if (!last || Math.hypot(event.clientX - last.x, event.clientY - last.y) > 3) {
        trail.push({ x: event.clientX, y: event.clientY, t: now });
        if (trail.length > TRAIL_MAX) trail.shift();
      }
      kick();
    };

    const onLeave = () => {
      trail.length = 0;
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
        trail.length = 0;
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