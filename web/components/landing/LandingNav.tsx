"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

/** Marketing site nav. Mobile: app.css hides .nav-links under 640px; the burger
 *  toggles the `.nav-links.open` dropdown (recipe lives in app.css — no inline
 *  styles). Escape closes the menu and returns focus to the burger; clicking a
 *  link closes it (navigation follows). */
export default function LandingNav() {
  const [open, setOpen] = useState(false);
  const burgerRef = useRef<HTMLButtonElement | null>(null);

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
          className={`nav-links${open ? " open" : ""}`}
          id="site-menu"
          onClick={(e) => {
            // close on link activation only — clicks on the menu surface keep it open
            if ((e.target as HTMLElement).closest("a")) setOpen(false);
          }}
        >
          <a href="/customer">For customers</a>
          <a href="/tradie">For tradies</a>
          <a href="/builder">For builders</a>
          <a href="/onboarding">Create profile</a>
          <a className="btn btn-p" href="/onboarding">Get started</a>
        </nav>
        <button
          ref={burgerRef}
          className="burger"
          aria-label="Menu"
          aria-expanded={open}
          aria-controls="site-menu"
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
