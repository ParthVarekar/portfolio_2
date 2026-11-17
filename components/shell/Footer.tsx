import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { site } from "@/content/site";

const sections = [
  { label: "Work", href: "/work" },
  { label: "Machine", href: "/machine" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Colophon", href: "/colophon" },
];

const elsewhere = [
  { label: "GitHub", href: site.github, external: true },
  { label: "LinkedIn", href: site.linkedin, external: true },
  { label: "Email", href: `mailto:${site.email}`, external: true },
];

export function Footer() {
  return (
    <footer className="footer">
      <div className="shell">
        <div className="footer-panel">
          <div className="footer-panel-head">
            <div className="footer-brand">
              <span className="footer-monogram" aria-hidden="true">
                PV
              </span>
              <div>
                <div className="footer-name">Parth Varekar</div>
                <div className="footer-role">AI systems builder · Mumbai, IN</div>
              </div>
            </div>
            <span className="footer-colophon">
              <span className="status-dot status-dot--lime" aria-hidden="true" />
              Next.js · WebLLM · Geist — no analytics, no cookies
            </span>
          </div>

          <div className="footer-grid">
            <div className="footer-col">
              <span className="label">Sections</span>
              <ul>
                {sections.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href}>{item.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="footer-col">
              <span className="label">Elsewhere</span>
              <ul>
                {elsewhere.map((item) => (
                  <li key={item.href}>
                    <a href={item.href} target="_blank" rel="noreferrer">
                      {item.label}
                      <ArrowUpRight size={11} aria-hidden="true" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="footer-col footer-col--action">
              <span className="label">Actions</span>
              <ul>
                <li>
                  <Link href="/machine">Ask the machine</Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© 2026 Parth Varekar. Built in Mumbai.</span>
          <span className="footer-meta">
            07 chapters · 1 model · 0 bytes sent
          </span>
        </div>
      </div>
    </footer>
  );
}
