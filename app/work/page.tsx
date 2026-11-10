import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { WorkGrid } from "@/components/work/WorkGrid";
import { ContactCard } from "@/components/method/ContactCard";

export const metadata: Metadata = {
  title: "The Work",
  description:
    "Seven chapters of Parth Varekar's work: local AI, space procedures, biodiversity intelligence, optical tracking, robotics and live client builds.",
  alternates: { canonical: "/work" },
};

export default function WorkPage() {
  return (
    <div className="page shell">
      <header className="page-head">
        <span className="section-label">
          <span className="status-dot status-dot--blue" aria-hidden="true" />
          The work · 2025–2026
        </span>
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
      </header>

      <WorkGrid withFilter />

      <section className="section section--tight" aria-labelledby="work-contact-title">
        <div className="section-head">
          <div className="section-head-copy">
            <span className="section-label">
              <span className="status-dot status-dot--lime" aria-hidden="true" />
              Next
            </span>
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
