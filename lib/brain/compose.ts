/**
 * Answers without the model — for phones, browsers without WebGPU, and the
 * moment before the model has loaded. It reads the same cards the model would
 * have read and picks the sentences that best answer the question, so the
 * two modes always agree on the facts.
 */

import { entityById, normalise } from "./entities";
import type { Card } from "./knowledge";
import type { Understanding } from "./understand";

export const EMAIL = "parthvarekar27@gmail.com";

const CAP = 520;

const STOP = new Set(
  "a an the of to in on at for from by with and or is are was were be been do does did can could would should what which who where when why how about tell me please his him he it its this that you your".split(" "),
);

function splitSentences(text: string): string[] {
  return text
    .replace(/(\d)\.(\d)/g, "$1<dot>$2")
    .replace(/\b([A-Z])\.(?=[A-Z])/g, "$1<dot>")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.replace(/<dot>/g, ".").trim())
    .filter(Boolean);
}

const tokens = (text: string) =>
  normalise(text).trim().split(" ").filter((t) => t.length > 2 && !STOP.has(t));

function bestSentences(question: string, card: Card, count: number): string[] {
  const asked = new Set(tokens(question));
  const all = splitSentences(card.text);
  const scored = all.map((sentence, at) => {
    const overlap = tokens(sentence).filter((t) => asked.has(t)).length;
    // the first sentence of a card is usually its definition
    return { sentence, at, score: overlap + (at === 0 ? 0.8 : 0) + (/\d/.test(sentence) ? 0.3 : 0) };
  });
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .sort((a, b) => a.at - b.at)
    .map((item) => item.sentence);
}

function capped(parts: string[]): string {
  let out = "";
  for (const part of parts) {
    if (out && out.length + part.length + 1 > CAP) break;
    out = out ? `${out} ${part}` : part;
  }
  return out;
}

export function composeAnswer(u: Understanding, cards: Card[]): string {
  if (cards.length === 0) {
    return `I don't have that in what I know about Parth. You can ask him directly at ${EMAIL}.`;
  }

  const [first, second] = cards;

  // these cards are written as complete answers — give them whole
  if (u.ask === "list" || u.ask === "contact" || u.ask === "skills") return first.text;

  if (u.ask === "role") {
    // the role and team sentences of the subject's details card
    const meta = cards.find((card) => card.facet === "meta");
    if (meta) {
      const lines = splitSentences(meta.text).filter((s) => /\brole\b|\bteam:/i.test(s));
      if (lines.length > 0) return lines.join(" ");
    }
  }
  if (u.ask === "story" || u.ask === "now") return capped(splitSentences(first.text));

  if (u.ask === "search") {
    // name the project each finding belongs to
    const seen = new Set<string>();
    const parts: string[] = [];
    for (const card of cards) {
      if (seen.has(card.entity)) continue;
      seen.add(card.entity);
      const sentence = bestSentences(u.question, card, 1)[0];
      if (!sentence) continue;
      const name = entityById.get(card.entity)?.name;
      parts.push(name && card.entity !== "parth" && !sentence.includes(name) ? `${name}: ${sentence}` : sentence);
    }
    return capped(parts);
  }

  if (u.ask === "results" && first.facts) {
    const name = entityById.get(first.entity)?.name ?? "It";
    return `${name} in numbers: ${first.facts.replace(/\.$/, "")}.`;
  }

  if (u.ask === "hire") {
    // who he is, the evidence across every project, and how he works
    const by = (id: string) => cards.find((card) => card.id === id);
    const bio = by("parth-bio");
    const evidence = by("parth-verification");
    const approach = by("parth-approach");
    return [
      bio ? splitSentences(bio.text)[0] : "",
      evidence ? splitSentences(evidence.text)[0] : "",
      approach ? splitSentences(approach.text).slice(-1)[0] : "",
      `He's open to internships and collaborations — ${EMAIL}.`,
    ]
      .filter(Boolean)
      .join(" ");
  }

  if (u.ask === "compare") {
    // one strong sentence from each card
    return capped(cards.map((card) => bestSentences(u.question, card, 1)[0]).filter(Boolean));
  }

  const parts = bestSentences(u.question, first, 2);
  if (second && second.entity !== first.entity) parts.push(...bestSentences(u.question, second, 1));
  return capped(parts);
}

export const PERSONAL_REPLY = `That's not something Parth has shared here — the site sticks to his work. If you'd like to know, ask him at ${EMAIL}.`;

export function generalWithoutModel(web: boolean, reference?: { text: string }): string {
  if (reference) return capped(splitSentences(reference.text).slice(0, 3));
  return web
    ? "I couldn't find that on Wikipedia. I'm best at questions about Parth and his work — try one of those."
    : "That's a general question, and the language model isn't loaded, so right now I can only answer about Parth and his work. Wake the machine, or switch Web on to look it up on Wikipedia.";
}
