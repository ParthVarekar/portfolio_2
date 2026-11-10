# Parth Varekar — Portfolio: Proposal V2

**Status:** AWAITING YOUR APPROVAL. No implementation has begun.
**Supersedes:** the previous dark "Deep Space / Signal" proposal. This version locks the decisions from your last message and the attached visual reference.

---

## 0. Decisions locked

| Decision | Your call | What I will build |
|---|---|---|
| Local model | Small 0.5B, low latency | **Qwen2.5-0.5B-Instruct-q4f16_1-MLC** via WebLLM. ~290 MB download, ~945 MB GPU memory, 4K context, WebGPU. No 1.5B, no model picker. |
| Visual language | The attached reference | **"Periwinkle Lab"**: periwinkle canvas, white bento cards, lime + blue accents, soft shadows, large radii. Sampled from your image. |
| Type | Geist Sans body, Geist Pixel content | **Geist Sans** for body/UI. **Geist Pixel Square** for the hero, section titles, chapter numbers and big metrics. Pixel is a display face; body copy stays Sans for legibility. |
| Analytics | Off | No analytics, no trackers, no cookies. |
| Domain | Redirect allowed | Canonical `parthvarekar.in`; 301 from `www` and old routes. If you want a new domain, tell me and I will point the redirect at it. |
| Projects | Exactly the seven links | H.A.L.O, Susurrus, Chumps Lab Studio, BioRadar, COSTA, RoboForge, and one ProtoVinci client-work chapter containing the five agency repos. |

**One clarification on typography:** "Geist Pixel for content" is interpreted as *display content* — headlines, act titles, chapter numbers, large metrics, pull quotes. Geist Pixel at 16px body size is genuinely hard to read, so body paragraphs remain Geist Sans. If you want pixel body copy anyway, say so and I will do it, but I recommend against it.

---

## 1. The idea: "The Living Instrument"

A portfolio is usually a document. This one is an **instrument you can wake**.

The page opens as a soft, light, beautifully organised object: a periwinkle workbench with white cards, lime markers and blue dials. In the middle of it sits a small, living core. It is idle. The copy says:

> **THIS PAGE RUNS A MACHINE.**
> A real language model, inside your browser. Ask it about the systems I build. Nothing leaves your device.

You press **Wake the machine**. A 290 MB model loads into your GPU, the core begins to pulse, and the page becomes a working instrument: a chat that answers questions about Parth's work, grounded in a small curated knowledge base, with sources shown beside every answer. No server. No account. No conversation stored.

The rest of the page is the evidence: seven projects told as chapters, each one a machine Parth built. The story moves from **Overture → The Machine → The Work → The Method**. The aesthetic moves with it: soft and inviting at the top, vivid blue and precise at the machine, white and editorial at the work, warm lime at the contact.

**Why this is not another AI-generated portfolio:** the palette is drawn from your reference (periwinkle, lime, blue — not cream/brown, not black/red, not purple-gradient-on-white). The display face is a pixel font used with discipline. The layout is a bento composition, not a template. And the centrepiece is not an illustration of AI; it is a real model doing real work in the visitor's tab.

**Why it is credible:** Parth's whole body of work is local-first AI — H.A.L.O runs offline on one laptop GPU, Susurrus is zero-cloud dictation, Chumps Lab runs local models. The portfolio becomes the thesis: *AI that runs where you are.*

---

## 2. Feasibility: the 0.5B machine

### 2.1 The model

| Property | Value |
|---|---|
| Model | `Qwen2.5-0.5B-Instruct-q4f16_1-MLC` |
| Runtime | WebLLM `@mlc-ai/web-llm` (WebGPU, Web Worker) |
| Download | ~278–290 MB (first time only) |
| GPU memory | ~945 MB VRAM required by WebLLM's config |
| Context | 4,096 tokens |
| Browser support | Chrome/Edge 113+, Firefox 141+ (Windows), Safari 26+/iOS 26+ with WebGPU |
| Speed | Fast on integrated GPUs; short answers stream in ~1–3 s |
| Cache | Cache API after first load; returning visitors load in ~1–3 s |
| Privacy | Weights are fetched from the MLC/Hugging Face CDN on opt-in. Conversations never leave the tab. |

**Load strategy:** the model is not in the JS bundle and never downloads on page load. The initial page is a static, fast site. The model is dynamically imported and fetched only after **Wake the machine**. Progress is shown with shards, percentage and a cancel button. On mobile, the default is **demo mode**; loading the real model is an explicit opt-in with the size disclosed.

### 2.2 Retrieval without a second model

A second embedding model would add another 25–30 MB download and latency. For a knowledge base of ~40 chunks, that is unnecessary. I will use **lexical retrieval (BM25 / MiniSearch)** over a curated `knowledge.json`:

- ~40 chunks covering the seven projects, Parth's role, approach, tools, bio and contact.
- Synonym map for domain terms (e.g. "space station" → H.A.L.O/ISS; "dictation" → Susurrus; "beacon" → COSTA).
- Top-3 chunks injected into the prompt, with source labels.
- Retrieval is local, instant (<5 ms), and adds zero download.

**Answer contract:** the system prompt tells the 0.5B model to answer in at most three short sentences, use only the supplied context, and name its sources. If retrieval finds nothing above threshold, it says: *"That's not in my notes — try asking about a project or how I work."* The UI shows the retrieved source chips under the answer. This makes a small model feel trustworthy because the knowledge is visible.

**Why 0.5B is enough:** the model does not need to know Parth's life; retrieval supplies the facts. It only needs to turn retrieved notes into clear sentences. The narrow domain, short answers and source chips are the mitigation for its size. If it still feels weak in testing, the fallback is an optional 1.5B "deep" mode later — not part of v1.

### 2.3 Fallback that is honest

If WebGPU is missing, the adapter fails, the download fails, or the device runs out of memory:

- The machine switches to **demo mode**: a set of pre-written, clearly labelled answers played with a typing effect.
- The label reads **"Demo mode — the model is not loaded."** It never pretends to be live inference.
- The rest of the site is unaffected. No broken buttons, no console errors.

### 2.4 What leaves the device

Nothing, after the model is cached. No analytics, no fonts from Google (Geist is self-hosted via npm), no chat persistence, no server. The only network request is the one-time model download, which the visitor explicitly starts. The colophon states this plainly.

---

## 3. Visual system: "Periwinkle Lab"

### 3.1 Palette (sampled from your reference)

Reference image saved at `docs/reference/theme-reference.png` for provenance.

| Token | Hex | Role | Notes |
|---|---|---|---|
| `--canvas` | `#C8D1E1` | Page background | The periwinkle from your image. Cool, soft, not grey. |
| `--canvas-soft` | `#D9E1EE` | Alternating sections | Slightly lighter, keeps rhythm without a hard seam. |
| `--surface` | `#FFFFFF` | Cards | The dominant surface. |
| `--surface-2` | `#F4F6FA` | Inset panels, chips | Light cool grey. |
| `--surface-3` | `#E9EEF6` | Hover / selected | |
| `--ink` | `#101218` | Primary text | 18.7:1 on white, 12.2:1 on periwinkle. |
| `--ink-2` | `#465063` | Secondary text | 8.1:1 on white, 5.3:1 on periwinkle. |
| `--ink-3` | `#6B7280` | Tertiary labels on white | 4.8:1 on white. |
| `--lime` | `#DBEE4D` | The core, primary CTA, chapter numbers | Always paired with dark ink (14.6:1). Never lime text on white. |
| `--lime-deep` | `#C6DD35` | Hover/pressed lime | |
| `--lime-soft` | `#F1F8C9` | Quiet highlight, quote background | |
| `--blue` | `#589CFF` | The machine card, data visuals | Dark ink on blue is 6.8:1. |
| `--blue-strong` | `#2F6BDB` | Links, focus, small blue text | 4.9:1 on white. |
| `--blue-deep` | `#1E4FA8` | White text on blue when needed | 7.7:1. |
| `--blue-soft` | `#E4EEFF` | Blue-tinted chips/panels | |
| `--coral` | `#EF6A5B` | Errors only | Restrained; not a theme colour. |
| `--line` | `#E3E8F1` | Hairlines | |
| `--shadow` | `rgba(24, 39, 75, 0.16)` | Card shadow | Soft, blue-tinted. |

**Rules:** lime is a fill, not a text colour. Blue is a surface/large element; small blue text uses `--blue-strong`. Dark ink on blue and on lime is intentional and accessible. White text on `#589CFF` is not used for body copy.

### 3.2 Typography

| Role | Face | Size / weight | Use |
|---|---|---|---|
| Display | **Geist Pixel Square** | `clamp(3.5rem, 8vw, 7.5rem)`, 400, uppercase, tracking `-0.02em`, line-height `0.95` | Hero headline, act titles, big statements |
| Section title | Geist Pixel Square | `clamp(2.25rem, 4.5vw, 4rem)` | "THE MACHINE", "THE WORK", "THE METHOD" |
| Chapter number | Geist Pixel Square | 2.5–4rem, lime | `01`–`07` |
| Metric | Geist Pixel Square | 2–3rem | "276 tests", "80/80", "28/28" |
| Body | **Geist Sans** | 17px/1.6, 400 | Paragraphs, case studies |
| UI | Geist Sans | 14–15px, 500 | Nav, buttons, labels |
| Label | Geist Sans | 11–12px, 600, uppercase, tracking `0.12em` | Eyebrows, status, meta |
| Code (case studies only) | Geist Mono | 13px | Commands, snippets, file names |

Geist Pixel is used at 24px and above only. Body copy is always Geist Sans. The contrast between the pixel display and the soft, humanist sans is the personality of the site: **machine voice, human explanation.**

### 3.3 Surfaces, shape and depth

- Cards: white, radius **28px**, padding 28–40px, shadow `0 1px 2px rgba(16,18,24,.04), 0 24px 60px -28px rgba(24,39,75,.22)`.
- Inner panels: `--surface-2`, radius 20px.
- Pills: fully rounded, 36–44px tall.
- Buttons: 48px tall, 16px radius, 600 weight.
- Hairline: 1px `--line`; cards may also have a 1px inner white highlight to feel physical.
- Background: flat periwinkle with a very subtle radial lightening at the top-left and a 2% grain overlay. No heavy glassmorphism, no neon glow.
- Bento grid: 12 columns, 20–24px gaps, max width 1240px.

### 3.4 Motifs from the reference, reinterpreted

- **Dot matrix** (the skills board): a 7×7 grid of dots in the hero status card. As the model loads, dots light up lime one by one — a progress indicator that feels like the reference, not a spinner.
- **Rounded bars** (the employment chart): the pipeline visualiser and project metrics use soft vertical bars in blue and lime.
- **Pills and toggles** (candidates review): status chips, filters and the "local / demo" toggle.
- **Portrait card** (top right): a lime monogram tile with `PV` in Geist Pixel; a real photo can replace it later without changing the layout.
- **Soft blue panel** (interview record): the machine card is the large blue surface, with a white inner chat panel for readability.

### 3.5 Motion

- Hero cards settle in with a soft spring (translateY 16px → 0, 500ms, stagger 70ms).
- The core breathes: scale 1 → 1.04, 2.8s ease-in-out. Idle = slow and dim; ready = brighter and slightly faster; generating = a quick pulse on each token batch.
- Model loader: dot matrix fills, progress bar grows, status text changes.
- Chat: messages fade/slide 150ms; tokens stream; source chips appear after the answer.
- Work cards: 2px lift and shadow deepen on hover; metric reveals in blue.
- Page transitions: 200ms fade; case-study reading progress is a thin blue line.
- `prefers-reduced-motion`: core static, no parallax, no card transforms; only 150ms opacity fades and functional progress.

### 3.6 What we deliberately avoid

- Dark hacker terminal, neon green on black, glass panels.
- Cream/brown "editorial warmth", black/red "bold", purple gradient on white.
- Generic dashboard charts with no meaning.
- Pixel font in body copy.
- Decorative 3D blobs, floating orbs with no function, cursor followers.
- Autoplaying sound or video.

---

## 4. Story and information architecture

### Four movements

1. **I — Overture.** The instrument is asleep. The hook, the promise, the status of the machine.
2. **II — The Machine.** Wake it. Chat. Sources. An honest explainer of what is running and what leaves the device.
3. **III — The Work.** Seven chapters, each a machine Parth built. Bento index → long-form case studies.
4. **IV — The Method.** How he works, who he is, how to reach him. Ends on a lime contact card.

### Pages

```
/                 Home (Overture → Machine → Work → Method)
/machine          Full-screen machine (same chat, shareable link)
/work             Chapter index
/work/[slug]      Case study (seven chapters)
/approach         Research → Prototype → Verify → Ship
/about            The person, tools, currently
/contact          Contact (also an anchor on home)
/colophon         Stack, privacy, accessibility, credits
```

Navigation is a floating white pill: `PV` monogram · Work · Machine · Approach · About · **Ask** (lime). On scroll it compresses to a smaller pill. On mobile it becomes a pill with a menu button.

---

## 5. What the finished site looks like

### 5.1 First screen (desktop)

The browser opens on a **periwinkle field** (`#C8D1E1`) with a faint film grain. A floating white nav pill sits at the top, centred: monogram, quiet links, and a small lime **Ask** button. There is no giant logo, no full-screen video.

Below it, a **bento composition** of white cards:

- **Large card (left, ~7 columns):** a small uppercase eyebrow `PARTH VAREKAR · MUMBAI, IN`; then the hero in huge **Geist Pixel Square**, uppercase, near-black:
  ```
  THIS PAGE
  RUNS A
  MACHINE.
  ```
  Below, in Geist Sans: *"A real language model, inside your browser. Ask it about the systems I build. Nothing leaves your device."* Two buttons: a **lime pill "Wake the machine"** with dark ink, and a white pill with a thin border: **"Read the work"**.
- **Blue card (right, ~5 columns):** a vivid `#589CFF` card with a large **lime core** — a soft radial orb made of layered gradients, breathing slowly. Around it, a 7×7 dot matrix, mostly dim, waiting. Top-left label: `THE MACHINE · IDLE`. Bottom row: `QWEN 2.5 · 0.5B` and `WEBGPU READY` (or `DEMO MODE`). The core is the only thing on the page that feels alive.
- **Two small cards under the blue card:** one says `0 BYTES SENT` with a small lime dot; one says `~290 MB · LOADS ON DEMAND` with a tiny bar chart. These are the reference's small stat cards, repurposed as honest machine facts.
- **Wide card below:** a single sentence of story in Geist Sans — *"I build AI that runs on your own hardware: offline procedure monitors, zero-cloud dictation, browser labs. This page is the same idea, in your tab."* — and a small `SCROLL TO OPEN ↓` label.

The overall first impression: **soft, optimistic, precise, and slightly unusual.** It does not look like a dark developer portfolio, and it does not look like a generic SaaS landing page. The periwinkle + lime + blue combination is friendly; the pixel headline gives it an edge; the breathing core gives it life.

### 5.2 The Machine (the apple of the eye)

As you scroll, the blue card grows into a **full-width blue machine panel**. This is the dramatic beat of the page: a large `#589CFF` surface, 32px radius, with a white inner chat panel floating inside it.

- **Header (blue):** `II — THE MACHINE` in Geist Pixel, dark ink. To the right: pills for `LOCAL`, `QWEN 2.5 · 0.5B`, `4K CONTEXT`, and a lime status dot. A small link: `How it works ↓`.
- **Inner chat panel (white, 24px radius):** a scrollable conversation. Assistant messages are plain dark text; user messages sit in `--surface-2` bubbles. While generating, a lime caret blinks. Under each answer, small source chips: `H.A.L.O README`, `Susurrus tests`, `BioRadar results`.
- **Before wake:** the panel shows a friendly empty state — the core, the sentence *"Ask me about the work. I answer from Parth's notes, not the internet."* and four suggestion chips: *"What is H.A.L.O?"*, *"How does Susurrus work?"*, *"What did BioRadar prove?"*, *"How do you test your systems?"*
- **Wake flow:** clicking **Wake the machine** replaces the empty state with a loader: the dot matrix fills lime, a progress bar grows, text says `Downloading 290 MB · 38% · 12 s left`, with `Cancel` and `Use demo instead`. The page stays usable; the model runs in a worker.
- **Ready:** the core brightens, the status dot turns lime, the input is enabled. Placeholder: *"Ask about a project, a decision, or how I work…"*.
- **Answering:** tokens stream in. The core pulses gently with the stream. The answer is short (2–3 sentences), followed by source chips. A small line underneath: *"Running locally · 0 bytes of this conversation sent."*
- **Below the blue panel:** three small white cards:
  1. **What runs** — Qwen 2.5 0.5B, 4-bit, WebGPU, in a worker.
  2. **What leaves** — nothing after the model is cached; no analytics, no chat storage.
  3. **What if it can't** — demo mode, clearly labelled; the site still works.

This section is the screenshot people will share: a friendly blue machine with a lime heartbeat, running a real model in the tab.

### 5.3 The Work

The page returns to periwinkle and white. A section label: `III — THE WORK`. A pixel title: **SEVEN MACHINES, ONE METHOD.** A short line: *"Each chapter is a problem, a decision, and evidence. Team projects are labelled as team projects."*

The chapters are a **bento grid of white cards**, not a uniform list:

- The first chapter (H.A.L.O) is a large card (7 columns) with a blue visual band and a lime `01`.
- Susurrus and Chumps Lab share a row (5 + 7).
- BioRadar and COSTA share a row (6 + 6).
- RoboForge spans wide (8) with a small "archived" note.
- ProtoVinci client work is a wide card (12) containing five small client tiles.

Each card has: pixel chapter number, title in Geist Sans semibold (or pixel for the big ones), a one-line description, a status pill (`COMPLETE`, `IN PROGRESS`, `ARCHIVED`, `CLIENT`), 2–3 tech chips, and one evidence metric in blue (`276 tests`, `80/80 detections`, `28/28 cases`, `77/77 tests`). Hover lifts the card 2px and the metric turns lime. Click opens the chapter.

A filter row above: `All · Local AI · Space · Bio · Optics · Robotics · Client`. Filters are pills; active is lime with dark ink.

### 5.4 A case study

Clicking H.A.L.O opens a periwinkle page with a white article card. At the top, a **blue band** with a huge pixel `01`, the title `H.A.L.O`, and the one-line *"A ground controller for the station."* Meta pills: `SIH26174`, `OFFLINE`, `YOLO11 + QWEN3-VL`, `276 TESTS`.

The body is editorial: 68ch measure, Geist Sans 18px, generous spacing. Sections are numbered in pixel lime: `01 THE PROBLEM`, `02 THE DECISION`, `03 THE BUILD`, `04 THE EVIDENCE`, `05 WHAT I LEARNED`. Diagrams sit in `--surface-2` panels with rounded corners; a pull quote sits on a lime-soft card with dark ink; code/file names in Geist Mono. A thin blue reading-progress line runs along the top. At the end, a "next chapter" card with the next project and a lime arrow.

### 5.5 The Method, About, Contact

- **Approach:** four white cards in a row, each with a pixel number `01–04`: *Research → Prototype → Verify → Ship.* Each has a short paragraph and a real evidence chip (e.g. "8/8 verification checks" for H.A.L.O). A thin blue line connects them; on mobile it becomes a vertical timeline.
- **About:** a large white card with a lime monogram circle (`PV` in pixel), a short first-person bio, and a `currently` card: *"Building local-first AI tools in Mumbai. B.Tech Computer Engineering, K.C. College, 2028."* A tools grid of chips: Python, TypeScript, PyTorch, WebGPU, llama.cpp, React, Next.js, Docker.
- **Contact:** a full-width **lime card** with a pixel headline: **LET'S BUILD SOMETHING THAT RUNS LOCALLY.** A dark button: `parthvarekar27@gmail.com`. Secondary links: GitHub, LinkedIn. Small line: *"No form, no backend, no tracking. Just email."*
- **Footer:** periwinkle, small white text. Colophon: *"Built with Next.js, WebLLM, Geist. The model runs in your browser. No analytics. No cookies."* Links to `/colophon`.

### 5.6 Mobile

- The nav becomes a floating pill with the monogram and a menu button.
- The hero bento stacks: headline card first, then the blue core card, then the two stat cards side by side, then the story card.
- The headline drops to ~48px pixel; body stays 16–17px.
- The machine card is full-width; the white chat panel becomes edge-to-edge inside it; suggestion chips scroll horizontally.
- Work cards stack; the bento becomes a single column with the chapter number and title on top, description below.
- The pipeline visualiser becomes a vertical step list.
- The contact lime card stays full-width and bold.
- The model defaults to **demo mode** on mobile; a `Load the real model (290 MB)` button is available for users who want it.
- Touch targets ≥ 44px; no hover-only information.

### 5.7 The feeling at the end

Soft, confident, and alive. Like a beautifully made piece of consumer hardware: periwinkle shell, white panels, one lime light, one blue screen. The pixel type says "machine"; the rounded cards and warm palette say "human". The chat is not a gimmick; it is the proof. A visitor remembers the blue machine with the breathing lime core, and they remember that it ran on their own laptop.

---

## 6. The seven chapters

| # | Chapter | One-line | Role / evidence | Visual motif |
|---|---|---|---|---|
| 01 | **H.A.L.O** | A ground controller for the station. | Owner/primary author. 276 tests, 8/8 verification, mAP50 0.79, Qwen3-VL 9 questions ~0.6s. | Blue band, orbit dots, signed-log diagram |
| 02 | **Susurrus** | Your voice never leaves the machine. | Owner. 77/77 tests, zero cloud, whisper.cpp + llama.cpp, live landing page. | Waveform bars, lime mic dot |
| 03 | **Chumps Lab Studio** | An editor that edits with you. | Owner. 26 browser e2e checks, typed Edit Decision Document, Remotion. | Timeline strips, blue playhead |
| 04 | **BioRadar** | From one litre of water. | Team SIH25042; README credits Parth. 80/80 detections, 0 false positives, 14 engines, Merkle ledger. | Dot matrix species grid, blue water bars |
| 05 | **COSTA** | It finds the beacon by how it blinks. | Team SIH26169. 28/28 cases, real footage 94–100% lock, Fourier signature, pan/tilt. | Blink pulses, blue/lime signal chart |
| 06 | **RoboForge** | Tell it, simulate it, test it against reality. | Team Odyssey. 900+ tests, MuJoCo + Webots, reality-gap diagnosis, archived. | Rover path, blue bars, lime checkpoints |
| 07 | **ProtoVinci — client work** | Real briefs, shipped. | Agency client work: wmc-virtual-lab, Firdosh Marble Arts, TheArtEvents, SocialxBrand Pilot, ProtoVinci site. | Five small client tiles in one wide card |

**Accuracy discipline:** H.A.L.O, Susurrus and Chumps Lab are owned by Parth and can be described in first person. BioRadar, COSTA and RoboForge are team projects; the copy will say "team project" and only claim what the repo/README supports. ProtoVinci is client work; the copy will say "client work at ProtoVinci" and describe the deliverables, not claim sole authorship. Before content lock, I need your confirmation of your specific role on COSTA, RoboForge, BioRadar and the ProtoVinci projects so the wording is exact.

---

## 7. Stack and system

- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript.
- **Styling:** Tailwind CSS v4 + CSS custom properties for the tokens above.
- **Motion:** `motion` (Framer Motion) for UI; CSS for the core; no heavy canvas in v1.
- **Local LLM:** `@mlc-ai/web-llm` 0.2.86, Qwen2.5-0.5B, Web Worker, WebGPU, Cache API.
- **Retrieval:** MiniSearch/BM25 over `content/knowledge.json`; no embedding model; top-3 chunks; source labels.
- **Content:** MDX case studies + JSON project metadata. All copy original, no lorem ipsum.
- **Fonts:** `geist` npm package, self-hosted (Geist Sans + Geist Pixel Square). No Google Fonts request.
- **Images:** next/image, AVIF/WebP, lazy, real repo screenshots.
- **Backend:** none. No database, no CMS, no analytics, no cookies.
- **Deploy:** Vercel; `parthvarekar.in` canonical; 301 from `www` and old paths.
- **Testing:** Vitest for retrieval/prompt logic; Playwright for UI, responsive screenshots, demo mode, links; axe for accessibility; Lighthouse budget.

**Bundle strategy:** the initial JS stays small (~150–200 KB gzipped). WebLLM is dynamically imported only on wake. The model is fetched from the MLC/HF CDN and cached; it is never part of the repo or the initial bundle.

---

## 8. User flows

### First visit, desktop with WebGPU

1. Page loads: static shell, fonts, hero. No model download. LCP under 2 s on 4G.
2. Visitor reads the hook, sees `WEBGPU READY` and `0 BYTES SENT`.
3. Clicks **Wake the machine** → loader with size/progress/cancel.
4. Model ready → suggestions → asks a question → short grounded answer + sources.
5. Scrolls to the work → chapter → case study → approach/about/contact.
6. Returns later: model cached, loads in ~1–3 s; no chat history is stored.

### Mobile or no WebGPU

1. Hero stacks; status card says `DEMO MODE` or `WEBGPU NOT AVAILABLE`.
2. **Wake** becomes **Try the demo**; demo answers are clearly labelled.
3. Optional `Load the real model (290 MB)` on WebGPU-capable mobile.
4. All work content is fully usable; no broken states.

### Keyboard and accessibility

- Skip link; semantic landmarks; visible focus rings in `--blue-strong`.
- ⌘K / Ctrl+K command palette: go to Work, Machine, Approach, About, Contact; "Wake the machine"; "Use demo mode".
- Chat messages in `aria-live="polite"`; progress with `aria-valuenow`; source chips are links.
- Reduced motion respected; all content visible without animation.
- Contrast checked for every text/background pair; status never conveyed by colour alone.

### Error states

- No WebGPU → demo mode, with a one-line explanation and a browser-support link.
- Adapter fail / OOM → friendly message, "Use demo instead", retry.
- Download fail → "The download stopped. Check your connection and retry." + demo.
- Cache evicted → "The model was cleared from your browser. Load it again?" 
- Network offline after load → chat still works; model is local.

---

## 9. Performance, accessibility, SEO

- Lighthouse mobile targets: **Performance ≥ 95, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 95**.
- LCP < 2.0 s on 4G; CLS < 0.05; INP < 200 ms; initial JS < 200 KB gzipped.
- Model download is opt-in, disclosed, cancelable, and cached.
- Responsive at 360, 390, 768, 1024, 1440, 1920.
- `prefers-reduced-motion`, `prefers-contrast`, keyboard, screen reader, 200% zoom.
- Metadata, Open Graph image, sitemap, robots, canonical URLs; case-study structured data.
- No broken links: automated link check in CI; every external URL returns 200.

---

## 10. Build plan

| Milestone | What | Time |
|---|---|---|
| **M1** | Research + proposal (this document) | Done |
| **M2** | Chapter confirmation UI: the 7 approved projects, reorder, choose the hero chapter, confirm role wording; saves `data/project_selection.json` | 0.5 day |
| **M3** | Design system + shell: tokens, type, cards, nav, footer, responsive grid | 1 day |
| **M4** | Overture + The Machine: hero bento, core, loader, WebLLM worker, retrieval, demo mode, explainer | 3 days |
| **M5** | The Work: index, chapter cards, seven case studies, pipeline visualiser | 2 days |
| **M6** | Content and copy: original story copy, real screenshots, role wording, metadata | 2 days |
| **M7** | Motion and interactions: scroll reveals, ⌘K, filters, reading progress, reduced motion | 1 day |
| **M8** | QA and polish: responsive screenshots, a11y, Lighthouse, links, build | 1.5 days |
| **M9** | Deploy + domain redirect | 0.5 day |

**Total:** ~11–12 working days. Checkpoints after M2 (selection), M4 (machine works on real WebGPU), and M8 (polish).

---

## 11. Risks and mitigations

| Risk | Mitigation |
|---|---|
| 0.5B answers feel thin | Retrieval-grounded short answers, source chips, curated suggestions, strict "not in my notes" guardrail. Optional 1.5B later. |
| WebGPU unavailable | Demo mode, clearly labelled; all content works without the model. |
| Mobile data cost | Default demo mode on mobile; explicit 290 MB opt-in. |
| Model CDN unavailable | Friendly error, retry, demo mode. |
| Collaborative role wording | Confirm exact roles with Parth before content lock; use "team project" and evidence only. |
| No portrait photo | Lime `PV` monogram tile now; real photo can drop in later. |
| Domain/DNS | Keep `parthvarekar.in` canonical; 301 from `www` and old paths. |
| Browser support changes | Feature-detect `navigator.gpu`; never assume. |

---

## 12. Open questions (short)

1. **Domain:** keep `parthvarekar.in` as canonical, or do you have a new domain to redirect to?
2. **Portrait:** monogram tile, or will you provide a photo?
3. **Roles:** can you confirm your specific contributions to COSTA, RoboForge, BioRadar and the ProtoVinci projects? I will not invent them.
4. **ProtoVinci:** show all five client projects in the chapter, or only the three strongest (wmc-virtual-lab, Firdosh Marble Arts, ProtoVinci site)?
5. **Approval:** the one thing I need before writing code.

---

## APPROVAL GATE

I have completed the revised research, system plan and visual direction. **No implementation has begun.**

**Reply with one of:**

- **Approve** — build the site exactly as described (0.5B machine, Periwinkle Lab, Geist Sans + Geist Pixel, seven chapters, no analytics, domain redirect).
- **Modify** — tell me what to change (palette, type, acts, model behaviour, project order, copy).
- **Reject / more research** — I will go deeper before proposing again.
- **Combine** — e.g. "keep this palette but make the machine card white" or "use pixel only for the hero".

Silence or an ambiguous reply is not approval. Once approved, M2 is the chapter confirmation, then M3–M9 as above.

**What is your decision?**
