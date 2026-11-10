import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { HeroBento } from "@/components/hero/HeroBento";
import { Machine } from "@/components/machine/Machine";
import { WorkGrid } from "@/components/work/WorkGrid";
import { AboutCard } from "@/components/method/AboutCard";
import { ContactCard } from "@/components/method/ContactCard";
import { Reveal } from "@/components/ui/Reveal";

export default function HomePage() {
  return (
    <>
      <HeroBento />

      <Machine />

      <section className="section shell" id="work" aria-labelledby="work-title">
        <Reveal className="section-head">
          <div className="section-head-copy">
            <span className="section-label">
              <span className="status-dot status-dot--blue" aria-hidden="true" />
              III — The work
            </span>
            <h2 className="section-title" id="work-title">
              Seven chapters,
              <br />
              one discipline.
            </h2>
            <p className="section-sub">
              Local AI, space, biology, optics, robotics and three live client builds. Each
              one starts from a constraint and ends with evidence.
            </p>
          </div>
          <Link className="section-link" href="/work">
            All work
            <ArrowUpRight size={14} aria-hidden="true" />
          </Link>
        </Reveal>
        <Reveal delay={80}>
          <WorkGrid />
        </Reveal>
      </section>

      <section className="section shell" id="about" aria-labelledby="about-title">
        <Reveal className="section-head">
          <div className="section-head-copy">
            <span className="section-label">
              <span className="status-dot status-dot--blue" aria-hidden="true" />
              IV — The person
            </span>
            <h2 className="section-title" id="about-title">
              The person
              <br />
              behind the machine.
            </h2>
          </div>
          <Link className="section-link" href="/about">
            More about me
            <ArrowUpRight size={14} aria-hidden="true" />
          </Link>
        </Reveal>
        <Reveal delay={80}>
          <AboutCard />
        </Reveal>
      </section>

      <section className="section shell" id="contact" aria-labelledby="contact-title">
        <Reveal className="section-head">
          <div className="section-head-copy">
            <span className="section-label">
              <span className="status-dot status-dot--lime" aria-hidden="true" />
              V — Contact
            </span>
            <h2 className="section-title" id="contact-title">
              Say hello.
            </h2>
          </div>
          <Link className="section-link" href="/contact">
            Contact page
            <ArrowUpRight size={14} aria-hidden="true" />
          </Link>
        </Reveal>
        <Reveal delay={80}>
          <ContactCard />
        </Reveal>
      </section>
    </>
  );
}
