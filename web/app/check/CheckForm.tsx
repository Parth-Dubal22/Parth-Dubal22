"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/Toast";

/** Big hero-style search: name or ABN → POST /api/check → /check/[slug]. */
export default function CheckForm() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const query = q.trim();
    if (!query) {
      toast("Enter a builder name or ABN first.", { kind: "error" });
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = (await res.json()) as { ok: boolean; slug?: string; error?: string };
      if (data.ok && data.slug) {
        router.push(`/check/${data.slug}`);
        return;
      }
      toast(data.error || "Check failed — please try again.", { kind: "error" });
      setBusy(false);
    } catch {
      toast("Check failed — please try again.", { kind: "error" });
      setBusy(false);
    }
  }

  return (
    <form className="search" onSubmit={submit}>
      <input
        type="text"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Check a builder — name or ABN…"
        aria-label="Builder name or ABN"
      />
      <button
        className={`btn btn-p btn-lg${busy ? " busy" : ""}`}
        type="submit"
        disabled={busy}
        aria-busy={busy || undefined}
      >
        {busy ? "Checking…" : "Check free"}
      </button>
    </form>
  );
}
