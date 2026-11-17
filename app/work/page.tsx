import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { WorkGrid } from "@/components/work/WorkGrid";
import { ContactCard } from "@/components/method/ContactCard";
import { projects } from "@/content/projects";

export const metadata: Metadata = {
  title: "The Work",
  description:
    "Seven chapters of Parth Varekar's work: local AI, space procedures, biodiversity intelligence, optical tracking, robotics and live client builds.",
  alternates: { canonical: "/work" },
};

export default function WorkPage() {
  return (
    <div className="page shell">
      <header className="page-head page-head-split">
        <div className="page-head-copy">
          <h1 className="page-title">
            Seven chapters.
            <br />
            One discipline.
          </h1>
          <p className="page-sub">
            Every project here starts from a real constraint: a skipped step in orbit, a
            microphone that should not phone home, a beacon hidden among brighter lights, a
            water sample that has to become a decision. The interface changes. The evidence
            does not.
          </p>
          <p className="work-meta">// index of seven builds · select by discipline below</p>
        </div>

        <aside className="page-index" aria-label="Chapter index">
          <div className="page-index-head">
            <span className="label">Index</span>
            <span className="page-index-count">07 chapters</span>
          </div>
          <ul className="page-index-list">
            {projects.map((project) => (
              <li key={project.slug}>
                <Link href={`/work/${project.slug}`}>
                  <span className="n">{project.chapter}</span>
                  <span className="t">{project.title}</span>
                  <span className="y">{project.year}</span>
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      </header>

      <WorkGrid withFilter />

      <section className="section section--tight" aria-labelledby="work-contact-title">
        <div className="section-head">
          <div className="section-head-copy">
            <h2 className="section-title" id="work-contact-title">
              Have a brief
              <br />
              like these?
            </h2>
          </div>
          <Link className="section-link" href="/contact">
            Start a conversation
            <ArrowUpRight size={14} aria-hidden="true" />
          </Link>
        </div>
        <ContactCard />
      </section>
    </div>
  );
}
