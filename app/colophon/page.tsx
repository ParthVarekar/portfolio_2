import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { machineFacts, site } from "@/content/site";

export const metadata: Metadata = {
  title: "Colophon",
  description:
    "How parthvarekar.in is built: Next.js, WebLLM, Geist, the local model specification, privacy, accessibility and credits.",
  alternates: { canonical: "/colophon" },
};

const stack = [
  ["Framework", "Next.js 16 · React 19 · TypeScript"],
  ["Styling", "Tailwind CSS 4 · hand-written design tokens"],
  ["Type", "Geist Sans · Geist Pixel Square · Geist Mono"],
  ["Motion", "CSS transitions and keyframes, reduced-motion aware"],
  ["Model", "WebLLM 0.2.87 · WebGPU · Web Worker"],
  ["Understanding", "Subject and detail routing over ~80 fact cards · MiniSearch 7 for keyword lookups"],
  ["Icons", "Lucide"],
  ["Hosting", "Vercel · static output · canonical parthvarekar.in"],
];

const colours = [
  ["Canvas", "#C8D1E1"],
  ["Ink", "#101218"],
  ["Lime", "#DBEE4D"],
  ["Blue", "#589CFF"],
  ["Blue strong", "#2F6BDB"],
  ["Coral", "#EF6A5B"],
];

const credits = [
  ["Geist", "Vercel", "https://vercel.com/font"],
  ["WebLLM", "MLC AI", "https://github.com/mlc-ai/web-llm"],
  ["Qwen2.5 0.5B", "Hugging Face", "https://huggingface.co/mlc-ai/Qwen2.5-0.5B-Instruct-q4f16_1-MLC"],
  ["Next.js", "Vercel", "https://nextjs.org"],
  ["Lucide", "Lucide contributors", "https://lucide.dev"],
  ["MiniSearch", "Luca Ongaro", "https://lucaong.github.io/minisearch/"],
];

export default function ColophonPage() {
  return (
    <div className="page shell">
      <header className="page-head">
        <h1 className="page-title">
          The fine print,
          <br />
          in plain sight.
        </h1>
        <p className="page-sub">
          How this site is built, what it runs, what it stores and what it does not. No
          analytics, no cookies, no chat persistence.
        </p>
      </header>

      <div className="page-body">
        <section className="panel" id="machine" aria-labelledby="colophon-machine-title">
          <div className="machine-spec-head">
            <div>
              <h2 className="panel-title" id="colophon-machine-title">
                The machine
              </h2>
              <p className="panel-sub">
                A real 0.5B language model, loaded on demand, running on the visitor&apos;s GPU. The
                conversation is grounded in fact cards about Parth&apos;s work and is never sent to
                a server — unless you turn on Web mode, an opt-in toggle that sends only a
                general question to Wikipedia.
              </p>
            </div>
            <Link className="section-link" href="/machine">
              Open the machine
              <ArrowUpRight size={14} aria-hidden="true" />
            </Link>
          </div>

          <dl className="spec-table">
            <div>
              <dt>Model</dt>
              <dd>{machineFacts.model}</dd>
            </div>
            <div>
              <dt>Download</dt>
              <dd>{machineFacts.download} · cached after the first load</dd>
            </div>
            <div>
              <dt>GPU memory</dt>
              <dd>{machineFacts.vram}</dd>
            </div>
            <div>
              <dt>Context</dt>
              <dd>{machineFacts.context}</dd>
            </div>
            <div>
              <dt>Runtime</dt>
              <dd>{machineFacts.runtime}</dd>
            </div>
            <div>
              <dt>Licence</dt>
              <dd>{machineFacts.licence}</dd>
            </div>
          </dl>

          <p className="panel-sub colophon-note">
            Plain code reads each question first — which project, which detail, whether it
            follows on from the last answer — and hands the model the two or three fact cards
            that answer it. The model writes the reply; a sentence carrying a number that isn&apos;t
            in those facts is dropped, and the sources beside each answer are the check.
            General questions are answered from the model&apos;s own knowledge, or from Wikipedia
            with Web on. Without WebGPU, the site answers instantly from the same fact cards.
          </p>
        </section>

        <section className="panel" id="privacy" aria-labelledby="colophon-privacy-title">
          <h2 className="panel-title" id="colophon-privacy-title">
            Privacy
          </h2>
          <ul className="limit-list">
            <li>No analytics, no cookies, no tracking pixels, no third-party scripts.</li>
            <li>No chat persistence. Reload the tab and the conversation is gone.</li>
            <li>No contact form and no email address harvesting.</li>
            <li>Fonts are self-hosted through Next.js; no font CDN request.</li>
            <li>
              Web mode is off by default. When it is on, only the search question travels to
              Wikipedia — the conversation itself never does.
            </li>
            <li>
              The only requests beyond the page are the explicit model download and, with Web
              mode on, the Wikipedia lookup you asked for.
            </li>
            <li>Model weights are cached by your browser; the conversation is not.</li>
          </ul>
        </section>

        <div className="two-col">
          <section className="panel" aria-labelledby="colophon-type-title">
            <h2 className="panel-title" id="colophon-type-title">
              Type
            </h2>
            <div className="type-specimens">
              <div className="type-row">
                <span className="type-sample type-sample--pixel">Aa</span>
                <div>
                  <strong>Geist Pixel Square</strong>
                  <span>Display · hero, chapter numbers, metrics</span>
                </div>
              </div>
              <div className="type-row">
                <span className="type-sample type-sample--sans">Aa</span>
                <div>
                  <strong>Geist Sans</strong>
                  <span>Body and interface · 400 to 700</span>
                </div>
              </div>
              <div className="type-row">
                <span className="type-sample type-sample--mono">Aa</span>
                <div>
                  <strong>Geist Mono</strong>
                  <span>Code and small technical labels</span>
                </div>
              </div>
            </div>
          </section>

          <section className="panel" aria-labelledby="colophon-colour-title">
            <h2 className="panel-title" id="colophon-colour-title">
              Colour
            </h2>
            <div className="swatches">
              {colours.map(([name, value]) => (
                <div className="swatch" key={name}>
                  <span className="swatch-chip" style={{ background: value }} />
                  <span className="swatch-name">{name}</span>
                  <span className="swatch-value">{value}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="panel" id="stack" aria-labelledby="colophon-stack-title">
          <h2 className="panel-title" id="colophon-stack-title">
            Stack
          </h2>
          <dl className="stack-list">
            {stack.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="panel" id="accessibility" aria-labelledby="colophon-a11y-title">
          <h2 className="panel-title" id="colophon-a11y-title">
            Accessibility
          </h2>
          <ul className="limit-list">
            <li>Semantic landmarks, a skip link and a visible focus ring.</li>
            <li>Keyboard-operable navigation, filters, tabs, chat and command palette.</li>
            <li>Reduced-motion support: animation and smooth scrolling are disabled.</li>
            <li>Colour pairs chosen for readable contrast on the periwinkle canvas.</li>
            <li>Live regions announce chat streaming and filter counts.</li>
            <li>Images carry descriptive alt text; decorative motifs are hidden.</li>
          </ul>
        </section>

        <section className="panel" id="credits" aria-labelledby="colophon-credits-title">
          <h2 className="panel-title" id="colophon-credits-title">
            Credits
          </h2>
          <ul className="credit-list">
            {credits.map(([name, maker, url]) => (
              <li key={name}>
                <a href={url} target="_blank" rel="noreferrer">
                  <span>
                    <strong>{name}</strong>
                    <span>{maker}</span>
                  </span>
                  <ArrowUpRight size={14} aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
          <p className="panel-sub colophon-note">
            The projects, screenshots, writing and design are Parth Varekar&apos;s own work.
            The site is built in Mumbai. The canonical address is{" "}
            <a className="inline-link" href={site.url}>
              parthvarekar.in
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
