/**
 * The machine's memory: small, self-contained fact cards.
 *
 * A 0.5B model answers well when it is handed two or three short, clean
 * paragraphs that are all about the thing it was asked. So every card is
 * about exactly one entity and one facet (what it is, how it works, its
 * results, the stack...). The verified prose lives in content/knowledge.json;
 * the structured cards (stack, role, links, skills, contact) are generated
 * here from the same content the site renders, so the machine and the pages
 * can never disagree.
 */

import raw from "@/content/knowledge.json";
import { projects } from "@/content/projects";
import { resume } from "@/content/resume";
import { site } from "@/content/site";
import { CHAPTERS, ENTITIES, entityById } from "./entities";

export type Facet =
  | "overview"
  | "problem"
  | "how"
  | "results"
  | "lesson"
  | "meta"
  | "list"
  | "education"
  | "experience"
  | "skills"
  | "certs"
  | "contact"
  | "approach"
  | "now"
  | "story"
  | "privacy";

export type Card = {
  id: string;
  entity: string;
  facet: Facet;
  title: string;
  text: string;
  /** a one-line summary of the hard numbers, when the card has them */
  facts?: string;
  source: string;
  url: string;
};

type RawChunk = {
  id: string;
  title: string;
  project: string;
  source: string;
  url: string;
  tags: string[];
  text: string;
  facts?: string;
};

const PROJECT_TO_ENTITY: Record<string, string> = {
  "H.A.L.O": "halo",
  Susurrus: "susurrus",
  "Chumps Lab Studio": "chumps",
  BioRadar: "bioradar",
  COSTA: "costa",
  RoboForge: "roboforge",
  "Client work": "client-work",
  TheArtEvents: "theartevents",
  "SocialxBrand Pilot": "socialxbrand",
  "Gully Culture": "gullyculture",
  ProtoVinci: "protovinci",
  "WMC Virtual Lab": "wmc",
  "Firdosh Marble Arts": "firdosh",
  "Enterprise Knowledge Assistant": "eka",
  Codeframe: "codeframe",
  "Agent Safety Net": "agentsafety",
  "Nexus-AI": "nexus",
  "Shorts Intelligence OS": "shorts",
  StudyOS: "studyos",
  "2'nd Brain": "secondbrain",
  "Local File Intelligence": "fileintel",
  "Parth Operating Assistant": "poco",
  Credence: "credence",
  "Color Vision Assistant": "colorvision",
  Parth: "parth",
  "This site": "site",
};

const FACET_BY_ID: Record<string, Facet> = {
  "portfolio-overview": "list",
  "parth-bio": "overview",
  "parth-github-profile": "overview",
  "parth-approach": "approach",
  "parth-verification": "results",
  "parth-tools": "skills",
  "parth-contact": "contact",
  "parth-hire": "contact",
  "parth-links": "contact",
  "parth-education": "education",
  "parth-internship": "experience",
  "parth-certifications": "certs",
  "portfolio-machine": "overview",
  "portfolio-web": "how",
  "portfolio-privacy": "privacy",
  "portfolio-web-offline": "privacy",
  "eka-details": "how",
};

const FACET_BY_SUFFIX: Array<[RegExp, Facet]> = [
  [/-overview$/, "overview"],
  [/-problem$/, "problem"],
  [/-(decision|build|details)$/, "how"],
  [/-evidence$/, "results"],
  [/-learned$/, "lesson"],
];

/** Links into this site become relative, so chips work on any host. */
function localise(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?parthvarekar\.in/, "") || "/";
}

function facetOf(chunk: RawChunk): Facet {
  if (FACET_BY_ID[chunk.id]) return FACET_BY_ID[chunk.id];
  for (const [pattern, facet] of FACET_BY_SUFFIX) if (pattern.test(chunk.id)) return facet;
  return "overview";
}

/** The chip for a chapter points at its case study on this site; everything else at its source. */
function sourceFor(entityId: string, chunk: RawChunk): { source: string; url: string } {
  const entity = entityById.get(entityId);
  if (entity && CHAPTERS.includes(entityId) && entity.href) {
    return { source: `${entity.name} case study`, url: entity.href };
  }
  return { source: chunk.source, url: localise(chunk.url) };
}

function fromKnowledge(): Card[] {
  return (raw as RawChunk[]).map((chunk) => {
    const entity = PROJECT_TO_ENTITY[chunk.project] ?? "parth";
    return {
      id: chunk.id,
      entity,
      facet: facetOf(chunk),
      title: chunk.title,
      text: chunk.text,
      facts: chunk.facts,
      ...sourceFor(entity, chunk),
    };
  });
}

const SLUG_TO_ENTITY: Record<string, string> = {
  halo: "halo",
  susurrus: "susurrus",
  "chumps-lab": "chumps",
  bioradar: "bioradar",
  costa: "costa",
  roboforge: "roboforge",
  "client-work": "client-work",
};

const bare = (url: string) => url.replace(/^https?:\/\//, "").replace(/\/$/, "");

/** "Team project · data, product, frontend" → a sentence a small model can't misread. */
function roleSentence(title: string, role: string): string {
  const [lead, ...rest] = role.split("·").map((part) => part.trim());
  const parts = (rest.length > 0 ? rest.join(", ") : lead).replace(/, ([^,]+)$/, " and $1");
  if (/^team project/i.test(lead)) {
    return `${title} was a team project; Parth's role was ${parts.toLowerCase()}.`;
  }
  if (/^built at /i.test(lead)) {
    return `Parth built the ${title.toLowerCase()} at ${lead.replace(/^built at /i, "")}, doing ${parts.toLowerCase()}.`;
  }
  return `On ${title}, Parth's role was ${parts.toLowerCase()}.`;
}

/** One "details" card per chapter: status, year, role, team, stack, links. */
function projectDetailCards(): Card[] {
  return projects.map((project) => {
    const entity = SLUG_TO_ENTITY[project.slug] ?? project.slug;
    const parts = [
      `${project.title} is one of the seven main projects on Parth's site, from ${project.year}; its status is ${project.status.toLowerCase()}.`,
      `${project.title}: ${project.subtitle.replace(/\.$/, "")} — ${project.kicker.toLowerCase()}.`,
      roleSentence(project.title, project.role),
      project.team ? `${project.title} team: ${project.team}.` : "",
      `${project.title} is built with ${project.stack.join(", ")}.`,
      `${project.title}'s headline result: ${project.metric} ${project.metricLabel}.`,
      project.repo ? `${project.title}'s code is at ${bare(project.repo)}.` : "",
      project.live ? `${project.title} is live at ${bare(project.live)}.` : "",
    ];
    return {
      id: `${project.slug}-meta`,
      entity,
      facet: "meta" as Facet,
      title: `${project.title} details`,
      text: parts.filter(Boolean).join(" "),
      source: `${project.title} case study`,
      url: `/work/${project.slug}`,
    };
  });
}

/** Beyond the seven chapters: one line per side project, from its overview card. */
function otherProjectsCard(cards: Card[]): Card {
  const others = ENTITIES.filter(
    (entity) => entity.kind === "project" && !CHAPTERS.includes(entity.id),
  );
  const lines = others
    .map((entity) => {
      const overview = cards.find((card) => card.entity === entity.id && card.facet === "overview");
      if (!overview) return null;
      const first = overview.text.split(/(?<=\.)\s+/)[0]
        .replace(/^Parth built /, "")
        .replace(/\.$/, "");
      return first.startsWith(entity.name) ? first : `${entity.name}: ${first}`;
    })
    .filter(Boolean);
  return {
    id: "parth-other-projects",
    entity: "parth",
    facet: "list",
    title: "Other projects",
    text: `Beyond the seven chapters, Parth has built more: ${lines.join("; ")}.`,
    source: "GitHub",
    url: site.github,
  };
}

const GROUP_LEAD: Record<string, string> = {
  Languages: "Parth writes",
  "AI / ML": "In AI and machine learning he works with",
  "Backend & Data": "On the backend and with data he uses",
  "Frontend & Tools": "For frontends and tooling he uses",
};

function profileCards(): Card[] {
  // the résumé's skill groups, as sentences rather than a table
  const skills = resume.skills
    .map((group) => `${GROUP_LEAD[group.label] ?? `${group.label}:`} ${group.items.join(", ")}.`)
    .join(" ");
  return [
    {
      id: "parth-skills",
      entity: "parth",
      facet: "skills",
      title: "Skills",
      text: skills,
      source: "Résumé",
      url: "/resume/parth-varekar-resume.pdf",
    },
    {
      id: "parth-contact-details",
      entity: "parth",
      facet: "contact",
      title: "Contact details",
      text: `Email: ${site.email}. Phone and WhatsApp: ${site.phone}. GitHub: github.com/ParthVarekar. LinkedIn: linkedin.com/in/parth-varekar-601432344. Website: parthvarekar.in. His résumé is a PDF on the contact page. He is in Mumbai, India, on IST. Email is the fastest way to reach him.`,
      source: "Contact",
      url: "/contact",
    },
    {
      id: "parth-now",
      entity: "parth",
      facet: "now",
      title: "Right now",
      text: "Right now Parth is finishing Chumps Lab Studio and widening its assistant, building small local-first tools that run on ordinary hardware, taking on client builds through ProtoVinci, and looking for internships and collaborations in applied AI.",
      source: "About",
      url: "/about",
    },
    {
      id: "parth-story",
      entity: "parth",
      facet: "story",
      title: "How Parth got here",
      text: "In 2024 Parth started Computer Engineering at Excelsior KC College of Engineering (Thane), University of Mumbai, class of 2028, and added a 120-hour data-science internship at Imarticus Learning and a Full-Stack Java certification through EduSkills, both with an A+ grade. In 2025 he worked across three Smart India Hackathon problem statements: on-board procedure intelligence, biodiversity eDNA and optical acquisition. From 2025 to 2026 he shipped three live client sites at ProtoVinci. In 2026 he built H.A.L.O, Susurrus, Chumps Lab Studio, BioRadar, COSTA and RoboForge — different domains, one question: can the machine explain itself?",
      source: "About",
      url: "/about",
    },
  ];
}

let cache: Card[] | null = null;

export function allCards(): Card[] {
  if (cache) return cache;
  const base = fromKnowledge();
  cache = [...base, ...projectDetailCards(), ...profileCards()];
  cache.push(otherProjectsCard(cache));
  return cache;
}

export function cardsFor(entity: string, facet?: Facet): Card[] {
  return allCards().filter((card) => card.entity === entity && (!facet || card.facet === facet));
}

export function cardById(id: string): Card | undefined {
  return allCards().find((card) => card.id === id);
}
