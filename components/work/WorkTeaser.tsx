import Link from "next/link";
import Image from "next/image";
import { projects, type Project } from "@/content/projects";

/**
 * The home page's work section: four chapters as small project folders, not
 * full cards. Each folder carries three of its own images — the front piece
 * and two behind it — so the stack reads as a set of specimen photos pulled
 * from a drawer rather than a card. On hover the sheets fan further apart.
 * Everything else lives on /work, reachable from the nav and from the link in
 * the section head.
 */

const FEATURED = ["halo", "susurrus", "bioradar", "client-work"] as const;

/** front piece and the two sheets behind it, all real material from the project */
const STACKS: Record<string, { front: string; backA: string; backB: string; frontPosition?: string }> = {
  halo: {
    front: "/images/work/halo-dashboard.jpg",
    backA: "/images/work/halo-model-answers.png",
    backB: "/images/work/halo-architecture.png",
  },
  susurrus: {
    front: "/images/work/susurrus-live.jpg",
    backA: "/images/work/susurrus-dictation.jpg",
    backB: "/images/work/susurrus-context.jpg",
  },
  bioradar: {
    front: "/images/work/bioradar-estuary.jpg",
    backA: "/images/work/bioradar-mandovi.jpg",
    backB: "/images/work/bioradar-kolleru.jpg",
    frontPosition: "50% 72%",
  },
  "client-work": {
    front: "/images/work/client-theartevents.jpg",
    backA: "/images/work/client-gullyculture.jpg",
    backB: "/images/work/client-socialxbrand.jpg",
  },
};

const IMAGE_SIZES = "(max-width: 980px) 46vw, 19vw";

export function WorkTeaser() {
  const featured = FEATURED.map((slug) => projects.find((project) => project.slug === slug)).filter(
    (project): project is Project => Boolean(project),
  );

  return (
    <ul className="work-teaser">
      {featured.map((project) => {
        const stack = STACKS[project.slug];
        if (!stack) return null;
        return (
          <li key={project.slug}>
            <Link
              className="deck-tile"
              href={`/work/${project.slug}`}
              aria-label={`Chapter ${project.chapter}: ${project.title} — ${project.subtitle}`}
            >
              <span className="deck" aria-hidden="true">
                <span className="deck-sheet deck-sheet--back">
                  <span className="deck-sheet-shot">
                    <Image
                      src={stack.backA}
                      alt=""
                      fill
                      sizes={IMAGE_SIZES}
                      style={{ objectFit: "cover", objectPosition: "center" }}
                    />
                  </span>
                </span>
                <span className="deck-sheet deck-sheet--mid">
                  <span className="deck-sheet-shot">
                    <Image
                      src={stack.backB}
                      alt=""
                      fill
                      sizes={IMAGE_SIZES}
                      style={{ objectFit: "cover", objectPosition: "center" }}
                    />
                  </span>
                </span>
                <span className="deck-frame">
                  <span className="deck-shot">
                    <Image
                      src={stack.front}
                      alt=""
                      fill
                      sizes={IMAGE_SIZES}
                      style={{ objectFit: "cover", objectPosition: stack.frontPosition ?? "center" }}
                    />
                  </span>
                  <span className="deck-caption">
                    <span className="deck-tag">CH·{project.chapter}</span>
                    <span className="deck-name">{project.title}</span>
                    <span className="deck-line">{project.subtitle}</span>
                  </span>
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
