"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  AtSign,
  BookOpen,
  Bot,
  FileText,
  Home,
  Link2,
  Mail,
  Search,
  User,
  Workflow,
} from "lucide-react";
import { site } from "@/content/site";
import { projects } from "@/content/projects";

type Command = {
  label: string;
  hint: string;
  href: string;
  external?: boolean;
  icon: React.ReactNode;
  keywords: string;
};

const baseCommands: Command[] = [
  { label: "Home", hint: "The overture", href: "/", icon: <Home size={15} />, keywords: "home start overture" },
  { label: "The Work", hint: "Seven chapters", href: "/work", icon: <Workflow size={15} />, keywords: "work projects chapters" },
  { label: "The Machine", hint: "Wake the local model", href: "/machine", icon: <Bot size={15} />, keywords: "machine ask chat model webllm" },
  { label: "About", hint: "The person", href: "/about", icon: <User size={15} />, keywords: "about parth bio person" },
  { label: "Contact", hint: "Email is the direct path", href: "/contact", icon: <AtSign size={15} />, keywords: "contact email hire internship" },
  { label: "Colophon", hint: "Stack, privacy, accessibility", href: "/colophon", icon: <FileText size={15} />, keywords: "colophon stack privacy accessibility credits" },
];

const projectCommands: Command[] = projects.map((project) => ({
  label: project.title,
  hint: `Chapter ${project.chapter} · ${project.subtitle}`,
  href: `/work/${project.slug}`,
  icon: <BookOpen size={15} />,
  keywords: `${project.title} ${project.kicker} ${project.stack.join(" ")} ${project.category}`,
}));

const linkCommands: Command[] = [
  { label: "GitHub", hint: "github.com/ParthVarekar", href: site.github, external: true, icon: <Link2 size={15} />, keywords: "github code repos" },
  { label: "LinkedIn", hint: "linkedin.com/in/parth-varekar", href: site.linkedin, external: true, icon: <Link2 size={15} />, keywords: "linkedin work" },
  { label: "Email", hint: site.email, href: `mailto:${site.email}`, external: true, icon: <Mail size={15} />, keywords: "email mail contact" },
];

const allCommands = [...baseCommands, ...projectCommands, ...linkCommands];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
      if (event.key === "Escape") setOpen(false);
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("open-command-palette", onOpen as EventListener);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("open-command-palette", onOpen as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActive(0);
    const timer = window.setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 30);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = previous;
    };
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allCommands;
    return allCommands.filter((command) =>
      `${command.label} ${command.hint} ${command.keywords}`.toLowerCase().includes(q),
    );
  }, [query]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  const run = (command: Command) => {
    setOpen(false);
    if (command.external) {
      if (command.href.startsWith("mailto:")) {
        window.location.href = command.href;
      } else {
        window.open(command.href, "_blank", "noopener,noreferrer");
      }
      return;
    }
    router.push(command.href);
  };

  const onInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => Math.min(index + 1, results.length - 1));
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => Math.max(index - 1, 0));
    }
    if (event.key === "Enter" && results[active]) {
      event.preventDefault();
      run(results[active]);
    }
  };

  if (!open) return null;

  return (
    <div
      className="palette-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) setOpen(false);
      }}
    >
      <div className="palette" role="dialog" aria-modal="true" aria-label="Command palette">
        <div className="palette-search">
          <Search size={17} aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onInputKeyDown}
            placeholder="Go to a page, a project, or a link…"
            aria-label="Search commands"
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="go"
          />
          <kbd>esc</kbd>
        </div>
        <div className="palette-list">
          {results.length === 0 ? (
            <div className="palette-empty">No results. Try “work”, “machine” or “H.A.L.O”.</div>
          ) : (
            results.map((command, index) => (
              <button
                key={`${command.label}-${command.href}`}
                type="button"
                className="palette-item"
                data-active={index === active}
                onMouseEnter={() => setActive(index)}
                onClick={() => run(command)}
              >
                <span className="palette-icon">{command.icon}</span>
                <span className="palette-copy">
                  <span className="palette-label">{command.label}</span>
                  <span className="palette-hint">{command.hint}</span>
                </span>
                {command.external ? <ArrowUpRight size={14} aria-hidden="true" /> : null}
              </button>
            ))
          )}
        </div>
        <div className="palette-foot">
          <span>↑↓ to move · ↵ to open · esc to close</span>
          <span>{results.length} results</span>
        </div>
      </div>
    </div>
  );
}
