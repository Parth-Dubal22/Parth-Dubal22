"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "@/components/Toast";

type Role = "customer" | "tradie" | "builder" | "admin";

/** Write-a-review form — ported 1:1 from site/profile.html #rev-form.
 *  Requires a session: signed-out visitors get a sign-in CTA instead.
 *  authorRole is derived from the account (customer → homeowner,
 *  tradie → subcontractor) per the API contract. Builders review tradies
 *  from the Builder app (not companies here); admins moderate, not write —
 *  both get an explanatory card, matching /api/reviews rules. */
export default function ReviewForm({
  companyId,
  viewer,
}: {
  companyId: number;
  viewer: { name: string; role: Role } | null;
}) {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [paidOnTime, setPaidOnTime] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  if (!viewer) {
    return (
      <div className="card flat form" style={{ marginTop: "var(--s4)" }}>
        <h3>Write a review</h3>
        <p className="hint" style={{ margin: 0 }}>
          Reviews get a Verified badge when we can match them to a real job on the platform — sign in to write one.
        </p>
        <div className="actions">
          <a className="btn btn-d" href="/login">
            Sign in to write a review
          </a>
        </div>
      </div>
    );
  }

  if (viewer.role === "builder" || viewer.role === "admin") {
    return (
      <div className="card flat form" style={{ marginTop: "var(--s4)" }}>
        <h3>Write a review</h3>
        <p className="hint" style={{ margin: 0 }}>
          {viewer.role === "builder"
            ? "Builders review the tradies they've hired — from your Builder app, after a job. Customers and subbies review builder companies here."
            : "Admin accounts moderate reviews — they don't write them."}
        </p>
      </div>
    );
  }

  const authorRole: "homeowner" | "subcontractor" =
    viewer.role === "customer" ? "homeowner" : "subcontractor";
  const roleLabel = authorRole === "homeowner" ? "Homeowner" : "Subcontractor";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!text.trim() || busy) return;
    setBusy(true);
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subjectCompanyId: companyId,
        rating,
        text: text.trim(),
        authorRole,
        ...(authorRole === "subcontractor" && paidOnTime !== null ? { paidOnTime } : {}),
      }),
    });
    const j: { ok: boolean; error?: string } = await res
      .json()
      .catch(() => ({ ok: false, error: "Something went wrong" }));
    setBusy(false);
    if (j.ok) {
      toast("Review published — thanks for sharing");
      setText("");
      setRating(5);
      setPaidOnTime(null);
      router.refresh();
    } else {
      toast(j.error || "Could not submit the review", { kind: "error" });
    }
  }

  return (
    <form className="card flat form" style={{ marginTop: "var(--s4)" }} onSubmit={onSubmit}>
      <h3>Write a review</h3>
      <div className="f2">
        <label>
          Your name
          <input type="text" id="r-n" value={viewer.name} readOnly aria-readonly="true" />
        </label>
        <label>
          You are a…
          <select id="r-role" value={roleLabel} disabled aria-label={`Reviewing as ${roleLabel}`}>
            <option>Homeowner</option>
            <option>Subcontractor</option>
          </select>
        </label>
      </div>
      <label>
        Rating
        <select id="r-r" value={rating} onChange={(e) => setRating(Number(e.target.value))}>
          <option>5</option>
          <option>4</option>
          <option>3</option>
          <option>2</option>
          <option>1</option>
        </select>
      </label>
      <label>
        Your experience{" "}
        <span className="hint">— we add a Verified badge when this matches a real job on the platform</span>
        <textarea
          id="r-t"
          placeholder="How was the build? Did payments run on time?"
          required
          value={text}
          onChange={(e) => setText(e.target.value)}
        ></textarea>
      </label>
      {authorRole === "subcontractor" ? (
        <label>
          Were you paid on time?
          <select
            id="r-paid"
            value={paidOnTime === null ? "" : paidOnTime ? "yes" : "no"}
            onChange={(e) =>
              setPaidOnTime(e.target.value === "" ? null : e.target.value === "yes")
            }
          >
            <option value="">Prefer not to say</option>
            <option value="yes">Yes — paid on time</option>
            <option value="no">No — payment was late</option>
          </select>
        </label>
      ) : null}
      <div className="actions">
        <button className={"btn btn-d" + (busy ? " busy" : "")} disabled={busy} aria-busy={busy || undefined}>
          {busy ? "Submitting…" : "Submit review"}
        </button>
      </div>
    </form>
  );
}
