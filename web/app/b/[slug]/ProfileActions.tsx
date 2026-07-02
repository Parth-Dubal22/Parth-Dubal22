"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "@/components/Toast";

type Role = "customer" | "tradie" | "builder" | "admin";

/** Header action buttons — ported from site/profile.html (#p-quote / #p-watch).
 *  Quote requests: signed-in customers → POST /api/quotes.
 *  Watchlist: signed-in tradies/builders → POST /api/watchlist. */
export default function ProfileActions({
  companyId,
  companyName,
  viewerRole,
}: {
  companyId: number;
  companyName: string;
  viewerRole: Role | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<"quote" | "watch" | null>(null);

  async function post(url: string, body: unknown): Promise<{ ok: boolean; error?: string }> {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.json().catch(() => ({ ok: false, error: "Something went wrong" }));
  }

  async function onQuote() {
    if (!viewerRole) {
      router.push("/login");
      return;
    }
    if (viewerRole !== "customer" && viewerRole !== "admin") {
      toast("Quote requests come from customer accounts — create one free");
      return;
    }
    setBusy("quote");
    const j = await post("/api/quotes", { companyId });
    setBusy(null);
    if (j.ok) toast(`Quote request sent to ${companyName} — replies land in your Customer app`);
    else toast(j.error || "Could not send the quote request");
  }

  async function onWatch() {
    if (!viewerRole) {
      router.push("/login");
      return;
    }
    if (viewerRole === "customer") {
      toast("Watchlists live in the Tradie & Builder app — create a pro profile to monitor builders");
      return;
    }
    setBusy("watch");
    // Builders watch other companies as clients (their app's upward watch
    // queries kind:'client'); tradies watch them as builders.
    const j = await post("/api/watchlist", {
      companyId,
      kind: viewerRole === "builder" ? "client" : "builder",
    });
    setBusy(null);
    if (j.ok) toast(`${companyName} added to your watchlist`);
    else toast(j.error || "Already on your watchlist");
  }

  return (
    <>
      <button className="btn btn-p" onClick={onQuote} disabled={busy === "quote"} aria-label={`Request a quote from ${companyName}`}>
        Request a quote
      </button>
      <button className="btn btn-g btn-s" onClick={onWatch} disabled={busy === "watch"} aria-label={`Add ${companyName} to your watchlist`}>
        ＋ Add to watchlist
      </button>
    </>
  );
}
