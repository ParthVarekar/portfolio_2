import type { KnowledgeChunk } from "./index";

export type PromptMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export const REFUSAL =
  "That's not in my notes — try asking about a project or how I work.";

const SYSTEM = `You are the local guide to Parth Varekar's portfolio. You run entirely in the visitor's browser on a small local model. Answer only from the notes in the user message. Be concise. Never invent metrics, dates or roles. Never claim to be a cloud model or to browse the internet. Do not use markdown headings. If the notes do not contain the answer, say exactly: "${REFUSAL}"`;

export function buildMessages(
  question: string,
  chunks: KnowledgeChunk[],
  subject?: string,
): PromptMessage[] {
  const context = chunks
    .map((chunk, index) => {
      const note = chunk.facts
        ? `${chunk.text}\nKEY FACTS: ${chunk.facts}`
        : chunk.text;
      return `[${index + 1}] ${chunk.project} — ${chunk.source}\n${note}`;
    })
    .join("\n\n");

  const instruction = chunks[0]?.facts
    ? "Begin with the project name and write the KEY FACTS as one sentence."
    : "Prefer note [1]. Answer in one or two short sentences. Name the project.";

  const subjectLine = subject ? `SUBJECT\n${subject}\n\n` : "";

  const request = `${subjectLine}NOTES\n${context || "(no matching notes)"}\n\nQUESTION\n${question}\n\n${instruction}`;

  return [
    { role: "system", content: SYSTEM },
    { role: "user", content: request },
  ];
}
