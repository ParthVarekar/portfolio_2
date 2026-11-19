import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Clock, Mail, MapPin, Phone } from "lucide-react";
import { ContactCard } from "@/components/method/ContactCard";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact Parth Varekar by email, GitHub or LinkedIn. Based in Mumbai, open to internships, collaborations and local-first AI projects.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <div className="page shell">
      <header className="page-head">
        <h1 className="page-title">
          Say hello.
        </h1>
        <p className="page-sub">
          Email is the direct path. No form, no tracking, no autoresponder. Tell me what you
          are building, what is getting in the way, and what a good result would look like.
        </p>
      </header>

      <ContactCard />

      <div className="two-col section section--tight">
        <section className="panel" aria-labelledby="contact-details-title">
          <h2 className="panel-title" id="contact-details-title">
            Direct details
          </h2>
          <dl className="contact-rows">
            <div>
              <dt>
                <Mail size={14} aria-hidden="true" /> Email
              </dt>
              <dd>
                <a href={`mailto:${site.email}`}>{site.email}</a>
              </dd>
            </div>
            <div>
              <dt>
                <Phone size={14} aria-hidden="true" /> Phone
              </dt>
              <dd>
                <a href={`tel:${site.phone.replace(/\s/g, "")}`}>{site.phone}</a>
              </dd>
            </div>
            <div>
              <dt>
                <MapPin size={14} aria-hidden="true" /> Location
              </dt>
              <dd>Mumbai, India</dd>
            </div>
            <div>
              <dt>
                <Clock size={14} aria-hidden="true" /> Timezone
              </dt>
              <dd>IST · UTC+5:30</dd>
            </div>
            <div>
              <dt>
                <Clock size={14} aria-hidden="true" /> Reply time
              </dt>
              <dd>Usually within a day</dd>
            </div>
          </dl>
        </section>

        <section className="panel" aria-labelledby="contact-elsewhere-title">
          <h2 className="panel-title" id="contact-elsewhere-title">
            Elsewhere
          </h2>
          <ul className="link-list">
            <li>
              <a href={site.github} target="_blank" rel="noreferrer">
                <span>
                  <strong>GitHub</strong>
                  <span>Code, tests and the full repositories</span>
                </span>
                <ArrowUpRight size={15} aria-hidden="true" />
              </a>
            </li>
            <li>
              <a href={site.linkedin} target="_blank" rel="noreferrer">
                <span>
                  <strong>LinkedIn</strong>
                  <span>The professional version of this page</span>
                </span>
                <ArrowUpRight size={15} aria-hidden="true" />
              </a>
            </li>
            <li>
              <Link href="/machine">
                <span>
                  <strong>The machine</strong>
                  <span>Ask a local model about the work</span>
                </span>
                <ArrowUpRight size={15} aria-hidden="true" />
              </Link>
            </li>
            <li>
              <Link href="/colophon">
                <span>
                  <strong>Colophon</strong>
                  <span>Stack, privacy, accessibility and credits</span>
                </span>
                <ArrowUpRight size={15} aria-hidden="true" />
              </Link>
            </li>
          </ul>
        </section>
      </div>

      <section className="panel approach-cta" aria-labelledby="contact-cta-title">
        <div>
          <span className="label">Or</span>
          <h2 className="panel-title" id="contact-cta-title">
            Ask the machine first.
          </h2>
          <p className="panel-sub">
            It runs in your browser and knows Parth&apos;s projects, skills and story. If it
            cannot answer, email is still the direct path.
          </p>
        </div>
        <Link className="btn btn--lime" href="/machine">
          Wake the machine
          <ArrowUpRight size={15} aria-hidden="true" />
        </Link>
      </section>
    </div>
  );
}
