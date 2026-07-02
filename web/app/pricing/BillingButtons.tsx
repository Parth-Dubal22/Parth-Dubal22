"use client";
/** Pricing page actions — checkout + cancel. Demo mode (no Stripe keys)
 *  activates instantly with a toast; live mode redirects to Stripe Checkout. */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/Toast";

type Plan = "tradie_watch" | "builder_pro";

export function SubscribeButton({ plan, label }: { plan: Plan; label: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function subscribe() {
    setBusy(true);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data: { ok: boolean; url?: string; demo?: boolean; error?: string } = await res.json();
      if (!data.ok) {
        toast(data.error ?? "Something went wrong — please try again.");
        return;
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      if (data.demo) {
        toast("Demo mode — Stripe keys not configured. Subscription activated.");
        router.refresh();
      }
    } catch {
      toast("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button className="btn btn-p" onClick={subscribe} disabled={busy} aria-label={label}>
      {busy ? "Starting checkout…" : label}
    </button>
  );
}

export function CancelButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function cancel() {
    setBusy(true);
    try {
      const res = await fetch("/api/billing/cancel", { method: "POST" });
      const data: { ok: boolean; error?: string } = await res.json();
      if (!data.ok) {
        toast(data.error ?? "Something went wrong — please try again.");
        return;
      }
      toast("Cancelled — no lock-ins. Access continues until the end of your billing period.");
      router.refresh();
    } catch {
      toast("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button className="btn btn-g btn-s" onClick={cancel} disabled={busy} aria-label="Cancel subscription">
      {busy ? "Cancelling…" : "Cancel subscription"}
    </button>
  );
}
