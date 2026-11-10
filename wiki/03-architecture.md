# 03 — Architecture

## Stack

- Next.js 16 App Router, React 19, TypeScript.
- Tailwind CSS 4 + custom CSS tokens.
- `motion` (Framer Motion) for UI motion; CSS for the core.
- `geist` npm package for Geist Sans, Geist Pixel Square, Geist Mono.
- `@mlc-ai/web-llm` 0.2.87 for local inference.
- `minisearch` for lexical retrieval.
- No backend, no database, no CMS, no analytics, no cookies.

## Routes

```
/                  Home
/machine           Full-screen machine
/work              Chapter index
/work/[slug]       Case study (7 chapters)
/about             Person
/contact           Contact
/colophon          Stack, privacy, accessibility
/approach          → 308 redirect to /
```

## Machine architecture

```
UI (React state in components/machine/Machine.tsx)
  ├─ detection: WebGPU adapter (lib/machine/useMachineSupport)
  ├─ worker: @mlc-ai/web-llm (Web Worker, MLC engine)
  │    ├─ init SmolLM2-135M-Instruct-q4f16_1-MLC
  │    ├─ stream tokens
  │    └─ interrupt / reset
  └─ retrieval: MiniSearch over content/knowledge.json (lib/rag)
       ├─ intent-aware rerank (definition | how | evidence | general)
       ├─ project focus from aliases and pronoun follow-ups
       ├─ evidence questions capped to the single best note
       ├─ KEY FACTS line appended from curated per-note facts
       └─ refusal when no note matches
```

### Lifecycle

1. Mount → detect WebGPU. No network.
2. Idle → core dim, CTA "Wake the machine".
3. Click → dynamic import WebLLM, create worker engine.
4. Loading → progress, dot matrix, cancel, demo option.
5. Ready → core bright, input enabled, suggestions.
6. Ask → follow-up rewrite → retrieve → build prompt → stream answer, show sources.
7. Error → retry or demo mode. Never crash.

### Model

- `SmolLM2-135M-Instruct-q4f16_1-MLC`.
- ~78 MB download, ~100 MB VRAM, 4K context. Custom model record — see `lib/machine/model.ts`.
- Worker keeps UI responsive.
- Cache API; returning visitors load in a few seconds.
- No chat persistence.

### Retrieval

- `content/knowledge.json`: 45 curated chunks with `id`, `title`, `project`, `source`, `url`, `tags`, `text` and — for results chunks — a `facts` line.
- MiniSearch fields: `title`, `text`, `project`, `tags`; boosts: title 2.2, project 2, tags 1.5; fuzzy 0.2, prefix, OR.
- Acronym normalisation (`H.A.L.O` → `halo`), stopwords, synonym map, threshold 0.8.
- Intent detection multiplies scores (best note per intent); explicit project aliases restrict results to that project.
- Evidence intent returns one note (the results chunk); other intents return three.
- Source chips under each answer; project-focused follow-ups work without chat history.

### Prompt

- System: local guide; answer only from the notes; cite KEY FACTS verbatim when present; refuse exactly with the canonical sentence; never invent metrics/roles.
- User message carries the notes (with `KEY FACTS:` on results chunks) and the question; there is no assistant history. Follow-ups are rewritten to `Project: question` in the UI before retrieval.
- Settings: temperature 0.2, top_p 0.9, max_tokens 160, repetition penalty 1.1.

### Demo mode

- `content/demo-answers.json` with 12 Q&A/source triples.
- Punctuation/acronym-insensitive keyword matching; typing effect.
- Badge: "Demo ready" / "Model not loaded." Never presented as live inference.

### Privacy

- No analytics, no cookies, no chat storage.
- Only network request is the opt-in model download.
- Fonts self-hosted.
- Colophon states this.

## Content model

`content/projects.ts` — typed project data:

```ts
type Project = {
  slug, chapter, title, subtitle, status, role, year,
  stack: string[], metric: string, repo?: string, live?: string,
  accent: "blue" | "lime",
  summary, problem, decision, build, evidence: string[],
  learned, images: { src, alt, caption }[],
  sections: { title, body: string[] }[],
  next?: string
}
```

Case studies are rendered by a generic template, not MDX. This keeps the design consistent and avoids an MDX toolchain.

## File map

```
app/                 routes, layout (data-scroll-behavior), globals, fonts, sitemap, robots, icon.svg
components/shell/    NavPill, Footer, CommandPalette
components/hero/     HeroBento, DotMatrix
components/machine/  Machine.tsx (chat, worker, loader, demo)
components/work/     WorkGrid, Visuals, ChapterCard
components/method/   AboutCard, ContactCard
lib/machine/         types, demo match, useMachineSupport
lib/rag/             index.ts, prompt.ts
content/             knowledge.json (45 chunks), demo-answers.json (12), projects.ts, site.ts
public/images/work/  real project screenshots, optimised
wiki/                durable project memory
docs/                proposal, system plan, reference
data/                catalogue + selection
shots/               QA screenshots
```

## Build commands

```
npm run dev
npm run build
npm run start
npm run typecheck
```
