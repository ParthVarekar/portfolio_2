# 00 — Context

## Person

**Parth Varekar** — Mumbai, India.
B.Tech Computer Engineering, K.C. College of Engineering, Mumbai University, class of 2028.
Data-science internship at Imarticus Learning (120 hours, A+). Full-Stack Java certification (EduSkills, A+).
Hackathons: SIH26174 (H.A.L.O), SIH25042 (BioRadar), SIH26169 (COSTA), CodeByte 2.0 (Credence), Team Odyssey (RoboForge).
Contact: `parthvarekar27@gmail.com`, `+91 7400082627`.
GitHub: https://github.com/ParthVarekar
LinkedIn: https://www.linkedin.com/in/parth-varekar-601432344
Canonical domain: `parthvarekar.in` (redirect from `www` and old routes).

## Brief

Create an exceptionally designed personal portfolio that is:

- personal, original, visually exceptional and conceptually cohesive;
- technically credible and evidence-based — no invented metrics or roles;
- responsive, fast, accessible and maintainable;
- free of placeholder text and broken links;
- built in `C:\Users\Parth\Desktop\portfolio_deepseek` only.

Workflow: research → proposal → explicit approval → implementation. Approval was given on 2026-11-08.

## The approved concept

**The Living Instrument.** A light, periwinkle bento portfolio whose centrepiece is a real 0.5B language model running in the visitor's browser. The page is an instrument you can wake: the hero shows it idle, the machine section lets you load and talk to it, the work section is the evidence, and the method section closes the story.

Tagline: **THIS PAGE RUNS A MACHINE.**
Sub: *"A real language model, inside your browser. Ask it about the systems I build. Nothing leaves your device."*

## Locked decisions

- **Model:** Qwen2.5-0.5B-Instruct-q4f16_1-MLC via WebLLM, WebGPU, Web Worker. ~265 MB, ~945 MB VRAM, 4K context. Prebuilt in web-llm's config — no custom record (`lib/machine/model.ts`). No model picker. Knowledge: 69 curated chunks with lexical retrieval and noise blocklist; opt-in Web mode (Wikipedia, default off); deterministic small talk layer.
- **Retrieval:** lexical BM25 / MiniSearch over ~40 curated chunks. No embedding model, no second download.
- **Theme:** "Periwinkle Lab" — canvas `#C8D1E1`, white cards, lime `#DBEE4D`, blue `#589CFF`, ink `#101218`.
- **Type:** Geist Sans body/UI; Geist Pixel Square for display/headings/chapter numbers; Geist Mono for code only.
- **Analytics:** none. No cookies, no chat persistence.
- **Domain:** `parthvarekar.in` canonical; 301 from `www` and old routes.
- **Projects:** exactly seven chapters:
  1. H.A.L.O
  2. Susurrus
  3. Chumps Lab Studio
  4. BioRadar
  5. COSTA
  6. RoboForge
  7. Client work — TheArtEvents, SocialxBrand Pilot, Gully Culture (only these three)
- **Portrait:** lime `PV` monogram tile for now; a real photo can be added later.
- **Contributions:** Parth has approved presenting the selected projects as his own work. H.A.L.O, Susurrus and Chumps Lab are owned. BioRadar, COSTA and RoboForge are collaborative; copy uses first person plural where appropriate. Client work is presented as work built at ProtoVinci, without diminishing Parth's role.

## Non-negotiables

- The model must never auto-download. It loads only after an explicit click, with size disclosure and cancel.
- Unsupported browsers get an instant answering system over the curated notes (no model), never a fake live model. Unlabeled “demo mode” (12 canned answers) was retired 2026-11-17.
- The site must be excellent without the model.
- Every claim in project copy must trace to a repository, README, live site, or Parth's direct statement.
- `prefers-reduced-motion` is respected everywhere.
- No placeholder text, no dead links, no console errors.
