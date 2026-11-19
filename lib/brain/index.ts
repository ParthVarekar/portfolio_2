/**
 * The machine's brain: one call that turns a visitor's message into either a
 * finished reply or a ready-to-run model request.
 *
 *   message → small talk? → understand (subject, facet, follow-up)
 *           → about Parth? → pick 2-3 fact cards → model (or composer)
 *           → general?     → model's own knowledge, or Wikipedia when Web is on
 *
 * The UI streams the model, then hands the raw text back to `finish`.
 */

import type { Source } from "@/lib/machine/types";
import { clampSources, sourcesOf } from "./sources";
import { finalise, withDetail } from "./clean";
import { composeAnswer, EMAIL, generalWithoutModel, PERSONAL_REPLY } from "./compose";
import { generalPrompt, portfolioPrompt, samplingFor, type PromptMessage, type Turn } from "./prompt";
import { selectCards } from "./retrieve";
import { smallTalk } from "./smalltalk";
import { understand, type Memory } from "./understand";
import { wikipediaLookup } from "./web";

export type { Memory } from "./understand";
export type { Turn } from "./prompt";

export const freshMemory = (): Memory => ({ focus: null, shown: [] });

/**
 * Answered straight from the cards even with the model awake: lists the
 * model would drop or repeat items from, and "why hire him", where an
 * invented claim costs the most.
 */
const DIRECT = new Set(["list", "contact", "skills", "hire", "role"]);

type Base = { sources: Source[]; memory: Memory };

export type Plan =
  | (Base & { kind: "reply"; text: string })
  | (Base & {
      kind: "model";
      messages: PromptMessage[];
      sampling: ReturnType<typeof samplingFor>;
      /** turn the raw streamed text into the final answer */
      finish: (raw: string) => string;
    });

export async function plan(
  message: string,
  context: { memory: Memory; history: Turn[]; live: boolean; web: boolean },
): Promise<Plan> {
  const { memory, history, live, web } = context;

  // 1. greetings, thanks, "who are you" — never touch the model
  const chat = smallTalk(message, live);
  if (chat && !chat.rest) return { kind: "reply", text: chat.reply, sources: [], memory };
  const question = chat?.rest || message.trim();

  // 2. what is this question about?
  const u = understand(question, memory);

  if (u.personal) {
    return { kind: "reply", text: PERSONAL_REPLY, sources: [], memory: { ...memory, focus: "parth" } };
  }

  // 3. about Parth, his work or this site
  if (u.aboutParth || u.entities.length > 0) {
    const cards = selectCards(u, memory);
    const next: Memory = {
      focus: u.entities[0] ?? (u.carried ? memory.focus : "parth"),
      shown: [...memory.shown, ...cards.map((card) => card.id)].slice(-40),
    };
    const sources = clampSources(sourcesOf(cards));

    if (cards.length === 0) {
      return {
        kind: "reply",
        text: `I don't have that in what I know about Parth. You can ask him directly at ${EMAIL}.`,
        sources: [],
        memory: next,
      };
    }

    const composed = composeAnswer(u, cards);
    // Lists of projects, contact details and skills are already written as
    // exact answers; a 0.5B model can only drop or repeat items, so these
    // come straight from the card even when the model is awake.
    if (!live || DIRECT.has(u.ask)) return { kind: "reply", text: composed, sources, memory: next };

    const factsText = cards.map((card) => `${card.text} ${card.facts ?? ""}`).join(" ");
    return {
      kind: "model",
      messages: portfolioPrompt(u, cards, history),
      sampling: samplingFor(u),
      sources,
      memory: next,
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

  // 4. a general question
  const found = web ? await wikipediaLookup(question) : null;
  const reference = found ? { title: found.title, text: found.extract } : undefined;
  const sources: Source[] = found ? [{ label: `${found.title} · Wikipedia`, url: found.url }] : [];

  if (!live) {
    return { kind: "reply", text: generalWithoutModel(web, reference), sources, memory };
  }

  return {
    kind: "model",
    messages: generalPrompt(question, reference),
    sampling: samplingFor(null),
    sources,
    memory,
    finish: (raw) => {
      const answer = finalise(raw, reference?.text ?? question, {
        strictNumbers: Boolean(reference),
        grounded: Boolean(reference),
        maxSentences: 3,
      });
      return answer.length >= 4 ? answer : generalWithoutModel(web, reference);
    },
  };
}
