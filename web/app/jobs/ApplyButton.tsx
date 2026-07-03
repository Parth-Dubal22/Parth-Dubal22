"use client";
/** One-tap apply — always free (zero lead fees, no credits, ever). */
import { useState } from "react";
import { toast } from "@/components/Toast";

export default function ApplyButton({ jobId }: { jobId: number }) {
  const [state, setState] = useState<"idle" | "busy" | "applied">("idle");

  async function apply() {
    setState("busy");
    try {
      const res = await fetch(`/api/jobs/${jobId}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data: { ok?: boolean; error?: string } = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setState("applied");
        toast("Application sent — the builder can see your verified profile");
      } else if (res.status === 409 && data.error === "Already applied") {
        setState("applied");
        toast("Already applied");
      } else {
        setState("idle");
        toast(data.error ?? "Something went wrong — try again.", { kind: "error" });
      }
    } catch {
      setState("idle");
      toast("Network error — try again.", { kind: "error" });
    }
  }

  if (state === "applied") return <span className="pill ok">Applied ✓</span>;
  const busy = state === "busy";
  return (
    <button
      className={`btn btn-p btn-s${busy ? " busy" : ""}`}
      onClick={apply}
      disabled={busy}
      aria-busy={busy || undefined}
      aria-label="Apply for this job — free, zero lead fees"
    >
      {busy ? "Applying…" : "Apply now"}
    </button>
  );
}
