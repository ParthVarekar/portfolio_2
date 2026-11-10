# 01 — Research

## Identity

- Parth Varekar, Mumbai.
- B.Tech Computer Engineering, K.C. College of Engineering, Mumbai University, 2024–2028.
- Imarticus Learning data-science internship, 120 hours, A+.
- Full-Stack Java certification, EduSkills, A+.
- SIH26174 H.A.L.O; SIH25042 BioRadar; SIH26169 COSTA; CodeByte 2.0 Credence; Team Odyssey RoboForge.
- Old portfolio: `https://parthvarekar.in` (identity corroborated; LinkedIn returned HTTP 999 during research).

## Selected repositories (verified 2026-11-08)

| Project | Repo | Key evidence |
|---|---|---|
| H.A.L.O | https://github.com/ParthVarekar/H.A.L.O | 276 tests; 8/8 verification; mAP50 0.79; 9 Qwen3-VL questions ~0.6s; 8/8 steps, 0 false alerts; signed 1 KB downlink report |
| Susurrus | https://github.com/ParthVarekar/Susurrus | 77/77 tests; zero cloud; Qwen3-ASR + Gemma/llama.cpp; ~1.2 GB disk, ~2.5 GB RAM; live site |
| Chumps Lab Studio | https://github.com/ParthVarekar/chumps-lab-studio | 26/26 browser e2e; typed Edit Decision Document; Remotion; local models; in progress |
| BioRadar | https://github.com/omtawde09/BioRadar | 80/80 detections, 0 false positives; 76 tests; 33,611 sequences / 8,020 species; Merkle ledger; caught mislabelled NCBI record; README credits Parth |
| COSTA | https://github.com/ishwar-prog/COSTA | 28/28 cases pass six targets; 0.83–1.60 s acquisition; 0.02–3.28 px error; real footage 94–100% lock; 30 Hz vision / 60 Hz control |
| RoboForge | https://github.com/college-hack24-nov26/hack-odyssey | 900+ tests; RF-DETR 92% precision / 85% recall; MuJoCo + Webots; ESP32 firmware; archived Nov 2026 |
| TheArtEvents | https://github.com/ProtoVinci/TheArtEvents | Live at https://theartevents.vercel.app; HTML/CSS/JS event décor studio site |
| SocialxBrand Pilot | https://github.com/ProtoVinci/SocialxBrand_Pilot | Live at https://www.socialxbrandpilot.com; Next.js 16, React 19, GSAP 3.15, Tailwind 4; 94 tests; 18 services; real client reels |
| Gully Culture | https://gullyculture.vercel.app/index.html | Live thrifted jersey/streetwear storefront; Instagram DM ordering; responsive HTML/CSS/JS |

## In-browser LLM research

- WebLLM `@mlc-ai/web-llm` 0.2.87 is current (Nov 2026). WebGPU only, OpenAI-shaped chat API, Web Worker support.
- `SmolLM2-135M-Instruct-q4f16_1-MLC`: ~78 MB total (72 MB weights + ~6 MB WebGPU lib); context 4,096 (overridden); `required_features: ["shader-f16"]` — GPUs without f16 shaders fall back to demo mode. Not in WebLLM's prebuilt config; merged in as a custom model record (`lib/machine/model.ts`, Apache 2.0, mlc-ai CDN).
- Browser support: Chrome/Edge 113+, Firefox 141+ on Windows, Safari 26+/iOS 26+ with WebGPU.
- First load: roughly 10–45 s on typical broadband, 1–3 s from cache. Generation is fast for short answers.
- 0.5B quality is limited; retrieval grounding, short answers, source chips and a refusal line are required.
- A second embedding model would add ~25–30 MB and latency. At ~40 chunks, lexical BM25 is better.
- WebLLM's Cache API usage is browser-managed; cache may be evicted.
- No cross-origin isolation is required for WebGPU inference in current WebLLM.

## Design reference

User-supplied image saved at `docs/reference/theme-reference.png`.

Sampled palette:

- Canvas `#C8D1E1` (periwinkle).
- Card `#FFFFFF`.
- Lime `#DBEE4D`.
- Blue `#589CFF`.
- Ink `#101218`.

Visual language to borrow: soft rounded cards, pill controls, dot-matrix motif, blue feature panel, generous whitespace, friendly premium feel. Do not copy the dashboard layout, the portrait photo, or any asset.

## Typography research

- Geist Sans, Geist Mono and Geist Pixel are available in the `geist` npm package (v1.9.2) under OFL 1.1.
- Geist Pixel Square is imported from `geist/font/pixel/square`; CSS variable `--font-geist-pixel-square`.
- Geist Pixel is a display face. Use at 24px and above; never body copy.
- Geist Sans is the body/UI face. Geist Mono is for code snippets only.
- Self-host via npm; no Google Fonts request.

## Domain

- `parthvarekar.in` remains canonical. Redirect `www.parthvarekar.in` and old routes to it.
- No new domain.
