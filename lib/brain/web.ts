/**
 * Web mode: a Wikipedia lookup the visitor explicitly opts into.
 *
 * When the globe toggle in the machine header is on, a question the
 * portfolio notes cannot answer is sent — only as a search query, and
 * only then — to Wikipedia, which is the one site the machine ever talks
 * to. The page summary it gets back becomes the note for the model, and
 * the answer cites the page. No other network access, no telemetry, and
 * toggling it off returns the machine to fully-local behaviour.
 *
 * Wikipedia's MediaWiki API allows anonymous CORS (`origin=*`), so no
 * proxy, key or server of Parth's is involved.
 */

export type WebAnswer = {
  title: string;
  extract: string;
  url: string;
};

const API = "https://en.wikipedia.org/w/api.php";
const TIMEOUT_MS = 9000;

const QUERY_STOPWORDS = new Set([
  "what", "which", "who", "whom", "whose", "where", "when", "why", "how",
  "is", "are", "was", "were", "be", "been", "do", "does", "did", "can",
  "could", "would", "should", "the", "a", "an", "of", "to", "in", "on",
  "at", "for", "from", "by", "about", "explain", "tell", "me", "please",
  "much", "many", "give", "find", "search",
  // contractions/possessives with the apostrophe stripped ("what's" -> "whats")
  "whats", "isnt", "doesnt", "dont", "didnt", "cant", "wont", "whos", "hows",
  "thats", "theres", "heres", "shouldnt", "couldnt", "wouldnt", "hasnt",
  "havent", "hadnt", "im", "youre", "theyre", "hes", "shes", "its",
  "right", "wrong", "now", "today", "currently",
]);

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`Wikipedia answered ${response.status}`);
  return response.json();
}

/** Tiny UK → US map so British questions still hit American-English Wikipedia. */
const UK_US: Record<string, string> = {
  colour: "color", behaviour: "behavior", honour: "honor", favour: "favor",
  neighbour: "neighbor", centre: "center", theatre: "theater", metre: "meter",
  fibre: "fiber", analyse: "analyze", organise: "organize", minimise: "minimize",
  defence: "defense", offence: "offense", licence: "license", litre: "liter",
};

const american = (word: string): string => UK_US[word] ?? word;

function coreOf(question: string): string {
  const words = question
    .replace(/[^a-zA-Z0-9\s'-]/g, " ")
    .split(/\s+/)
    .map((word) => american(word.replace(/'/g, "").toLowerCase()))
    .filter((word) => word.length > 1 && !QUERY_STOPWORDS.has(word));
  return words.slice(0, 8).join(" ").trim();
}

function pageUrl(title: string): string {
  return `https://en.wikipedia.org/wiki/${title.replace(/ /g, "_")}`;
}

type OpenSearch = [string, string[], string[], string[]];

async function titlesOf(query: string, limit: number): Promise<string[]> {
  const url =
    `${API}?action=opensearch&search=${encodeURIComponent(query)}` +
    `&limit=${limit}&namespace=0&format=json&origin=*`;
  const data = (await fetchJson(url)) as OpenSearch;
  return Array.isArray(data) && Array.isArray(data[1]) ? data[1] : [];
}

const countOverlap = (title: string, tokens: string[]): number => {
  const t = title.toLowerCase();
  return tokens.filter((token) => t.includes(token)).length;
};

/**
 * Pick the Wikipedia article that actually matches the query. Wikipedia's
 * open search is literal and sometimes returns a page whose title shares no
 * words with the question ("population mumbai" -> "Population of Dubai"), so
 * candidates must share every query token (single-token cores) or at least
 * two tokens. When nothing survives, the trailing entity of the query — the
 * place or thing usually sits last in English questions — is searched on its
 * own and its page accepted.
 */
async function pickTitle(core: string): Promise<string | null> {
  const tokens = core.split(" ").filter(Boolean);
  if (tokens.length === 0) return null;

  try {
    const titles = await titlesOf(core, 5);
    let best: string | null = null;
    let bestScore = 0;
    for (const title of titles) {
      const overlap = countOverlap(title, tokens);
      const ok = tokens.length === 1 ? overlap === 1 : overlap >= 2;
      if (ok && overlap > bestScore) {
        best = title;
        bestScore = overlap;
      }
    }
    if (best) return best;

    const entity = tokens[tokens.length - 1];
    if (entity.length >= 3) {
      const fallback = await titlesOf(entity, 3);
      return fallback.find((title) => title.toLowerCase().includes(entity)) ?? null;
    }
    return null;
  } catch {
    return null;
  }
}

type QueryResult = {
  query?: { pages?: Record<string, { title?: string; extract?: string }> };
};

/**
 * Resolve a question to a Wikipedia summary, or null when nothing usable
 * comes back. The query core (stopwords removed, most distinctive tokens
 * kept) is matched against candidate article titles, so an off-topic hit
 * like "Population of Dubai" for "population mumbai" is rejected.
 */
export async function wikipediaLookup(question: string): Promise<WebAnswer | null> {
  const cleaned = question.trim().replace(/\s+/g, " ");
  if (cleaned.length < 2) return null;

  const core = coreOf(cleaned);
  if (!core) return null;

  const title = await pickTitle(core);
  if (!title) return null;

  try {
    const url =
      `${API}?action=query&prop=extracts&exintro=1&explaintext=1` +
      `&redirects=1&exchars=1100&format=json&origin=*&titles=${encodeURIComponent(title)}`;
    const data = (await fetchJson(url)) as QueryResult;
    const page = Object.values(data.query?.pages ?? {})[0];
    const extract = page?.extract?.trim();
    if (!page?.title || !extract) return null;
    // the extract must carry the question's subject vocabulary — otherwise the
    // search wandered onto an adjacent page (an answer about the wrong thing
    // is worse than the refusal)
    const coreTokens = core.split(" ");
    const subjectTokens = coreTokens.slice(0, -1);
    if (subjectTokens.length > 0) {
      const haystack = extract.toLowerCase();
      const carries = subjectTokens.some((token) => haystack.includes(token));
      if (!carries) return null;
    }
    return { title: page.title, extract, url: pageUrl(page.title) };
  } catch {
    return null;
  }
}
