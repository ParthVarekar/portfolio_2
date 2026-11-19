/**
 * Light-touch cleanup of what the model writes.
 *
 * The old system replaced the model's sentence with a raw note whenever it
 * looked weak, which is what made it sound like a robot. This keeps the
 * model's words and only removes what is genuinely broken: echoed prompt
 * labels, repeated sentences, a sentence cut off mid-way, and any sentence
 * carrying a number that appears nowhere in the facts it was given.
 */

import { normalise } from "./entities";

const ACRONYMS: Array<[RegExp, string]> = [
  // a 0.5B model sometimes blends the detector's name into the project's
  [/\bH\.?\s*A\.?\s*L\.?\s*O\.?\s?11\b/g, "YOLO11"],
  [/\bH\.\s*A\.\s*L\.\s*O\.?(?=\s|$|[,;:!?'’])/g, "H.A.L.O"],
  [/\bHALO\b/g, "H.A.L.O"],
  [/\bR\.?\s*F\s*-\s*D\.?\s*E\.?\s*T\.?\s*R\b/g, "RF-DETR"],
];

const LABEL_LINE = /^\s*(facts|question|reference|key numbers)\b.*$/gim;
const LEAD_IN = /^\s*(answer|the machine|machine|assistant|response|a)\s*[:\-–]\s*/i;

/** Safe to run on every streamed chunk. */
export function tidy(text: string): string {
  let out = text
    .replace(LABEL_LINE, "")
    .replace(LEAD_IN, "")
    // the reply is plain text: drop markdown emphasis, headings, bullets and list numbers
    .replace(/\*\*|__|`/g, "")
    .replace(/^\s*#{1,6}\s+/gm, "")
    .replace(/^\s*(?:[-*•]|\d{1,2}[.)])\s+/gm, "");
  for (const [pattern, replacement] of ACRONYMS) out = out.replace(pattern, replacement);
  return out
    .replace(/[ \t]+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trimStart();
}

function sentences(text: string): string[] {
  // keep decimals (0.79), acronyms (H.A.L.O) and abbreviations whole
  const protectedText = text
    .replace(/(\d)\.(\d)/g, "$1<dot>$2")
    .replace(/\b([A-Z])\.(?=[A-Z])/g, "$1<dot>")
    .replace(/\b(e\.g|i\.e|etc|vs|approx)\./gi, (match) => match.replace(/\./g, "<dot>"));
  return protectedText
    .split(/(?<=[.!?])\s+(?=[A-Z0-9"“(])|\n+/)
    .map((part) => part.replace(/<dot>/g, ".").trim())
    .filter(Boolean);
}

/** "80%" and "80" are different claims, so a percentage keeps its sign. */
const numbersIn = (text: string) =>
  (text.match(/\d[\d,]*(?:\.\d+)?(?:\s?%| percent)?/g) ?? []).map((n) =>
    n.replace(/,/g, "").replace(/\s?(%| percent)$/, "%"),
  );

function unsupported(sentence: string, allowed: Set<string>): boolean {
  return numbersIn(sentence).some((n) => {
    if (allowed.has(n)) return false;
    if (n.endsWith("%")) return true;
    const value = Number(n);
    // small counts ("two steps", "3 cards") are rarely the dangerous kind of claim
    return !(Number.isFinite(value) && value <= 12 && !n.includes("."));
  });
}

const COMMON = new Set(
  "about also and any are been being both but can could does doing done each even every from have having into its just know known like made make makes many more most much must only other over really same should since some such than that their them then there these they this those through very well what when where which while will with would your highly skilled great good best strong important unique various different able ability approach approaches work works worked working project projects system systems build built builds parth varekar".split(
    " ",
  ),
);

/** content words, crudely stemmed so "detects" and "detected" meet */
function contentWords(text: string): string[] {
  return normalise(text)
    .trim()
    .split(" ")
    .filter((word) => word.length > 3 && !COMMON.has(word) && !/^\d/.test(word))
    .map((word) => (word.length > 5 ? word.replace(/(ing|ed|es|s|ly)$/, "") : word));
}

/**
 * True when most of a sentence's content words appear nowhere in the facts —
 * the signature of a small model inventing ("…medical research involving
 * human subjects…"). Short sentences are let through.
 */
function invented(sentence: string, known: Set<string>): boolean {
  const words = contentWords(sentence);
  if (words.length < 5) return false;
  const novel = words.filter((word) => !known.has(word)).length;
  return novel / words.length > 0.6;
}

/**
 * At temperature 0 a 0.5B model often answers in one bare clause ("Yes, he
 * uses Docker."). Keep its words, then add the supporting sentences the
 * composer picked from the same cards — skipping any that repeat it.
 */
export function withDetail(answer: string, detail: string, minLength = 90): string {
  if (answer.length >= minLength || !detail) return answer;
  const said = new Set(contentWords(answer));
  const extra = sentences(detail).filter((sentence) => {
    const words = contentWords(sentence);
    if (words.length === 0) return false;
    const repeated = words.filter((word) => said.has(word)).length / words.length;
    return repeated < 0.6;
  });
  return extra.length > 0 ? `${answer} ${extra.slice(0, 2).join(" ")}` : answer;
}

export function finalise(
  raw: string,
  source: string,
  options: { strictNumbers: boolean; grounded: boolean; maxSentences: number },
): string {
  const text = tidy(raw).trim();
  if (!text) return "";

  const allowed = new Set(numbersIn(source));
  const known = new Set(contentWords(source));
  const seen = new Set<string>();
  const kept: string[] = [];

  for (const sentence of sentences(text)) {
    const key = sentence.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    if (!key) continue;
    if (seen.has(key)) break; // the model has started looping
    seen.add(key);
    if (options.strictNumbers && unsupported(sentence, allowed)) continue;
    if (options.grounded && invented(sentence, known)) continue;
    kept.push(sentence);
    if (kept.length >= options.maxSentences) break;
  }

  // drop a trailing fragment cut off by the token limit
  if (kept.length > 1 && !/[.!?)"”]$/.test(kept[kept.length - 1])) kept.pop();

  // a line without end punctuation (a former list item) still reads as a sentence
  return kept
    .map((sentence) => (/[.!?)"”:]$/.test(sentence) ? sentence : `${sentence}.`))
    .join(" ")
    .replace(/\s{2,}/g, " ")
    .trim();
}
