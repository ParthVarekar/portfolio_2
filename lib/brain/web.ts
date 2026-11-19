/**
 * Web mode: looking things up, only when the visitor switches Web on.
 *
 * Two sources, both called straight from the visitor's browser (anonymous
 * CORS with `origin=*`, no key, no server of Parth's in between). Only the
 * question's search words leave the tab — never the conversation.
 *
 * 1. Wikidata, for relational facts ("who is the CEO of Nvidia", "capital of
 *    Australia", "who wrote Dune"). Wikidata stores these as dated claims with
 *    a preferred current value, so the answer is current and exact, and it is
 *    returned as a finished sentence — the model never gets a chance to garble
 *    a name.
 * 2. Wikipedia full-text search for everything else: the intros of the best
 *    few pages are split into sentences, ranked against the question, and the
 *    top three become the REFERENCE the model answers from.
 *
 * The old lookup used title-prefix search, which turned "ceo nvidia" into
 * "Conidium" — and then rejected the right page for not saying "CEO".
 */

export type WebAnswer = {
  /** what the source chip says */
  title: string;
  /** passage for the model, or the finished answer when `direct` */
  extract: string;
  url: string;
  /** a verified one-sentence answer that needs no model */
  direct?: boolean;
};

const WIKIPEDIA = "https://en.wikipedia.org/w/api.php";
const WIKIDATA = "https://www.wikidata.org/w/api.php";
const TIMEOUT_MS = 9000;

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(`${url}&format=json&origin=*`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`lookup answered ${response.status}`);
  return (await response.json()) as T;
}

// ---- Wikidata: relational facts -----------------------------------------

/** "on 4 September 1998", but "in 1998" and "in September 1998" */
const onOrIn = (date: string) => (/^\d{1,2} /.test(date) ? `on ${date}` : `in ${date}`);

/** offices worth dating ("CEO since…"); a capital or a currency isn't */
const OFFICES = new Set(["P169", "P6", "P35"]);

type Relation = {
  pattern: RegExp;
  property: string;
  /** turn subject + value(s) into the answer sentence */
  say: (subject: string, value: string, role: string) => string;
};

const RELATIONS: Relation[] = [
  {
    pattern: /\b(?:ceo|chief executive(?: officer)?) of (.+)|^(.+?)(?:'s|s)? (?:ceo|chief executive)$/,
    property: "P169",
    say: (s, v) => `${v} is the CEO of ${s}`,
  },
  {
    pattern: /\b(prime minister|pm|chancellor|premier|head of government) of (.+)/,
    property: "P6",
    say: (s, v, role) => `The ${role === "pm" ? "prime minister" : role} of ${s} is ${v}`,
  },
  {
    pattern: /\b(president|king|queen|monarch|head of state) of (.+)/,
    property: "P35",
    say: (s, v, role) => `The ${role} of ${s} is ${v}`,
  },
  { pattern: /\bcapital(?: city)? of (.+)|^(.+?)(?:'s|s)? capital$/, property: "P36", say: (s, v) => `The capital of ${s} is ${v}` },
  { pattern: /\bpopulation of (.+)|how many people live in (.+)/, property: "P1082", say: (s, v) => `The population of ${s} is about ${v}` },
  {
    pattern: /\b(?:founders?|co-?founders?) of (.+)|who (?:founded|co-?founded|started|created) (.+)/,
    property: "P112",
    say: (s, v) => `${s} was founded by ${v}`,
  },
  {
    pattern: /when was (.+?) (?:founded|established|formed|started|created|launched)|when did (.+?) (?:start|begin|launch)/,
    property: "P571",
    say: (s, v) => `${s} was founded ${onOrIn(v)}`,
  },
  { pattern: /who (?:invented|discovered) (.+)|(?:inventor|discoverer) of (.+)/, property: "P61", say: (s, v) => `${s}: invented or discovered by ${v}` },
  { pattern: /when was (.+?) born|(.+?)(?:'s|s)? (?:birthday|date of birth)|how old is (.+)/, property: "P569", say: (s, v) => `${s} was born ${onOrIn(v)}` },
  { pattern: /where was (.+?) born/, property: "P19", say: (s, v) => `${s} was born in ${v}` },
  { pattern: /when did (.+?) die/, property: "P570", say: (s, v) => `${s} died ${onOrIn(v)}` },
  { pattern: /who (?:wrote|authored) (.+)|author of (.+)/, property: "P50", say: (s, v) => `${s} was written by ${v}` },
  { pattern: /who directed (.+)|director of (?:the (?:movie|film) )?(.+)/, property: "P57", say: (s, v) => `${s} was directed by ${v}` },
  { pattern: /\bcurrency of (.+)|what currency (?:does|is used in) (.+?)(?: use)?$/, property: "P38", say: (s, v) => `The currency of ${s} is the ${v}` },
  { pattern: /(?:official )?languages? (?:of|spoken in) (.+)/, property: "P37", say: (s, v) => `The official language of ${s}: ${v}` },
];

type Snak = { datavalue?: { value?: Record<string, unknown> & { id?: string } } };
type Claim = {
  rank: "preferred" | "normal" | "deprecated";
  mainsnak: Snak;
  qualifiers?: Record<string, Snak[]>;
};

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function formatTime(value: Record<string, unknown>): string {
  const raw = String(value.time ?? "");
  const precision = Number(value.precision ?? 11);
  const match = /^([+-])(\d+)-(\d\d)-(\d\d)/.exec(raw);
  if (!match) return raw;
  const [, sign, year, month, day] = match;
  const y = `${Number(year)}${sign === "-" ? " BC" : ""}`;
  if (precision <= 9 || month === "00") return y;
  if (precision === 10 || day === "00") return `${MONTHS[Number(month) - 1]} ${y}`;
  return `${Number(day)} ${MONTHS[Number(month) - 1]} ${y}`;
}

function qualifierTime(claim: Claim, property: string): string | null {
  const value = claim.qualifiers?.[property]?.[0]?.datavalue?.value;
  return value ? formatTime(value) : null;
}

/** Current claims first: no end date, preferred rank, latest point in time. */
function currentClaims(claims: Claim[]): Claim[] {
  const live = claims.filter((claim) => claim.rank !== "deprecated" && !claim.qualifiers?.P582);
  const pool = live.length > 0 ? live : claims;
  const preferred = pool.filter((claim) => claim.rank === "preferred");
  if (preferred.length > 0) return preferred;
  const dated = pool.filter((claim) => claim.qualifiers?.P585);
  if (dated.length > 0) {
    const time = (claim: Claim) => String(claim.qualifiers?.P585?.[0]?.datavalue?.value?.time ?? "");
    return [dated.sort((a, b) => time(b).localeCompare(time(a)))[0]];
  }
  return pool;
}

async function labelsOf(ids: string[]): Promise<Record<string, string>> {
  if (ids.length === 0) return {};
  type Entities = { entities?: Record<string, { labels?: { en?: { value: string } } }> };
  const data = await getJson<Entities>(
    `${WIKIDATA}?action=wbgetentities&ids=${ids.join("|")}&props=labels&languages=en`,
  );
  return Object.fromEntries(
    ids.map((id) => [id, data.entities?.[id]?.labels?.en?.value ?? id]),
  );
}

function plainQuestion(question: string): string {
  return question
    .toLowerCase()
    .replace(/[?!.]+$/g, "")
    .replace(/\b(the|current|currently|today|now|right now|present|actual)\b/g, " ")
    .replace(/^(who|what|which)( is| are|'s|s)? /, "$1 ")
    .replace(/\s+/g, " ")
    .trim();
}

async function wikidataFact(question: string): Promise<WebAnswer | null> {
  const q = plainQuestion(question);
  for (const relation of RELATIONS) {
    const match = relation.pattern.exec(q);
    if (!match) continue;
    const groups = match.slice(1).filter(Boolean);
    const role = groups.length > 1 ? groups[0] : "";
    const subject = (groups.length > 1 ? groups[groups.length - 1] : groups[0])
      ?.replace(/^(a|an|the)\s+/, "")
      .trim();
    if (!subject || subject.length < 2) continue;

    type Search = { search?: Array<{ id: string; label: string }> };
    const found = await getJson<Search>(
      `${WIKIDATA}?action=wbsearchentities&search=${encodeURIComponent(subject)}&language=en&limit=1`,
    );
    const hit = found.search?.[0];
    if (!hit) return null;

    type Claims = { claims?: Record<string, Claim[]> };
    const data = await getJson<Claims>(
      `${WIKIDATA}?action=wbgetclaims&entity=${hit.id}&property=${relation.property}`,
    );
    const claims = currentClaims(data.claims?.[relation.property] ?? []).slice(0, 4);
    if (claims.length === 0) return null;

    const values = claims.map((claim) => claim.mainsnak.datavalue?.value).filter(Boolean) as Array<
      Record<string, unknown> & { id?: string }
    >;
    const labels = await labelsOf(values.map((value) => value.id).filter(Boolean) as string[]);
    const rendered = values.map((value) => {
      if (value.id) return labels[value.id];
      if (value.amount !== undefined) return Number(value.amount).toLocaleString("en-US");
      if (value.time !== undefined) return formatTime(value);
      return String(value.text ?? "");
    });
    const list =
      rendered.length > 1
        ? `${rendered.slice(0, -1).join(", ")} and ${rendered[rendered.length - 1]}`
        : rendered[0];
    if (!list) return null;

    const since = claims.length === 1 && OFFICES.has(relation.property) ? qualifierTime(claims[0], "P580") : null;
    const asOf = claims.length === 1 ? qualifierTime(claims[0], "P585") : null;
    const tail = since ? ` (since ${since})` : asOf ? ` (as of ${asOf})` : "";
    return {
      title: `${hit.label} · Wikidata`,
      extract: `${relation.say(hit.label, list, role)}${tail}.`,
      url: `https://www.wikidata.org/wiki/${hit.id}`,
      direct: true,
    };
  }
  return null;
}

// ---- Wikipedia: passages for everything else ------------------------------

const STOPWORDS = new Set(
  "what which who whom whose where when why how is are was were be been do does did can could would should the a an of to in on at for from by about explain tell me please much many give find search define definition meaning mean means whats isnt doesnt dont im its current currently now today right really".split(
    " ",
  ),
);

/** Words people say vs. words encyclopedias write. */
const SYNONYMS: Record<string, string[]> = {
  ceo: ["ceo", "chief executive"],
  pm: ["prime minister"],
  founder: ["founder", "founded", "co-founded"],
  founded: ["founded", "founder", "established"],
  invented: ["invented", "inventor", "invention"],
  born: ["born", "birth"],
  population: ["population", "inhabitants"],
  tallest: ["tallest", "height"],
  biggest: ["largest", "biggest"],
  largest: ["largest", "biggest"],
  won: ["won", "winner", "winners", "champion", "crowned", "winning", "defeated", "victory", "beat"],
  win: ["won", "winner", "winners", "champion", "crowned", "winning", "defeated", "victory", "beat"],
  winner: ["won", "winner", "winners", "champion", "crowned", "winning", "defeated", "victory"],
  created: ["created", "designed", "developed", "released"],
  far: ["distance", "km", "kilometres", "kilometers", "miles"],
  colour: ["color", "colour"],
  color: ["color", "colour"],
};

const termsOf = (question: string) =>
  question
    .toLowerCase()
    .replace(/[’']s\b/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 1 && !STOPWORDS.has(word));

function sentencesOf(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    // pronunciation stubs left by the plain-text extract: "Musk ( ; born …)"
    .replace(/\(\s*[;,]\s*/g, "(")
    .replace(/\(\s*\)/g, "")
    .replace(/(\d)\.(\d)/g, "$1<dot>$2")
    .split(/(?<=[.!?])\s+(?=[A-Z0-9"“(])/)
    .map((sentence) => sentence.replace(/<dot>/g, ".").trim())
    .filter((sentence) => sentence.length > 20);
}

async function wikipediaPassage(question: string): Promise<WebAnswer | null> {
  const terms = termsOf(question);
  if (terms.length === 0) return null;
  const query = terms.join(" ");

  // Question shape decides the search. "Why is the sky blue" needs full-text
  // search on the whole sentence (→ Diffuse sky radiation; a title search
  // finds Blue Sky Studios). "Who is Elon Musk" needs a title search on the
  // name (full-text drifts to "Wealth of Elon Musk").
  const explanatory = /^\s*(why|how)\b/i.test(question);
  type Search = { query?: { search?: Array<{ title: string }> } };
  type Open = [string, string[]];
  const fullText = (q: string) =>
    getJson<Search>(`${WIKIPEDIA}?action=query&list=search&srsearch=${encodeURIComponent(q)}&srlimit=4&srprop=`)
      .then((data) => (data.query?.search ?? []).map((hit) => hit.title))
      .catch(() => [] as string[]);
  const byTitle = (q: string) =>
    getJson<Open>(`${WIKIPEDIA}?action=opensearch&search=${encodeURIComponent(q)}&limit=1&namespace=0`)
      .then((data) => data[1] ?? [])
      .catch(() => [] as string[]);

  const lists = explanatory
    ? await Promise.all([fullText(question.replace(/[?!.]+$/, "")), fullText(query)])
    : await Promise.all([byTitle(query), fullText(query)]);
  // A page ranked high by its search earns a little trust. For why/how only
  // the whole-sentence search counts: "sky blue" alone ranks the colour first.
  const searchRank = new Map<string, number>();
  lists.forEach((list, which) => {
    list.forEach((title, at) => {
      const rank = explanatory && which > 0 ? 3 : at;
      searchRank.set(title, Math.min(searchRank.get(title) ?? 9, rank));
    });
  });
  const titles = [...searchRank.keys()].sort((a, b) => searchRank.get(a)! - searchRank.get(b)!).slice(0, 6);
  if (titles.length === 0) return null;

  type Extracts = { query?: { pages?: Record<string, { title?: string; extract?: string }> } };
  const data = await getJson<Extracts>(
    `${WIKIPEDIA}?action=query&prop=extracts&exintro=1&explaintext=1&redirects=1&exlimit=6&titles=${encodeURIComponent(
      titles.join("|"),
    )}`,
  );
  const pages = Object.values(data.query?.pages ?? {}).filter((page) => page.title && page.extract);

  type Scored = { title: string; sentence: string; score: number; at: number };
  const scored: Scored[] = [];
  for (const page of pages) {
    const title = page.title!.toLowerCase();
    const titleMatch = terms.filter((term) => title.includes(term)).length / terms.length;
    // Words already in the page title are true of every sentence on that page
    // ("2022 FIFA World Cup"); the words that aren't ("won") are what the
    // question is really asking, so they carry the weight.
    const weighted = terms.map((term) => ({
      // "airplanes" should find "airplane"
      alternatives: SYNONYMS[term] ?? (term.length > 4 && term.endsWith("s") ? [term, term.slice(0, -1)] : [term]),
      weight: title.includes(term) ? 0.1 : 1,
    }));
    const rankBonus = Math.max(0, 0.3 - (searchRank.get(page.title!) ?? 3) * 0.1);
    // for why/how, a page titled with the question's words is usually the trap, not the answer
    const titleWeight = explanatory ? 0 : 0.6;
    const total = weighted.reduce((sum, term) => sum + term.weight, 0);
    const definitional = !explanatory && weighted.every((term) => term.weight < 1);
    sentencesOf(page.extract!).forEach((sentence, at) => {
      const low = sentence.toLowerCase();
      const hits = weighted
        .filter((term) => term.alternatives.some((word) => low.includes(word)))
        .reduce((sum, term) => sum + term.weight, 0);
      scored.push({
        title: page.title!,
        sentence,
        at,
        // coverage of the question, a page about the thing itself, and — for
        // "what is X" — the definition-first habit of intros
        score:
          hits / total +
          titleMatch * titleWeight +
          rankBonus +
          (definitional && at === 0 ? 0.25 : 0) +
          // a "why" is answered by a sentence that gives a cause
          (/^\s*why\b/i.test(question) && /\b(because|due to|caused by|results? (from|in)|the reason)\b/.test(low) ? 0.15 : 0),
      });
    });
  }
  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];
  // nothing on the page actually speaks to the question
  if (!best || best.score < 0.55) return null;

  // the best page's sentences, in reading order, plus at most one from elsewhere
  const fromBest = scored.filter((item) => item.title === best.title).slice(0, 3).sort((a, b) => a.at - b.at);
  const other = scored.find((item) => item.title !== best.title && item.score >= best.score * 0.8);
  const passage = [...fromBest.map((item) => item.sentence), ...(other ? [other.sentence] : [])].join(" ");

  return {
    title: `${best.title} · Wikipedia`,
    extract: passage.slice(0, 1400),
    url: `https://en.wikipedia.org/wiki/${encodeURIComponent(best.title.replace(/ /g, "_"))}`,
  };
}

/** A verified fact, a passage to answer from, or null when the web has nothing usable. */
export async function webLookup(question: string): Promise<WebAnswer | null> {
  const cleaned = question.trim().replace(/\s+/g, " ").slice(0, 200);
  if (cleaned.length < 2) return null;
  try {
    const fact = await wikidataFact(cleaned);
    if (fact) return fact;
  } catch {
    // fall through to the encyclopedia
  }
  try {
    return await wikipediaPassage(cleaned);
  } catch {
    return null;
  }
}
