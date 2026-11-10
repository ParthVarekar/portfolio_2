import demoAnswers from "@/content/demo-answers.json";

export type DemoAnswer = {
  id: string;
  keywords: string[];
  question: string;
  answer: string;
  sources: { label: string; url: string }[];
};

const answers = demoAnswers as DemoAnswer[];

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function matchDemo(question: string): DemoAnswer | null {
  const q = normalize(question);
  let best: DemoAnswer | null = null;
  let bestScore = 0;

  for (const answer of answers) {
    let score = 0;
    for (const keyword of answer.keywords) {
      const needle = normalize(keyword);
      if (needle && q.includes(needle)) score += needle.includes(" ") ? 2 : 1;
    }
    if (score > bestScore) {
      bestScore = score;
      best = answer;
    }
  }

  return bestScore > 0 ? best : null;
}

export function demoQuestions(): string[] {
  return answers.slice(0, 4).map((answer) => answer.question);
}
