# 05 — Progress

**Current milestone:** M9 — deploy
**Current state:** build passes, all QA done except deploy; only blocker is Vercel credentials
**Next action:** user runs `npx vercel login` or provides a Vercel token; then deploy and set canonical domain.

## Milestones

- [x] **M1 — Research + proposal + approval** (2026-11-08)
- [x] **M2 — Chapter confirmation** — seven chapters locked; order in `data/projects_catalogue.json`. Parallel demo `data/project_selection.json` kept as machine-readable confirmation.
- [x] **M3 — Design system + shell** — tokens, fonts, nav pill (desktop + mobile menu + Search everywhere), footer, skip link, command palette.
- [x] **M4 — Overture + The Machine** — hero bento, core, loader, WebLLM worker, retrieval, demo mode, colophon explainer.
- [x] **M5 — The Work** — index, seven chapters, case studies, pipeline visualiser.
- [x] **M6 — Content + copy** — original copy, real screenshots optimised, metadata, knowledge base (45 chunks).
- [x] **M7 — Motion + interactions** — hero settle, states, filters, tabs, ⌘K, reading progress, reduced motion (verified on device).
- [x] **M8 — QA + polish** — 14 routes 200, responsive 1440/390, interactions, links, console, production build.
- [ ] **M9 — Deploy + domain** — blocked on Vercel credentials; see below.

## Task board — done

### Foundation
- [x] `package.json`, Next.js 16.4.5, React 19.3.1, TypeScript 7.0.2
- [x] Tailwind CSS 4 + PostCSS
- [x] `geist` fonts (Sans, Pixel Square, Mono)
- [x] `app/layout.tsx`, metadata, fonts, `data-scroll-behavior="smooth"`
- [x] `app/globals.css` tokens, base styles, responsive rules
- [x] Nav pill, mobile menu (with Search everywhere), footer, skip link, command palette

### Home
- [x] Hero bento (headline, core, stat cards, story)
- [x] Machine card + chat + loader + demo mode
- [x] Work grid + filters
- [x] Pipeline visualiser (7 tabs)
- [x] Approach, About, Contact, Colophon

### Content
- [x] `content/projects.ts` seven chapters
- [x] `content/knowledge.json` 45 chunks (with `facts` for the six results chunks)
- [x] `content/demo-answers.json` 12 answers
- [x] Real project screenshots downloaded and optimised
- [x] Case study pages (SSG, 7 routes)
- [x] About/approach/contact/colophon copy

### Machine
- [x] WebGPU detection + demo fallback
- [x] WebLLM worker (load from cache ~5–9 s)
- [x] Loader progress, cancel
- [x] Retrieval: intent-aware, project focus, evidence cap, KEY FACTS injection, acronym normalisation
- [x] Follow-up resolution via `projectInQuestion` / `isFollowUpQuestion` — no chat history sent to the model
- [x] Streaming chat + sources + refusal
- [x] Error states (stop mid-answer, interrupted, load error → demo)

### QA
- [x] Build passes (19 pages static)
- [x] Typecheck passes
- [x] Responsive 1440 / 390 (also 360, 768 during dev)
- [x] Case studies: 14/14 pages — no overflow, no broken images, all alt text
- [x] Interactions: filters, pipeline tabs, ⌘K palette, mobile menu, links
- [x] Console: only 4 accepted LCP warnings (below-the-fold gallery images; hero already priority)
- [x] External links 200 (LinkedIn 999 = bot block, fine in browsers)
- [x] Real WebGPU inference: load, stream, evidence questions quote KEY FACTS, follow-up "How many tests did it pass?" → "BioRadar passed 76 tests.", refusal OK
- [x] Demo mode: answer + refusal OK
- [ ] Lighthouse (deferred; not installed)
- [ ] Deploy

## Changelog

### 2026-11-10 (portrait photo in the About card)
- User supplied a portrait (arms folded, white shirt) plus a reference screenshot of the About card; the black `PV` monogram disc in the left PORTRAIT panel is now the photo.
- Asset: `public/images/portrait.jpg` (960×1438, 91 KB) rendered with `next/image` (`fill`, `object-fit: cover`, `object-position: 50% 16%`), lazy-loaded; ~26 KB served at w=640, ~11 KB at w=384.
- Backdrop match: the supplied photo is a green-screen shot (flat #4E8D01). An offline key replaces the screen with the panel's own CSS gradient (radial white highlight at 20% 8% + `linear-gradient(165deg, #e8f765, #dbee4d, #c9e13c)`), evaluated in the panel's coordinate space through the `object-fit: cover` mapping — so the portrait stands *in* the lime wall rather than on a print of it. Measured seam on the rendered page: left edge Δ(0,0,3), right edge Δ(1,2,1), top edge Δ(0,4,5) (the tile's dot texture accounts for the remainder).
- Layout: `.portrait-photo` replaces `.monogram-big`; both old rules deleted. Desktop keeps the tall 0.618fr column; ≤1080px (stacked card) the photo is centred at `min(100%, 480px)` with a 4:5 aspect so the head is never cropped; ≤720px it goes full width at 4:5.
- Verified 1440 / 900 / 768 / 390: no horizontal overflow, head always in frame, alt text present, typecheck and production build green.

### 2026-11-10 (transparent cut-out portrait)
- Final direction: **"use this image with a transparent bg instead"**. The upload was a 1025×1535 PNG with a real alpha channel (alpha mean 101.6, min 0, max 255) — a proper cut-out, so no keying was needed at all.
- Asset: `public/images/parth-cutout.png`, re-encoded at 900×1348 with the alpha intact (214 KB source). `next/image` serves it as AVIF to browsers: **17.7 KB at w=640, 9.7 KB at w=384** (99 KB if a client refuses modern formats).
- Layout: `.portrait-photo--cutout` drops the frame, the hairline and the drop shadow — those described a rectangle, and there is no rectangle now. The container's background goes transparent so the panel's own gradient, dot texture and corner ticks read through the empty space.
- A `mask-image` fade takes the bottom of the figure to transparent (84 % → 100 %), so he dissolves into the lime instead of being cut off flat at the frame's edge.
- The subject's alpha bbox is x 98–882, y 278–1535 (38 % wide, head at 18 % down), which sits well inside the 0.705 frame at every breakpoint.
- Verified 1440 / 900 / 768 / 390: figure fully in frame, no horizontal overflow, no green or white halo on the edges.

### 2026-11-10 (portrait published with its green screen)
- User direction after seeing the keyed result: **"i want to use the image with the green screen or background, not the lime one"**. The photo is now shipped exactly as supplied — `public/images/parth-green.jpg` (1000×1498, from the 1025×1535 upload) — and mounted in the lime PORTRAIT panel as a print: 24 px rounded corners, a 1 px ink hairline (0.14) and a soft drop shadow so it sits on the tile instead of floating.
- The keyed variants (`portrait.jpg`, `parth-v2.jpg`) were deleted; `scripts/key-portrait.mjs` stays in the repo as a tool but no longer feeds the published asset. It still refuses duplicate swaps (mean difference < 4/255 against the published file → "same photograph", exit 2).
- Verified 1440 and 390: the green screen renders as shot, no horizontal overflow, alt text updated to "photographed against a green screen".

### 2026-11-10 (green-screen key, second pass)
- The first portrait came on a flat lime backdrop that already matched the tile; the replacement photo is a raw green-screen capture (1025×1535, flat #4E8D01), so the backdrop now has to be keyed.
- **The two uploads are the same photograph** — the second is a green-screen version of the first (identical face, hair, shirt and pose; hair band at 18.5–32.9 % of the frame in both). Once the backdrop is keyed into the tile either file renders the same picture, which is why the swap looked like "nothing changed". The live file is the newer, higher-resolution one (1025×1535 vs 853×1280), so the rendered portrait is now sharper.
- Distance-from-backdrop matte was the wrong tool: JPEG chroma noise made the flat green drift up to 25 units, leaving a muddy olive cast across the field. Switched to a **greenness** matte (`alpha = 1 − (G − max(R,B)) / 63`), which is stable because the screen's green excess is 63 everywhere regardless of noise.
- Background replacement is a colour transfer, `out = P + (1 − a) · (tile − localScreen)`: a pure screen pixel becomes exactly the tile, a pure subject pixel is untouched, edge pixels slide between the two. Pure-screen pixels (`excess ≥ 55`) are written as the tile directly so no green survives.
- The screen's local brightness still drifts vertically, so the reference colour is sampled per 64 px block instead of globally; with a global reference the field was ~10 units off the tile.
- The photo's drop shadow was removed: with the backdrop baked to the tile, the shadow darkened the tile around the frame and re-introduced a visible edge. Only a 1 px hairline remains.
- Asset renamed to `public/images/portrait.jpg` — `next/image` responses are cached for 4 h (`max-age=14400`), so a changed file under the same name can stay stale in the user's browser.
- Also set `experimental.staleTimes: { static: 0, dynamic: 0 }`: the Next client router reused a prefetched page segment for 5 minutes, so a client-side navigation could still render the pre-swap markup. Header now reads `x-nextjs-stale-time: 0`.
- The keying pass is now a **repo script**, `scripts/key-portrait.mjs <source> [out]` — it samples the backdrop from the corners, picks the greenness matte (green screen, green excess > 40) or the distance matte (any other flat backdrop), keys it against the panel gradient and writes `public/images/portrait.jpg`. Regression-checked: it reproduces the shipped portrait byte-for-byte (mean abs diff 0.18/765) from the green-screen source and keys the lime-backdrop source cleanly too. Swapping the portrait is now: run the script → rename the asset (the 4 h image cache) → rebuild.

### 2026-11-08 (nav material + snappier motion)
- Nav pill given a real material: top-lit grey gradient (white → cool grey), ink-tinted border with inner highlight lines, deeper duotone shadow — now distinct against both the periwinkle canvas and white cards in both expanded and collapsed (PV seal) states.
- Fold choreography tightened: collapse at 110px (was 150), re-expand delta 60px (was 80), springs at 380–460 stiffness / 21–30 damping, stagger 0.022–0.03, exit timings 0.11–0.14s — links vanish and return noticeably quicker without snapping.

### 2026-11-08 (laptop → retro computer)
- Per user direction the laptop was replaced by a **CRT desk computer** built from the supplied reference image: `components/contact/Computer.tsx` + `.crt-*` CSS.
- Shell: rounded white body, deep-blue tube (4:3) with soft bezel, a chin carrying a slot, two knobs and a glowing lime power button (links to /machine — "ask the machine"), a pedestal with a lime glow foot, soft contact shadow, slight `rotateY(-5deg)` for depth.
- Screen: inline SVG wallpaper reproducing the reference scene (lime planet, clouds, orbit line, moon, sparkles) with the desktop UI on top — five app icons, terminal tab + blinking cursor, `npm ERR! sleep not found` toast, `ship ✓ / sleep ✗` widget, task bar with live IST clock, 12% battery and `sleep: off/soon`.
- The slot in the chin doubles as the timeline meter (62% lime fill).
- `Laptop.tsx` and all `.laptop-*` CSS deleted.

### 2026-11-08 (contact laptop rebuilt in 3D)
- The laptop is no longer a flat front elevation — it is now a real CSS 3D instrument: `perspective` on the device column, the whole unit turned `rotateY(-13deg) rotateX(4deg)` for the 3/4 view, the lid leaning back (`rotateX(-13deg)` about its bottom edge), the deck receding toward the viewer (`rotateX(-58deg)` about the hinge), a shell-thickness strip on the right edge, two lime hinge tabs, a glowing lime front lip and a soft contact shadow.
- Screen content stays real DOM, so the app icons remain crisp and clickable (verified: Résumé opens the viewer through the 3D transform).
- The old "PV" rubber stamp was removed from the contact card — the laptop now owns that space.

### 2026-11-08 (contact laptop + résumé)
- **Laptop in the contact card**: `components/contact/Laptop.tsx` — a small CSS laptop in the empty right column of the lime card (white shell, periwinkle keys, lime hinge + spacebar, blue screen with the site's dot texture, lime webcam).
  - Screen apps, all clickable: Mail (mailto), LinkedIn, WhatsApp (wa.me from the real number), GitHub, Résumé (opens the in-page viewer).
  - Personality, all tiny: live **IST clock** in the task bar, `sleep: off` / `sleep: soon` depending on the hour, battery at 12%, a `timeline 62%` widget, `ship ✓ / sleep ✗` checkboxes, a `pv@local: ~/parth` tab with blinking cursor and a `npm ERR! sleep not found` toast.
- **Résumé viewer**: the attached PDF (`Resume_8November2026.pdf`, 1 page) is copied to `public/resume/parth-varekar-resume.pdf`; its content is also structured in `content/resume.ts` and rendered as a designed HTML sheet in a modal (PDF + Download links, Esc / backdrop / ✕ to close) — no dependency on the browser's PDF viewer.
- Copy alignment: About page, knowledge base and demo answer now say **Excelsior KC College of Engineering (Thane), University of Mumbai** to match the résumé (previously "K.C. College of Engineering, Mumbai University").

### 2026-11-08 (visual pass 2 — reversible test)
- **Backup**: git checkpoint `9b95f2f` (pre-pass) + `C:\Users\Parth\Desktop\portfolio_backup_2026-11-10.zip`. Rollback: `git reset --hard 9b95f2f` (then `npm run build`), or unzip the archive over the folder.
- **Work page** rebuilt as a φ split: 61.8% title column + 38.2% "Index" panel (07 chapter rows: number · title · year) above the filters and mosaic.
- **Case studies** now speak the same grammar: section heads carry a hairline + dotted rule, and every section reveals on scroll (`Reveal`, staggered).
- **Motion scale**: `--dur-1…4` + `--ease-out` tokens replace hardcoded durations site-wide; consistent 0.97 press feedback on chips, index rows and links.
- **Footer** is now an end-card: brand row + mono status, three hairline columns (Sections / Elsewhere / Actions), mono meta line.
- **404** is now an end-card: lime Pixel 404, actions, and a "Live routes" index.
- Verified: 13 routes 200 + 404, zero console errors, zero overflow at 1440 and 390.

### 2026-11-08 (visual composition pass)
- **Readout band**: the four stat cards + story card + chapter index strip (three floating bands) collapsed into ONE instrument panel — hairline-divided readouts (0 / 78 MB / 4,096 / 1 + a φ-wider place cell), the statement row, and the chapter index as a dotted-leader table of contents. Dead CSS (`.stat-card`, `.story-card`, `.index-strip`, …) pruned.
- **Technical headers**: `.section-label` is now a mono micro-label that runs into a dotted rule instead of a white chip — one repeated signature across home and inner pages.
- **Lime panels** (portrait tile + contact card) given a shared material: diagonal lime gradient, inner hairline frame with corner ticks, dot texture. Contact headline re-broken from 4 lines to 3.
- **Case studies**: chapter numeral switched to lime for a focal accent; hero got the white corner-tick frame. Machine panel + hero machine card got matching inner frames/hairlines.
- **Type scale**: one `--t-lede` token now drives hero, section and page ledes (identical measure/leading across pages).
- φ anchors: hero 1.618:1, readout place cell 1.618fr, about card 0.618:1.

### 2026-11-08 (method removed)
- User: the method section is meaningless. Removed everywhere: home section, /approach route, ApproachSteps + PipelineViz components, nav/footer/palette entries, sitemap URL; 308 /approach → /; knowledge chunk now cites /about.
- Home flow: hero → machine → work → person → contact. Section kickers renumbered; nav = Work · Machine · About · Contact.

### 2026-11-08 (work section redesign)
- Chapter cards rebuilt in the site's own voice: mono `CH·NN` index rows, ink tag with lime mono text on images, Pixel uppercase titles, hairline foot rows, ghost outlined chapter numerals, dot-grid image texture, mono uppercase status + tech chips, ink/lime active filter pills, `// index of seven builds` meta line on /work.
- Before: white cards with sans bold titles, duplicated kickers (image chip + kicker above), lime arrow pill — read as a generic template. After: instrument-index cards that belong to the Periwinkle Lab system.

### 2026-11-08 (visual refinement round)
- Golden ratio structure: `.hero-stage` 1.618fr 1fr (61.8/38.2) replacing bento spans; story quote measure 56ch.
- Type hierarchy: `--t-lede` token, Pixel display for section/page titles, `tabular-nums` for stats/tables.
- Motion: press scale 0.93–0.98, hover icon nudges, chat pop-ins, card re-settle on filter, `LoopGuard` pauses hero loops off-screen, `Reveal` below-fold 14px rise (single pass, 1.5 s safety timer).
- Touch hygiene: hover transforms disabled under `(hover: none)`; `-webkit-tap-highlight-color` transparent; palette items `mousedown`.
- Rauno pass: box-shadow focus rings, `::selection` lime, form-wrapped chat with 16 px input, font-smoothing + text-rendering, `aria-live`/`role=progressbar`, favicon prefers-color-scheme, SVG clip paths n/a, skip link verified.
- Machine AI: out-of-domain screen (≥2 corpus hits or alias), SUBJECT follow-ups, post-stream fact check (`weakAnswerCheck` for definitions), acronym cleaning, double-period fix.
- Hero CSS fix: `.bento--hero` 2-col approach broke stats grid; restructured to `.hero-stage` + 12-col `.bento`.
- Screenshots reviewed: home 1440/390, machine idle/answer, work, approach, about, contact, colophon, footer, index-strip.

### 2026-11-08 (QA + polish)
- RAG: removed project dedupe; added acronym normalisation, stopword additions, synonym map, intent reranking (definition/how/evidence), project focus aliases, evidence cap to one note.
- RAG: added `facts` to the six results chunks; prompt renders `KEY FACTS:` line and cites it verbatim; removed assistant history from prompt; follow-ups rewritten to `Project: question` in UI (`lastProjectRef`).
- Machine: mobile menu now offers "Search everywhere ⌘K".
- Layout: `data-scroll-behavior="smooth"` to satisfy Next 16.
- Build: typecheck ✓, `npm run build` ✓ (19 static pages).
- Verified client 3-up contact sheet, pipeline tabs, filters, redirects (308), sitemap (14), robots, 404.

### 2026-11-08 (earlier)
- User approved implementation. Locked domain, monogram, project set and three client projects.
- Created the knowledge wiki. Updated proposal, system plan and catalogue.
- Implementation and desktop/mobile/home/machine QA completed.
