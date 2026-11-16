import Image from "next/image";
import type { Project } from "@/content/projects";

export const workImages: Record<string, { src: string; alt: string; position?: string }> = {
  halo: {
    src: "/images/work/halo-dashboard.jpg",
    alt: "H.A.L.O ground dashboard with procedure steps and detector evidence.",
    position: "center top",
  },
  susurrus: {
    src: "/images/work/susurrus-shot.webp",
    alt: "Susurrus title frame showing two local models, one hears and one edits.",
    position: "center",
  },
  "chumps-lab": {
    src: "/images/work/chumps-editor.jpg",
    alt: "Chumps Lab Studio editor with a preview and timeline.",
    position: "center top",
  },
  bioradar: {
    src: "/images/work/bioradar-shot.webp",
    alt: "BioRadar title frame with an India-curated species reference.",
    position: "center",
  },
  costa: {
    src: "/images/work/costa-live.jpg",
    alt: "COSTA live tracking view with a beacon lock overlay.",
    position: "center top",
  },
  roboforge: {
    src: "/images/work/roboforge-shot.webp",
    alt: "RoboForge terminal output showing a simulated rover and applied trim.",
    position: "center",
  },
};

export function ChapterVisual({ project }: { project: Project }) {
  if (project.slug === "client-work") {
    return (
      <div className="chapter-visual chapter-visual--clients">
        <div className="chapter-client-grid">
          {project.clients?.map((client) => (
            <div className="chapter-client-thumb" key={client.name}>
              <Image
                src={client.image}
                alt={client.alt}
                fill
                sizes="(max-width: 720px) 30vw, 30vw"
                style={{ objectFit: "cover", objectPosition: "top center" }}
              />
              <span>{client.name}</span>
            </div>
          ))}
        </div>
        <div className="chapter-client-names" aria-hidden="true">
          {project.clients?.map((client) => (
            <span key={client.name}>{client.name}</span>
          ))}
        </div>
      </div>
    );
  }

  const image = workImages[project.slug];
  if (!image) return null;

  return (
    <div className="chapter-visual">
      <Image
        src={image.src}
        alt={image.alt}
        fill
        sizes="(max-width: 720px) 92vw, (max-width: 960px) 46vw, 40vw"
        style={{ objectFit: "cover", objectPosition: image.position ?? "center" }}
      />
      <span className="chapter-visual-shade" aria-hidden="true" />
      <span className="chapter-visual-tag">{project.kicker}</span>
    </div>
  );
}
