# 06 — Decisions

| Date | Decision | Rationale |
|---|---|---|
| 2026-11-08 | Concept: "The Living Instrument" | Story-based, local-first, memorable; the portfolio proves the thesis. |
| 2026-11-08 | Theme: "Periwinkle Lab" | User supplied a reference; sampled palette avoids generic dark/cream/red AI looks. |
| 2026-11-08 | Type: Geist Sans body, Geist Pixel Square display | User requested; Pixel is display-only for legibility. |
| 2026-11-08 | Model: Qwen2.5-0.5B q4f16_1 | User prioritised low wait time and latency; ~290 MB and fast generation. |
| 2026-11-08 | Pivot: SmolLM2-135M q4f16_1 | User chose the smallest loadable browser model (~78 MB) over answer quality. Wired in as a custom model record via `lib/machine/model.ts`; detection now requires `shader-f16` and falls back to demo otherwise; intro/spec/colophon copy updated. Hardened for the tiny model: temperature 0, max_tokens 120, repetition_penalty 1.12, scaffold-echo strip (note headers, `[N]`, KEY FACTS lines, `OPTIONS:`, `END OF QUESTION`, enumeration spam), verbatim-notes → first-sentence substitution, evidence questions fall back to KEY FACTS verbatim. Honest limits: prose answers are weak — fact/definition questions remain correct via deterministic layers; `The notes show:` is the fallback voice by design. |
| 2026-11-08 | No embedding model; lexical BM25 | Avoids a second download; ~40 chunks make lexical retrieval sufficient. |
| 2026-11-08 | No chat persistence | Stronger privacy; simpler; matches "nothing leaves / nothing stored". |
| 2026-11-08 | No analytics, no cookies | User decision; privacy ethos. |
| 2026-11-08 | Canonical domain `parthvarekar.in` | User decision; redirect `www` and old routes. |
| 2026-11-08 | Monogram `PV` instead of photo | User decision at the time; photo could be added later without a layout change. **Superseded 2026-11-10** — the portrait now sits in the same panel, so the disc was simply swapped for the image. |
| 2026-11-08 | Seven chapters, client work = 3 projects | User directive: only TheArtEvents, SocialxBrand Pilot, Gully Culture. |
| 2026-11-08 | Present selected projects as Parth's own | User explicitly approved this framing. Collaborative projects use "we" where accurate. |
| 2026-11-08 | Data-driven case studies, not MDX | Consistent design, simpler build, no MDX toolchain; content stays typed and maintainable. |
| 2026-11-08 | Web Worker for WebLLM | Keeps scrolling/typing responsive during generation. |
| 2026-11-08 | Demo mode clearly labelled | Honest fallback; no fake live inference. |
| 2026-11-08 | No heavy canvas in v1 | CSS core is lighter, faster and matches the soft visual language. |
| 2026-11-08 | Evidence questions use one note | 0.5B models latch onto the nearest sentence; a single results note with a `KEY FACTS` line beats three notes. |
| 2026-11-08 | Below-fold reveals (`Reveal`) | 14px rise, single pass, IntersectionObserver, 1.5 s safety timer, `prefers-reduced-motion` honoured. |
| 2026-11-08 | Animated collapsing nav (user request) | Desktop nav folds into a 52px lime PV circle on scroll-down past 150px and re-expands on scroll-up ≥80px (spring physics via `motion/react`, staggered children); click to expand; never on <961px; `prefers-reduced-motion` disables folding; cluster removed from tab order / AT when collapsed (display:none + tabIndex=-1). Mobile menu unchanged. |
| 2026-11-08 | `facts` field on results chunks | Deterministic anchor for metric questions; the model quotes it, not invents it. |
| 2026-11-08 | No assistant history in prompt | The 0.5B copied previous answers (COSTA answer was a copy of BioRadar). Follow-ups are instead rewritten in the UI to `Project: question` using a `lastProjectRef`. |
| 2026-11-08 | Project focus aliases in retrieval | Without them, "client work" matched all three client chunks equally; aliases give distinct retrieval per client and per chapter. |
| 2026-11-08 | "Search everywhere ⌘K" in mobile menu | ⌘K is desktop-only; mobile visitors get palette access without a permanent search button in the pill. |
| 2026-11-08 | Accept below-the-fold gallery LCP warnings | Those images are lazy on purpose; case-study hero already uses `priority`. |
| 2026-11-08 | Evidence questions verified by post-check | After streaming, if the answer contains no fact number from the top note's `facts`, the answer is replaced with `The notes show: <facts>`. Guarantees metric questions never invent or drop numbers. |
| 2026-11-08 | Definition questions verified by weakAnswerCheck | If the top note is an overview and shares <2 significant tokens with the answer, the answer is replaced with the overview's first sentence. Fixes "Costa is the name of the project." |
| 2026-11-08 | Out-of-domain screen (`hasPortfolioSignal`) | ≥2 meaningful corpus tokens or a project alias required before the model is called; otherwise the canned refusal is returned instantly. 2+2, jokes, weather, "prime minister of India" — all refused for free. |
| 2026-11-08 | Follow-ups rewritten to SUBJECT + original question | The 0.5B echoed "COSTA: how many…" back verbatim; now it sees a SUBJECT line and the natural question. No chat history is sent. |
| 2026-11-08 | No few-shot example in the prompt | The example leaked into answers ("…which runs Qwen2.5-0.5B locally…" for a COSTA question). Instructions alone + post-check beat the example. |
| 2026-11-08 | `.bento--hero` replaced by `.hero-stage` | φ split (1.618fr 1fr) broke the 12-col bento grid; the hero stage is now its own 2-col φ grid, stats flow in the 12-col `.bento`. |
| 2026-11-08 | Off-screen pause via `LoopGuard` + `data-loop` | Hero orbit dots, scroll-cue arrow and chat orb only animate while visible. |
| 2026-11-08 | Animated collapsing nav (user request) | Desktop nav folds into a 52px lime PV circle on scroll-down past 150px and re-expands on scroll-up ≥80px (spring physics via `motion/react`, staggered children); click to expand; never on <961px; `prefers-reduced-motion` disables folding; cluster removed from tab order / AT when collapsed (display:none + tabIndex=-1). Mobile menu unchanged. |
| 2026-11-08 | φ as the structural constant | One constant drives layout, rhythm and decoration: hero stage 1.618:1; machine chat:rail 1.618:1; about portrait:content 0.618:1; Fibonacci padding/gaps (55/89, 13/21, 21/34); 8:5 (≈φ) image crops; type ladder at φ powers of 16px; phyllotaxis dot matrices (34 hero / 55 loader, 137.508°). Tokens `--phi`/`--phi-inv` and a φ SYSTEM note in globals.css. Not decoration — the same rule everywhere. |
| 2026-11-08 | Method section deleted, user direction | The "Four moves, repeated" / PROCEDURE MONITOR section was judged meaningless; removed the home section, the /approach route, ApproachSteps + PipelineViz components, nav/footer/palette entries and sitemap URL; added 308 /approach → /; knowledge chunk relinked to /about. Home now flows hero → machine → work → person → contact. |
| 2026-11-10 | Portrait photo replaces the `PV` disc | User supplied the image and a reference screenshot of the About card. The photo takes the monogram's place in the left PORTRAIT column; the lime tile, the PORTRAIT / OPEN TO WORK labels and the name + coordinates footer are untouched, so the change is a pure substitution and stays rollback-able. |
| 2026-11-10 | Photo backdrop chroma-matched to the tile offline | The supplied photo has a flat studio green close to — but not equal to — the tile's gradient, which showed as a visible rectangle. The flat region is replaced at build time with the panel's exact CSS gradient computed in panel coordinates, so the subject stands in the lime wall instead of on a print of it. Offline sharp pass, no runtime cost, no extra bytes, and the original flat file is never shipped. |
| 2026-11-10 | The photo is the only likeness on the site | It appears once, in the About card (home + /about). No other copy references the portrait or its likeness. |
| 2026-11-10 | Portrait keeps a portrait aspect when the card stacks | At ≤1080px the About card becomes one column and a full-width band cropped the head off. The photo is now centred at `min(100%, 480px)` with a 4:5 aspect, and full width at 4:5 below 720px. |
