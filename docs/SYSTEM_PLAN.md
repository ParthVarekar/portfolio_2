# Parth Varekar Portfolio — System Plan, UI & User Flow (V2)

Companion to `docs/PROPOSAL.md`. This is the technical and UI plan for **"The Living Instrument"** — a light, periwinkle bento portfolio whose centrepiece is a real 0.5B model running in the visitor's browser.

**Status:** awaiting approval. No implementation has begun.

---

## 1. Architecture

### 1.1 High level

```
┌──────────────────────────────────────────────────────────────────────┐
│  Browser tab (static Next.js site)                                   │
│                                                                      │
│  ┌───────────────┐    ┌───────────────┐    ┌──────────────────────┐  │
│  │  Next.js UI   │◄──►│  Zustand store│◄──►│  Web Worker          │  │
│  │  React 19     │    │  machine state│    │  @mlc-ai/web-llm     │  │
│  └──────┬────────┘    └───────────────┘    │  Qwen2.5-0.5B        │  │
│         │                                   └──────────┬───────────┘  │
│         │   ┌──────────────────────────────┐           │              │
│         └──►│  Lexical retriever (BM25)    │           │              │
│             │  MiniSearch over 40 chunks   │           │              │
│             │  no embedding model          │           │              │
│             └──────────────────────────────┘           │              │
│                                                        │              │
│  Storage: Cache API (model weights only). No IndexedDB chat history.  │
│  No cookies. No analytics. No server calls after the model is cached. │
└──────────────────────────────────────────────────────────────────────┘
          │ one-time, opt-in
          ▼
   MLC / Hugging Face CDN: ~290 MB model shards
```

### 1.2 Why this architecture

- **Static-first:** the site is fully readable without JavaScript beyond the shell. The model is an enhancement, not a dependency.
- **Worker isolation:** WebLLM runs in a Web Worker so token generation never blocks scrolling or typing.
- **No second model:** BM25 over ~40 chunks is instant and adds no download. An embedding model would add ~25–30 MB and latency for little gain at this corpus size.
- **No chat persistence:** conversations live in React state only. Reloading clears them. This is simpler and stronger privacy than IndexedDB history.
- **No backend:** deployable as static output. The only server-side concern is the domain redirect.

### 1.3 Components

| Component | Responsibility |
|---|---|
| `Shell` | Nav pill, footer, ⌘K palette, skip link, reduced-motion provider |
| `HeroBento` | 12-column bento: headline card, core card, stat cards, story card |
| `Core` | CSS/SVG lime orb with layered radial gradients; idle/loading/ready/generating states |
| `DotMatrix` | 7×7 progress/status grid; lights up during model load |
| `MachineCard` | Blue outer card, header, status pills, inner white chat panel |
| `ModelLoader` | WebGPU detection, download progress, cancel, demo fallback |
| `ChatPanel` | Message list, streaming caret, suggestions, input, source chips |
| `MachineExplainer` | Three cards: what runs, what leaves, what if it can't |
| `WorkGrid` | Bento chapter index with filters and hover metrics |
| `ChapterCard` | Number, title, one-line, status, tech chips, metric |
| `CaseStudy` | MDX article layout, numbered sections, diagrams, pull quotes, next chapter |
| `PipelineViz` | Tabbed data-flow visualiser using rounded bars/dots |
| `ApproachSteps` | Four-step method with evidence chips |
| `AboutCard` | Monogram, bio, currently, tools |
| `ContactCard` | Lime full-width card, email button, social links |
| `CommandPalette` | Navigation, wake machine, demo mode, reduced motion |

---

## 2. The machine

### 2.1 Model choice

| Property | Value |
|---|---|
| Model ID | `Qwen2.5-0.5B-Instruct-q4f16_1-MLC` |
| Runtime | `@mlc-ai/web-llm` 0.2.86 |
| Download | ~278–290 MB |
| VRAM required | ~945 MB (WebLLM config) |
| Context | 4,096 tokens |
| Quantisation | q4f16_1 (4-bit weights, fp16 activations) |
| Required features | WebGPU; no `shader-f16` requirement for this build |
| Cache | Cache API, browser-managed |

No model picker. One model, one path, one honest disclosure. The 1.5B is explicitly out of scope for v1.

### 2.2 Lifecycle

```
mount
  └─ detect WebGPU (navigator.gpu, requestAdapter)
       ├─ unsupported ──────────────► state = demo
       └─ supported ────────────────► state = idle
idle
  └─ user clicks "Wake the machine"
       └─ dynamic import("@mlc-ai/web-llm") + CreateWebWorkerMLCEngine
            ├─ progress ───────────► state = loading (dot matrix + bar + ETA)
            ├─ ready ──────────────► state = ready (core bright, input enabled)
            ├─ error ──────────────► state = error (retry / demo)
            └─ cancel ─────────────► state = idle (worker terminated)
ready
  └─ user asks
       ├─ retrieve top-3 chunks (BM25, <5 ms)
       ├─ build prompt
       ├─ stream tokens ─────────► state = generating
       └─ done ──────────────────► append sources, state = ready
```

### 2.3 Worker API

The main thread talks to the worker with a small typed protocol:

```ts
type WorkerRequest =
  | { type: "init"; modelId: string }
  | { type: "chat"; id: string; messages: ChatMessage[]; maxTokens: number }
  | { type: "abort"; id: string }
  | { type: "reset" };

type WorkerEvent =
  | { type: "progress"; progress: number; text: string; timeElapsed: number }
  | { type: "ready"; modelId: string }
  | { type: "token"; id: string; delta: string }
  | { type: "done"; id: string; text: string }
  | { type: "error"; id?: string; message: string; code: string };
```

The worker owns the engine. The UI owns the conversation. Aborting a generation posts `abort` and stops rendering tokens.

### 2.4 Retrieval

**Source:** `content/knowledge.json` — ~40 chunks, each 80–160 words, with:

```json
{
  "id": "halo-overview",
  "project": "H.A.L.O",
  "source": "H.A.L.O README",
  "url": "https://github.com/ParthVarekar/H.A.L.O",
  "tags": ["space", "offline", "procedure", "yolo", "qwen"],
  "text": "..."
}
```

**Index:** MiniSearch with fields `title`, `text`, `tags`, `project`; boosts for project names and tags. A synonym map handles natural questions:

- "space station", "ISS", "astronaut" → H.A.L.O
- "dictation", "speech to text", "voice" → Susurrus
- "video editor", "tutorial" → Chumps Lab
- "water", "eDNA", "species" → BioRadar
- "beacon", "optical", "gimbal" → COSTA
- "rover", "robot", "simulation" → RoboForge
- "client", "agency", "website" → ProtoVinci

**Threshold:** if the top score is below a tuned cutoff, return no context and let the model use the refusal line. The cutoff is tuned against a 20-question evaluation set with expected source IDs.

**Output:** top-3 chunks, deduplicated by project, max ~700 tokens total. The UI shows source chips from the chunk metadata.

### 2.5 Prompt

```
SYSTEM
You are the local guide to Parth Varekar's portfolio. You run entirely in the
visitor's browser. Answer only from the CONTEXT below. Be concise: at most
three short sentences. Name the project you are describing. If the context
does not contain the answer, say: "That's not in my notes — try asking about
one of the projects or how I work." Never invent metrics, dates or roles.
Never claim to be a cloud model.

CONTEXT
[chunk 1]
[chunk 2]
[chunk 3]

HISTORY
[last 4 turns, trimmed to 600 tokens]

USER
[question]
```

**Generation settings:** temperature 0.2, top_p 0.9, max_tokens 160, repetition penalty 1.1. Short answers keep latency low and reduce the 0.5B model's tendency to wander.

**Suggested questions** are chosen because retrieval answers them well:
- "What is H.A.L.O?"
- "How does Susurrus work?"
- "What did BioRadar prove?"
- "How does COSTA find the beacon?"
- "How do you test your systems?"
- "What did you do at ProtoVinci?"

### 2.6 Demo mode

A `content/demo-answers.json` file with 12 question/answer/source triples. The UI matches the closest question by keyword and streams the answer with a typing effect. A visible badge says **"Demo mode — model not loaded."** The demo is not presented as live inference.

### 2.7 Failure handling

| Failure | UI | Recovery |
|---|---|---|
| No `navigator.gpu` | Status: `WEBGPU NOT AVAILABLE`; CTA: `Try the demo` | Demo mode |
| Adapter request fails | Same as above, with a short explanation | Demo mode |
| Download stalls | Progress text: `Still downloading… you can cancel.` | Cancel / retry |
| OOM / device lost | `Your device can't hold the model. Try demo mode.` | Demo / retry |
| Cache evicted | `The model was cleared. Load it again?` | Reload model |
| Network offline after load | Chat works; status `LOCAL · OFFLINE` | — |
| Worker crash | `The machine stopped. Reload it?` | Re-init worker |

---

## 3. Design tokens

```css
:root {
  /* Canvas */
  --canvas: #c8d1e1;
  --canvas-soft: #d9e1ee;
  --surface: #ffffff;
  --surface-2: #f4f6fa;
  --surface-3: #e9eef6;

  /* Ink */
  --ink: #101218;
  --ink-2: #465063;
  --ink-3: #6b7280;

  /* Lime */
  --lime: #dbee4d;
  --lime-deep: #c6dd35;
  --lime-soft: #f1f8c9;
  --lime-ink: #2a3300;

  /* Blue */
  --blue: #589cff;
  --blue-strong: #2f6bdb;
  --blue-deep: #1e4fa8;
  --blue-soft: #e4eeff;

  /* Attention */
  --coral: #ef6a5b;

  /* Lines and shadow */
  --line: #e3e8f1;
  --shadow-sm: 0 1px 2px rgba(16, 18, 24, 0.04);
  --shadow-md: 0 1px 2px rgba(16, 18, 24, 0.04),
               0 24px 60px -28px rgba(24, 39, 75, 0.22);
  --shadow-lift: 0 2px 4px rgba(16, 18, 24, 0.05),
                 0 32px 72px -30px rgba(24, 39, 75, 0.3);

  /* Radii */
  --r-sm: 10px;
  --r-md: 16px;
  --r-lg: 20px;
  --r-card: 28px;
  --r-pill: 999px;

  /* Type */
  --font-sans: var(--font-geist-sans);
  --font-pixel: var(--font-geist-pixel-square);
  --font-mono: var(--font-geist-mono);
  --t-hero: clamp(3.5rem, 8vw, 7.5rem);
  --t-act: clamp(2.25rem, 4.5vw, 4rem);
  --t-h2: clamp(1.75rem, 3vw, 2.75rem);
  --t-body: 1.0625rem;
  --t-small: 0.875rem;
  --t-label: 0.75rem;

  /* Layout */
  --max: 1240px;
  --gutter: clamp(16px, 3vw, 32px);
  --gap: clamp(16px, 2vw, 24px);
}
```

### 3.1 Type loading

```ts
// app/fonts.ts
import { GeistSans } from "geist/font/sans";
import { GeistPixelSquare } from "geist/font/pixel/square";
import { GeistMono } from "geist/font/mono";

export const sans = GeistSans;
export const pixel = GeistPixelSquare;
export const mono = GeistMono;
```

All three are self-hosted via the `geist` npm package (OFL 1.1). No Google Fonts request. `GeistPixelSquare` is the most legible pixel variant at display sizes; it is used at 24px and above only.

### 3.2 Contrast rules

- `--ink` on `--surface` 18.7:1; on `--canvas` 12.2:1; on `--lime` 14.6:1; on `--blue` 6.8:1.
- `--ink-2` on `--surface` 8.1:1; on `--canvas` 5.3:1.
- `--blue-strong` on `--surface` 4.9:1 (links, focus).
- White on `--blue-strong` 4.9:1; white on `--blue-deep` 7.7:1. White is not used on `--blue` for body text.
- Lime is never used for text on white. It is a fill with `--ink` or `--lime-ink` on top.
- Status is always icon/text + colour, never colour alone.

---

## 4. Layout and responsive rules

### 4.1 Grid

- 12 columns desktop, 8 tablet, 4 mobile.
- Max width 1240px; gutter 32px desktop, 24px tablet, 16px mobile.
- Bento gaps 24px desktop, 20px tablet, 16px mobile.
- Section rhythm: 96–128px desktop, 72–96px tablet, 56–72px mobile.

### 4.2 Breakpoints

| Name | Width | Behaviour |
|---|---|---|
| `sm` | 360–639 | 4-col, stacked cards, pixel hero 44–52px |
| `md` | 640–1023 | 8-col, 2-card rows, nav pill full |
| `lg` | 1024–1439 | 12-col, full bento, sticky nav pill |
| `xl` | 1440+ | max 1240px, generous whitespace |

### 4.3 Home bento map (desktop)

```
┌───────────────────────────────┬──────────────────┐
│  HERO CARD (7)                │  CORE CARD (5)   │
│  eyebrow                      │  blue            │
│  THIS PAGE RUNS A MACHINE.    │  lime core       │
│  sub + CTAs                   │  dot matrix      │
│                               │  status          │
├───────────────┬───────────────┼────────┬─────────┤
│ 0 BYTES (3)   │ 290 MB (3)    │ MODEL  │ WEBGPU  │
│               │               │ (3)    │ (3)     │
├───────────────┴───────────────┴────────┴─────────┤
│  STORY CARD (12)                                 │
└──────────────────────────────────────────────────┘
```

The exact card spans can flex at `md`, but the hierarchy stays: headline > core > facts > story.

---

## 5. Component specifications

### 5.1 Nav pill

- Floating, fixed top 20px, centred, max-width 980px.
- White, radius 999px, shadow-md, padding 8px 10px 8px 16px.
- Left: `PV` monogram (Geist Pixel, 16px) in a lime circle 32px.
- Links: Work, Machine, Approach, About, Contact — 14px Geist Sans, `--ink-2`, hover `--ink`.
- Right: lime `Ask` pill (dark ink) linking to `/#machine` or `/machine`.
- On scroll > 40px: padding shrinks, shadow deepens, background becomes `rgba(255,255,255,.92)` with 12px blur.
- Mobile: monogram + `Ask` + menu button; menu is a white sheet with links, focus-trapped.

### 5.2 Hero card

- White, `--r-card`, padding 40–56px.
- Eyebrow: 11px uppercase, `--ink-3`, tracking 0.14em.
- Headline: Geist Pixel Square, uppercase, 3 lines, `--ink`, line-height 0.92, tracking -0.02em. On mobile, 3 lines at 44–52px.
- Sub: 18–20px Geist Sans, `--ink-2`, max 46ch, line-height 1.55.
- CTAs: lime pill (48px, dark ink, shadow-sm) + white pill with `--line` border.
- A small `SCROLL TO OPEN ↓` label at the bottom in 11px uppercase.

### 5.3 Core card

- Blue `#589CFF`, `--r-card`, padding 28px, overflow hidden.
- Background: subtle radial lightening top-left, no gradient mesh.
- Core: 180–240px circle, layered radial gradients (`--lime` centre → `#e8f77a` → transparent), soft inner shadow, outer lime glow at 20% opacity. Idle: opacity 0.8, scale 1.0, 2.8s breathe. Loading: dot matrix fills. Ready: opacity 1, scale 1.04, 2.2s. Generating: quick 0.9s pulse.
- Top label: `THE MACHINE · IDLE` in 11px uppercase, `--ink` at 70%.
- Bottom: two pills `QWEN 2.5 · 0.5B` and `WEBGPU READY` (or `DEMO MODE`), dark ink on translucent white.
- Dot matrix: 7×7, 8px dots, 6px gap; dim dots `rgba(16,18,24,.14)`, lit dots `--lime`; used as load progress.

### 5.4 Stat cards

- White, `--r-card`, padding 24px, min-height 120px.
- Value in Geist Pixel 28–36px; label 11px uppercase `--ink-3`.
- `0 BYTES SENT`: a lime dot + value 0 + label "conversation data sent".
- `~290 MB`: value + label "one-time model download".
- `4K`: context window; `2.8s`: idle breathing cycle. Facts, not vanity metrics.

### 5.5 Machine card

- Full-width blue card, `--r-card`, padding 24–32px.
- Header: `II — THE MACHINE` in Geist Pixel 28–40px, dark ink; status pills on the right.
- Inner chat: white, `--r-lg`, padding 20–28px, min-height 420px, max-height 560px, scroll.
- User bubble: `--surface-2`, radius 16px 16px 4px 16px, max 70ch.
- Assistant: plain text, `--ink`, 16px/1.65; streaming caret 2px lime.
- Sources: chips `--blue-soft` with `--blue-strong` text, 12px; link to the repo/README.
- Input: white with `--line` border, radius 16px, 48px; send button lime circle with dark arrow; stop button coral outline while generating.
- Footer line: `Running locally · 0 bytes of this conversation sent` with a lime dot.
- On mobile: padding 16px, inner chat edge-to-edge, suggestions horizontally scrollable, header wraps.

### 5.6 Work grid

- 12-col bento, gap 24px.
- Chapter card: white, `--r-card`, padding 28–32px, min-height 220px, flex column, cursor pointer.
- Number: Geist Pixel 36–48px, `--lime-deep` (or `--lime` on blue cards), top-left.
- Title: Geist Sans 22–28px, 600, `--ink`.
- One-line: 15–16px, `--ink-2`, max 40ch.
- Status pill: 11px uppercase; `COMPLETE` blue-soft/blue-strong; `IN PROGRESS` lime-soft/lime-ink; `ARCHIVED` surface-2/ink-3; `CLIENT` blue-soft/blue-strong.
- Tech chips: 11px, `--surface-2`, `--ink-2`, radius pill.
- Metric: Geist Pixel 24–28px, `--blue-strong`; turns `--lime-deep` on hover.
- Hover: translateY(-2px), shadow-lift, 180ms; focus ring 2px `--blue-strong` offset 2px.
- Filters: pills 36px; active lime/dark ink; inactive white/ink-2.

### 5.7 Case study

- Page: periwinkle; article card white, max-width 880px, `--r-card`, padding 40–64px.
- Hero band: blue, radius 20px, padding 32–40px, pixel chapter number + title + one-line + meta pills.
- Body: 68ch, 18px/1.7, `--ink`; h2 in Geist Pixel 28–36px; h3 Geist Sans 20px 600.
- Sections numbered `01`–`05` in pixel lime.
- Diagrams: `--surface-2` panels, radius 20px, caption 12px `--ink-3`.
- Pull quote: `--lime-soft` card, 22–26px Geist Sans 500, dark ink, lime left rule.
- Code: `--surface-2`, Geist Mono 13px, radius 12px.
- Reading progress: fixed top 3px blue bar.
- Next chapter: white card with blue arrow, hover lift.

### 5.8 Approach

- Four cards in a 4-col grid; mobile vertical.
- Number pixel 40px lime; title Geist Sans 20px 600; body 15px; evidence chip blue-soft.
- Connector: 2px blue line with a small lime dot between cards; mobile vertical line.

### 5.9 About

- White card, 2-col: left monogram 160px lime circle with `PV` pixel; right bio 18px, currently card, tools chips.
- Tools: chips 12px, surface-2; groups "Languages", "AI/ML", "Web", "Infra".

### 5.10 Contact

- Full-width lime card, `--r-card`, padding 48–64px.
- Headline pixel 40–72px, dark ink: `LET'S BUILD SOMETHING THAT RUNS LOCALLY.`
- Button: dark ink pill, white text, 52px; email address in Geist Sans 16px.
- Secondary: GitHub / LinkedIn text links with arrows.
- Small print: "No form, no backend, no tracking."

### 5.11 Footer

- Periwinkle, top hairline `rgba(16,18,24,.08)`, padding 40px 0.
- Monogram, copyright, links (Colophon, GitHub, LinkedIn, Email).
- Colophon line: "Built with Next.js, WebLLM, Geist. No analytics. No cookies."

---

## 6. Page specifications

### 6.1 Home `/`

1. Nav pill.
2. Hero bento (headline, core, stat cards, story).
3. Machine section (`#machine`): blue card + chat + explainer.
4. Work section (`#work`): filters + bento chapters.
5. Pipeline visualiser: "How a system moves" — tabs for H.A.L.O, Susurrus, BioRadar; rounded bars and moving dots; mobile step list.
6. Approach (`#approach`).
7. About (`#about`).
8. Contact (`#contact`).
9. Footer.

### 6.2 Machine `/machine`

Full-page version of the machine: nav, blue card at 90vh, chat larger, explainer below, link back to work. Shareable URL for "ask my portfolio anything".

### 6.3 Work `/work`

Index page with all seven chapters, filters, and a short intro. Same cards as home, larger.

### 6.4 Case study `/work/[slug]`

Seven MDX files:

```
content/work/halo.mdx
content/work/susurrus.mdx
content/work/chumps-lab.mdx
content/work/bioradar.mdx
content/work/costa.mdx
content/work/roboforge.mdx
content/work/protovinci.mdx
```

Frontmatter: title, chapter, oneLine, status, role, year, stack, metric, repo, demo, accent, next.

### 6.5 Approach `/approach`

Long-form version of the four steps, with evidence from real projects, a "what I look for in a problem" section, and a "how I verify" section.

### 6.6 About `/about`

Bio, education, experience, tools, currently, links. No resume dump; a short story.

### 6.7 Contact `/contact`

The lime contact card, email, social links, location/timezone, "what I'm open to".

### 6.8 Colophon `/colophon`

Stack, fonts (OFL), model (Apache 2.0), privacy statement, accessibility statement, credits, source links.

---

## 7. User flows

### 7.1 First visit, desktop, WebGPU

1. **0–1.5s:** static shell, fonts, hero. No model request. LCP target < 2s.
2. **Hero:** headline, core idle, `WEBGPU READY`, `0 BYTES SENT`, `~290 MB`.
3. **Choice:** Wake / Read the work / scroll.
4. **Wake:** loader with dot matrix, progress, ETA, cancel, demo option.
5. **Ready:** core bright; suggestions; ask; short answer + sources; `0 bytes sent`.
6. **Work:** filter, chapter, case study, next chapter.
7. **Method:** approach, about, contact.
8. **Return:** model cached; wake takes 1–3s; no chat history.

### 7.2 First visit, mobile / no WebGPU

1. Hero stacks; status `DEMO MODE` or `WEBGPU NOT AVAILABLE`.
2. CTA `Try the demo`; demo answers labelled.
3. On WebGPU mobile, `Load the real model (290 MB)` is an explicit option.
4. All content works; no dead ends.

### 7.3 Returning visitor

- Model cached: `Wake` shows `Ready in ~1s`, then chat.
- Cache evicted: re-download prompt, demo available.
- No stored conversation; a clean start each time.

### 7.4 Keyboard

- Skip link → main.
- Tab: nav → hero CTAs → machine (if awake) → work cards → sections → footer.
- ⌘K: palette with Work, Machine, Approach, About, Contact, Wake, Demo, Toggle motion.
- Focus visible: 2px `--blue-strong` ring, 2px offset.
- Chat: `aria-live="polite"`; input labelled; send/stop buttons labelled; source chips are links.
- Loader: `role="progressbar"`, `aria-valuenow`, `aria-valuetext`.

### 7.5 Reduced motion

- Core static (no breathe).
- No card translate; opacity 150ms only.
- No scroll parallax; no auto-playing visualiser; bars appear static.
- Chat streaming remains (functional), but the caret does not blink.

---

## 8. Performance and accessibility budgets

| Metric | Target |
|---|---|
| LCP (mobile 4G) | < 2.0s |
| CLS | < 0.05 |
| INP | < 200ms |
| Initial JS | < 200KB gzipped |
| Initial CSS | < 40KB gzipped |
| Fonts | 3 families, subset Latin, `display: swap`, preload only Sans + Pixel |
| Images | AVIF/WebP, width/height set, lazy below fold |
| Lighthouse mobile | Perf ≥ 95, A11y ≥ 95, BP ≥ 95, SEO ≥ 95 |
| Model | 290MB, opt-in, cached, cancelable |

Accessibility:

- Semantic landmarks; one h1 per page; logical heading order.
- Colour contrast checked; no colour-only status.
- 44px touch targets; visible focus; no keyboard traps.
- `prefers-reduced-motion` and `prefers-contrast` supported.
- 200% zoom and 320px width tested.
- Screen-reader pass on hero, machine, chat, work cards, case study.
- Alt text for all screenshots; decorative elements `aria-hidden`.

SEO:

- Metadata per page; Open Graph/Twitter cards; canonical URLs.
- Sitemap and robots.
- Case-study `Article` structured data.
- No keyword stuffing; real copy.

---

## 9. Testing

- **Unit (Vitest):** retrieval ranking, synonym expansion, prompt builder, demo matcher, source extraction, token trimming.
- **Component (Testing Library):** loader states, chat messages, error states, reduced motion.
- **E2E (Playwright):** demo mode (headless, no WebGPU), navigation, filters, case studies, ⌘K, mobile menu, 404, external links.
- **Manual WebGPU:** Chrome/Edge on the target laptop: load, ask 20 evaluation questions, check sources, abort, reload from cache, OOM simulation (small VRAM), offline after load.
- **Visual:** screenshots at 360, 390, 768, 1024, 1440, 1920; compare against the design intent.
- **Accessibility:** axe on all pages; keyboard-only pass; screen-reader pass.
- **Performance:** Lighthouse CI; bundle analyzer; font subset check.
- **Links:** crawl all internal/external links; fail on non-200.

---

## 10. File structure

```
portfolio_deepseek/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   ├── fonts.ts
│   ├── machine/page.tsx
│   ├── work/page.tsx
│   ├── work/[slug]/page.tsx
│   ├── approach/page.tsx
│   ├── about/page.tsx
│   ├── contact/page.tsx
│   ├── colophon/page.tsx
│   ├── not-found.tsx
│   ├── sitemap.ts
│   └── robots.ts
├── components/
│   ├── shell/ (NavPill, Footer, CommandPalette, SkipLink)
│   ├── hero/ (HeroBento, Core, DotMatrix, StatCard)
│   ├── machine/ (MachineCard, ModelLoader, ChatPanel, SourceChips, MachineExplainer)
│   ├── work/ (WorkGrid, ChapterCard, FilterBar, PipelineViz)
│   ├── method/ (ApproachSteps, AboutCard, ContactCard)
│   └── ui/ (Button, Pill, Card, Label, SectionHeader)
├── lib/
│   ├── machine/ (worker.ts, client.ts, types.ts, detect.ts)
│   ├── rag/ (index.ts, synonyms.ts, prompt.ts, evaluate.ts)
│   ├── content.ts
│   ├── motion.ts
│   └── store.ts
├── content/
│   ├── knowledge.json
│   ├── demo-answers.json
│   ├── site.ts
│   └── work/*.mdx
├── public/
│   ├── images/work/...
│   └── og/...
├── data/
│   ├── projects_catalogue.json
│   └── project_selection.json   # M2
├── docs/
│   ├── PROPOSAL.md
│   └── SYSTEM_PLAN.md
├── tests/
│   ├── unit/
│   └── e2e/
└── ...
```

---

## 11. Implementation order

1. **M2 — chapter confirmation:** 7 approved projects, reorder, hero chapter, role notes → `data/project_selection.json`.
2. **M3 — design system:** tokens, fonts, Card/Button/Pill, nav pill, footer, background grain, responsive grid.
3. **M4 — machine:** detection, worker, loader, demo mode, retrieval, prompt, chat, sources, explainer. Test on real WebGPU before moving on.
4. **M5 — work:** index, seven case studies, pipeline visualiser.
5. **M6 — content:** copy, screenshots, metadata, role wording, knowledge base.
6. **M7 — motion:** hero settle, core states, scroll reveals, filters, ⌘K, reading progress, reduced motion.
7. **M8 — QA:** responsive screenshots, a11y, Lighthouse, links, build.
8. **M9 — deploy:** Vercel, domain, redirect, final smoke test.

**Checkpoints:** M2 (chapter set), M4 (machine works), M8 (polish review). The machine milestone is validated before content and motion are layered on top.

---

## 12. Open decisions

1. Domain: keep `parthvarekar.in` canonical, or redirect to a new domain?
2. Portrait: monogram tile or real photo?
3. Roles for COSTA, RoboForge, BioRadar, ProtoVinci: exact contributions needed for honest copy.
4. ProtoVinci: all five client projects or the three strongest?
5. Approval to begin.

---

**No code has been written. Awaiting your approval.**
