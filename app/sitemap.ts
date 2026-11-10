import type { MetadataRoute } from "next";
import { site } from "@/content/site";
import { projects } from "@/content/projects";

const lastModified = new Date("2026-11-08");

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: site.url, lastModified, changeFrequency: "monthly", priority: 1 },
    { url: `${site.url}/work`, lastModified, changeFrequency: "monthly", priority: 0.9 },
    { url: `${site.url}/machine`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: `${site.url}/about`, lastModified, changeFrequency: "yearly", priority: 0.7 },
    { url: `${site.url}/contact`, lastModified, changeFrequency: "yearly", priority: 0.6 },
    { url: `${site.url}/colophon`, lastModified, changeFrequency: "yearly", priority: 0.4 },
  ];

  const projectRoutes: MetadataRoute.Sitemap = projects.map((project) => ({
    url: `${site.url}/work/${project.slug}`,
    lastModified,
    changeFrequency: "yearly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...projectRoutes];
}
