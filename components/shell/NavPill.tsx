"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from "motion/react";
import { ArrowUpRight, Menu, Search, X } from "lucide-react";
import { site } from "@/content/site";

const COLLAPSE_AFTER = 110; // px scrolled down before the bar folds away
const EXPAND_DELTA = 60; // px scrolled back up before it returns

const containerVariants = {
  expanded: {
    width: "auto",
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      damping: 26,
      stiffness: 420,
      staggerChildren: 0.03,
      delayChildren: 0.05,
    },
  },
  collapsed: {
    width: "3.25rem",
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      damping: 30,
      stiffness: 460,
      when: "afterChildren",
      staggerChildren: 0.022,
      staggerDirection: -1,
    },
  },
} as const;

const wordmarkVariants = {
  expanded: {
    opacity: 1,
    x: 0,
    rotate: 0,
    transition: { type: "spring", damping: 22, stiffness: 380 },
  },
  collapsed: {
    opacity: 0,
    x: -26,
    rotate: -16,
    transition: { duration: 0.14 },
  },
} as const;

const clusterVariants = {
  expanded: {
    opacity: 1,
    x: 0,
    transition: { type: "spring", damping: 24, stiffness: 380, when: "beforeChildren" },
  },
  collapsed: {
    opacity: 0,
    x: -16,
    transition: { duration: 0.13, when: "beforeChildren" },
  },
} as const;

const itemVariants = {
  expanded: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { type: "spring", damping: 21, stiffness: 400 },
  },
  collapsed: {
    opacity: 0,
    x: -12,
    scale: 0.94,
    transition: { duration: 0.11 },
  },
} as const;

export function NavPill() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const prefersReduced = useReducedMotion();

  const { scrollY } = useScroll();
  const lastY = useRef(0);
  const collapseAt = useRef(0);

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (typeof window === "undefined") return;
    const wide = window.matchMedia("(min-width: 961px)").matches;
    const previous = lastY.current;
    if (!prefersReduced && wide) {
      if (expanded && latest > previous && latest > COLLAPSE_AFTER) {
        setExpanded(false);
        collapseAt.current = latest;
      } else if (
        !expanded &&
        latest < previous &&
        collapseAt.current - latest > EXPAND_DELTA
      ) {
        setExpanded(true);
      }
    }
    setScrolled(latest > 40);
    lastY.current = latest;
  });

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const clusterHidden = !expanded;

  return (
    <div className="nav-wrap">
      <motion.nav
        className={`nav nav-animated${scrolled || !expanded ? " nav--scrolled" : ""}${expanded ? "" : " nav--collapsed"}`}
        aria-label="Primary"
        initial={false}
        animate={expanded ? "expanded" : "collapsed"}
        variants={containerVariants}
        whileHover={!expanded ? { scale: 1.09 } : undefined}
        whileTap={!expanded ? { scale: 0.92 } : undefined}
        onClick={!expanded ? () => setExpanded(true) : undefined}
      >
        <Link
          className="nav-brand"
          href="/"
          aria-label="Parth Varekar, home"
          onClick={!expanded ? (event) => {
            event.preventDefault();
            setExpanded(true);
          } : undefined}
        >
          <span className="nav-monogram" aria-hidden="true">
            PV
          </span>
          <motion.span
            className="nav-name"
            variants={wordmarkVariants}
            initial={false}
            animate={expanded ? "expanded" : "collapsed"}
          >
            Parth Varekar
          </motion.span>
        </Link>

        <motion.div
          className="nav-cluster"
          variants={clusterVariants}
          initial={false}
          animate={expanded ? "expanded" : "collapsed"}
          style={{ pointerEvents: clusterHidden ? "none" : "auto" }}
          aria-hidden={clusterHidden}
        >
          <motion.div className="nav-links" variants={itemVariants}>
            {site.nav.map((item) => (
              <Link
                key={item.href}
                className="nav-link"
                href={item.href}
                data-active={isActive(item.href)}
                tabIndex={clusterHidden ? -1 : undefined}
              >
                {item.label}
              </Link>
            ))}
          </motion.div>

          <motion.button
            type="button"
            className="nav-search-btn"
            aria-label="Open command palette"
            onClick={() => window.dispatchEvent(new CustomEvent("open-command-palette"))}
            variants={itemVariants}
            tabIndex={clusterHidden ? -1 : undefined}
          >
            <Search size={16} aria-hidden="true" />
            <span className="nav-kbd" aria-hidden="true">⌘K</span>
          </motion.button>

          <motion.div variants={itemVariants}>
            <Link
              className="nav-cta"
              href="/machine"
              tabIndex={clusterHidden ? -1 : undefined}
            >
              Ask the machine
              <ArrowUpRight size={14} aria-hidden="true" />
            </Link>
          </motion.div>
        </motion.div>

        <button
          type="button"
          className="nav-menu-btn"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
        </button>

        {open ? (
          <div className="nav-mobile" id="mobile-nav">
            <button
              type="button"
              className="nav-mobile-search"
              onClick={() => {
                setOpen(false);
                window.dispatchEvent(new CustomEvent("open-command-palette"));
              }}
            >
              <Search size={15} aria-hidden="true" />
              Search everywhere
              <span className="nav-kbd" aria-hidden="true">⌘K</span>
            </button>
            {site.nav.map((item) => (
              <Link key={item.href} href={item.href} data-active={isActive(item.href)}>
                {item.label}
              </Link>
            ))}
            <Link href="/colophon">Colophon</Link>
          </div>
        ) : null}
      </motion.nav>
    </div>
  );
}
