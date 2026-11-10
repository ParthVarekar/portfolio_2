import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";

export default function NotFound() {
  return (
    <div className="notfound shell">
      <span className="notfound-code">404</span>
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
    </div>
  );
}
