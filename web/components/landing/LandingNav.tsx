"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";

/** Mobile dropdown styling for the .nav-links menu when the burger is open.
 *  (app.css hides .nav-links under 640px; this inline style reveals it as a
 *  dropdown under the sticky header without touching the shared stylesheet.) */
const openMenu: CSSProperties = {
  display: "flex",
  position: "absolute",
  top: "100%",
  left: 0,
  right: 0,
  flexDirection: "column",
  alignItems: "flex-start",
  gap: "1rem",
  background: "#fff",
  borderBottom: "1px solid var(--line)",
  boxShadow: "var(--sh2)",
  padding: "1.1rem 4%",
};

export default function LandingNav() {
  const [open, setOpen] = useState(false);
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
          className="nav-links"
          id="site-menu"
          style={open ? openMenu : undefined}
          onClick={() => setOpen(false)}
        >
          <a href="/customer">For customers</a>
          <a href="/tradie">For tradies</a>
          <a href="/builder">For builders</a>
          <a href="/onboarding">Create profile</a>
          <a className="btn btn-p" href="/onboarding">Get started</a>
        </nav>
        <button
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
