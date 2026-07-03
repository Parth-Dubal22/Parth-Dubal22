"use client";
/** Toast host — R2 system toasts (design-system/MASTER.md §9). Mount once in root layout.
 *
 *  Fire with: import { toast } from "@/components/Toast";
 *    toast("Watching CBD Constructions")            → success, role="status"
 *    toast("Could not save", { kind: "error" })     → error variant, role="alert"
 *
 *  Contract: auto-dismiss at 3500ms (ux-guidelines 3–5s band), hover pauses the
 *  timers, queue stacks up to 3 (oldest evicted), reduced-motion degrades via the
 *  global kill-switch in app.css. Every mutation fires exactly one toast.
 *  Back-compat: the original toast(msg) signature and string CustomEvent detail
 *  still work unchanged. */
import { useEffect, useRef, useState } from "react";

export type ToastKind = "success" | "error";
export type ToastOptions = { kind?: ToastKind };

const DISMISS_MS = 3500; // keep in the 3–5s band — do not drop back to 2600ms
const EXIT_MS = 320; // just past --t-3 so the slide-out finishes before unmount
const MAX_STACK = 3;

export function toast(msg: string, opts: ToastOptions = {}) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("bs:toast", { detail: { msg, kind: opts.kind ?? "success" } })
    );
  }
}

type Item = { id: number; msg: string; kind: ToastKind; show: boolean };
type Timer = { handle: ReturnType<typeof setTimeout> | null; remaining: number; endsAt: number };

export default function ToastHost() {
  const [items, setItems] = useState<Item[]>([]);
  const stackRef = useRef<HTMLDivElement | null>(null);
  const itemsRef = useRef<Item[]>([]);
  const nextId = useRef(1);
  const timers = useRef(new Map<number, Timer>());
  const paused = useRef(false);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    const timerMap = timers.current;

    const dismiss = (id: number) => {
      const t = timerMap.get(id);
      if (t?.handle) clearTimeout(t.handle);
      timerMap.delete(id);
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, show: false } : i)));
      setTimeout(() => setItems((prev) => prev.filter((i) => i.id !== id)), EXIT_MS);
    };

    const arm = (id: number, ms: number) => {
      const handle = paused.current ? null : setTimeout(() => dismiss(id), ms);
      timerMap.set(id, { handle, remaining: ms, endsAt: Date.now() + ms });
    };

    const onToast = (e: Event) => {
      const detail: unknown = (e as CustomEvent).detail;
      const msg =
        typeof detail === "string"
          ? detail
          : String((detail as { msg?: unknown } | null)?.msg ?? "");
      const kind: ToastKind =
        typeof detail === "object" && detail !== null && (detail as { kind?: unknown }).kind === "error"
          ? "error"
          : "success";

      // queue cap: evict the oldest visible toast when a 4th arrives
      const live = itemsRef.current.filter((i) => i.show);
      if (live.length >= MAX_STACK) dismiss(live[0].id);

      const id = nextId.current++;
      setItems((prev) => [...prev, { id, msg, kind, show: false }]);
      // mount hidden, then flip .show next frame so the entry transition runs
      requestAnimationFrame(() =>
        requestAnimationFrame(() =>
          setItems((prev) => prev.map((i) => (i.id === id ? { ...i, show: true } : i)))
        )
      );
      arm(id, DISMISS_MS);
    };

    // hover pauses every pending dismissal; leaving resumes with time left
    const pause = () => {
      paused.current = true;
      timerMap.forEach((t) => {
        if (t.handle) clearTimeout(t.handle);
        t.handle = null;
        t.remaining = Math.max(400, t.endsAt - Date.now());
      });
    };
    const resume = () => {
      paused.current = false;
      [...timerMap.entries()].forEach(([id, t]) => arm(id, t.remaining));
    };

    const el = stackRef.current;
    el?.addEventListener("mouseenter", pause);
    el?.addEventListener("mouseleave", resume);
    window.addEventListener("bs:toast", onToast);
    return () => {
      window.removeEventListener("bs:toast", onToast);
      el?.removeEventListener("mouseenter", pause);
      el?.removeEventListener("mouseleave", resume);
      timerMap.forEach((t) => {
        if (t.handle) clearTimeout(t.handle);
      });
      timerMap.clear();
    };
  }, []);

  return (
    <div className="toast-stack" ref={stackRef}>
      {items.map((t) => (
        <div
          key={t.id}
          className={`toast-fix${t.kind === "error" ? " err" : ""}${t.show ? " show" : ""}`}
          role={t.kind === "error" ? "alert" : "status"}
          aria-live={t.kind === "error" ? "assertive" : "polite"}
        >
          {t.kind === "error" ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" />
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          )}
          <span>{t.msg}</span>
        </div>
      ))}
    </div>
  );
}
