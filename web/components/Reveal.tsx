"use client";
/** Scroll-reveal host — ported from prototype initReveal().
 *  Observes .rv elements (including ones added after navigation) and adds .in. */
import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function RevealHost() {
  const pathname = usePathname();

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.1 }
    );
    const observeAll = () =>
      document.querySelectorAll(".rv:not(.in)").forEach((el) => io.observe(el));
    observeAll();
    const mo = new MutationObserver(observeAll);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, [pathname]);

  return null;
}
