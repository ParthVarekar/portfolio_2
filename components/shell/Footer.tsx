import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { site } from "@/content/site";

export function Footer() {
  return (
    <footer className="footer">
      <div className="shell">
        <div className="footer-top">
          <div className="footer-brand">
            <span className="footer-monogram" aria-hidden="true">
              PV
            </span>
            <div>
              <div className="footer-name">Parth Varekar</div>
              <div className="footer-role">AI systems builder · Mumbai, IN</div>
            </div>
          </div>
          <nav className="footer-links" aria-label="Footer">
            <Link href="/work">Work</Link>
            <Link href="/machine">Machine</Link>
            <Link href="/about">About</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/colophon">Colophon</Link>
            <a href={site.github} target="_blank" rel="noreferrer">
              GitHub <ArrowUpRight size={11} aria-hidden="true" />
            </a>
            <a href={site.linkedin} target="_blank" rel="noreferrer">
              LinkedIn <ArrowUpRight size={11} aria-hidden="true" />
            </a>
          </nav>
        </div>
        <div className="footer-bottom">
          <span>© 2026 Parth Varekar. Built in Mumbai.</span>
          <span className="footer-colophon">
            <span className="status-dot status-dot--lime" aria-hidden="true" />
            Next.js · WebLLM · Geist. No analytics, no cookies.
          </span>
          <a href="#main">Back to top ↑</a>
        </div>
      </div>
    </footer>
  );
}
