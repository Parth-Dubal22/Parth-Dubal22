"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

/** Public profile nav — ported 1:1 from site/profile.html header.
 *  Mobile dropdown uses the shared `.nav-links.open` recipe in app.css
 *  (replaces the old inline CSSProperties object). Escape closes the menu
 *  and returns focus to the burger; clicking a link closes it too.
 *  TODO (deferred, shared-file): consolidate with LandingNav into one SiteNav. */
export default function ProfileNav() {
  const [open, setOpen] = useState(false);
  const burgerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        burgerRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="nav">
      <div className="wrap">
        <Link className="logo" href="/">
          <span className="logo-mark">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </span>
          BuildSafe
        </Link>
        <nav
          className={"nav-links" + (open ? " open" : "")}
          id="profile-menu"
          onClick={(e) => {
            // close only when a link was activated — clicking empty space keeps focus
            if ((e.target as HTMLElement).closest("a")) setOpen(false);
          }}
        >
          <a href="/customer">Directory</a>
          <a href="/tradie">Tradie app</a>
          <a href="/builder">Builder app</a>
          <a className="btn btn-p" href="/onboarding">Get started</a>
        </nav>
        <button
          ref={burgerRef}
          className="burger"
          aria-label="Menu"
          aria-expanded={open}
          aria-controls="profile-menu"
          onClick={() => setOpen((o) => !o)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </header>
  );
}
