import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ArrowUpRight, ExternalLink } from "lucide-react";
import { projectBySlug, projects, statusTone } from "@/content/projects";
import { ReadingProgress } from "@/components/case/ReadingProgress";

export const dynamicParams = false;

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = projectBySlug(slug);
  if (!project) return { title: "Chapter not found" };

  return {
    title: `${project.title} — Chapter ${project.chapter}`,
    description: project.summary,
    alternates: { canonical: `/work/${project.slug}` },
    openGraph: {
      title: `${project.title} — Parth Varekar`,
      description: project.summary,
      url: `/work/${project.slug}`,
      images: project.images[0]?.src ? [{ url: project.images[0].src }] : undefined,
    },
  };
}

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = projectBySlug(slug);
  if (!project) notFound();

  const nextSlug = project.next ?? projects[0].slug;
  const next = projectBySlug(nextSlug) ?? projects[0];
  const heroImage = project.images[0];
  const gallery = project.images.slice(1);

  return (
    <div className="case-page">
      <ReadingProgress />
      <div className="shell">
        <Link className="back-link" href="/work">
          <ArrowLeft size={13} aria-hidden="true" />
          All chapters
        </Link>

        <article className="case-article">
          <header className="case-hero">
            <div className="case-hero-top">
              <span className="case-chapter">{project.chapter}</span>
              <span className={`status ${statusTone[project.status]}`}>
                <span className="status-dot" aria-hidden="true" />
                {project.status}
              </span>
            </div>

            <h1 className="case-title">{project.title}</h1>
            <p className="case-subtitle">{project.subtitle}</p>

            <div className="case-meta">
              <span className="pill">{project.year}</span>
              <span className="pill">{project.role}</span>
              {project.team ? <span className="pill">{project.team}</span> : null}
              <span className="pill">{project.kicker}</span>
            </div>
          </header>

          <div className="case-body">
            <p className="case-lede">{project.summary}</p>

            <div className="case-evidence" aria-label="Evidence">
              {project.evidence.map((item) => (
                <div className="evidence-card" key={item.label}>
                  <div className="evidence-value">{item.value}</div>
                  <div className="evidence-label">{item.label}</div>
                </div>
              ))}
            </div>

            {heroImage ? (
              <figure className="case-figure case-figure--hero">
                <Image
                  src={heroImage.src}
                  alt={heroImage.alt}
                  width={heroImage.width ?? 1600}
                  height={heroImage.height ?? 900}
                  sizes="(max-width: 1000px) 92vw, 950px"
                  priority
                />
                {heroImage.caption ? <figcaption>{heroImage.caption}</figcaption> : null}
              </figure>
            ) : null}

            {project.sections.map((section, index) => (
              <section className="case-section" key={section.number}>
                <div className="case-section-head">
                  <span className="case-num">{section.number}</span>
                  <h2>{section.title}</h2>
                </div>

                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph.slice(0, 48)}>{paragraph}</p>
                ))}

                {section.quote ? (
                  <blockquote className="case-quote">{section.quote}</blockquote>
                ) : null}

                {section.bullets ? (
                  <ul className="case-bullets">
                    {section.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                ) : null}

                {index === 2 && gallery.length > 0 ? (
                  <div className="case-gallery">
                    {gallery.map((image) => (
                      <figure className="case-figure" key={image.src}>
                        <Image
                          src={image.src}
                          alt={image.alt}
                          width={image.width ?? 1600}
                          height={image.height ?? 900}
                          sizes="(max-width: 720px) 92vw, 460px"
                        />
                        {image.caption ? <figcaption>{image.caption}</figcaption> : null}
                      </figure>
                    ))}
                  </div>
                ) : null}

                {index === 2 && project.clients ? (
                  <div className="client-detail">
                    {project.clients.map((client) => (
                      <div className="client-detail-card" key={client.name}>
                        <div className="client-detail-image">
                          <Image
                            src={client.image}
                            alt={client.alt}
                            fill
                            sizes="(max-width: 720px) 92vw, 420px"
                            style={{ objectFit: "cover", objectPosition: "top center" }}
                          />
                        </div>
                        <div className="client-detail-body">
                          <div className="client-detail-line">{client.line}</div>
                          <div className="client-detail-name">{client.name}</div>
                          <p className="client-detail-desc">{client.description}</p>
                          <div className="client-tile-tags">
                            {client.tags.map((tag) => (
                              <span className="tech-chip" key={tag}>
                                {tag}
                              </span>
                            ))}
                          </div>
                          <a
                            className="client-detail-link"
                            href={client.url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Visit the live site
                            <ExternalLink size={12} aria-hidden="true" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </section>
            ))}

            <div className="case-stack">
              <span className="label">Built with</span>
              <div className="chapter-tags">
                {project.stack.map((tech) => (
                  <span className="tech-chip" key={tech}>
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            <footer className="case-footer">
              <div className="case-links">
                {project.repo ? (
                  <a
                    className="btn btn--white btn--sm"
                    href={project.repo}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Repository
                    <ArrowUpRight size={13} aria-hidden="true" />
                  </a>
                ) : null}
                {project.live ? (
                  <a
                    className="btn btn--lime btn--sm"
                    href={project.live}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Live site
                    <ArrowUpRight size={13} aria-hidden="true" />
                  </a>
                ) : null}
                <Link className="btn btn--white btn--sm" href="/work">
                  All chapters
                </Link>
              </div>
              <Link className="about-link" href="/contact">
                Talk about this work
                <ArrowRight size={13} aria-hidden="true" />
              </Link>
            </footer>

            <Link className="case-next" href={`/work/${next.slug}`}>
              <div>
                <div className="case-next-label">Next chapter · {next.chapter}</div>
                <div className="case-next-title">{next.title}</div>
              </div>
              <span className="case-next-arrow" aria-hidden="true">
                <ArrowRight size={16} />
              </span>
            </Link>
          </div>
        </article>
      </div>
    </div>
  );
}
