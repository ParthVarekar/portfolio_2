import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Cpu, HardDrive, ShieldCheck, Timer } from "lucide-react";
import { Machine } from "@/components/machine/Machine";
import { MachineStatus } from "@/components/machine/MachineStatus";
import { machineFacts } from "@/content/site";

export const metadata: Metadata = {
  title: "The Machine",
  description:
    "A real SmolLM2 135M language model running locally in your browser through WebLLM and WebGPU. No server, no analytics, no chat storage.",
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
    text: "SmolLM2 135M is fetched from a public CDN, quantised to 4-bit, and loaded into GPU memory through WebLLM. The browser caches the weights.",
  },
  {
    number: "03",
    title: "Retrieval runs",
    text: "Your question is matched against a small curated knowledge base using lexical search. The most relevant notes become the context for the answer.",
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
        <span className="section-label">
          <span className="status-dot status-dot--lime" aria-hidden="true" />
          The machine
        </span>
        <h1 className="page-title">
          A model in
          <br />
          your tab.
        </h1>
        <p className="page-sub">
          This is not a video of a chatbot. It is a real 135M language model running on your
          own GPU, grounded in a small set of notes about the work. It downloads only when
          you ask it to, and the conversation never leaves this tab.
        </p>
        <div className="machine-page-meta">
          <MachineStatus />
          <span className="pill pill--soft">~78 MB once</span>
          <span className="pill pill--soft">4,096 tokens</span>
          <span className="pill pill--soft">No server</span>
        </div>
      </header>

      <Machine showHeader={false} />

      <section className="section" aria-labelledby="machine-how-title">
        <div className="section-head">
          <div className="section-head-copy">
            <span className="section-label">
              <span className="status-dot status-dot--blue" aria-hidden="true" />
              Under the hood
            </span>
            <h2 className="section-title" id="machine-how-title">
              What actually
              <br />
              happens.
            </h2>
            <p className="section-sub">
              Four steps, no server in the loop. The only network request is the model
              download, and it is started by you.
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
            <li>Answer questions about the seven chapters, the person and the stack.</li>
            <li>Show the notes it used as source chips beside each answer.</li>
            <li>Say “that&apos;s not in my notes” instead of inventing an answer.</li>
            <li>Run offline once the model weights are cached.</li>
            <li>Fall back to a labelled demo when WebGPU is unavailable.</li>
          </ul>
        </section>

        <section className="panel" aria-labelledby="machine-cannot-title">
          <h2 className="panel-title" id="machine-cannot-title">
            What it cannot do
          </h2>
          <ul className="limit-list limit-list--no">
            <li>Browse the internet or read pages it was not given.</li>
            <li>Remember a conversation after you reload the tab.</li>
            <li>Match a large cloud model on open-ended reasoning.</li>
            <li>See images, hear audio or run tools.</li>
            <li>Send your question anywhere. There is no server to send it to.</li>
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
          <Link className="section-link" href="/colophon#machine">
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
