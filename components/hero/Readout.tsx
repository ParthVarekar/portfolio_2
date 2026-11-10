import Link from "next/link";
import { Fragment } from "react";
import { ArrowUpRight } from "lucide-react";
import { site } from "@/content/site";
import { Clock } from "./Clock";

const readouts = [
  {
    value: "0",
    label: "Bytes of conversation data sent",
    viz: "dots" as const,
    lit: 1,
  },
  {
    value: "~78 MB",
    label: "One-time model download",
    viz: "bars" as const,
    lit: 4,
  },
  {
    value: "4,096",
    label: "Context window, in your tab",
    viz: "dots" as const,
    lit: 3,
  },
  {
    value: "1",
    label: "Worker thread, so scrolling stays smooth",
    viz: "bars" as const,
    lit: 7,
  },
];

/**
 * One instrument panel under the hero: readouts, the statement, and the
 * chapter index — separated by hairlines instead of floating as three bands.
 */
export function Readout() {
  return (
    <section className="readout settle" style={{ animationDelay: "160ms" }} aria-label="Machine readouts">
      <div className="readout-row">
        {readouts.map((item) => (
          <div className="readout-cell" key={item.label}>
            <div className="readout-value">{item.value}</div>
            <div className="readout-label">{item.label}</div>
            {item.viz === "dots" ? (
              <div className="readout-viz readout-viz--dots" aria-hidden="true">
                {Array.from({ length: 5 }, (_, index) => (
                  <span key={index} data-on={index < item.lit} />
                ))}
              </div>
            ) : (
              <div className="readout-viz" aria-hidden="true">
                {Array.from({ length: 8 }, (_, index) => (
                  <span className="readout-bar" key={index} data-on={index < item.lit} />
                ))}
              </div>
            )}
          </div>
        ))}

        <div className="readout-cell readout-cell--place">
          <div className="readout-label">Mumbai, IN</div>
          <Clock />
          <div className="readout-coords">19.0176° N · 72.8562° E</div>
        </div>
      </div>

      <div className="readout-story">
        <p className="story-quote">
          I build AI that runs on your own hardware: offline procedure monitors, zero-cloud
          dictation, browser labs. This page is the same idea, in your tab.
        </p>
      </div>

      <nav className="readout-index" aria-label="Chapters">
        {site.chapters.map((chapter, index) => (
          <Fragment key={chapter.href}>
            <Link className="readout-index-item" href={chapter.href}>
              <span className="n">{chapter.number}</span>
              {chapter.title}
            </Link>
            <span className="readout-leader" aria-hidden="true" />
          </Fragment>
        ))}
        <Link className="readout-index-item" href="/work">
          All work
          <ArrowUpRight size={12} aria-hidden="true" />
        </Link>
      </nav>
    </section>
  );
}
