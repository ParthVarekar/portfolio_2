/**
 * Choosing the two or three cards the model gets to read.
 *
 * The subject and facet decided by `understand` pick most cards directly.
 * Keyword search (BM25 via MiniSearch) is the backstop for questions that
 * name a technology rather than a project — "has he used Docker?", "which
 * project uses a Kalman filter?".
 */

import MiniSearch from "minisearch";
import { allCards, cardById, cardsFor, type Card, type Facet } from "./knowledge";
import { entityById } from "./entities";
import { DEEPER, type Memory, type Understanding } from "./understand";

/** Roughly 650 tokens of facts — enough to answer, small enough for a 0.5B model to stay on topic. */
const BUDGET_CHARS = 2600;

const STOP = new Set(
  "a an the of to in on at for from by with and or is are was were be been do does did can could would should will what which who whom whose where when why how about tell me please his him he parth you your it its this that these those has have had any there their them they i we our project projects one chapter use uses used using know knows worked work works experience familiar ever tried built build".split(
    " ",
  ),
);

let index: MiniSearch<Card> | null = null;

function search(): MiniSearch<Card> {
  if (index) return index;
  index = new MiniSearch<Card>({
    fields: ["title", "text", "facts", "entityName"],
    storeFields: ["id"],
    extractField: (card, field) =>
      field === "entityName"
        ? entityById.get(card.entity)?.name ?? ""
        : ((card as Record<string, unknown>)[field] as string | undefined) ?? "",
    processTerm: (term) => {
      const t = term.toLowerCase();
      return STOP.has(t) || t.length < 2 ? null : t;
    },
    searchOptions: { boost: { entityName: 2, title: 1.5, facts: 1.2 }, fuzzy: 0.15, prefix: true },
  });
  index.addAll(allCards());
  return index;
}

export function keywordSearch(query: string, limit = 3): Card[] {
  const hits = search().search(query);
  if (hits.length === 0) return [];
  const top = hits[0].score;
  return hits
    .filter((hit) => hit.score >= top * 0.45)
    .slice(0, limit)
    .map((hit) => cardById(hit.id as string))
    .filter((card): card is Card => Boolean(card));
}

const one = (id: string) => cardById(id);

function forSubject(entity: string, ask: Facet, more: boolean, memory: Memory): Card[] {
  if (more) {
    // walk to the first facet of this subject the visitor hasn't seen yet
    for (const facet of DEEPER) {
      const unseen = cardsFor(entity, facet).filter((card) => !memory.shown.includes(card.id));
      if (unseen.length > 0) return unseen.slice(0, 2);
    }
  }

  const direct = cardsFor(entity, ask);
  const overview = cardsFor(entity, "overview");
  const meta = cardsFor(entity, "meta");

  switch (ask) {
    case "overview":
      return [...overview.slice(0, 1), ...meta];
    case "how":
      return direct.length > 0 ? direct.slice(0, 2) : overview;
    case "meta":
      return [...meta, ...overview.slice(0, 1)];
    case "results":
      return direct.length > 0 ? [...direct, ...meta] : [...overview, ...meta];
    default:
      return direct.length > 0 ? [...direct, ...overview.slice(0, 1)] : [...overview, ...meta];
  }
}

function forParth(u: Understanding): Card[] {
  const ids: Record<string, string[]> = {
    overview: ["parth-bio", "parth-now"],
    // one list card at a time: two overlapping lists make a small model repeat itself
    list: /\b(other|else|side|more)\b/i.test(u.question) ? ["parth-other-projects"] : ["portfolio-overview"],
    hire: ["parth-bio", "parth-verification", "parth-approach"],
    education: ["parth-education", "parth-certifications"],
    experience: ["parth-internship", "client-protovinci", "parth-certifications"],
    certs: ["parth-certifications", "parth-education"],
    skills: ["parth-skills", "parth-tools"],
    contact: ["parth-contact-details", "parth-hire"],
    approach: ["parth-approach", "parth-verification"],
    now: ["parth-now", "parth-hire"],
    story: ["parth-story", "parth-bio"],
  };
  const chosen = (ids[u.ask] ?? ids.overview).map(one).filter((card): card is Card => Boolean(card));

  // a named technology ("has he used Docker?") — add the cards that mention it
  if (u.ask === "skills" || u.ask === "overview") {
    for (const card of keywordSearch(u.question, 2)) {
      if (!chosen.some((c) => c.id === card.id) && card.entity !== "parth") chosen.push(card);
    }
  }
  return chosen;
}

function withinBudget(cards: Card[]): Card[] {
  const out: Card[] = [];
  let used = 0;
  for (const card of cards) {
    if (out.some((c) => c.id === card.id)) continue;
    const cost = card.text.length + (card.facts?.length ?? 0) + card.title.length;
    if (out.length > 0 && used + cost > BUDGET_CHARS) continue;
    out.push(card);
    used += cost;
    if (out.length >= 4) break;
  }
  return out;
}

export function selectCards(u: Understanding, memory: Memory): Card[] {
  if (u.ask === "compare") {
    // one overview each — more than that and a small model blends the two
    return withinBudget(u.entities.slice(0, 3).flatMap((entity) => cardsFor(entity, "overview").slice(0, 1)));
  }

  const subject = u.entities[0];
  if (subject) {
    const facet = (u.ask === "role" ? "meta" : u.ask) as Facet;
    return withinBudget(forSubject(subject, facet, u.more, memory));
  }

  // "which project uses a Kalman filter?" — the cards that mention it
  if (u.ask === "search") {
    const hits = keywordSearch(u.question, 3);
    const fallback = one("parth-skills");
    return withinBudget(hits.length > 0 ? hits : fallback ? [fallback] : []);
  }

  if (u.aboutParth) {
    const cards = forParth(u);
    if (cards.length > 0) return withinBudget(cards);
  }

  // no subject, no facet: the question names something — find who mentions it
  return withinBudget(keywordSearch(u.question, 3));
}
