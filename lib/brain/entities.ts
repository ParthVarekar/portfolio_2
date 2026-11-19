/**
 * Everything the machine can talk about, and every way a visitor might name it.
 *
 * Aliases are matched on a normalised question (lowercase, dots and
 * punctuation removed, single spaces), longest alias first, on word
 * boundaries — so "H.A.L.O", "halo" and "the space station project" all land
 * on the same entity.
 */

export type EntityKind = "person" | "project" | "client" | "org" | "site";

export type Entity = {
  id: string;
  name: string;
  kind: EntityKind;
  /** the case-study route, when there is one */
  href?: string;
  aliases: string[];
};

export const ENTITIES: Entity[] = [
  {
    id: "parth",
    name: "Parth",
    kind: "person",
    href: "/about",
    aliases: ["parth varekar", "parth", "varekar", "the developer", "the author", "the owner"],
  },
  {
    id: "halo",
    name: "H.A.L.O",
    kind: "project",
    href: "/work/halo",
    aliases: [
      "halo",
      "h a l o",
      "hal o",
      "procedure monitor",
      "space station project",
      "iss project",
      "space project",
      "sih26174",
    ],
  },
  {
    id: "susurrus",
    name: "Susurrus",
    kind: "project",
    href: "/work/susurrus",
    aliases: [
      "susurrus",
      "susurus",
      "dictation app",
      "dictation tool",
      "dictation",
      "push to talk",
      "voice typing",
      "speech to text app",
    ],
  },
  {
    id: "chumps",
    name: "Chumps Lab Studio",
    kind: "project",
    href: "/work/chumps-lab",
    aliases: ["chumps lab studio", "chumps lab", "chumps", "video editor", "tutorial editor"],
  },
  {
    id: "bioradar",
    name: "BioRadar",
    kind: "project",
    href: "/work/bioradar",
    aliases: ["bioradar", "bio radar", "edna", "biodiversity project", "sih25042"],
  },
  {
    id: "costa",
    name: "COSTA",
    kind: "project",
    href: "/work/costa",
    aliases: [
      "costa",
      "coarse optical tracking",
      "optical tracking",
      "beacon tracker",
      "beacon tracking",
      "sih26169",
    ],
  },
  {
    id: "roboforge",
    name: "RoboForge",
    kind: "project",
    href: "/work/roboforge",
    aliases: ["roboforge", "robo forge", "robot forge", "rover project", "hack odyssey", "team odyssey"],
  },
  {
    id: "client-work",
    name: "Client work",
    kind: "client",
    href: "/work/client-work",
    aliases: [
      "client work",
      "client sites",
      "client projects",
      "client websites",
      "clients",
      "client",
      "agency work",
      "freelance",
    ],
  },
  {
    id: "theartevents",
    name: "TheArtEvents",
    kind: "client",
    href: "/work/client-work",
    aliases: ["theartevents", "the art events", "art events"],
  },
  {
    id: "socialxbrand",
    name: "SocialxBrand Pilot",
    kind: "client",
    href: "/work/client-work",
    aliases: ["socialxbrand pilot", "socialxbrand", "social x brand", "socialx brand"],
  },
  {
    id: "gullyculture",
    name: "Gully Culture",
    kind: "client",
    href: "/work/client-work",
    aliases: ["gully culture", "gullyculture", "gully"],
  },
  {
    id: "protovinci",
    name: "ProtoVinci",
    kind: "org",
    href: "/work/client-work",
    aliases: ["protovinci", "proto vinci"],
  },
  {
    id: "wmc",
    name: "WMC Virtual Lab",
    kind: "client",
    aliases: ["wmc virtual lab", "wmc", "virtual lab", "wireless and mobile communication"],
  },
  {
    id: "firdosh",
    name: "Firdosh Marble Arts",
    kind: "client",
    aliases: ["firdosh marble arts", "firdosh", "marble arts"],
  },
  {
    id: "eka",
    name: "Enterprise Knowledge Assistant",
    kind: "project",
    aliases: [
      "enterprise knowledge assistant",
      "knowledge assistant",
      "enterprise assistant",
      "slack rag",
      "aegis qa",
      "aegis",
    ],
  },
  {
    id: "codeframe",
    name: "Codeframe",
    kind: "project",
    aliases: ["codeframe", "code frame", "frigshwar", "design canvas", "figma clone"],
  },
  {
    id: "agentsafety",
    name: "Agent Safety Net",
    kind: "project",
    aliases: ["agent safety net", "agent safety", "safety net", "browser agent safety"],
  },
  {
    id: "nexus",
    name: "Nexus-AI",
    kind: "project",
    aliases: ["nexus ai", "nexus", "coding game", "python game"],
  },
  {
    id: "shorts",
    name: "Shorts Intelligence OS",
    kind: "project",
    aliases: ["shorts intelligence os", "shorts intelligence", "shorts os", "youtube shorts"],
  },
  {
    id: "studyos",
    name: "StudyOS",
    kind: "project",
    aliases: ["studyos", "study os", "gate prep", "gate app"],
  },
  {
    id: "secondbrain",
    name: "2'nd Brain",
    kind: "project",
    aliases: ["2nd brain", "second brain", "2 nd brain"],
  },
  {
    id: "fileintel",
    name: "Local File Intelligence",
    kind: "project",
    aliases: ["local file intelligence", "file intelligence", "semantic file system", "semantic file"],
  },
  {
    id: "poco",
    name: "Parth Operating Assistant",
    kind: "project",
    aliases: ["parth operating assistant", "operating assistant", "telegram assistant", "telegram bot"],
  },
  {
    id: "credence",
    name: "Credence",
    kind: "project",
    aliases: ["credence", "codebyte"],
  },
  {
    id: "colorvision",
    name: "Color Vision Assistant",
    kind: "project",
    aliases: ["color vision assistant", "colour vision assistant", "color vision", "colour vision"],
  },
  {
    id: "site",
    name: "this site",
    kind: "site",
    href: "/colophon",
    aliases: [
      "this site",
      "this website",
      "this page",
      "this portfolio",
      "the portfolio site",
      "your website",
      "web mode",
      "webllm",
      "web llm",
      "webgpu",
      "the machine",
      "this chat",
      "this chatbot",
    ],
  },
];

export const entityById = new Map(ENTITIES.map((entity) => [entity.id, entity]));

/** The seven chapters, in the order the site presents them. */
export const CHAPTERS = ["halo", "susurrus", "chumps", "bioradar", "costa", "roboforge", "client-work"];

export function normalise(text: string): string {
  return ` ${text
    .toLowerCase()
    // possessives first, so "H.A.L.O's" still reads as "h a l o"
    .replace(/[’']s\b/g, "")
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9+#%\s-]/g, " ")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim()} `;
}

const ALIAS_TABLE = ENTITIES.flatMap((entity) =>
  entity.aliases.map((alias) => ({ id: entity.id, alias: normalise(alias) })),
).sort((a, b) => b.alias.length - a.alias.length);

/**
 * Every entity named in the text, in the order they first appear.
 * Longer aliases win, and a matched span is blanked so "chumps lab studio"
 * is not also read as "studio".
 */
export function findEntities(text: string): string[] {
  let haystack = normalise(text);
  const hits: Array<{ id: string; at: number }> = [];
  for (const { id, alias } of ALIAS_TABLE) {
    const at = haystack.indexOf(alias);
    if (at === -1) continue;
    if (!hits.some((hit) => hit.id === id)) hits.push({ id, at });
    haystack = haystack.replace(alias, " ".repeat(alias.length));
  }
  return hits.sort((a, b) => a.at - b.at).map((hit) => hit.id);
}
