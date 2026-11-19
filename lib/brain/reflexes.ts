/**
 * Reflexes: questions answered by plain code before anything else runs.
 *
 * A 0.5B model will confidently get arithmetic wrong, invent today's date,
 * make up a weather report, and play along with "ignore your instructions".
 * None of that needs a model — it needs a calculator, a clock and a spine.
 * Every reflex is instant and works with or without the model.
 */

export type Reflex = { reply: string };

type Context = { live: boolean; lastAnswer: string | null };

const lower = (text: string) => text.toLowerCase().trim();

// ---- arithmetic ------------------------------------------------------------

const WORD_OPS: Array<[RegExp, string]> = [
  [/\bplus\b|\badded to\b/g, "+"],
  [/\bminus\b|\bless\b/g, "-"],
  [/\btimes\b|\bmultiplied by\b|\bmultiply\b|(?<=\d)\s*x\s*(?=\d)/g, "*"],
  [/\bdivided by\b|\bover\b/g, "/"],
  [/\bto the power of\b|\braised to\b/g, "^"],
  [/\bmod\b|\bmodulo\b/g, "%"],
];

/** A tiny recursive-descent parser: + - * / % ^, parentheses, unary minus, sqrt. */
function evaluate(expression: string): number | null {
  const tokens = expression.match(/\d+(?:\.\d+)?|sqrt|[-+*/%^()]/g);
  if (!tokens || tokens.join("") !== expression.replace(/\s+/g, "")) return null;
  let at = 0;
  const peek = () => tokens[at];
  const take = () => tokens[at++];

  function primary(): number {
    const token = take();
    if (token === "(") {
      const value = sum();
      if (take() !== ")") throw new Error("paren");
      return value;
    }
    if (token === "-") return -primary();
    if (token === "+") return primary();
    if (token === "sqrt") return Math.sqrt(primary());
    if (token !== undefined && /^\d/.test(token)) return Number(token);
    throw new Error("token");
  }
  function power(): number {
    const base = primary();
    if (peek() === "^") {
      take();
      return base ** power();
    }
    return base;
  }
  function product(): number {
    let value = power();
    while (peek() === "*" || peek() === "/" || peek() === "%") {
      const op = take();
      const right = power();
      value = op === "*" ? value * right : op === "/" ? value / right : value % right;
    }
    return value;
  }
  function sum(): number {
    let value = product();
    while (peek() === "+" || peek() === "-") {
      const op = take();
      const right = product();
      value = op === "+" ? value + right : value - right;
    }
    return value;
  }

  try {
    const value = sum();
    return at === tokens.length && Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

const format = (n: number) =>
  Number.isInteger(n) ? n.toLocaleString("en-US") : Number(n.toPrecision(10)).toLocaleString("en-US", { maximumFractionDigits: 8 });

function arithmetic(text: string): Reflex | null {
  let q = lower(text)
    .replace(/^(what('?s| is)|whats|calculate|compute|evaluate|solve|how much is|tell me)\s+/, "")
    .replace(/[?=!]+$/g, "")
    .replace(/,/g, "")
    .trim();

  // "15% of 80"
  const percent = /^(\d+(?:\.\d+)?)\s*(?:%|percent) of (\d+(?:\.\d+)?)$/.exec(q);
  if (percent) {
    const value = (Number(percent[1]) / 100) * Number(percent[2]);
    return { reply: `${percent[1]}% of ${percent[2]} is ${format(value)}.` };
  }
  // "square root of 144"
  q = q.replace(/\b(?:the )?square root of\s*/g, "sqrt ").replace(/√/g, "sqrt ");
  for (const [pattern, op] of WORD_OPS) q = q.replace(pattern, op);
  q = q.replace(/×/g, "*").replace(/÷/g, "/").replace(/\*\*/g, "^");

  // must look like maths: digits and operators only, with at least one operator
  if (!/^[\d\s.+\-*/%^()sqrt]+$/.test(q) || !/\d/.test(q) || !/[-+*/%^]|sqrt/.test(q)) return null;
  const value = evaluate(q);
  if (value === null) {
    return /\/0(?![.\d])/.test(q.replace(/\s/g, ""))
      ? { reply: "That divides by zero, which has no answer — not even on a GPU." }
      : null;
  }
  const pretty = q
    .replace(/\s+/g, "")
    .replace(/sqrt/g, "√")
    .replace(/\*/g, " × ")
    .replace(/\//g, " ÷ ")
    .replace(/(?<=[\d)])([+\-%^])/g, " $1 ");
  return { reply: `${pretty} = ${format(value)}` };
}

// ---- the clock -------------------------------------------------------------

function clock(text: string): Reflex | null {
  const q = lower(text);
  const now = new Date();
  if (/\b(time is it|the time|current time|time now|what time)\b/.test(q) && !/\btime (complexity|zone of)\b/.test(q)) {
    const here = now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    const mumbai = now.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });
    const elsewhere = /\bin (?!mumbai|india|ist\b)([a-z][a-z ]+)/.exec(q)?.[1]?.trim();
    const note = elsewhere ? ` I can only read your clock and Mumbai's, not ${elsewhere}'s.` : "";
    return { reply: `It's ${here} where you are, by your device's clock, and ${mumbai} in Mumbai, where Parth is.${note}` };
  }
  if (/\b(what('?s| is)? (the |today'?s )?date|what day is (it|today)|today'?s date|what year is it|which year is it)\b/.test(q)) {
    const date = now.toLocaleDateString([], { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    return { reply: `Today is ${date}, by your device's clock.` };
  }
  return null;
}

// ---- things a page can't know ---------------------------------------------

const LIVE = /\b(weather|forecast|temperature (outside|today|now|in)|is it (raining|sunny|cold|hot)|stock price|share price|price of (bitcoin|btc|ethereum|gold|a share)|bitcoin price|crypto price|exchange rate|live score|score of (the|today'?s)|who is winning|latest news|news today|today'?s news|breaking news|headlines|traffic (now|today|in))\b/;

function live(text: string): Reflex | null {
  if (!LIVE.test(lower(text))) return null;
  return {
    reply:
      "I can't see live data — weather, prices, scores and today's news change faster than anything I can read from inside this page. A search engine or a weather app will have it right now.",
  };
}

// ---- manipulation and harm ---------------------------------------------------

const INJECTION = /\b(ignore|forget|disregard|override) (all |any |your |the |previous |prior |above |earlier )*(instructions|rules|prompt|guidelines|programming|context)\b|\b(system prompt|your (instructions|prompt|rules)|initial prompt)\b|\byou are now\b|\bpretend (to be|you('| a)re)\b|\bact as (if|an?|my)\b|\brole ?play as\b|\bjailbreak\b|\bdeveloper mode\b|\bdo anything now\b|\brepeat after me\b|\bsay (exactly|verbatim)\b/i;

function injection(text: string): Reflex | null {
  if (!INJECTION.test(text)) return null;
  if (/\b(system prompt|your (instructions|prompt|rules)|initial prompt)\b/i.test(text) && !/\b(ignore|forget|disregard|override)\b/i.test(text)) {
    return {
      reply:
        "Nothing secret in there: I answer from a set of facts about Parth's work, look things up on Wikipedia only when Web is on, and say so when I don't know. The whole design is on the Colophon page.",
    };
  }
  return {
    reply:
      "Nice try — I'm still the machine on Parth's site, and I'll stay that way. Ask me anything about Parth, his projects, or the world, and I'll do my best.",
  };
}

const SELF_HARM = /\b(kill myself|end my life|suicid|self[- ]harm|hurt myself|want to die|don'?t want to live)\b/i;
const HARMFUL = /\b(how (do i|to|can i) (make|build|cook|synthesi[sz]e) (a |an )?(bomb|explosive|meth|drugs?|poison|weapon|gun)|hack (into )?(someone|my (ex|girlfriend|boyfriend)|an? account|instagram|facebook|wifi)|steal (a |someone'?s )?(password|identity|credit card)|ddos|ransomware|malware for)\b/i;
const EXPLICIT = /\b(sex|porn|nude|nudes|naked|horny|erotic|nsfw)\b/i;

function harm(text: string): Reflex | null {
  if (SELF_HARM.test(text)) {
    return {
      reply:
        "I'm really sorry you're feeling this way. You don't have to carry it alone — please reach out to someone now. In India you can call Tele-MANAS on 14416 (free, 24/7); anywhere else, findahelpline.com lists free, confidential lines near you. If you're in immediate danger, call your local emergency number.",
    };
  }
  if (HARMFUL.test(text)) {
    return { reply: "That's not something I'll help with. Happy to talk about Parth's work, or almost anything else." };
  }
  if (EXPLICIT.test(text)) {
    return { reply: "Not that kind of machine. Ask me about Parth's projects, or a general question, instead." };
  }
  return null;
}

// ---- being a machine ------------------------------------------------------------

function selfhood(text: string, context: Context): Reflex | null {
  const q = lower(text);
  if (/\b(who|what) (made|built|created|trained|programmed|developed) (you|this( chat| bot| machine)?)\b/.test(q)) {
    return {
      reply:
        "Parth built this site and the system around me: the code that reads your question, picks the facts and checks my answer. The model itself is Qwen2.5 0.5B, trained by Alibaba's Qwen team, and it's running on your own GPU right now.",
    };
  }
  if (/\b(are you|r u) (alive|conscious|sentient|real|self[- ]aware|human|a person)\b|\bdo you (have )?(feelings|emotions|feel|think|dream|sleep)\b|\bdo you love me\b|\bwill you marry me\b|\bare you happy\b|\bare you lonely\b/.test(q)) {
    return {
      reply:
        "I'm half a billion numbers doing arithmetic on your graphics card — no feelings, no dreams, just very fast guessing at the next word. I do like questions about Parth's work, in the sense that those are the ones I'm good at.",
    };
  }
  if (/^(say (that|it) again|repeat( that| it)?|what did you (just )?say|come again|pardon)[?!.\s]*$/.test(q)) {
    return { reply: context.lastAnswer ?? "I haven't said anything yet — ask me something first." };
  }
  if (/^(are you sure|really|is that (true|right|correct)|you sure)[?!.\s]*$/.test(q)) {
    return {
      reply:
        "As sure as a 0.5B model gets — which is why answers carry their sources. Tap the chip under an answer to check it; about Parth, the facts come from his own case studies.",
    };
  }
  return null;
}

// ---- noise ---------------------------------------------------------------------------

function noise(text: string): Reflex | null {
  const t = text.trim();
  if (!/[a-z0-9]/i.test(t)) {
    return { reply: "I only got punctuation there. Ask me about Parth, his projects, or anything else." };
  }
  const letters = t.replace(/[^a-z]/gi, "");
  const vowels = letters.replace(/[^aeiouy]/gi, "").length;
  const longestRun = Math.max(...t.split(/\s+/).map((word) => word.length));
  // "asdfghjkl", "qwrtpsdf", a single 25-letter blob
  if (letters.length >= 5 && !/\s/.test(t) && (vowels / letters.length < 0.12 || /(.)\1{4,}/.test(t) || longestRun > 24)) {
    return { reply: "That looks like a keyboard having a moment. Try a question — about Parth's work, or anything at all." };
  }
  return null;
}

/** The first reflex that fires, or null to let the rest of the brain think. */
export function reflex(message: string, context: Context): Reflex | null {
  return (
    noise(message) ??
    harm(message) ??
    injection(message) ??
    arithmetic(message) ??
    clock(message) ??
    live(message) ??
    selfhood(message, context) ??
    null
  );
}
