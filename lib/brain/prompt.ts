/**
 * What the model actually reads.
 *
 * Qwen2.5-0.5B follows short, plain instructions well and long ones badly, so
 * the system prompt is a handful of rules, the facts sit right next to the
 * question in the last user turn, and earlier turns are only included for a
 * follow-up (a small model given unrelated history tends to copy it).
 */

import { entityById } from "./entities";
import type { Card, Facet } from "./knowledge";
import type { Understanding } from "./understand";

export type Turn = { role: "user" | "assistant"; content: string };
export type PromptMessage = { role: "system" | "user" | "assistant"; content: string };

const PERSONA =
  "You are the machine: a small language model (Qwen2.5 0.5B) running inside the visitor's web browser, on the portfolio website of Parth Varekar, an AI systems builder from Mumbai.";

const PORTFOLIO_RULES = [
  "Answer the visitor's question about Parth, his projects or his work using the FACTS.",
  "Talk about Parth in the third person (\"Parth\" or \"he\"). You are not Parth.",
  "Use only the FACTS for anything about Parth. Copy names and numbers exactly. Never invent projects, numbers, dates, companies or links.",
  "If the FACTS do not answer the question, say you don't know that about Parth and suggest emailing him at parthvarekar27@gmail.com.",
  "If the question can be answered yes or no, answer it, then give the supporting details from the FACTS.",
  "Be warm, direct and specific. Write two to four sentences of plain text. No headings, no lists, no bold, no quotation marks.",
];

const LIST_RULE =
  "The visitor wants an overview of several projects: name each one with a short description, in one or two flowing paragraphs.";

const GENERAL_RULES = [
  "The visitor asked a general question that is not about Parth.",
  "Answer in one to three plain sentences.",
  "If a REFERENCE is given, answer from it. Otherwise answer from general knowledge, and say honestly when you are not sure.",
  "Do not bring up Parth unless the visitor asks about him.",
];

function factLine(card: Card): string {
  const facts = card.facts ? ` Key numbers: ${card.facts}` : "";
  return `${card.title}: ${card.text}${facts}`;
}

function lastExchange(history: Turn[]): Turn[] {
  const tail = history.slice(-2);
  if (tail.length < 2 || tail[0].role !== "user" || tail[1].role !== "assistant") return [];
  return tail.map((turn) => ({ ...turn, content: turn.content.slice(0, 500) }));
}

const FACET_QUESTION: Partial<Record<Facet, (name: string) => string>> = {
  overview: (name) => `What is ${name}?`,
  how: (name) => `How does ${name} work?`,
  results: (name) => `What are ${name}'s results?`,
  problem: (name) => `What problem does ${name} solve, and why?`,
  meta: (name) => `What is ${name} built with, and what was Parth's role?`,
  lesson: (name) => `What did Parth learn from ${name}?`,
};

/**
 * The question as the model should read it. A 0.5B model handles "it" and
 * "tell me more" badly, so the subject is written back in, a bare "more"
 * becomes a concrete question about the next facet, and an opinion question
 * becomes a request for evidence.
 */
export function explicitQuestion(u: Understanding, cards: Card[]): string {
  const name = u.entities[0] ? entityById.get(u.entities[0])?.name : undefined;

  if (u.ask === "hire") {
    return "Based only on the FACTS, give two or three concrete reasons Parth would be a strong hire, using his real projects and numbers.";
  }
  if (u.ask === "compare") {
    const names = u.entities.map((id) => entityById.get(id)?.name).filter(Boolean) as string[];
    return `${names.map((n) => `Describe ${n} in one sentence`).join(", then ")}, then say in one sentence how they differ.`;
  }
  let question = u.question;
  if (u.more && name && cards[0]) {
    question = FACET_QUESTION[cards[0].facet]?.(name) ?? `Tell me more about ${name}.`;
  } else if (u.carried && name) {
    question = question
      .replace(/\b(this|that|the) (project|app|tool|system)\b/gi, name)
      .replace(/\bits\b/gi, `${name}'s`)
      .replace(/\b(it|this|that)\b(?=[\s?.!,]|$)/gi, name);
  }

  // greedy decoding likes to stop after one bare sentence — ask for the detail
  if (/^\s*(has|have|had|does|do|did|is|are|was|were|can|could|will|would)\b/i.test(u.question)) {
    return `${question} Say yes or no, then give the details from the FACTS in one or two sentences.`;
  }
  if (["overview", "how", "problem", "lesson", "results", "now", "story", "approach"].includes(u.ask)) {
    return `${question} Answer in two or three sentences.`;
  }
  return question;
}

export function portfolioPrompt(
  u: Understanding,
  cards: Card[],
  history: Turn[],
): PromptMessage[] {
  const rules = u.ask === "list" ? [...PORTFOLIO_RULES.slice(0, 5), LIST_RULE] : PORTFOLIO_RULES;
  const system = `${PERSONA}\n\n${rules.map((rule) => `- ${rule}`).join("\n")}`;

  const subject = u.entities.map((id) => entityById.get(id)?.name).filter(Boolean).join(" and ");
  const label = subject ? `QUESTION (about ${subject})` : "QUESTION";
  const user = `FACTS:\n${cards.map(factLine).join("\n\n")}\n\n${label}: ${explicitQuestion(u, cards)}`;

  return [
    { role: "system", content: system },
    ...(u.carried ? lastExchange(history) : []),
    { role: "user", content: user },
  ];
}

export function generalPrompt(question: string, reference?: { title: string; text: string }): PromptMessage[] {
  const system = `${PERSONA}\n\n${GENERAL_RULES.map((rule) => `- ${rule}`).join("\n")}`;
  const user = reference
    ? `REFERENCE (Wikipedia, ${reference.title}):\n${reference.text}\n\nQUESTION: ${question}`
    : question;
  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}

/**
 * Sampling for a 0.5B model. Questions about Parth decode greedily — any
 * randomness there is a chance to invent a fact. General chat gets a little
 * temperature so it doesn't read like a template.
 */
export function samplingFor(u: Understanding | null) {
  return {
    temperature: u ? 0 : 0.3,
    top_p: 0.9,
    repetition_penalty: 1.1,
    max_tokens: u?.ask === "list" || u?.ask === "compare" ? 260 : 170,
    stop: ["QUESTION", "FACTS:", "REFERENCE"],
  };
}
