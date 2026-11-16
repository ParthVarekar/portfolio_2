import Link from "next/link";
import Image from "next/image";
import { projects, type Project } from "@/content/projects";
import { workImages } from "./Visuals";

/**
 * The home page's work section: four chapters as small specimen decks, not
 * full cards. A tinted sheet at the back, a white one in the middle, then the
 * screenshot in a white mat with its label printed underneath — one object, so
 * the caption never floats over the ASCII field.
 *
 * Everything else lives on /work, reachable from the nav and from the link in
 * the section head.
 */

const FEATURED = ["halo", "susurrus", "bioradar", "client-work"] as const;

type Cover = { src: string; alt: string; position: string };

function coverFor(project: Project): Cover | null {
  if (project.slug === "client-work") {
    const first = project.clients?.[0];
    if (first) return { src: first.image, alt: first.alt, position: "top center" };
  }
  const image = workImages[project.slug];
  return image ? { src: image.src, alt: image.alt, position: image.position ?? "center" } : null;
}

export function WorkTeaser() {
  const featured = FEATURED.map((slug) => projects.find((project) => project.slug === slug)).filter(
    (project): project is Project => Boolean(project),
  );

  return (
    <ul className="work-teaser">
      {featured.map((project) => {
        const cover = coverFor(project);
        return (
          <li key={project.slug}>
            <Link
              className="deck-tile"
              href={`/work/${project.slug}`}
              data-accent={project.accent}
              aria-label={`Chapter ${project.chapter}: ${project.title} — ${project.subtitle}`}
            >
              <span className="deck" aria-hidden="true">
                <span className="deck-sheet deck-sheet--back" />
                <span className="deck-sheet deck-sheet--mid" />
                <span className="deck-frame">
                  <span className="deck-shot">
                    {cover ? (
                      <Image
                        src={cover.src}
                        alt=""
                        fill
                        sizes="(max-width: 980px) 44vw, 22vw"
                        style={{ objectFit: "cover", objectPosition: cover.position }}
                      />
                    ) : null}
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
