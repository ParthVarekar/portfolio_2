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

## Machine architecture (rebuilt 2026-11-19)

The model stays Qwen2.5-0.5B in the browser — running a model well client-side is the point of the
portfolio. The rebuild moves the thinking a 0.5B model is bad at (working out *what* is asked) into
plain code, and leaves the model the job it is good at (writing a reply from a short, focused brief).

```
UI (components/machine/Machine.tsx) — wake/load, stream, stop, reset; dev-only window.__machine hook
  ├─ detection: WebGPU + shader-f16 (lib/machine/detect, useMachineSupport) → "webgpu" | "instant"
  ├─ worker: @mlc-ai/web-llm in a Web Worker (lib/machine/worker.ts)
  └─ brain: lib/brain/index.ts → plan(message, {memory, history, live, web})
       1. smalltalk.ts   greetings / thanks / who-are-you / capabilities — instant, never the model
       2. understand.ts  subject (entities.ts aliases), facet (overview/how/results/meta/problem/lesson,
                         education/experience/skills/contact/now/story/hire/list/search), follow-up
                         carry-over ("it", "tell me more"), personal-question deflection
       3. retrieve.ts    2-4 fact cards for that subject+facet (~2,600 chars); MiniSearch for "search"
       4a. about Parth → prompt.ts portfolioPrompt (persona + 5 rules; FACTS + QUESTION in the last
           user turn; previous exchange only for follow-ups) → model → clean.ts finalise
       4b. general     → model's own knowledge, or Wikipedia (web.ts) when Web is on
       no model (instant mode) → compose.ts picks the best sentences from the same cards
```

- **Knowledge** (`lib/brain/knowledge.ts`): ~80 cards. Prose from `content/knowledge.json` (entity and
  facet derived from `project` and the id suffix), plus generated cards from the same data the pages
  render: one details card per chapter from `content/projects.ts` (status, year, role, team, stack,
  links), skills from `content/resume.ts`, contact details from `content/site.ts`, "right now" and
  "how he got here" from the About page, and an other-projects list.
- **Sampling**: temperature 0.2, top_p 0.9, repetition_penalty 1.1, max_tokens 220 (300 for lists and
  comparisons), stop on `QUESTION` / `FACTS:` / `REFERENCE`.
- **Cleanup** keeps the model's words: strips echoed labels, fixes acronyms, cuts repetition loops and
  trailing fragments, and drops any sentence carrying a number not present in the facts. Only an empty
  result falls back to the composed answer.
- **Source chips**: chapter cards link to the on-site case study (same tab); other cards to their repo
  or page; Wikipedia answers to the article.

### Lifecycle

1. Mount → detect WebGPU. No network.
2. Idle → core dim, CTA "Wake the machine".
3. Click → dynamic import WebLLM, create worker engine.
4. Loading → progress, dot matrix, cancel, instant-answers option.
5. Ready → core bright, input enabled, suggestions.
6. Ask → `plan()` (small talk → understand → cards) → stream from the model → `finish()` → sources.
7. Error → retry or instant answers. Never crash.

### Model

- `Qwen2.5-0.5B-Instruct-q4f16_1-MLC` (prebuilt in web-llm's config).
- ~265 MB download, ~945 MB VRAM, 4K context. No custom record — see `lib/machine/model.ts`.
- Worker keeps UI responsive.
- Cache API; returning visitors load in a few seconds.
- No chat persistence.

### Privacy

- No analytics, no cookies, no chat storage.
- Default: the only request beyond the page is the explicit model download.
- Web mode (opt-in globe toggle, default off): only a general (non-Parth) question goes to Wikipedia (stopword-stripped core, UK→US map, ≥2-token overlap or trailing entity, extract must carry the question's subject vocabulary); answers cite the page. Off = the machine never touches the network.
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
components/hero/     HeroBento, WindmillViewer, Readout, DotMatrix
components/machine/  Machine.tsx (chat UI, worker, loader, instant mode), MachineStatus
components/work/     WorkGrid, Visuals, ChapterCard
components/method/   AboutCard, ContactCard
lib/machine/         types, detect, model id, worker, useMachineSupport
lib/brain/           the chat brain: entities, knowledge, understand, retrieve, prompt, clean, compose, smalltalk, web
content/             knowledge.json (69 prose chunks), projects.ts, resume.ts, site.ts
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
