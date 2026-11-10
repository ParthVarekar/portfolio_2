import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, GraduationCap, MapPin, Sparkles } from "lucide-react";
import { AboutCard } from "@/components/method/AboutCard";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "About",
  description:
    "Parth Varekar is an AI systems builder from Mumbai, studying Computer Engineering and building local-first AI systems.",
  alternates: { canonical: "/about" },
};

const timeline = [
  {
    year: "2026",
    title: "Seven systems, one idea",
    text: "H.A.L.O, Susurrus, Chumps Lab Studio, BioRadar, COSTA and RoboForge. Different domains, same question: can the machine explain itself?",
  },
  {
    year: "2025–2026",
    title: "Client builds at ProtoVinci",
    text: "Shipped three live sites for real businesses: TheArtEvents, SocialxBrand Pilot and Gully Culture. Learned that shipping is a design skill.",
  },
  {
    year: "2025",
    title: "SIH teams and national finals",
    text: "Worked across three Smart India Hackathon problem statements: on-board procedure intelligence, biodiversity eDNA and optical acquisition.",
  },
  {
    year: "2024",
    title: "Computer Engineering, Mumbai University",
    text: "Started at K.C. College of Engineering, class of 2028. Added a 120-hour data-science internship at Imarticus Learning and a Full-Stack Java certification through EduSkills, both with an A+ grade.",
  },
];

export default function AboutPage() {
  return (
    <div className="page shell">
      <header className="page-head">
        <span className="section-label">
          <span className="status-dot status-dot--lime" aria-hidden="true" />
          About
        </span>
        <h1 className="page-title">
          A builder
          <br />
          in Mumbai.
        </h1>
        <p className="page-sub">
          I study Computer Engineering, build local-first AI systems, and care about the part
          of the work that happens after the demo: the test, the boundary, the explanation.
        </p>
      </header>

      <AboutCard />

      <section className="section section--tight" aria-labelledby="about-story-title">
        <div className="section-head">
          <div className="section-head-copy">
            <span className="section-label">
              <span className="status-dot status-dot--blue" aria-hidden="true" />
              The short version
            </span>
            <h2 className="section-title" id="about-story-title">
              How I got
              <br />
              here.
            </h2>
          </div>
        </div>

        <ol className="timeline">
          {timeline.map((item) => (
            <li className="timeline-item" key={item.year}>
              <span className="timeline-year">{item.year}</span>
              <div className="timeline-body">
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <div className="two-col">
        <section className="panel" aria-labelledby="about-education-title">
          <h2 className="panel-title" id="about-education-title">
            Education
          </h2>
          <ul className="fact-list">
            <li>
              <GraduationCap size={15} aria-hidden="true" />
              <div>
                <strong>K.C. College of Engineering</strong>
                <span>Computer Engineering · Mumbai University · class of 2028</span>
              </div>
            </li>
            <li>
              <Sparkles size={15} aria-hidden="true" />
              <div>
                <strong>Imarticus Learning</strong>
                <span>120-hour data-science internship · A+ grade</span>
              </div>
            </li>
            <li>
              <Sparkles size={15} aria-hidden="true" />
              <div>
                <strong>EduSkills</strong>
                <span>Full-Stack Java certification · A+ grade</span>
              </div>
            </li>
          </ul>
        </section>

        <section className="panel" aria-labelledby="about-now-title">
          <h2 className="panel-title" id="about-now-title">
            Right now
          </h2>
          <ul className="limit-list">
            <li>Finishing Chumps Lab Studio and widening its assistant.</li>
            <li>Building small local-first tools that run on ordinary hardware.</li>
            <li>Taking on client builds through ProtoVinci.</li>
            <li>Looking for internships and collaborations in applied AI.</li>
          </ul>
          <div className="about-facts">
            <span className="about-fact">
              <MapPin size={13} aria-hidden="true" />
              Mumbai, India · IST
            </span>
            <a className="about-fact" href={`mailto:${site.email}`}>
              {site.email}
            </a>
          </div>
        </section>
      </div>

      <section className="panel approach-cta" aria-labelledby="about-cta-title">
        <div>
          <span className="label">Next</span>
          <h2 className="panel-title" id="about-cta-title">
            See what I have built.
          </h2>
          <p className="panel-sub">
            Seven chapters, from an on-board procedure monitor to three live client sites.
          </p>
        </div>
        <div className="approach-cta-actions">
          <Link className="btn btn--lime" href="/work">
            Read the work
            <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
          <Link className="btn btn--white" href="/contact">
            Say hello
          </Link>
        </div>
      </section>
    </div>
  );
}
