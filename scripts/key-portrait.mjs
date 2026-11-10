/**
 * Key a portrait photo into the About panel's lime tile.
 *
 *   node scripts/key-portrait.mjs <source.jpg> [out.jpg]
 *
 * The portrait is displayed inside a lime panel that is painted with a CSS
 * gradient (radial white highlight at 20% 8% + a 165° lime ramp). A photo
 * shot against a flat backdrop cannot simply be placed on top of that: the
 * rectangle would show. This script replaces the backdrop with the panel's own
 * gradient, evaluated in the panel's coordinate space through the same
 * object-fit: cover mapping the browser uses, so the subject ends up standing
 * *in* the lime wall.
 *
 * Two backdrop kinds are handled:
 *   - a green screen (backdrop green dominant): keyed by greenness, which is
 *     immune to the JPEG chroma noise that makes a flat green drift.
 *   - any other flat backdrop: keyed by distance from the sampled backdrop.
 *
 * Layout constants below were measured on the live page at a 1440px viewport
 * (panel box and photo frame inside it). Re-measure if the panel geometry
 * changes.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/* ---------- the panel's geometry (CSS px, measured at a 1440px viewport) ----- */
const PANEL = { w: 473.6125183105469, h: 713.8375244140625 };
const FRAME = { x: 38.00000762939453, y: 75.60000610351562, w: 397.6125183105469, h: 564.2374877929688 };
const OBJ_POS_Y = 0.16;
const OUT_W = 960;
const BLOCK = 64;

/* ---------- the panel's CSS gradient, reproduced exactly -------------------- */
const STOPS = [
  [0.0, [232, 247, 101]],
  [0.48, [219, 238, 77]],
  [1.0, [201, 225, 60]],
];
const lerp = (a, b, t) => a + (b - a) * t;

function linearColor(t) {
  t = Math.min(1, Math.max(0, t));
  for (let i = 0; i < STOPS.length - 1; i++) {
    const [t0, c0] = STOPS[i];
    const [t1, c1] = STOPS[i + 1];
    if (t <= t1) {
      const k = (t - t0) / (t1 - t0);
      return [lerp(c0[0], c1[0], k), lerp(c0[1], c1[1], k), lerp(c0[2], c1[2], k)];
    }
  }
  return STOPS[STOPS.length - 1][1];
}

const RAD = (165 * Math.PI) / 180;
const DIR = { x: Math.sin(RAD), y: -Math.cos(RAD) };
const GLEN = Math.abs(PANEL.w * DIR.x) + Math.abs(PANEL.h * DIR.y);
const GC = { x: PANEL.w / 2, y: PANEL.h / 2 };
const GSTART = { x: GC.x - (DIR.x * GLEN) / 2, y: GC.y - (DIR.y * GLEN) / 2 };
const RC = { x: 0.2 * PANEL.w, y: 0.08 * PANEL.h };
const RR = { x: 0.9 * PANEL.w, y: 0.9 * PANEL.h };

function tileColor(px, py) {
  const t = ((px - GSTART.x) * DIR.x + (py - GSTART.y) * DIR.y) / GLEN;
  const base = linearColor(t);
  const r = Math.hypot((px - RC.x) / RR.x, (py - RC.y) / RR.y);
  const a = 0.5 * (1 - Math.min(1, r / 0.6));
  return [base[0] * (1 - a) + 255 * a, base[1] * (1 - a) + 255 * a, base[2] * (1 - a) + 255 * a];
}

/* ---------- helpers --------------------------------------------------------- */
const median = (arr) => {
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
};

async function sampleBackdrop(data, info, size = 24) {
  const channels = [0, 1, 2].map(() => []);
  const corners = [
    [0, 0],
    [info.width - size, 0],
    [0, info.height - size],
    [info.width - size, info.height - size],
  ];
  for (const [ox, oy] of corners) {
    for (let y = oy; y < oy + size; y++) {
      for (let x = ox; x < ox + size; x++) {
        const i = (y * info.width + x) * info.channels;
        for (let c = 0; c < 3; c++) channels[c].push(data[i + c]);
      }
    }
  }
  return channels.map(median);
}

function boxBlur(src, W, H) {
  const dst = new Float32Array(W * H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let sum = 0;
      let n = 0;
      for (let dy = -1; dy <= 1; dy++) {
        const yy = y + dy;
        if (yy < 0 || yy >= H) continue;
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx;
          if (xx < 0 || xx >= W) continue;
          sum += src[yy * W + xx];
          n++;
        }
      }
      dst[y * W + x] = sum / n;
    }
  }
  return dst;
}

/* ---------- main ------------------------------------------------------------ */
const srcPath = process.argv[2];
if (!srcPath) {
  console.error("usage: node scripts/key-portrait.mjs <source> [out]");
  process.exit(1);
}
const outPath = process.argv[3] ?? path.join(ROOT, "public", "images", "portrait.jpg");

const { data, info } = await sharp(srcPath).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const W = info.width;
const H = info.height;
const C = info.channels;

const backdrop = await sampleBackdrop(data, info);
const greenExcess = backdrop[1] - Math.max(backdrop[0], backdrop[2]);
// A real green screen has a large green excess. A lime backdrop also reads as
// "greenish" but only slightly, and there the distance matte is the safer key
// (a steep greenness ramp would eat into warm, slightly green subject pixels).
const isGreenScreen = greenExcess > 40;
console.log(
  `source ${W}x${H}  backdrop rgb(${backdrop.join(",")})  greenExcess ${greenExcess.toFixed(0)}  -> ${isGreenScreen ? "green-screen key" : "flat-backdrop key"}`,
);

const scale = Math.max(FRAME.w / W, FRAME.h / H);
const originX = FRAME.x;
const originY = FRAME.y + (FRAME.h - H * scale) * OBJ_POS_Y;

/* matte */
const alpha = new Float32Array(W * H);
if (isGreenScreen) {
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * C;
      const excess = data[i + 1] - Math.max(data[i], data[i + 2]);
      const a = 1 - excess / greenExcess;
      alpha[y * W + x] = a < 0 ? 0 : a > 1 ? 1 : a;
    }
  }
} else {
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * C;
      const d = Math.hypot(data[i] - backdrop[0], data[i + 1] - backdrop[1], data[i + 2] - backdrop[2]);
      const a = (d - 10) / (48 - 10);
      alpha[y * W + x] = a < 0 ? 0 : a > 1 ? 1 : a;
    }
  }
}
const blurred = boxBlur(alpha, W, H);

/* local backdrop colour per block (a flat field drifts under JPEG) */
const bw = Math.ceil(W / BLOCK);
const bh = Math.ceil(H / BLOCK);
const blockScreen = new Float64Array(bw * bh * 3);
const blockCount = new Float64Array(bw * bh);
const screenish = (i) =>
  isGreenScreen
    ? data[i + 1] - Math.max(data[i], data[i + 2]) > greenExcess * 0.85
    : Math.hypot(data[i] - backdrop[0], data[i + 1] - backdrop[1], data[i + 2] - backdrop[2]) < 16;
for (let y = 0; y < H; y++) {
  const by = Math.floor(y / BLOCK);
  for (let x = 0; x < W; x++) {
    const i = (y * W + x) * C;
    if (!screenish(i)) continue;
    const b = (by * bw + Math.floor(x / BLOCK)) * 3;
    blockScreen[b] += data[i];
    blockScreen[b + 1] += data[i + 1];
    blockScreen[b + 2] += data[i + 2];
    blockCount[by * bw + Math.floor(x / BLOCK)]++;
  }
}
for (let b = 0; b < bw * bh; b++) {
  const n = blockCount[b];
  for (let c = 0; c < 3; c++) blockScreen[b * 3 + c] = n ? blockScreen[b * 3 + c] / n : backdrop[c];
}

/* composite */
const out = Buffer.alloc(W * H * 3);
for (let y = 0; y < H; y++) {
  const by = Math.min(bh - 1, Math.floor(y / BLOCK));
  for (let x = 0; x < W; x++) {
    const bx = Math.min(bw - 1, Math.floor(x / BLOCK));
    const b = (by * bw + bx) * 3;
    const i = (y * W + x) * C;
    const o = (y * W + x) * 3;
    const tile = tileColor(originX + x * scale, originY + y * scale);

    const isScreen = isGreenScreen
      ? data[i + 1] - Math.max(data[i], data[i + 2]) > greenExcess * 0.87
      : Math.hypot(data[i] - backdrop[0], data[i + 1] - backdrop[1], data[i + 2] - backdrop[2]) < 14;
    if (isScreen) {
      out[o] = tile[0];
      out[o + 1] = tile[1];
      out[o + 2] = tile[2];
      continue;
    }

    const k = 1 - blurred[y * W + x];
    let r = data[i] + k * (tile[0] - blockScreen[b]);
    let g = data[i + 1] + k * (tile[1] - blockScreen[b + 1]);
    let bl = data[i + 2] + k * (tile[2] - blockScreen[b + 2]);
    const mxc = Math.max(r, bl);
    if (g > mxc) g = mxc + (g - mxc) * 0.15; // despill the screen's green cast
    out[o] = r < 0 ? 0 : r > 255 ? 255 : r;
    out[o + 1] = g < 0 ? 0 : g > 255 ? 255 : g;
    out[o + 2] = bl < 0 ? 0 : bl > 255 ? 255 : bl;
  }
}

const buf = await sharp(out, { raw: { width: W, height: H, channels: 3 } })
  .resize({ width: OUT_W })
  .jpeg({ quality: 88, mozjpeg: true, progressive: true, chromaSubsampling: "4:4:4" })
  .toBuffer();

writeFileSync(outPath, buf);
const m = await sharp(outPath).metadata();
console.log(`written ${outPath}  ${m.width}x${m.height}  ${(buf.length / 1024).toFixed(1)} KB`);
