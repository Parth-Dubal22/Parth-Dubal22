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
  const [busy, setBusy] = useState(false);

  if (!viewer) {
    return (
      <div className="card form" style={{ padding: "1.3rem", marginTop: "1rem" }}>
        <b style={{ fontFamily: "var(--fd)" }}>Write a review</b>
        <p className="hint" style={{ margin: 0 }}>
          Reviews are verified against a real job before publishing — sign in to write one.
        </p>
        <a className="btn btn-d" style={{ justifySelf: "start" }} href="/login">
          Sign in to write a review
        </a>
      </div>
    );
  }

  if (viewer.role === "builder" || viewer.role === "admin") {
    return (
      <div className="card form" style={{ padding: "1.3rem", marginTop: "1rem" }}>
        <b style={{ fontFamily: "var(--fd)" }}>Write a review</b>
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
      body: JSON.stringify({ subjectCompanyId: companyId, rating, text: text.trim(), authorRole }),
    });
    const j: { ok: boolean; error?: string } = await res
      .json()
      .catch(() => ({ ok: false, error: "Something went wrong" }));
    setBusy(false);
    if (j.ok) {
      toast("Review submitted — published after verification");
      setText("");
      setRating(5);
      router.refresh();
    } else {
      toast(j.error || "Could not submit the review");
    }
  }

  return (
    <form className="card form" style={{ padding: "1.3rem", marginTop: "1rem" }} onSubmit={onSubmit}>
      <b style={{ fontFamily: "var(--fd)" }}>Write a review</b>
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
        Your experience <span className="hint">— verified against a real job before publishing</span>
        <textarea
          id="r-t"
          placeholder="How was the build? Did payments run on time?"
          required
          value={text}
          onChange={(e) => setText(e.target.value)}
        ></textarea>
      </label>
      <button className="btn btn-d" style={{ justifySelf: "start" }} disabled={busy}>
        Submit review
      </button>
    </form>
  );
}
