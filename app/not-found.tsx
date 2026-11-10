import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";

const routes = [
  { label: "Home", href: "/" },
  { label: "The Work", href: "/work" },
  { label: "The Machine", href: "/machine" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Colophon", href: "/colophon" },
];

export default function NotFound() {
  return (
    <div className="notfound shell">
      <div className="notfound-panel">
        <div className="notfound-code">404</div>
        <h1>This page is off the map.</h1>
        <p>
          The link may be old, the chapter may have moved, or the address may have a typo.
          Everything below is still where it should be.
        </p>
        <div className="notfound-actions">
          <Link className="btn btn--lime" href="/">
            <ArrowLeft size={15} aria-hidden="true" />
            Back home
          </Link>
          <Link className="btn btn--white" href="/work">
            Read the work
          </Link>
          <Link className="btn btn--white" href="/machine">
            Wake the machine
            <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
        </div>

        <nav className="notfound-routes" aria-label="Valid routes">
          <span className="label">Live routes</span>
          <ul>
            {routes.map((route) => (
              <li key={route.href}>
                <Link href={route.href}>
                  {route.label}
                  <ArrowUpRight size={11} aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}
