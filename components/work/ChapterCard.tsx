import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Project } from "@/content/projects";
import { statusTone } from "@/content/projects";
import { ChapterVisual } from "./Visuals";

export function ChapterCard({ project }: { project: Project }) {
  return (
    <Link
      className={`chapter-card chapter-card--${project.slug}`}
      href={`/work/${project.slug}`}
      aria-label={`Chapter ${project.chapter}: ${project.title}`}
    >
      <span className="chapter-ghost" aria-hidden="true">
        {project.chapter}
      </span>
      <div className="chapter-top">
        <span className="chapter-index">
          <span className="chapter-index-num">CH·{project.chapter}</span>
          {project.kicker}
        </span>
        <span className={`status ${statusTone[project.status]}`}>
          <span className="status-dot" aria-hidden="true" />
          {project.status}
        </span>
      </div>

      <ChapterVisual project={project} />

      <h3 className="chapter-title">{project.title}</h3>
      <p className="chapter-line">{project.subtitle}</p>

      <div className="chapter-foot">
        <div>
          <div className="chapter-metric">{project.metric}</div>
          <div className="chapter-metric-label">{project.metricLabel}</div>
        </div>
        <div className="chapter-tags">
          {project.stack.slice(0, 3).map((tech) => (
            <span className="tech-chip" key={tech}>
              {tech}
            </span>
          ))}
          <span className="chapter-open" aria-hidden="true">
            <ArrowUpRight size={13} />
          </span>
        </div>
      </div>
    </Link>
  );
}
