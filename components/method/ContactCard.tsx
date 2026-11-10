import { ArrowUpRight, Mail } from "lucide-react";
import { site } from "@/content/site";
import { Computer } from "@/components/contact/Computer";

export function ContactCard() {
  return (
    <div className="contact-card">
      <div className="contact-copy">
        <span className="label label--ink">Contact</span>
        <h2 className="contact-title">
          Let&apos;s build something that runs close to the metal.
        </h2>
        <p className="contact-sub">
          Open to internships, collaborations and local-first AI projects. Email is the
          direct path. No form, no tracking, no autoresponder.
        </p>

        <div className="contact-actions">
          <a className="contact-email" href={`mailto:${site.email}`}>
            <Mail size={16} aria-hidden="true" />
            {site.email}
          </a>
          <a
            className="contact-secondary"
            href={site.github}
            target="_blank"
            rel="noreferrer"
          >
            GitHub
            <ArrowUpRight size={13} aria-hidden="true" />
          </a>
          <a
            className="contact-secondary"
            href={site.linkedin}
            target="_blank"
            rel="noreferrer"
          >
            LinkedIn
            <ArrowUpRight size={13} aria-hidden="true" />
          </a>
        </div>

        <p className="contact-small">
          Mumbai, India · IST · Usually replies within a day.{" "}
          <span className="nowrap">{site.phone}</span>
        </p>
      </div>

      <div className="contact-device">
        <Computer />
      </div>
    </div>
  );
}
