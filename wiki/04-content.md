# 04 — Content

## Voice

- First person, specific, calm. No hype words ("revolutionary", "seamless", "cutting-edge").
- Lead with the problem and the decision, then evidence.
- Short sentences. Concrete nouns. Numbers where they are real.
- No invented metrics, dates, roles, awards or clients.
- For collaborative projects, use "we" where appropriate; never claim sole authorship of a team repo.
- Client work: "Built at ProtoVinci" in meta; first person for the build story.

## Chapter copy

### 01 — H.A.L.O
- Subtitle: "A ground controller for the station."
- Summary: An on-board AI that watches a science procedure in orbit and speaks up when a step is skipped or out of order — offline, on one laptop GPU.
- Problem: A skipped step, like a tray left out of a −80 °C freezer, can cost a sample that took months to prepare.
- Decision: Model the procedure as a deterministic state machine over visual evidence, not as a video classifier.
- Build: YOLO11 trained on real ISS footage; Qwen3-VL answers plain-English questions; sliding-window evidence; signed hash-chained log; H.264 UDP stream.
- Evidence: mAP50 0.79; nine visual questions in ~0.6 s; 8/8 steps in order; 0 false alerts; 276 tests; 8/8 verification; 1 KB downlink report.
- Learned: "A procedure is a state machine, not a video. Once I modelled it that way, the alerts became explainable."

### 02 — Susurrus
- Subtitle: "Your voice never leaves the machine."
- Summary: Offline push-to-talk dictation for Windows. Speak, release, get clean text in any app. No cloud, no subscription.
- Problem: Cloud dictation sends audio away and charges monthly; raw ASR is messy.
- Decision: Split hearing and editing into two local models; paste via Win32 SendInput; command mode rewrites selected text.
- Evidence: 77/77 tests across 8 modules; ~1.2 GB disk, ~2.5 GB RAM; zero cloud calls; live landing page.
- Learned: "The second model is what makes it feel like writing instead of transcription."

### 03 — Chumps Lab Studio
- Subtitle: "An editor that edits with you."
- Summary: An AI video editor for screen-recording tutorials. It auto-edits raw recordings, then hands you a real editor and an assistant.
- Problem: Tutorial editing is repetitive; AI editors are black boxes.
- Decision: The AI writes a typed Edit Decision Document, never code; every AI change is a draft you can apply or discard; locked edits survive re-planning.
- Evidence: 26/26 browser e2e; typed command layer; Remotion renderer at −14 LUFS; AI-designed animated elements via a safe spec.
- Learned: "The interface between AI and editor has to be inspectable. A typed document is that interface."

### 04 — BioRadar
- Subtitle: "From one litre of water."
- Summary: Turns raw eDNA reads into a species list, invasion forecast and tamper-evident record — in English or Hindi.
- Problem: Millions of short reads; decision-makers need an answer, not a FASTA file.
- Decision: A frozen data contract, an India-curated COI reference, a Merkle ledger and 14 intelligence engines.
- Evidence: 80/80 detections at exact read counts, 0 false positives; 76 tests; 33,611 sequences / 8,020 species; caught a mislabelled NCBI record.
- Learned: "The hard part isn't the pipeline; it's making the result trustworthy enough to act on."

### 05 — COSTA
- Subtitle: "It finds the beacon by how it blinks."
- Summary: Coarse pointing, acquisition and tracking for a free-space optical link. It finds the partner terminal's beacon among stars, street lights and decoys by how it blinks, not how bright it is.
- Problem: A laser link needs the beacon centred before data can flow; the sky is full of brighter lights.
- Decision: Blink-signature Fourier identification + geometry + a Kalman tracker; no training data; drives a pan/tilt gimbal.
- Evidence: 28/28 cases pass all six targets; 0.83–1.60 s acquisition; 0.02–3.28 px error; real footage 94–100% lock; 30 Hz vision / 60 Hz control.
- Learned: "Brightness is the one thing the partner doesn't control. Rhythm is."

### 06 — RoboForge
- Subtitle: "Tell it, simulate it, test it against reality."
- Summary: A chat-first machine builder: describe a rover, it designs it, simulates it, then checks the real one against the simulation and diagnoses the gap.
- Problem: Simulation never matches the real machine; motors differ.
- Decision: A reality-gap engine using gyro measurements; a deterministic router; AI only for new jobs; every result says what was not tested.
- Evidence: 900+ tests without Webots/hardware; RF-DETR 92% precision / 85% recall; 16/16 planted defects; firmware v2.
- Learned: "The gap between simulation and reality is data, not a failure."

### 07 — Client work
- Subtitle: "Real briefs, shipped."
- Summary: Three live client builds: an art events brand, a motion-led marketing agency, and a thrifted streetwear storefront.
- TheArtEvents: celebration décor studio site; palette-led portfolio, occasion filters, enquiry flow; live at theartevents.vercel.app.
- SocialxBrand Pilot: motion-led site for an Indian digital marketing agency; real client reels in the headline; 18 services; 94 tests; Next.js 16, GSAP, Tailwind 4; live at socialxbrandpilot.com.
- Gully Culture: thrifted jerseys and streetwear storefront; Instagram DM ordering; responsive; live at gullyculture.vercel.app.
- Evidence: three live sites; SocialxBrand 94 tests; Gully Culture's live storefront.
- Learned: "Client work is where you learn to make the work legible to someone who isn't in the room."

## Links

- H.A.L.O: https://github.com/ParthVarekar/H.A.L.O
- Susurrus: https://github.com/ParthVarekar/Susurrus · https://susurrus-xi.vercel.app
- Chumps Lab: https://github.com/ParthVarekar/chumps-lab-studio
- BioRadar: https://github.com/omtawde09/BioRadar
- COSTA: https://github.com/ishwar-prog/COSTA
- RoboForge: https://github.com/college-hack24-nov26/hack-odyssey
- TheArtEvents: https://theartevents.vercel.app
- SocialxBrand: https://www.socialxbrandpilot.com
- Gully Culture: https://gullyculture.vercel.app/index.html
- GitHub: https://github.com/ParthVarekar
- LinkedIn: https://www.linkedin.com/in/parth-varekar-601432344
- Email: parthvarekar27@gmail.com

## Image sources

Repo assets via `raw.githubusercontent.com`:

- H.A.L.O: `docs/assets/demo.webp`, `docs/assets/dashboard-live.jpg`, `docs/assets/architecture-light.png`, `docs/assets/intro.webp`
- Susurrus: `docs/assets/intro.gif`, `docs/assets/banner.svg`
- Chumps Lab: `docs/assets/showcase.webp`, `docs/assets/editor-demo.webp`, `docs/assets/shot-editor.jpg`, `docs/assets/shot-assistant.jpg`
- BioRadar: `docs/assets/intro.gif`, `docs/assets/banner.svg`
- COSTA: `docs/assets/demo.webp`, `docs/assets/live-tracking.jpg`, `docs/assets/analytics.jpg`, `docs/assets/architecture-light.png`
- RoboForge: `docs/media/chat.gif`, `docs/media/rover-loop.gif`, `docs/media/banner.png`
- Client work: screenshots to be captured from the live sites.
