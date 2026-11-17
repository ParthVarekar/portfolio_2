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

### 2026-11-17 (every hash anchor and scroll-jump removed)
- The user asked for the "wake the machine" tap to stop jumping the page to the top, and for **no anchor to any section anywhere in the site**.
- Root cause of the wake-button jump: programmatic focus moved into the freshly-mounted face, and the browser scrolls to reveal a focused element — softened into a glide by `html { scroll-behavior: smooth }` and `scroll-padding-top: 110px`.
- Fixes, site-wide:
  - `html`: `scroll-behavior: smooth` and `scroll-padding-top` deleted; `data-scroll-behavior="smooth"` on `<html>` deleted; the `scroll-behavior: auto` override in the reduced-motion block became redundant and went too. `overscroll-behavior: contain` on the chat panel stays — that is scroll containment, not an anchor.
  - All programmatic `.focus()` calls now pass `{ preventScroll: true }` (hero open/close, machine input ×2, command palette input).
  - **Hero "Read the work"** `href="#work"` → `href="/work"`.
  - **Footer "Back to top"** (`href="#main"`) deleted.
  - **"How it works"** links (`/colophon#machine`, in the machine rail and on /machine) → `/colophon`.
  - **Skip link** (`href="#main"`) and its CSS deleted — the user said no anchors anywhere; this one costs keyboard/screen-reader users the one-key jump past the nav. A focus-without-scroll alternative exists if wanted.
  - `<main id="main">` keeps its landmark id.
- Verified: scroll tracer attached across open → Escape → open — zero scroll events, `scrollY` constant, zero `a[href*="#"]` in the rendered DOM, no console errors, all routes 200.

### 2026-11-17 (the machine lives inside the hero card — the real merge)
- The user's actual ask: the white **"This page runs a machine."** card turns into the chat on click — no second panel appears below the hero. The previous bottom-dock version did exactly that and was wrong.
- The hero card now has two **faces**: a welcome face (eyebrow / title / sub / CTAs / foot) and a **machine face** (a slim "Hide the machine" chip + the chat). One click flips the card; the windmill card keeps acting as a live gauge (`Idle → Waking → Ready`, 55 pips).
- `Machine` gained `compact` (rail + three note cards dropped; chat fills the card) in addition to `embedded`. `/machine` page renders exactly as before.
- The chat panel mounts **once** (first click only, so 78 MB never loads unasked) and is hidden, never unmounted, afterwards — model, conversation and scroll position all persist across toggles. Escape and the chip toggle it; `aria-expanded`/`aria-controls` wired both ways.
- Focus management lives in one effect, not in the click handler: on open, focus lands on the hide-chip; on close, it returns to the wake button. Focusing a `display:none` element is a no-op, so both must happen post-commit with a timeout — the earlier rAF-in-handler approach silently dropped focus.
- The close chip sits in a normal-flow toolbar row above the panel, never overlapping the panel title or the pills (verified at 1440 and 375 — no overlap, no overflow).
- `overflow-anchor: none` on the faces so removing the focused element doesn't trigger a scroll jump.
- Found while testing: programmatic scrolls are swallowed on this page (`scroll-behavior: smooth`), wheel/keyboard work fine. And the **nav collapses on scroll by design** (`COLLAPSE_AFTER = 110`) — not a bug.
- Headless quirk: fullPage screenshots paint fixed elements (nav pill, skip link) inside the captured page. Viewport screenshots are honest; crops of fullPage are only suitable for static content.

### 2026-11-17 (the machine folded into the hero)
- The standalone **Wake it up.** section is gone from the home page. **This page runs a machine.** is now the only machine surface: one click on **Wake the machine** mounts the chat dock inside the hero section, the model starts downloading on the spot, and the chat is already waking when it arrives.
- Mounting is lazy (first click only, so 78 MB never loads unasked) and idempotent: the dock is hidden, never unmounted, so the machine (and the conversation in it) survives repeated Hide/Wake cycles. Escape and the button toggle it; `aria-expanded`/`aria-controls` wire the button to the dock.
- The windmill card is now a live gauge for the chat beneath it: it flips from `The machine · Idle` to `Waking` to `Ready` with the download percentage in the status line and a dot matrix that fills with the model's progress (55 pips). Phase and progress are reported up through optional `onPhaseChange`/`onProgress` props — zero new state machines.
- The scroll-jump dance was investigated and dropped: the page's `scroll-behavior: smooth` made every non-user scrollInert in this environment, and programmatic scrolls landed inconsistently anyway. The dock lands via `scrollIntoView({ behavior: "instant" })`, which is deterministic everywhere and was verified to land the dock exactly at `scroll-padding-top: 110px` on desktop and mobile.
- `Machine` gained `embedded` (renders the panel in a plain wrapper, keeping the standalone `/machine` page untouched), `autoWake` (kicks `wake()` once WebGPU support resolves), and the phase/progress callbacks.
- WebLLM's caches were wiped for testing and will re-download on the user's next visit, as they would on any first visit.

### 2026-11-17 (work folders fanned out)
- Each of the four work folders now carries **three real images from the project itself** — a huge upgrade from the tinted placeholder sheets:
  - H.A.L.O — dashboard, answers panel, architecture diagram.
  - Susurrus — live-site hero screenshot, the Dictation Studio and Context Command Sandbox cards (cropped from his full-page capture, `susurrus-live.jpg`, `susurrus-dictation.jpg`, `susurrus-context.jpg`). No purple title cards anywhere; they were AI-ish banners.
  - BioRadar — aerial estuary (his landing page hero), Mandovi estuary and Kolleru Lake storks (real photos from his repo, `bioradar-estuary.jpg`, `bioradar-mandovi.jpg`, `bioradar-kolleru.jpg`). No koala, obviously.
  - Client Work — TheArtEvents, Gully Culture and SocialxBrand Pilot.
- The folder is smaller (220px cap, 16:11 photo, tighter caption type), the sheets splay visibly past the edges (`translate(±31px) rotate(∓6.4/3.5deg)` at rest; ±44px on hover), and mobile tucks the stack in to fit its narrower gutters.
- Captions reserve two lines so every folder ends level at any width.
- Layout root cause noted: the page's `scroll-behavior: smooth` means `scrollIntoView({behavior: "auto"})` and plain `scrollTo()` do **nothing** without a user gesture; only `behavior: "instant"`, or a wheel/keyboard gesture, scrolls. It does not affect human browsing (smooth animation) but any future code that scrolls programmatically must use `"instant"`.

### 2026-11-16 (the work becomes an index, not a wall)
- The home page no longer carries the seven full chapter cards. It shows **four decks** — H.A.L.O, Susurrus, BioRadar, Client Work — and a link to `/work`, where all seven still live with their filters. Nav → Work is unchanged, so nothing became unreachable.
- The deck is one object: a tinted sheet at the back, a pale one in the middle, then the screenshot in a white mat with `CH·0n`, the title and the one-line subtitle **printed inside the mat**. The caption used to float over the ASCII field and was hard to read; folding it into the card fixed that and made the stack read as a specimen pulled from a drawer.
- Sheets rest at `translate(±10px) rotate(∓4.4/2.8deg) scale(.965/.98)`; on hover they spread 6px further and the mat lifts 4px over 200 ms. Under `prefers-reduced-motion` the stack keeps its pose and nothing moves.
- The section went from four rows of cards to **one row**, about 712px including its head.
- Captions reserve two lines (`min-height: 2.8em` + clamp) so every deck in a row ends level at any width.
- Each tile's accessible name is explicit — `Chapter 01: H.A.L.O — A ground controller for the station.` — because the spans would otherwise run together; the deck itself is `aria-hidden`.

### 2026-11-16 (the about section leads)
- The home page now opens with **The person**, then the hero, the machine, the work and contact. Only the order changed — no section was restyled.
- The about section took the class `section--lead` (`padding-top: clamp(112px, 14vw, 150px)`) so it clears the fixed nav, which the hero used to do with its own top padding. Measured: nav bottom 76 / label top 150 at 1440, 66 / 98 at 375.
- The hero keeps its original padding, so the seam between the two is 217px at 1440 — a normal section break.
- Open: the label still reads **IV — The person** while sitting first. Renumbering is a three-word edit if wanted.

### 2026-11-16 (the fish, rebuilt as halftone silhouettes)
- User reference: a fish rendered entirely in ASCII, the body a solid mass of strokes that dithers out toward the edge, with the eye punched out as a hole. The earlier hand-authored glyph sprites read as scribbles, so the fish became **geometry**, not text.
- **Body**: a teardrop — blunt at the tail root (0.34 of full height), widest a little forward of the middle, tapering to a point at the nose. Profile `base + (1−base)·(4t(1−t))^0.42`.
- **Fluke**: a convex trapezoid with a narrow neck (0.2 of the body height) that widens to 0.98 at the tip, so there is a visible **waist** between tail and body. Signed distance via point-in-polygon + nearest edge.
- **Eye**: a hole — cells inside it are never drawn, so the eye is the paper showing through the body.
- **Halftone**: every cell's density is compared against a **4×4 Bayer matrix**, so the body is solid in the middle and stipples out over ~1.2 cells at the edge. Deterministic — the fish never flicker.
- **Strokes**: the body is vertical bars (`|`, with `!` for texture); the dithered flanks pick up `/` and `\`, matching the contour vocabulary of the waves.
- Two sizes: small 23×9 cells, big 35×13 cells. Colours: small `rgb(22,92,164)` cyan, big `rgb(58,128,182)` pale — both a step bluer than the neutral wave ink. A fish per ~200 px of width plus one big fish per ~700 px.
- The silhouette was tuned by rendering it as plain text offline (`fishDensity` + Bayer printed to the console) rather than by eye in the browser — four iterations were needed before the fluke stopped merging into the body.

### 2026-11-16 (a school in the waves)
- User idea: the waving ASCII had produced accidental shapes, so why not put small swimming ASCII fish in it — in a slightly different colour, and where a fish overlaps a wave the fish keeps its colour so it reads as being seen *through* the water.
- **Sprites**: a small fish ` ,__ / <( O > / ` `--' `, a broader one ` ,-----. / <(   O   > / '-----' `, and a jellyfish ` .-. / ( o ) / (   ) / \_/ `. All mirrored when heading left (`<`↔`>`, `(`↔`)`, `'`↔`` ` ``).
- **Colour**: the waves are neutral ink (r, g×1.03, b×1.16); the creatures are a step bluer — fish `rgb(22,68,146)`, jellyfish `rgb(24,92,124)` at 0.92 alpha, drawn at weight 700. Identifiable without leaving the palette.
- **Priority**: a creature cell is drawn *instead of* the wave glyph, then the wave glyph is re-drawn over it at 0.14 alpha — so the water passes back across the fish and it sits under the surface rather than on top of it.
- **Motion**: fish swim at 13–39 px/s (× scale) and wrap around the edges, bobbing on a per-fish sine with a slow independent vertical drift; jellyfish drift at 5–14 px/s. The school is stocked by width (a fish per ~165 px, a jelly per ~560 px) and seeded, so it looks the same on every visit.
- Verified: creatures paint in a distinct blue (385–505 strongly blue pixels vs ~130k neutral), and 283 of 287 creature pixels had moved to new positions 900 ms later.

### 2026-11-16 (ASCII backdrop — second pass)
- User feedback: too dense, the hover change was invisible, and the wave gradient could not be read. Three fixes.
- **Density down**: cell 6×7.4 → 7.2×8.8 px, and cells below `EMPTY_BELOW` (0.11) are left as bare paper so the thin parts of the wave actually clear out. Canvas coverage 25.7 % → **15.0 %**.
- **Gradient now legible**: the wave frequencies were halved (3.1/1.9 → 1.5/0.9 and −1.7/3.4 → −0.85/1.7) so it sweeps broad bands instead of a fine plaid, and the density curve got a ×1.72 contrast push. The tone range widened — luminance 198 (thin) → 44 (dense) at alpha 0.20 → 0.95 — so density and tone rise together and the band reads as a gradient. A 16×8 tile map of the field shows the diagonal banding directly.
- **Hover trail**: every pointer sample is kept in a ring buffer (18 samples, 620 ms) and each cell takes the strongest lobe that reaches it, so the cursor drags a fading comet. Measured on a swept path: glyphs on the path average luminance **149.3** vs **126.5** beside it.
- The tone lift was also fixed: previously hover only dropped alpha by 18 %, which was invisible against a busy field. Now a hovered glyph lifts up to 104 luminance toward the paper (capped at 214 so it never vanishes) *and* steps up a band into a heavier character.

### 2026-11-11 (ASCII backdrop)
- User direction: an ASCII field as the page background — contour-aware glyphs, a travelling density wave, hover that only changes *tone*, and roughly double the density of the first pass. It must never appear inside a card.
- `components/shell/AsciiField.tsx` — one fixed canvas behind `main`, so it sits under the content and the opaque cards (`--surface` white) hide it completely.
- **Density** is a field, not a constant: two sine waves cross at an angle and sweep bands of busy and empty across the page, so the field keeps changing and never settles. Measured: 95.6 % of painted cells change between two frames 700 ms apart.
- **Contour glyphs** come from the local slope of that field — `/` on the rising flank, `\` on the falling one, `|` / `!` / `i` / `l` on steep edges, `~` in the troughs, `o` (with `0 # @` as siblings) on the broad plateaus, and `. , ' \` "` for the thin gaps. `+ = *` carry the mid-weights.
- **Tone** is a mix toward the site ink, never a different hue: luminance 172 (thin) → 58 (dense) at alpha 0.26 → 0.86 over the periwinkle canvas (lum 207). Measured mean glyph luminance 119 — a tone darker than the paper, not ink-black.
- **Hover** lifts a glyph toward the canvas (`HOVER_LIFT`) *and* steps it up a band so a heavier character takes its place (`HOVER_BAND`), so the cursor reads as brighter and more present without any colour change. Measured: glyphs within 90 px average lum 127.9 vs 117.0 further out.
- **Density doubled**: the margin strip went from 10.1 % → 24.8 % alpha coverage, with the cell shrunk 6.6×8.4 → 6×7.4 px and the vignette softened (0.85 → 0.38) so the edges carry their own texture.
- **Cost is flat**: the density field is evaluated on a coarse grid (every 6 cells) and interpolated, so the per-frame work does not grow with the cell count. Idle repaint is 12 fps; the wave is slow enough that it reads continuous.
- `prefers-reduced-motion` renders one static frame — verified 99.8 % identical pixels 700 ms apart — and the pointer listeners are never attached.

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
