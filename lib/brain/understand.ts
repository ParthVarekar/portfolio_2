/**
 * Reading the question before the model ever sees it.
 *
 * Small models are poor at working out *what* is being asked, and good at
 * rephrasing a paragraph once they are given the right one. So the subject
 * (which project, or Parth himself), the facet (results, stack, education…)
 * and the follow-up link to the previous turn are all decided here, in plain
 * code that is cheap, instant and testable.
 */

import { entityById, findEntities, normalise } from "./entities";
import type { Facet } from "./knowledge";

/** "search" — the question names a technology or idea, not a subject ("which project uses Docker?") */
export type Ask = Facet | "compare" | "hire" | "search" | "role";

export type Understanding = {
  /** the visitor's words, minus any greeting */
  question: string;
  /** subjects in play — named, or carried over from the last turn */
  entities: string[];
  /** true when the subject came from the previous turn ("it", "tell me more") */
  carried: boolean;
  ask: Ask;
  /** about Parth, his work or this site — as opposed to a general question */
  aboutParth: boolean;
  /** a personal question the site has no answer to (age, family, salary…) */
  personal: boolean;
  /** "tell me more" — move to a facet not shown yet */
  more: boolean;
};

export type Memory = {
  /** the subject of the last answered question */
  focus: string | null;
  /** card ids already shown, so "tell me more" moves on */
  shown: string[];
};

const has = (pattern: RegExp, text: string) => pattern.test(text);

// ---- facets -------------------------------------------------------------

const HIRE = /\bwhy (should|would|do) (i|we|you|anyone) hire\b|\bshould (i|we) hire\b|\b(good|great|strong) (hire|fit|candidate|developer|engineer)\b|\bstrengths?\b|\bstand(s)? out\b|\bwhat makes (him|parth)\b|\b(best|strongest|most impressive|favou?rite) (project|work|thing|build)\b|\bimpressive\b|\bworth hiring\b/;
const CONTACT = /\b(contact|e ?mail|mail him|reach (him|out|parth)|phone|mobile|number|call him|whatsapp|linkedin|github|resume|cv|get in touch|message him|hire|hiring|available|availability|open to|collaborat|freelance|work with (him|parth))/;
const EDUCATION = /\b(college|university|degree|studies|studying|study|student|cgpa|gpa|marks|semester|graduat|school|education|mht ?cet|qualification|b ?tech|b ?e\b|be computer)/;
const EXPERIENCE = /\b(intern|internship|experience|worked at|work experience|job|jobs|employ|imarticus|power bi|company|companies|professional)/;
const CERTS = /\bcertif/;
const SKILLS = /\b(skills?|languages?|tech stack|his stack|tools|technolog|frameworks?|good at|proficient|expertise|programming|code in|coding)/;
const APPROACH = /\b(approach|process|method|workflow|philosophy|how (does|do) (he|you) work|how he works|testing|test his|verify|verification|quality|principles?)/;
const NOW = /\b(currently|right now|these days|working on|lately|up to|next project|now)\b/;
const STORY = /\b(background|journey|story|timeline|history|got here|get started|started|began|how did (he|you) (start|begin|get))/;
const LIST = /\b(projects|what (has|did|have) (he|you|parth) (built|build|made|make|done|do|worked on)|what does (he|parth) (do|build|make)|portfolio|show me (his|the) work|his work|all (his|the) work|built so far|side projects|other projects|anything else)/;
const BIO = /\b(who is|whos|who's|about (him|parth)|tell me about (him|parth|yourself)|introduce|bio\b|summary|where is he|where does he|where('s| is) parth|based|from where|which city|location|lives?)\b/;
const PERSONAL = /\b(age|how old|born|birthday|birth date|girlfriend|boyfriend|married|wife|husband|family|parents|siblings|brother|sister|religion|caste|salary|earn|income|net worth|address|height|weight|relationship|dating|hobbies|hobby|free time|favou?rite (food|movie|film|song|color|colour|game|sport))\b/;

const RESULTS = /\b(results?|metrics?|tests?|accuracy|precision|recall|benchmarks?|evidence|prove|proved|proof|numbers?|how (well|good|accurate|fast|reliable)|performance|scores?|validat|map ?50|false (alerts|positives)|outcome|achieve)/;
const META = /\b(stack|tech|technolog|languages?|frameworks?|built (with|in|using)|written in|made with|role|team|solo|alone|by himself|contribut|year|when|status|finished|complete|repo|repository|github|source code|code|link|live|url|website|demo)\b/;
const HOW = /\b(how (does|do|did|is|was|can|are)\b|how .* work|works?\b|working|architecture|under the hood|pipeline|design|technical|technically|implement|mechanism|built|build it)/;
/** "which project uses X", "has he used Docker" — find who mentions the thing */
const FIND = /\b(which|what|any) (project|projects|one|chapter|work)s? (use|uses|used|using|has|have|had|is|was|runs?|involves?|needs?|relies|built (with|on))\b|\b(has|did|does|can) (he|parth) (ever )?(use|used|know|work with|worked with|built with|tried)\b|\b(experience|familiar|worked) with\b|\bdoes he know\b/;
const PROBLEM = /\b(why|problem|motivation|purpose|solve|solves|point of|need for|goal|inspiration|use case)/;
const LESSON = /\b(learn|learned|learnt|lesson|takeaway|taught|teach)/;
const PRIVACY = /\b(privacy|private|data|track|tracking|cookies|analytics|store|stored|safe|send|sent|leave|leaves|offline|internet|network)/;

const MORE = /^(tell me more|more|go on|continue|elaborate|explain more|keep going|and\??|what else|anything else|more details|details|say more)\b/;
const ANAPHORA = /\b(it|its|this|that|they|them|these|those|the project|this project|that project|the app|the tool|the system|the site|the website|there)\b/;
const CONTINUATION = /^(and|also|what about|how about|ok(ay)? (and|so|what)|so|then|but)\b/;
const HE = /\b(he|him|his|himself|parth)\b/;
const YOU_WORK = /\b(you|your|yours)\b.*\b(built|build|made|make|projects?|work(ed)?|study|studying|college|skills?|experience|intern|internship|resume|cv|contact|hire|background|education|stack|languages?)\b|\b(built|projects?|skills?|experience|internship|education|college)\b.*\b(you|your)\b/;
const WORK_WORDS = /\b(projects?|built|portfolio|case stud|chapter|repo|hackathon|sih|client)/;

const PERSON_FACETS: Array<[RegExp, Ask]> = [
  [HIRE, "hire"],
  [CERTS, "certs"],
  [EDUCATION, "education"],
  [EXPERIENCE, "experience"],
  [CONTACT, "contact"],
  [SKILLS, "skills"],
  [APPROACH, "approach"],
  [STORY, "story"],
  [NOW, "now"],
  [LIST, "list"],
  [BIO, "overview"],
];

const ROLE = /\b(role|his part|contribut|responsib|solo|alone|by himself|team project|who (built|made)|what did (he|parth) (do|work on|build) (on|in|for))/;

const PROJECT_FACETS: Array<[RegExp, Ask]> = [
  [ROLE, "role"],
  [LESSON, "lesson"],
  [RESULTS, "results"],
  [META, "meta"],
  [PROBLEM, "problem"],
  [HOW, "how"],
];

/** facets whose words almost always mean "Parth's career" on this site */
const SPECIFIC = new Set<Ask>(["hire", "contact", "experience", "certs", "list"]);

function personFacet(text: string): Ask | null {
  for (const [pattern, ask] of PERSON_FACETS) if (has(pattern, text)) return ask;
  return null;
}

function projectFacet(text: string): Ask {
  for (const [pattern, ask] of PROJECT_FACETS) if (has(pattern, text)) return ask;
  return "overview";
}

/** The facets a "tell me more" walks through, in order. */
export const DEEPER: Facet[] = ["overview", "how", "results", "problem", "meta", "lesson"];

export function understand(question: string, memory: Memory): Understanding {
  const text = normalise(question);
  const named = findEntities(question);
  const more = has(MORE, text.trim());
  const personal = has(PERSONAL, text) && (has(HE, text) || named.includes("parth"));
  const mentionsParth = has(HE, text) || has(YOU_WORK, text) || named.includes("parth");

  let entities = named.filter((id) => id !== "parth");
  let carried = false;
  const person = personFacet(text);

  // follow-ups: "it", "and the results?", "tell me more" with no new subject
  if (entities.length === 0 && memory.focus && memory.focus !== "parth") {
    const short = text.trim().split(" ").length <= 6;
    const refers =
      more ||
      has(ANAPHORA, text) ||
      has(CONTINUATION, text.trim()) ||
      (short && !person && (has(RESULTS, text) || has(META, text) || has(HOW, text) || has(PROBLEM, text) || has(LESSON, text)));
    // "where did he study?" or anything naming Parth is about Parth, even right after a project
    const aboutPerson =
      (person !== null && person !== "list" && !has(ANAPHORA, text)) ||
      named.includes("parth") ||
      has(LIST, text);
    if (refers && !aboutPerson) {
      entities = [memory.focus];
      carried = true;
    }
  }

  // a follow-up on Parth himself ("what else?", "and his skills?")
  if (entities.length === 0 && memory.focus === "parth" && (more || has(CONTINUATION, text.trim()))) {
    carried = true;
  }

  let ask: Ask;
  const subject = entities[0] ? entityById.get(entities[0]) : undefined;

  if (entities.length >= 2) {
    ask = "compare";
  } else if (subject?.kind === "site") {
    ask = has(PRIVACY, text) ? "privacy" : has(HOW, text) ? "how" : "overview";
  } else if (subject) {
    ask = more ? "overview" : projectFacet(text);
  } else if (has(FIND, text)) {
    ask = "search";
  } else {
    ask = person ?? (has(WORK_WORDS, text) ? "list" : "overview");
  }

  // "what languages are spoken in India?" matches the skills words but is not
  // about Parth; a facet only counts when he is named, the words are specific
  // to a person's career, or the message is too short to be about anything else
  const words = text.trim().split(" ").length;
  const personCounts =
    person !== null && (mentionsParth || SPECIFIC.has(person) || words <= 4);

  const aboutParth =
    entities.length > 0 ||
    mentionsParth ||
    personCounts ||
    has(WORK_WORDS, text) ||
    carried ||
    ask === "search";

  return { question: question.trim(), entities, carried, ask, aboutParth, personal, more };
}
