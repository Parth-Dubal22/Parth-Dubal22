"use client";
/** Toast host — ported from prototype toast(). Mount once in root layout.
 *  Fire with: import { toast } from "@/components/Toast"; toast("msg") */
import { useEffect, useRef, useState } from "react";

export function toast(msg: string) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("bs:toast", { detail: msg }));
  }
}

export default function ToastHost() {
  const [msg, setMsg] = useState("");
  const [show, setShow] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onToast = (e: Event) => {
      setMsg(String((e as CustomEvent).detail ?? ""));
      setShow(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setShow(false), 2600);
    };
    window.addEventListener("bs:toast", onToast);
    return () => {
      window.removeEventListener("bs:toast", onToast);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return (
    <div id="toast" className={`toast-fix${show ? " show" : ""}`} role="status" aria-live="polite">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
        <path d="M20 6L9 17l-5-5" />
      </svg>
      <span>{msg}</span>
    </div>
  );
}
