import type { Source } from "@/lib/machine/types";
import type { Card } from "./knowledge";

/** One chip per distinct link, in the order the cards were used. */
export function sourcesOf(cards: Card[]): Source[] {
  const seen = new Set<string>();
  const out: Source[] = [];
  for (const card of cards) {
    if (seen.has(card.url)) continue;
    seen.add(card.url);
    out.push({ label: card.source, url: card.url });
  }
  return out;
}

export const clampSources = (sources: Source[], max = 3) => sources.slice(0, max);
