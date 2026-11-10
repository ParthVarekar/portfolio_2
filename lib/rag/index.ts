import MiniSearch from "minisearch";
import knowledge from "@/content/knowledge.json";

export type KnowledgeChunk = {
  id: string;
  title: string;
  project: string;
  source: string;
  url: string;
  tags: string[];
  text: string;
  facts?: string;
};

export type Retrieval = {
  chunk: KnowledgeChunk;
  score: number;
};

const chunks = knowledge as KnowledgeChunk[];
const chunksById = new Map(chunks.map((chunk) => [chunk.id, chunk]));

const STOPWORDS = new Set([
  "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
  "what", "which", "who", "whom", "whose", "when", "where", "why",
  "how", "does", "do", "did", "can", "could", "would", "should",
  "i", "me", "my", "we", "our", "you", "your", "it", "its", "this",
  "that", "these", "those", "of", "to", "in", "on", "at", "for",
  "and", "or", "but", "with", "about", "from", "by", "as", "please",
  "tell", "give", "explain", "there", "here", "have", "has", "had",
  "work", "works", "working",
]);

const SYNONYMS: Array<[string, string]> = [
  ["space station", "halo iss procedure"],
  ["space", "halo"],
  ["iss", "halo"],
  ["astronaut", "halo"],
  ["orbit", "halo"],
  ["dictation", "susurrus"],
  ["speech to text", "susurrus"],
  ["voice", "susurrus"],
  ["microphone", "susurrus"],
  ["video editor", "chumps"],
  ["tutorial", "chumps"],
  ["editing", "chumps"],
  ["water", "bioradar edna"],
  ["edna", "bioradar"],
  ["species", "bioradar"],
  ["biodiversity", "bioradar"],
  ["beacon", "costa"],
  ["optical", "costa"],
  ["laser", "costa"],
  ["tracking", "costa"],
  ["rover", "roboforge"],
  ["robot", "roboforge"],
  ["simulation", "roboforge"],
  ["client", "client work protovinci"],
  ["agency", "client work socialxbrand"],
  ["website", "client work"],
  ["resume", "about parth"],
  ["contact", "email parth"],
  ["model", "machine webllm"],
  ["privacy", "machine privacy"],
  ["analytics", "privacy"],
  ["cookies", "privacy"],
  ["test", "testing evidence"],
  ["tests", "testing evidence"],
  ["how do you test", "verify evidence approach"],
  ["how you test", "verify evidence approach"],
  ["prove", "results evidence"],
  ["proved", "results evidence"],
  ["proven", "results evidence"],
  ["result", "results evidence"],
  ["results", "results evidence"],
  ["accuracy", "results evidence"],
  ["metric", "results evidence"],
  ["metrics", "results evidence"],
  ["validation", "results evidence"],
  ["validated", "results evidence"],
  ["benchmark", "results evidence"],
  ["page", "machine webllm"],
  ["site", "machine webllm"],
  ["running", "machine webllm"],
  ["runs", "machine webllm"],
];

function normalise(query: string): string {
  return query
    .replace(/\b(?:[a-z]\.){2,}[a-z]\b/gi, (acronym) => acronym.replace(/\./g, ""))
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 0 && !STOPWORDS.has(word))
    .join(" ")
    .trim();
}

function expand(query: string): string {
  let expanded = query;
  for (const [needle, addition] of SYNONYMS) {
    if (query.includes(needle)) expanded += ` ${addition}`;
  }
  return expanded;
}

let index: MiniSearch<KnowledgeChunk> | null = null;

function getIndex() {
  if (index) return index;
  index = new MiniSearch<KnowledgeChunk>({
    fields: ["title", "text", "project", "tags"],
    storeFields: ["id"],
    searchOptions: {
      boost: { title: 2.2, project: 2, tags: 1.5 },
      fuzzy: 0.2,
      prefix: true,
      combineWith: "OR",
    },
  });
  index.addAll(chunks);
  return index;
}

type Intent = "definition" | "how" | "evidence" | "general";

function intentOf(query: string): Intent {
  if (/\b(what is|what's|who is|who's|tell me about|explain|describe)\b/i.test(query)) {
    return "definition";
  }
  if (/\bhow (does|do|did|is|are|can)\b/i.test(query)) return "how";
  if (
    /\b(prove|proved|proven|results?|accurate|accuracy|metrics?|validation|benchmark|how many|how much)\b/i.test(
      query,
    )
  ) {
    return "evidence";
  }
  return "general";
}

const KIND_BONUS: Record<Intent, Record<string, number>> = {
  definition: {
    overview: 2.4,
    results: 1.5,
    build: 1.2,
    decision: 1,
    problem: 0.7,
    lesson: 0.6,
  },
  how: {
    overview: 1.6,
    decision: 1.8,
    build: 1.4,
    results: 1.1,
    problem: 0.7,
    lesson: 0.7,
  },
  evidence: {
    overview: 1.2,
    results: 2.4,
    build: 1,
    decision: 1,
    problem: 0.6,
    lesson: 0.5,
  },
  general: {},
};

function chunkKind(chunk: KnowledgeChunk): string {
  return chunk.title.split(" ").at(-1)?.toLowerCase() ?? "";
}

const PROJECT_ALIASES: Array<[string, string]> = [
  ["space station", "H.A.L.O"],
  ["astronaut", "H.A.L.O"],
  ["orbit", "H.A.L.O"],
  ["halo", "H.A.L.O"],
  ["iss", "H.A.L.O"],
  ["speech to text", "Susurrus"],
  ["dictation", "Susurrus"],
  ["microphone", "Susurrus"],
  ["voice", "Susurrus"],
  ["susurrus", "Susurrus"],
  ["video editor", "Chumps Lab Studio"],
  ["tutorial", "Chumps Lab Studio"],
  ["chumps", "Chumps Lab Studio"],
  ["edna", "BioRadar"],
  ["biodiversity", "BioRadar"],
  ["species", "BioRadar"],
  ["bioradar", "BioRadar"],
  ["beacon", "COSTA"],
  ["optical", "COSTA"],
  ["laser", "COSTA"],
  ["costa", "COSTA"],
  ["rover", "RoboForge"],
  ["robot", "RoboForge"],
  ["simulation", "RoboForge"],
  ["roboforge", "RoboForge"],
  ["theartevents", "TheArtEvents"],
  ["socialxbrand", "SocialxBrand Pilot"],
  ["gully culture", "Gully Culture"],
  ["protovinci", "Client work"],
  ["client", "Client work"],
  ["privacy", "This site"],
  ["analytics", "This site"],
  ["cookies", "This site"],
  ["this site", "This site"],
  ["webllm", "This site"],
  ["machine", "This site"],
  ["page running", "This site"],
  ["parth", "Parth"],
  ["tools", "Parth"],
  ["stack", "Parth"],
  ["projects", "Parth"],
  ["portfolio", "Parth"],
  ["built", "Parth"],
  ["model", "This site"],
  ["webgpu", "This site"],
  ["demo", "This site"],
  ["how do you", "Parth"],
];

export function projectInQuestion(query: string): string | null {
  // Match aliases on a light clean: keep stopwords, drop punctuation and dots
  // in acronyms, so "how do you…" and "H.A.L.O" both work.
  const cleaned = query
    .replace(/\b(?:[a-z]\.){2,}[a-z]\b/gi, (acronym) => acronym.replace(/\./g, ""))
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  for (const [alias, project] of PROJECT_ALIASES) {
    if (cleaned.includes(alias)) return project;
  }
  return null;
}

export function isFollowUpQuestion(query: string): boolean {
  const cleaned = query.trim().toLowerCase();
  if (
    /\b(it|its|it's|they|them|their|that|this|those|these|the same|the project)\b/.test(
      cleaned,
    )
  ) {
    return true;
  }
  return /^(and|also|so|why|how many|how much|what about|tell me more|more|go on)\b/.test(
    cleaned,
  );
}

let corpusTokens: Set<string> | null = null;

function getCorpusTokens(): Set<string> {
  if (corpusTokens) return corpusTokens;
  const set = new Set<string>();
  for (const chunk of chunks) {
    const source = [chunk.title, chunk.text, chunk.project, chunk.tags.join(" ")]
      .join(" ")
      .toLowerCase();
    for (const token of source.split(/[^a-z0-9]+/)) {
      if (token.length >= 3) set.add(token);
    }
  }
  corpusTokens = set;
  return set;
}

/**
 * Cheap out-of-domain screen. The machine must refuse questions that do not
 * touch the portfolio at all. A question passes if it names a known project,
 * or contributes at least two meaningful tokens that appear (or prefix it)
 * in the knowledge base. Pure general knowledge fails the screen for free.
 */
export function hasPortfolioSignal(query: string): boolean {
  if (projectInQuestion(query)) return true;
  // Bare arithmetic is not something the notes can answer.
  if (/\d\s*[+\-*/x=]\s*\d/.test(query)) return false;
  const tokens = query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(
      (token) =>
        (token.length >= 4 || (token.length === 3 && /^[a-z]{3}$/.test(token))) &&
        !STOPWORDS.has(token),
    );
  if (tokens.length === 0) {
    // A question made of nothing but stopwords still deserves the overview,
    // but digit-only noise ("2+2") does not have one.
    return /[a-z]/i.test(query);
  }
  const corpus = getCorpusTokens();
  const matches = new Set<string>();
  for (const token of tokens) {
    if (corpus.has(token)) {
      matches.add(token);
      continue;
    }
    for (const entry of corpus) {
      if (entry.startsWith(token)) {
        matches.add(token);
        break;
      }
    }
  }
  return matches.size >= 2;
}

export function retrieve(query: string, limit = 3): Retrieval[] {
  const cleaned = normalise(query);
  if (!cleaned) {
    // A question made entirely of stopwords ("how do you work?") still deserves
    // a useful answer — point at the overview rather than refuse.
    const fallback = chunksById.get("portfolio-overview");
    return fallback ? [{ chunk: fallback, score: 1 }] : [];
  }

  const intent = intentOf(query);
  const bonuses = KIND_BONUS[intent];
  const focus = projectInQuestion(query);
  const results = getIndex().search(expand(cleaned));
  const ranked: Retrieval[] = [];

  for (const result of results) {
    if (result.score < 0.8) continue;
    const chunk = chunksById.get(String(result.id));
    if (!chunk) continue;
    if (focus && chunk.project !== focus) continue;
    const bonus = bonuses[chunkKind(chunk)] ?? 1;
    ranked.push({ chunk, score: result.score * bonus });
  }

  ranked.sort((a, b) => b.score - a.score);
  const effectiveLimit = intent === "evidence" ? Math.min(limit, 1) : limit;
  return ranked.slice(0, effectiveLimit);
}

export function isEvidenceQuestion(query: string): boolean {
  return intentOf(query) === "evidence";
}

export function topFactHit(answer: string, facts: string): boolean {
  // The first number in KEY FACTS is the headline figure. If the model answer
  // does not quote it, the model has latched onto something else — say the
  // facts verbatim instead of trusting its prose.
  const first = facts.match(/\d+(?:\.\d+)?/)?.[0];
  if (!first) return true;
  return answer.includes(first);
}

function firstSentence(text: string): string {
  const match = text.match(/^[^.!?]*[.!?]/);
  return (match ? match[0] : text).trim();
}

const REPLY_STOPS = new Set([
  "the", "and", "with", "that", "this", "from", "into", "your", "about", "built",
]);

/**
 * The 135M model occasionally shrugs off a definition ("Costa is the name of the
 * project."). If the note[1] overview shares almost no vocabulary with the
 * answer, replace the answer with the overview's first sentence — it is a
 * better sentence than the model wrote. Otherwise keep what it wrote.
 */
export function weakAnswerCheck(
  answer: string,
  note: KnowledgeChunk,
): string | null {
  if (!/overview$/i.test(note.title)) return null;
  const first = firstSentence(note.text);
  if (!first || first.length < 12) return null;
  const sig = first
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 5 && !REPLY_STOPS.has(token));
  if (sig.length === 0) return null;
  const hay = answer.toLowerCase();
  const hits = sig.filter((token) => hay.includes(token)).length;
  return hits >= 2 ? null : first;
}

export function allChunks(): KnowledgeChunk[] {
  return chunks;
}
