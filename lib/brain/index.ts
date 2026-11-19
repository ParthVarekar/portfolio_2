/**
 * The machine's brain: one call that turns a visitor's message into either a
 * finished reply or a ready-to-run model request.
 *
 *   message → reflexes   maths, the clock, live data, tricks, harm, gibberish
 *           → small talk greetings, thanks, "who are you"
 *           → understand subject, facet, follow-up
 *           → about Parth? 1-4 fact cards → model (or composer)
 *           → general?    Wikidata fact (exact, no model) / Wikipedia passage
 *                         → model; or the model's memory, flagged as such
 *
 * The UI streams the model, previews it with `preview`, then hands the raw
 * text back to `finish`.
 */

import type { Source } from "@/lib/machine/types";
import { clampSources, sourcesOf } from "./sources";
import { finalise, finaliseCreative, tidy, withDetail } from "./clean";
import { composeAnswer, EMAIL, generalWithoutModel, PERSONAL_REPLY } from "./compose";
import {
  generalPrompt,
  portfolioPrompt,
  samplingFor,
  type GeneralMode,
  type PromptMessage,
  type Turn,
} from "./prompt";
import { reflex } from "./reflexes";
import { selectCards } from "./retrieve";
import { smallTalk } from "./smalltalk";
import { understand, type Memory } from "./understand";
import { webLookup } from "./web";

export type { Memory } from "./understand";
export type { Turn } from "./prompt";

export const freshMemory = (): Memory => ({ focus: null, shown: [] });

/**
 * Answered straight from the cards even with the model awake: lists the
 * model would drop or repeat items from, and "why hire him", where an
 * invented claim costs the most.
 */
const DIRECT = new Set(["list", "contact", "skills", "hire", "role"]);

/** Longer than this and it's a paste, not a question — read the start. */
const MAX_QUESTION = 600;

/** A claim about the world that can be right or wrong. */
const FACTUAL =
  /^(who|whom|whose|when|where|which)\b|^how (many|much|old|tall|far|long|big|high|deep|fast|large)\b|\b(ceo|president|prime minister|capital|population|founder|founded|invented|inventor|born|died|won|winner|richest|tallest|largest|biggest|smallest|price|cost|net worth|elected|leader|owner|owns|author|wrote|directed|record|distance|height|year)\b/i;

/** "write me a poem", "tell me a joke", "code to reverse a string" */
const CREATIVE =
  /^(please )?(write|compose|create|generate|draft|make)( me)? (a |an |some |the )?(short |little |funny )?(poem|haiku|limerick|song|rap|story|joke|riddle|code|function|program|script|email|letter|tweet|essay|paragraph|slogan|tagline|caption|bio|message)|^(tell|give) me (a |an |some )?(joke|story|riddle|fun fact|pun)|\b(code|function|script|program) (to|that|for)\b|\bin (python|javascript|typescript|java|c\+\+|rust|go|sql)\b/i;

const MEMORY_NOTE_ON = "I couldn't find a source for this, so that's the model's memory. Treat it with care.";

/**
 * With Web off, a name, number or date from a 0.5B model's memory is a coin
 * toss ("Nvidia's CEO is Elon Musk"). Rather than show a confident wrong
 * answer, offer to check — one click, and only the question is sent.
 */
const NO_GUESS =
  "That's a fact about the world, and a 0.5B model's memory isn't reliable for names, numbers and dates — I'd rather check than guess. Want me to look it up? Only your question goes to Wikipedia.";

type Base = {
  sources: Source[];
  memory: Memory;
  /** offer a one-click Wikipedia check of this question */
  check?: string;
};

export type Plan =
  | (Base & { kind: "reply"; text: string })
  | (Base & {
      kind: "model";
      messages: PromptMessage[];
      sampling: ReturnType<typeof samplingFor>;
      /** clean a partial stream for display */
      preview: (raw: string) => string;
      /** turn the raw streamed text into the final answer */
      finish: (raw: string) => string;
    });

export async function plan(
  message: string,
  context: { memory: Memory; history: Turn[]; live: boolean; web: boolean },
): Promise<Plan> {
  const { memory, history, live, web } = context;
  const text = message.trim().slice(0, MAX_QUESTION);
  const reply = (body: string, sources: Source[] = [], next: Memory = memory): Plan => ({
    kind: "reply",
    text: body,
    sources,
    memory: next,
  });

  // 1. reflexes — maths, the clock, live data, tricks, harm, noise
  const lastAnswer = [...history].reverse().find((turn) => turn.role === "assistant")?.content ?? null;
  const reflexive = reflex(text, { live, lastAnswer });
  if (reflexive) return reply(reflexive.reply);

  // 2. greetings, thanks, "who are you" — never touch the model
  const chat = smallTalk(text, live);
  if (chat && !chat.rest) return reply(chat.reply);
  const question = chat?.rest || text;

  // 3. what is this question about?
  const u = understand(question, memory);

  if (u.personal) return reply(PERSONAL_REPLY, [], { ...memory, focus: "parth" });

  // 4. about Parth, his work or this site
  if (u.aboutParth || u.entities.length > 0) {
    const cards = selectCards(u, memory);
    const next: Memory = {
      focus: u.entities[0] ?? (u.carried ? memory.focus : "parth"),
      shown: [...memory.shown, ...cards.map((card) => card.id)].slice(-40),
    };
    const sources = clampSources(sourcesOf(cards));

    if (cards.length === 0) {
      return reply(`I don't have that in what I know about Parth. You can ask him directly at ${EMAIL}.`, [], next);
    }

    const composed = composeAnswer(u, cards);
    if (!live || DIRECT.has(u.ask)) return reply(composed, sources, next);

    const factsText = cards.map((card) => `${card.text} ${card.facts ?? ""}`).join(" ");
    return {
      kind: "model",
      messages: portfolioPrompt(u, cards, history),
      sampling: samplingFor(u),
      sources,
      memory: next,
      preview: tidy,
      finish: (raw) => {
        const answer = finalise(raw, `${factsText} ${question}`, {
          strictNumbers: true,
          grounded: true,
          maxSentences: u.ask === "list" || u.ask === "compare" ? 6 : 4,
        });
        // the model said nothing usable — the composer always has an answer
        if (answer.length < 12) return composed;
        // a results answer without a single figure has missed the point — add the numbers
        if (u.ask === "results" && !/\d/.test(answer)) return withDetail(answer, composed, Infinity);
        return withDetail(answer, composed);
      },
    };
  }

  // 5. a general question
  const mode: GeneralMode = CREATIVE.test(question) ? "creative" : FACTUAL.test(question) ? "factual" : "chat";
  const found = web && mode !== "creative" ? await webLookup(question) : null;
  const sources: Source[] = found ? [{ label: found.title, url: found.url }] : [];

  // a structured fact from Wikidata is already the answer — exact, current, cited
  if (found?.direct) return reply(found.extract, sources);

  const reference = found ? { title: found.title, text: found.extract } : undefined;

  // Web off: don't guess at world facts — offer the check instead
  if (!web && mode === "factual") return { ...reply(NO_GUESS), check: question };
  if (!live) return { ...reply(generalWithoutModel(web, reference), sources), check: web ? undefined : question };

  const unchecked = mode === "factual" && !reference;
  return {
    kind: "model",
    messages: generalPrompt(question, mode, reference),
    sampling: samplingFor(null, mode, Boolean(reference)),
    sources,
    memory,
    // an explanation from memory can still be checked with a click
    check: !web && mode === "chat" ? question : undefined,
    preview: mode === "creative" ? finaliseCreative : tidy,
    finish: (raw) => {
      if (mode === "creative") return finaliseCreative(raw) || "I drew a blank on that one — try asking another way.";
      const answer = finalise(raw, reference?.text ?? question, {
        strictNumbers: Boolean(reference),
        grounded: Boolean(reference),
        maxSentences: 3,
      });
      if (answer.length < 4) return generalWithoutModel(web, reference);
      // Web was on but found nothing: a world fact from memory is a guess — say so
      if (unchecked) return `${answer} ${MEMORY_NOTE_ON}`;
      // "Argentina." is right, but give the sentence that says so
      return reference ? withDetail(answer, reference.text, 60, true) : answer;
    },
  };
}
