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

### 2026-11-08 (nav material + snappier motion)
- Nav pill given a real material: top-lit grey gradient (white → cool grey), ink-tinted border with inner highlight lines, deeper duotone shadow — now distinct against both the periwinkle canvas and white cards in both expanded and collapsed (PV seal) states.
- Fold choreography tightened: collapse at 110px (was 150), re-expand delta 60px (was 80), springs at 380–460 stiffness / 21–30 damping, stagger 0.022–0.03, exit timings 0.11–0.14s — links vanish and return noticeably quicker without snapping.

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
