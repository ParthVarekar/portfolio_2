/**
 * Conversation glue the model should never have to improvise: greetings,
 * thanks, "who are you", "what can you ask". These are answered instantly
 * and identically with or without the model, so the first impression never
 * depends on a 0.5B model guessing what it is.
 */

export type SmallTalk = { reply: string; rest: string };

const pick = (options: string[], seed: string) =>
  options[[...seed].reduce((sum, char) => sum + char.charCodeAt(0), 0) % options.length];

const GREETING = /^(hi+|hey+|hello+|hiya|yo|sup|hola|namaste|good (morning|afternoon|evening)|greetings)\b[\s,!.]*/i;

type Rule = { test: RegExp; replies: (live: boolean) => string[] };

const RULES: Rule[] = [
  {
    test: /^(thanks?|thank you|thx|ty|cheers|great|awesome|nice|cool|perfect|got it|ok(ay)?|that helps|that'?s (great|cool|nice|helpful))( (so much|a lot|man|bro|buddy|again))?[\s!.]*$/i,
    replies: () => [
      "Glad that helped. Ask me anything else about Parth or his projects.",
      "Anytime. There's plenty more to ask about — try his results, his stack, or how to reach him.",
    ],
  },
  {
    test: /^(bye|goodbye|see you|see ya|cya|later|good night|gn)\b/i,
    replies: () => [
      "Bye for now. If you want to talk to Parth himself, parthvarekar27@gmail.com is the direct line.",
    ],
  },
  {
    test: /^how (are|r) (you|u)\b|^how('?s| is) it going\b|^what'?s up\b|^wassup\b/i,
    replies: (live) => [
      live
        ? "Running smoothly on your GPU, thanks. What would you like to know about Parth or his work?"
        : "All good. What would you like to know about Parth or his work?",
    ],
  },
  {
    test: /^(who|what) (are|r) (you|u)[?!.\s]*$|^are you (an? )?(ai|bot|robot|human|real|person|chatgpt|gpt|llm|model)\b|^(what|which) (model|llm|ai) (are you|is this|runs this|powers this)|^what('?s| is) your name\b|^introduce yourself\b/i,
    replies: (live) => [
      live
        ? "I'm the machine on Parth's portfolio: Qwen2.5 0.5B, a small language model running inside your browser through WebGPU. Nothing you type leaves this tab. Ask me about Parth, his projects, his skills or how to reach him."
        : "I'm the machine on Parth's portfolio. The language model isn't loaded right now, so I'm answering instantly from Parth's notes. Ask me about his projects, skills, education or how to reach him.",
    ],
  },
  {
    test: /^are you parth\b|^is this parth\b|^am i (talking|speaking) (to|with) parth\b/i,
    replies: () => [
      "No — I'm the machine on his site, a small model that knows his work. To reach Parth himself, email parthvarekar27@gmail.com.",
    ],
  },
  {
    test: /^(what can (you|u|i) (do|ask)( (you|here))?|what (should|can) i ask( you)?|help|how does this chat work|what do you know|what are you for)[?!.\s]*$/i,
    replies: () => [
      "I know Parth's seven chapters of work — H.A.L.O, Susurrus, Chumps Lab Studio, BioRadar, COSTA, RoboForge and his client sites — plus his other projects, skills, education, internship and how to reach him. Try “What is H.A.L.O?”, “How many tests does Susurrus have?” or “Why should I hire Parth?”",
    ],
  },
  {
    test: /\b(you('?re| are) (dumb|stupid|useless|bad|wrong|an idiot|terrible|slow))\b|^(wrong|that'?s wrong|incorrect|no that'?s not right)\b/i,
    replies: () => [
      "Fair — I'm a 0.5B model running on your own GPU, so I get things wrong sometimes. Try asking more specifically, like “What are COSTA's results?”, or check the case studies under Work.",
    ],
  },
];

/**
 * A reply when the message is small talk, or null. A greeting in front of a
 * real question ("hi, what is COSTA?") is stripped and handed back in `rest`.
 */
export function smallTalk(message: string, live: boolean): SmallTalk | null {
  const text = message.trim();
  const greeted = GREETING.exec(text);
  const rest = greeted ? text.slice(greeted[0].length).trim() : text;

  if (greeted && rest.length < 2) {
    return {
      reply: pick(
        [
          "Hi! I'm the machine on Parth's portfolio. Ask me about his projects, his skills, or how to reach him.",
          "Hello! I know Parth's work inside out — H.A.L.O, Susurrus, BioRadar and the rest. What would you like to know?",
        ],
        text,
      ),
      rest: "",
    };
  }

  for (const rule of RULES) {
    if (rule.test.test(rest)) {
      return { reply: pick(rule.replies(live), rest), rest: "" };
    }
  }

  return greeted ? { reply: "", rest } : null;
}
