import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Cpu, HardDrive, ShieldCheck, Timer } from "lucide-react";
import { Machine } from "@/components/machine/Machine";
import { MachineStatus } from "@/components/machine/MachineStatus";
import { machineFacts } from "@/content/site";

export const metadata: Metadata = {
  title: "The Machine",
  description:
    "A real Qwen2.5 0.5B language model running locally in your browser through WebLLM and WebGPU. No server, no analytics, no chat storage.",
  alternates: { canonical: "/machine" },
};

const how = [
  {
    number: "01",
    title: "You press wake",
    text: "The site checks for WebGPU. If it is available, it starts a dedicated Web Worker and begins the one-time model download.",
  },
  {
    number: "02",
    title: "The model loads",
    text: "Qwen2.5-0.5B-Instruct-q4f16_1 is fetched from a public CDN, quantised to 4-bit, and loaded into GPU memory through WebLLM. The browser caches the weights.",
  },
  {
    number: "03",
    title: "It reads the question",
    text: "Plain code works out what you're asking — which project, which detail, whether it follows on from the last answer — and hands the model the two or three fact cards that answer it. A small model writes best from a short, focused brief.",
  },
  {
    number: "04",
    title: "The answer streams",
    text: "Tokens are generated on your GPU and streamed into the chat. Sources are shown as chips. Reload the page and the conversation is gone.",
  },
];

export default function MachinePage() {
  return (
    <div className="page shell">
      <header className="page-head">
        <h1 className="page-title">
          A model in
          <br />
          your tab.
        </h1>
        <p className="page-sub">
          This is not a video of a chatbot. It is a real 0.5B language model running on your
          own GPU — about 265 MB, once. It knows Parth&apos;s projects, skills and story; flip
          Web on and general questions can look things up on Wikipedia. The conversation never
          leaves this tab unless you ask it to.
        </p>
        <div className="machine-page-meta">
          <MachineStatus />
          <span className="pill pill--soft">~265 MB once</span>
          <span className="pill pill--soft">4,096 tokens</span>
          <span className="pill pill--soft">No server</span>
        </div>
      </header>

      <Machine showHeader={false} />

      <section className="section" aria-labelledby="machine-how-title">
        <div className="section-head">
          <div className="section-head-copy">
            <h2 className="section-title" id="machine-how-title">
              What actually
              <br />
              happens.
            </h2>
            <p className="section-sub">
              Four steps, no server in the loop. The only network requests are the model
              download and, if you turn it on, the Wikipedia lookups Web mode makes for you.
            </p>
          </div>
        </div>

        <div className="how-grid">
          {how.map((step) => (
            <article className="how-card" key={step.number}>
              <span className="flow-num">{step.number}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      <div className="two-col">
        <section className="panel" aria-labelledby="machine-can-title">
          <h2 className="panel-title" id="machine-can-title">
            What it can do
          </h2>
          <ul className="limit-list">
            <li>Answer questions about all seven chapters, the side projects, Parth&apos;s education, internship, skills and how to reach him.</li>
            <li>Follow a conversation — “tell me more”, “what about its results?” — without losing the thread.</li>
            <li>Answer general questions from what the model knows, or from Wikipedia with Web on, citing the page.</li>
            <li>Show where each answer came from as source chips.</li>
            <li>Say it doesn&apos;t know instead of inventing a fact about Parth.</li>
            <li>Run offline once the model weights are cached and Web is off.</li>
            <li>Answer instantly from the same facts when WebGPU is unavailable.</li>
          </ul>
        </section>

        <section className="panel" aria-labelledby="machine-cannot-title">
          <h2 className="panel-title" id="machine-cannot-title">
            What it cannot do
          </h2>
          <ul className="limit-list limit-list--no">
            <li>Browse the internet — until you turn Web mode on, which only ever talks to Wikipedia.</li>
            <li>Remember a conversation after you reload the tab.</li>
            <li>Match a large cloud model on open-ended reasoning.</li>
            <li>See images, hear audio or run tools.</li>
            <li>Send your conversation anywhere — Web mode sends only the search query, and it is off unless you turn it on.</li>
          </ul>
        </section>
      </div>

      <section className="panel machine-spec-panel" aria-labelledby="machine-spec-title">
        <div className="machine-spec-head">
          <div>
            <h2 className="panel-title" id="machine-spec-title">
              The specification
            </h2>
            <p className="panel-sub">
              Small enough to load quickly, large enough to answer a question about the work.
            </p>
          </div>
          <Link className="section-link" href="/colophon">
            Read the colophon
            <ArrowUpRight size={14} aria-hidden="true" />
          </Link>
        </div>

        <dl className="spec-table">
          <div>
            <dt>
              <Cpu size={14} aria-hidden="true" /> Model
            </dt>
            <dd>{machineFacts.model}</dd>
          </div>
          <div>
            <dt>
              <HardDrive size={14} aria-hidden="true" /> Download
            </dt>
            <dd>{machineFacts.download}</dd>
          </div>
          <div>
            <dt>
              <Cpu size={14} aria-hidden="true" /> GPU memory
            </dt>
            <dd>{machineFacts.vram}</dd>
          </div>
          <div>
            <dt>
              <Timer size={14} aria-hidden="true" /> Context
            </dt>
            <dd>{machineFacts.context}</dd>
          </div>
          <div>
            <dt>
              <ShieldCheck size={14} aria-hidden="true" /> Runtime
            </dt>
            <dd>{machineFacts.runtime}</dd>
          </div>
          <div>
            <dt>
              <ShieldCheck size={14} aria-hidden="true" /> Licence
            </dt>
            <dd>{machineFacts.licence}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
