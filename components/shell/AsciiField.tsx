"use client";

import { useEffect, useRef } from "react";

/**
 * The page's backdrop: an ASCII renderer.
 *
 * One fixed monospace grid covers the viewport, and every cell's character
 * comes from the brightness of a scene underneath — the way an ASCII shader
 * works. Shapes are never outlined; they emerge from glyph density.
 *
 *  1. The scene is painted each frame into a tiny offscreen canvas at one
 *     pixel per cell: the red channel holds water, green holds fish (blue
 *     marks the teal school). Waves are volumetric bands, brightest in their
 *     core; fish are filled, shaded bodies with a dorsal fin, a wagging tail
 *     and the eye left empty, so it reads as a hole.
 *  2. That canvas is read back and each cell's value picks a glyph from a
 *     ramp — water `.` `_` `-` `>` `o` `0`, fish `.` `:` `+` `o` `0` `@` —
 *     and an opacity step.
 *  3. Under everything sits a faint, static field of dots, so the page always
 *     carries the grid even where nothing is swimming.
 *  4. The cursor trail lights cells along the pointer's path in green — thick
 *     at the head, thinning and breaking into specks as it ages — a loop of
 *     glyphs that follows you and dissolves behind you.
 *
 * Glyphs are stamped from a pre-rendered atlas (drawImage), never shaped as
 * text per frame. The scene runs at ~20 fps; the trail at full frame rate
 * only while it is visible. Reduced motion gets one still frame and no trail.
 */

/* ---------- grid ---------- */
const CELL_W = 9;
const CELL_H = 12;
const FONT_PX = 10.5;
const SCENE_MS = 1000 / 20;

/* ---------- trail ---------- */
const TRAIL_LIFE = 1500; // ms a point of the trail lives
const TRAIL_MAX = 160;

/* ---------- glyphs and palettes ---------- */
const GLYPHS = ["·", ".", ":", "-", "_", "~", ">", "+", "o", "%", "°", "0", "@", "*"] as const;
type Glyph = (typeof GLYPHS)[number];
const GLYPH_INDEX = new Map<string, number>(GLYPHS.map((g, i) => [g, i]));

/** opacity steps per palette */
const LEVELS = 8;

const PALETTES = {
  dots: { rgb: "54,72,112", max: 0.3 },
  water: { rgb: "40,86,164", max: 0.78 },
  fish: { rgb: "24,78,168", max: 0.92 },
  teal: { rgb: "16,124,150", max: 0.9 },
  trail: { rgb: "30,150,90", max: 0.95 },
} as const;
type Palette = keyof typeof PALETTES;
const PALETTE_ORDER: Palette[] = ["dots", "water", "fish", "teal", "trail"];

const WATER_RAMP: Glyph[] = [".", "_", "-", "-", ">", ">", "o", "0"];
const FISH_RAMP: Glyph[] = [".", ":", ":", "+", "o", "o", "o", "0"];
const TRAIL_RAMP: Glyph[] = ["·", "·", "°", "%", "o", "o", "0", "@"];

const clamp = (v: number, lo = 0, hi = 1) => (v < lo ? lo : v > hi ? hi : v);

/** cheap deterministic hash → 0..1 */
function hash(a: number, b: number, c = 0) {
  let h = (a * 73856093) ^ (b * 19349663) ^ (c * 83492791);
  h = (h ^ (h >>> 13)) * 1274126177;
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/* ---------- creatures ---------- */

type Fish = {
  /** length in cells */
  len: number;
  teal: boolean;
  x: number; // centre, cells
  y: number;
  baseY: number;
  dir: 1 | -1;
  speed: number; // cells per second
  boost: number;
  vy: number;
  bob: number;
  phase: number;
  wag: number;
};

type Bubble = { x: number; y: number; born: number; life: number; wobble: number };

export function AsciiField() {
  const dotsRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<HTMLCanvasElement | null>(null);
  const trailRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const dotsCanvas = dotsRef.current;
    const sceneCanvas = sceneRef.current;
    const trailCanvas = trailRef.current;
    if (!dotsCanvas || !sceneCanvas || !trailCanvas) return;
    const dctx = dotsCanvas.getContext("2d");
    const sctx = sceneCanvas.getContext("2d");
    const tctx = trailCanvas.getContext("2d");
    if (!dctx || !sctx || !tctx) return;

    const mono =
      getComputedStyle(document.documentElement).getPropertyValue("--font-geist-mono").trim() ||
      "ui-monospace, monospace";
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const withTrail = finePointer && !reduceMotion;

    let w = 0;
    let h = 0;
    let dpr = 1;
    let cols = 0;
    let rows = 0;
    /** phones: text sits straight on the backdrop more often, so it is calmer */
    let calm = 1;
    let scrollY = window.scrollY;
    const start = performance.now();

    /* ---------- the glyph atlas ---------- */
    const atlas = document.createElement("canvas");
    const actx = atlas.getContext("2d");

    const buildAtlas = () => {
      if (!actx) return;
      const rowsTotal = PALETTE_ORDER.length * LEVELS;
      atlas.width = Math.ceil(GLYPHS.length * CELL_W * dpr);
      atlas.height = Math.ceil(rowsTotal * CELL_H * dpr);
      actx.setTransform(dpr, 0, 0, dpr, 0, 0);
      actx.clearRect(0, 0, GLYPHS.length * CELL_W, rowsTotal * CELL_H);
      actx.textAlign = "center";
      actx.textBaseline = "middle";
      PALETTE_ORDER.forEach((name, p) => {
        const { rgb, max } = PALETTES[name];
        const bold = name === "fish" || name === "teal" || name === "trail";
        actx.font = `${bold ? 700 : 400} ${FONT_PX}px ${mono}`;
        for (let level = 1; level <= LEVELS; level++) {
          const alpha = (level / LEVELS) * max * (name === "trail" ? 1 : calm);
          actx.fillStyle = `rgba(${rgb},${alpha.toFixed(3)})`;
          const row = p * LEVELS + (level - 1);
          GLYPHS.forEach((glyph, i) => actx.fillText(glyph, (i + 0.5) * CELL_W, (row + 0.5) * CELL_H));
        }
      });
    };

    /** stamp one glyph into a cell (cx, cy are cell coordinates) */
    const stamp = (
      context: CanvasRenderingContext2D,
      cx: number,
      cy: number,
      glyph: Glyph,
      palette: Palette,
      level: number,
    ) => {
      const l = Math.max(1, Math.min(LEVELS, Math.round(level)));
      const gi = GLYPH_INDEX.get(glyph) ?? 0;
      const row = PALETTE_ORDER.indexOf(palette) * LEVELS + (l - 1);
      const sw = CELL_W * dpr;
      const sh = CELL_H * dpr;
      context.drawImage(atlas, gi * sw, row * sh, sw, sh, cx * CELL_W, cy * CELL_H, CELL_W, CELL_H);
    };

    /* ---------- the dot field (static) ---------- */
    const drawDots = () => {
      dctx.clearRect(0, 0, w, h);
      for (let cy = 0; cy < rows; cy++) {
        for (let cx = 0; cx < cols; cx++) {
          // a slow, soft density: denser toward the left and the bottom, like a halftone wash
          const nx = cx / cols;
          const ny = cy / rows;
          const wash =
            0.5 +
            0.28 * Math.sin(nx * 4.1 + ny * 2.3) +
            0.22 * Math.sin(nx * -2.7 + ny * 5.2 + 1.3) -
            nx * 0.25 +
            ny * 0.15;
          const r = hash(cx, cy, 7);
          if (r > clamp(wash, 0.15, 0.95)) continue;
          const glyph: Glyph = wash > 0.7 && r < 0.06 ? "°" : r < 0.6 ? "·" : ".";
          stamp(dctx, cx, cy, glyph, "dots", 1 + clamp(wash) * 3 + hash(cx, cy, 3) * 1.5);
        }
      }
    };

    /* ---------- the scene field: one pixel per cell ---------- */
    const field = document.createElement("canvas");
    const fctx = field.getContext("2d", { willReadFrequently: true });

    const fishes: Fish[] = [];
    const bubbles: Bubble[] = [];

    let seed = 0x5eed1234;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };

    const newFish = (len: number, teal: boolean, onScreen: boolean, y?: number, dir?: 1 | -1, x?: number): Fish => {
      const d: 1 | -1 = dir ?? (rand() < 0.65 ? 1 : -1);
      const baseY = y ?? rows * (0.12 + rand() * 0.76);
      return {
        len,
        teal,
        x: x ?? (onScreen ? rand() * cols : d > 0 ? -len - rand() * 30 : cols + len + rand() * 30),
        y: baseY,
        baseY,
        dir: d,
        speed: (len > 30 ? 2 : len > 14 ? 3.2 : 5.2) * (0.8 + rand() * 0.4),
        boost: 0,
        vy: 0,
        bob: 0.4 + rand() * 1.1,
        phase: rand() * Math.PI * 2,
        wag: 4 + rand() * 3,
      };
    };

    const stock = () => {
      fishes.length = 0;
      bubbles.length = 0;
      seed = 0x5eed1234;
      const wide = w > 900;
      if (wide) fishes.push(newFish(44, false, true, rows * 0.66, 1, cols * 0.3));
      const mids = Math.max(1, Math.round(w / 640));
      for (let i = 0; i < mids; i++) {
        // spread the mid fish across the width so they don't stack on each other
        // narrow screens get smaller fish, so none of them fills the space behind a paragraph
        const size = (20 + rand() * 6) * Math.max(0.62, Math.min(1, cols / 120));
        fishes.push(newFish(size, false, true, rows * (0.18 + 0.3 * i), undefined, cols * ((i + 0.6) / (mids + 0.4))));
      }
      // a teal school that travels together and scatters together
      // the school keeps to the upper water, away from the big fish
      const schoolY = rows * (0.22 + rand() * 0.2);
      const schoolX = cols * (0.55 + rand() * 0.35);
      const schoolDir: 1 | -1 = rand() < 0.5 ? 1 : -1;
      const size = wide ? 8 : 5;
      for (let i = 0; i < size; i++) {
        const fish = newFish(
          6 + rand() * 2.5,
          true,
          true,
          schoolY + (rand() - 0.5) * 9,
          schoolDir,
          schoolX + (rand() - 0.5) * 18 - i * 3 * schoolDir,
        );
        fish.speed = 5;
        fishes.push(fish);
      }
    };

    /** a swell's shape, fixed by its index so it keeps its identity under scroll */
    const swell = (j: number) => ({
      amp: 3 + hash(j, 11) * 3.5, // rows
      len: 55 + hash(j, 23) * 60, // cols
      speed: (2.4 + hash(j, 37) * 3) * (hash(j, 41) < 0.8 ? 1 : -1),
      phase: hash(j, 53) * Math.PI * 2,
      thick: 9 + hash(j, 61) * 6,
    });
    const SWELL_GAP = 27; // rows between swells
    const PARALLAX = 0.2;

    const paintWaves = (t: number) => {
      if (!fctx) return;
      const offset = (scrollY * PARALLAX) / CELL_H;
      const first = Math.floor((offset - SWELL_GAP) / SWELL_GAP);
      const last = Math.ceil((offset + rows + SWELL_GAP) / SWELL_GAP);
      fctx.lineWidth = 1;
      for (let j = first; j <= last; j++) {
        const s = swell(j);
        const base = j * SWELL_GAP - offset + SWELL_GAP * 0.4;
        const k = (Math.PI * 2) / s.len;
        // the band is drawn as stacked strokes, so its brightness follows the crest:
        // thin at the top and bottom edges, brightest in the core — a volume, not a line
        for (let d = 0; d <= s.thick; d++) {
          const u = d / s.thick;
          const profile = Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.15)), 0.9) * (1 - u * 0.35);
          if (profile <= 0.02) continue;
          fctx.beginPath();
          for (let x = -1; x <= cols + 1; x++) {
            const theta = k * x - k * s.speed * t + s.phase;
            const y = base + s.amp * (Math.sin(theta) + 0.32 * Math.sin(2 * theta + 1.1)) + d;
            if (x === -1) fctx.moveTo(x, y);
            else fctx.lineTo(x, y);
          }
          const level = Math.round(255 * profile);
          fctx.strokeStyle = `rgb(${level},0,0)`;
          fctx.stroke();
        }
      }
      // let some stretches of each swell fade out: multiply by a slow horizontal mask
      fctx.globalCompositeOperation = "multiply";
      const mask = fctx.createLinearGradient(0, 0, cols, 0);
      const phase = (t * 0.03) % 1;
      for (let i = 0; i <= 6; i++) {
        const stop = i / 6;
        const v = 0.7 + 0.3 * Math.sin((stop + phase) * Math.PI * 4);
        const c = Math.round(255 * v);
        mask.addColorStop(stop, `rgb(${c},255,255)`);
      }
      fctx.fillStyle = mask;
      fctx.fillRect(0, 0, cols, rows);
      fctx.globalCompositeOperation = "source-over";
    };

    /**
     * A fish, painted into the field: a deep, rounded body lit from above,
     * a forked tail that wags from the root, a dorsal and a belly fin, a gill
     * line, and the eye left empty so it reads as a hole in the glyphs. The
     * body goes to the green channel; fins and tail also set blue, so they
     * print in teal and every fish is two-toned.
     */
    const paintFish = (fish: Fish, t: number) => {
      if (!fctx) return;
      const L = fish.len;
      // cells are taller than wide: H is in rows, so this keeps a deep body on screen
      const H = (L * CELL_W) / CELL_H / 1.55;
      const body = fish.teal ? 255 : 0;
      const fin = 255;
      fctx.save();
      fctx.translate(fish.x, fish.y);
      fctx.scale(fish.dir, 1);

      // forked tail, wagging from the root
      fctx.save();
      fctx.translate(-0.36 * L, 0);
      fctx.rotate(Math.sin(t * fish.wag + fish.phase) * 0.3);
      fctx.beginPath();
      fctx.moveTo(0.06 * L, -0.08 * H);
      fctx.lineTo(-0.3 * L, -0.78 * H);
      fctx.quadraticCurveTo(-0.17 * L, 0, -0.3 * L, 0.78 * H);
      fctx.lineTo(0.06 * L, 0.08 * H);
      fctx.closePath();
      const tail = fctx.createLinearGradient(0, 0, -0.3 * L, 0);
      tail.addColorStop(0, `rgb(0,200,${fin})`);
      tail.addColorStop(1, `rgb(0,120,${fin})`);
      fctx.fillStyle = tail;
      fctx.fill();
      fctx.restore();

      // dorsal fin, swept back
      fctx.beginPath();
      fctx.moveTo(0.16 * L, -0.46 * H);
      fctx.quadraticCurveTo(-0.02 * L, -1.02 * H, -0.24 * L, -0.86 * H);
      fctx.quadraticCurveTo(-0.16 * L, -0.55 * H, -0.24 * L, -0.34 * H);
      fctx.closePath();
      fctx.fillStyle = `rgb(0,165,${fin})`;
      fctx.fill();

      // belly fin
      fctx.beginPath();
      fctx.moveTo(0.06 * L, 0.44 * H);
      fctx.quadraticCurveTo(-0.04 * L, 0.86 * H, -0.16 * L, 0.74 * H);
      fctx.lineTo(-0.12 * L, 0.4 * H);
      fctx.closePath();
      fctx.fillStyle = `rgb(0,140,${fin})`;
      fctx.fill();

      // body: deep and rounded, brightest along the back
      const shade = fctx.createLinearGradient(0, -0.6 * H, 0, 0.6 * H);
      shade.addColorStop(0, `rgb(0,245,${body})`);
      shade.addColorStop(0.45, `rgb(0,215,${body})`);
      shade.addColorStop(1, `rgb(0,110,${body})`);
      fctx.beginPath();
      fctx.moveTo(-0.38 * L, 0);
      fctx.bezierCurveTo(-0.24 * L, -0.72 * H, 0.24 * L, -0.72 * H, 0.5 * L, 0.04 * H);
      fctx.bezierCurveTo(0.26 * L, 0.66 * H, -0.24 * L, 0.66 * H, -0.38 * L, 0);
      fctx.fillStyle = shade;
      fctx.fill();

      if (L > 10) {
        // gill line, a shade darker
        fctx.beginPath();
        fctx.moveTo(0.2 * L, -0.44 * H);
        fctx.quadraticCurveTo(0.12 * L, 0, 0.2 * L, 0.42 * H);
        fctx.strokeStyle = `rgb(0,95,${body})`;
        fctx.lineWidth = Math.max(0.7, L / 36);
        fctx.stroke();
      }

      // the eye: a hole, with a bright rim on bigger fish
      const ex = 0.33 * L;
      const ey = -0.14 * H;
      const er = Math.max(0.55, L * 0.034);
      if (L > 14) {
        fctx.beginPath();
        fctx.arc(ex, ey, er + 0.9, 0, Math.PI * 2);
        fctx.fillStyle = `rgb(0,255,${body})`;
        fctx.fill();
      }
      fctx.beginPath();
      fctx.arc(ex, ey, er, 0, Math.PI * 2);
      fctx.fillStyle = "rgb(0,0,0)";
      fctx.fill();

      fctx.restore();
    };

    /* ---------- the pointer trail ---------- */
    const trail: Array<{ x: number; y: number; t: number }> = [];
    let pointer = { x: -1000, y: -1000, inside: false };
    let trailDrawn = false;

    /* ---------- moving things ---------- */
    const move = (dt: number, t: number, now: number) => {
      const head = trail[trail.length - 1];
      const fresh = head && now - head.t < 600;
      for (const fish of fishes) {
        if (fresh && head) {
          const hx = head.x / CELL_W;
          const hy = head.y / CELL_H;
          const d = Math.hypot((fish.x - hx) * (CELL_W / CELL_H), fish.y - hy);
          const reach = 12 + fish.len * 0.5;
          if (d < reach) {
            const fear = 1 - d / reach;
            const away: 1 | -1 = fish.x >= hx ? 1 : -1;
            if (away !== fish.dir && fear > 0.25) {
              fish.dir = away;
              if (fish.len > 8 && bubbles.length < 50) {
                bubbles.push({ x: fish.x, y: fish.y - 1, born: now, life: 1800 + rand() * 1200, wobble: rand() * 6 });
              }
            }
            fish.boost = Math.max(fish.boost, 8 + fear * 14);
            fish.vy += (fish.y >= hy ? 1 : -1) * fear * 18 * dt;
          }
        }
        fish.x += fish.dir * (fish.speed + fish.boost) * dt;
        fish.boost *= Math.exp(-dt * 1.4);
        fish.baseY = clamp(fish.baseY + fish.vy * dt, rows * 0.08, rows * 0.92);
        fish.vy *= Math.exp(-dt * 2.4);
        fish.y = fish.baseY + Math.sin(t * 0.9 + fish.phase) * fish.bob;

        const margin = fish.len * 0.7 + 4;
        if (fish.dir > 0 && fish.x > cols + margin) {
          fish.x = -margin;
          fish.baseY = rows * (0.1 + rand() * 0.8);
        } else if (fish.dir < 0 && fish.x < -margin) {
          fish.x = cols + margin;
          fish.baseY = rows * (0.1 + rand() * 0.8);
        }
        // the occasional breath
        if (fish.len > 12 && rand() < dt * 0.25 && bubbles.length < 50) {
          bubbles.push({ x: fish.x + fish.dir * fish.len * 0.5, y: fish.y - 1, born: now, life: 2200 + rand() * 1600, wobble: rand() * 6 });
        }
      }
      for (let i = bubbles.length - 1; i >= 0; i--) {
        const b = bubbles[i];
        b.y -= dt * 2.2;
        b.x += Math.sin(t * 2.5 + b.wobble) * dt * 0.8;
        if (now - b.born > b.life || b.y < -2) bubbles.splice(i, 1);
      }
    };

    /* ---------- drawing the scene ---------- */

    // numeric ramps and palette rows, so the per-cell loop does no lookups
    const FISH_IDX = FISH_RAMP.map((g) => GLYPH_INDEX.get(g) ?? 0);
    const WATER_IDX = WATER_RAMP.map((g) => GLYPH_INDEX.get(g) ?? 0);
    const ROW_BASE = Object.fromEntries(PALETTE_ORDER.map((name, i) => [name, i * LEVELS])) as Record<Palette, number>;
    const G = GLYPHS.length;
    /** a cell's look as one number: atlas row × glyph count + glyph + 1 (0 = empty) */
    const code = (palette: Palette, level: number, glyph: number) =>
      (ROW_BASE[palette] + Math.max(1, Math.min(LEVELS, Math.round(level))) - 1) * G + glyph + 1;

    /** per-cell jitter, fixed for the life of the layout */
    let jitter = new Float32Array(0);
    /** what each cell currently shows, so a frame only redraws the cells that changed */
    let shown = new Uint32Array(0);
    const bubbleAt = new Map<number, number>();

    const drawScene = (now: number) => {
      if (!fctx) return;
      const t = reduceMotion ? 0 : (now - start) / 1000;
      fctx.globalCompositeOperation = "source-over";
      fctx.fillStyle = "#000";
      fctx.fillRect(0, 0, cols, rows);
      paintWaves(t);
      for (const fish of fishes) paintFish(fish, t);
      const data = fctx.getImageData(0, 0, cols, rows).data;

      bubbleAt.clear();
      for (const bubble of bubbles) {
        const bx = Math.round(bubble.x);
        const by = Math.round(bubble.y);
        if (bx < 0 || by < 0 || bx >= cols || by >= rows) continue;
        const age = clamp((now - bubble.born) / bubble.life);
        const glyph = GLYPH_INDEX.get(age < 0.5 ? "o" : age < 0.8 ? "°" : "·") ?? 0;
        bubbleAt.set(by * cols + bx, code("teal", 6 - age * 4, glyph));
      }

      const sw = CELL_W * dpr;
      const sh = CELL_H * dpr;
      const fishLen = FISH_IDX.length;
      const waterLen = WATER_IDX.length;
      for (let cell = 0, i = 0; cell < cols * rows; cell++, i += 4) {
        let next = 0;
        const fish = data[i + 1] / 255;
        if (fish > 0.1) {
          const v = clamp(fish + jitter[cell]);
          next = code(data[i + 2] > 100 ? "teal" : "fish", 2.5 + v * 5.5, FISH_IDX[Math.min(fishLen - 1, (v * fishLen) | 0)]);
        } else {
          const water = data[i] / 255;
          if (water > 0.07) {
            const v = clamp(water + jitter[cell]);
            next = code("water", 1 + v * 7, WATER_IDX[Math.min(waterLen - 1, (v * waterLen) | 0)]);
          }
        }
        const bubble = bubbleAt.get(cell);
        if (bubble) next = bubble;

        if (next === shown[cell]) continue;
        shown[cell] = next;
        const cx = cell % cols;
        const cy = (cell - cx) / cols;
        sctx.clearRect(cx * CELL_W, cy * CELL_H, CELL_W, CELL_H);
        if (next) {
          const n = next - 1;
          const row = (n / G) | 0;
          sctx.drawImage(atlas, (n - row * G) * sw, row * sh, sw, sh, cx * CELL_W, cy * CELL_H, CELL_W, CELL_H);
        }
      }
    };

    /** forget what is on screen, so the next frame repaints every cell */
    const resetScene = () => {
      shown = new Uint32Array(cols * rows);
      jitter = new Float32Array(cols * rows);
      for (let cell = 0; cell < cols * rows; cell++) {
        jitter[cell] = (hash(cell % cols, (cell / cols) | 0, 13) - 0.5) * 0.14;
      }
      sctx.clearRect(0, 0, w, h);
    };

    /* ---------- drawing the trail ---------- */
    const cellLight = new Map<number, number>();

    const drawTrail = (now: number) => {
      while (trail.length && now - trail[0].t > TRAIL_LIFE) trail.shift();
      tctx.clearRect(0, 0, w, h);
      cellLight.clear();
      if (trail.length === 0 && !pointer.inside) return false;

      const light = (cx: number, cy: number, v: number) => {
        if (cx < 0 || cy < 0 || cx >= cols || cy >= rows) return;
        const key = cy * cols + cx;
        if (v > (cellLight.get(key) ?? 0)) cellLight.set(key, v);
      };

      // walk every segment in half-cell steps, so a fast flick stays joined
      for (let i = 1; i < trail.length; i++) {
        const a = trail[i - 1];
        const b = trail[i];
        const steps = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / (CELL_W * 0.5)));
        for (let s = 0; s <= steps; s++) {
          const f = s / steps;
          const x = a.x + (b.x - a.x) * f;
          const y = a.y + (b.y - a.y) * f;
          const age = clamp((now - (a.t + (b.t - a.t) * f)) / TRAIL_LIFE);
          const cx = Math.floor(x / CELL_W);
          const cy = Math.floor(y / CELL_H);
          // older parts of the trail break up into specks
          if (age > 0.4 && hash(cx, cy, 29) < (age - 0.4) * 1.5) continue;
          const v = Math.pow(1 - age, 1.1);
          light(cx, cy, v);
          // the young part of the trail is thicker
          if (age < 0.25) {
            const side = (1 - age / 0.25) * 0.55 * v;
            light(cx + 1, cy, side);
            light(cx - 1, cy, side);
            light(cx, cy + 1, side * 0.8);
          }
        }
      }
      // the head stays lit under a resting cursor
      if (pointer.inside) light(Math.floor(pointer.x / CELL_W), Math.floor(pointer.y / CELL_H), 1);

      for (const [key, v] of cellLight) {
        const cx = key % cols;
        const cy = (key - cx) / cols;
        const r = hash(cx, cy, 31);
        const idx = Math.min(TRAIL_RAMP.length - 1, Math.max(0, Math.floor(v * TRAIL_RAMP.length + (r - 0.5) * 1.6)));
        stamp(tctx, cx, cy, TRAIL_RAMP[idx], "trail", 1.5 + v * 6.5);
      }
      return trail.length > 0;
    };

    /* ---------- layout ---------- */
    const sizeCanvas = (canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) => {
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.imageSmoothingEnabled = false;
    };

    const layout = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      cols = Math.ceil(w / CELL_W) + 1;
      rows = Math.ceil(h / CELL_H) + 1;
      calm = w < 700 ? 0.5 : 1;
      sizeCanvas(dotsCanvas, dctx);
      sizeCanvas(sceneCanvas, sctx);
      sizeCanvas(trailCanvas, tctx);
      field.width = cols;
      field.height = rows;
      buildAtlas();
      drawDots();
      stock();
      resetScene();
      drawScene(performance.now());
    };

    /* ---------- loop ---------- */
    let raf = 0;
    let lastScene = 0;
    let lastFrame = performance.now();

    const frame = (now: number) => {
      raf = 0;
      const dt = Math.min(0.05, (now - lastFrame) / 1000) || 1 / 60;
      lastFrame = now;
      move(dt, (now - start) / 1000, now);
      if (now - lastScene >= SCENE_MS) {
        drawScene(now);
        lastScene = now;
      }
      if (withTrail && (trail.length > 0 || trailDrawn)) {
        trailDrawn = drawTrail(now) || pointer.inside;
      }
      raf = requestAnimationFrame(frame);
    };

    const startLoop = () => {
      if (!raf && !reduceMotion && !document.hidden) {
        lastFrame = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };
    const stopLoop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };

    /* ---------- input ---------- */
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" && event.pointerType !== "pen") return;
      pointer = { x: event.clientX, y: event.clientY, inside: true };
      const now = performance.now();
      const last = trail[trail.length - 1];
      if (!last || Math.hypot(pointer.x - last.x, pointer.y - last.y) > 3) {
        trail.push({ x: pointer.x, y: pointer.y, t: now });
        if (trail.length > TRAIL_MAX) trail.shift();
      }
      trailDrawn = true;
    };
    const onLeave = () => {
      pointer = { ...pointer, inside: false };
    };
    const onScroll = () => {
      scrollY = window.scrollY;
      if (reduceMotion) drawScene(performance.now());
    };
    let resizeTimer = 0;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(layout, 140);
    };
    const onVisibility = () => {
      if (document.hidden) stopLoop();
      else startLoop();
    };

    layout();
    startLoop();

    // development only: render one full frame on demand, for visual QA in
    // environments that throttle animation frames
    type Hook = { __asciiFrame?: () => void };
    if (process.env.NODE_ENV !== "production") {
      (window as unknown as Hook).__asciiFrame = () => {
        const now = performance.now();
        move(1 / 30, (now - start) / 1000, now);
        drawScene(now);
        if (withTrail) drawTrail(now);
      };
    }

    // the atlas is drawn in Geist Mono — redraw once the font has arrived
    void document.fonts?.ready.then(() => {
      buildAtlas();
      drawDots();
      resetScene();
      drawScene(performance.now());
    });

    if (withTrail) {
      window.addEventListener("pointermove", onMove, { passive: true });
      document.documentElement.addEventListener("pointerleave", onLeave);
      window.addEventListener("blur", onLeave);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      delete (window as unknown as Hook).__asciiFrame;
      stopLoop();
      window.clearTimeout(resizeTimer);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("blur", onLeave);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <div className="ascii-field" aria-hidden="true">
      <canvas ref={dotsRef} className="ascii-canvas" />
      <canvas ref={sceneRef} className="ascii-canvas" />
      <canvas ref={trailRef} className="ascii-canvas ascii-glow" />
    </div>
  );
}
