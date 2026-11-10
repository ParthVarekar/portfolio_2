"use client";

import { useMemo, useState } from "react";
import { projects, categories, type ProjectCategory } from "@/content/projects";
import { ChapterCard } from "./ChapterCard";

type Filter = ProjectCategory | "all";

export function WorkGrid({ withFilter = false }: { withFilter?: boolean }) {
  const [filter, setFilter] = useState<Filter>("all");

  const visible = useMemo(
    () => (filter === "all" ? projects : projects.filter((project) => project.category === filter)),
    [filter],
  );

  return (
    <div>
      {withFilter ? (
        <div className="work-head">
          <div className="filter-bar" role="group" aria-label="Filter work by category">
            {categories.map((category) => (
              <button
                key={category.value}
                type="button"
                className="filter-pill"
                data-active={filter === category.value}
                aria-pressed={filter === category.value}
                onClick={() => setFilter(category.value)}
              >
                {category.label}
              </button>
            ))}
          </div>
          <p className="filter-count" aria-live="polite">
            {String(visible.length).padStart(2, "0")} chapter{visible.length === 1 ? "" : "s"}
          </p>
        </div>
      ) : null}

      <div className="work-grid" data-filtered={filter !== "all"} key={filter}>
        {visible.map((project) => (
          <ChapterCard key={project.slug} project={project} />
        ))}
      </div>
    </div>
  );
}
