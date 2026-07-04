# BuildSafe — Pre-launch checklist

Living doc. Sections 1–4 are engineering; section 5 is the **lawyer sign-off gate** —
do not go public until every ⛔ item is cleared by a qualified Australian tech/media
lawyer (Master Plan §4: budget ~$1.5–3K, "the single best money you will spend").

## Launch-readiness ledger (what's left, at a glance)

| Item | State | Owner | Blocking launch? |
|---|---|---|---|
| Rate limiting (code) | ✅ done, in `main` | — | no |
| Sentry wiring (code) | ✅ done (inert until DSN) | — | no |
| Demo-credential gate (code) | ✅ done | — | no |
| App build / lint / typecheck | ✅ green | — | no |
| **Upstash Redis account + env vars** | ⚠️ not set | you | **yes** (else limiter is per-instance only) |
| **Sentry account + DSN env vars** | ⚠️ not set | you | recommended, not hard |
| **Deploy to Vercel + Neon** (see `DEPLOY.md`) | ⚠️ not done | you (or me, w/ creds) | **yes** |
| **Neon PITR ≥ 7 days + one test restore** | ⚠️ unconfirmed | you | **yes** |
| **Independent nightly `pg_dump` backup** | ⏸️ deferred — host TBD | you (then me) | recommended |
| Onshore region (Neon + Vercel = AU) | ⚠️ set at deploy | you | **yes** (Privacy Act) |
| Rotate all shared secrets post-dev | ⚠️ at deploy | you | **yes** |
| Confirm 0 demo accounts on prod DB | ⚠️ at deploy | you | **yes** |
| **`/terms`, `/privacy`, `/disclaimer` pages** | ⏸️ deferred — lawyer session | lawyer → then build | **yes** |
| **Lawyer sign-off** (T&Cs, risk wording, reviews) | ⛔ not started | you + lawyer | **yes** |

⏸️ = intentionally held per owner decision (lawyer produces the legal copy; backup host chosen later).

---

## 1. Rate limiting (public + mutation endpoints) — ✅ implemented
Shared limiter `web/lib/rate-limit.ts` (Upstash Redis sliding-window in prod via
`UPSTASH_REDIS_REST_URL`/`_TOKEN`; in-memory fallback for single-instance dev;
**fail-open** on infra error). Applied per the table in the commit. Not applied to
the Stripe webhook (signature-verified) or the cron route (bearer-protected).
- ⚠️ **Action for you:** create a free Upstash Redis DB and set the two env vars in
  Vercel Production. Without them, limiting falls back to in-memory, which is
  **per-serverless-instance** and therefore ineffective across Vercel replicas.

## 2. Error monitoring — ✅ wired (Sentry free tier), inert until configured
`@sentry/nextjs` via the instrumentation hook (Turbopack-safe; no webpack plugin).
Completely no-ops with no DSN set.
- ⚠️ **Action for you:** create a free project at https://sentry.io, set `SENTRY_DSN`
  and `NEXT_PUBLIC_SENTRY_DSN` in Vercel Production. Confirm a test error appears
  (`throw` in a scratch route, or Sentry's test button).

## 3. Database backups (Neon) — ⚠️ confirm in your account
Neon provides continuous backup with **point-in-time restore (PITR)** — no dumps to
manage. I can't confirm your project's settings from here (no Neon access), so verify:
1. Neon Console → your project → **Branches / Restore** → confirm PITR history
   window (Free ≈ 24h; paid plans up to 7–30 days). For a risk/records product,
   **a 7-day window is the minimum you want** — upgrade if on Free.
2. Do a **test restore** once: create a branch from a timestamp 1h ago, confirm the
   data is intact, delete the branch. A backup you've never restored is a hope, not a backup.
3. **Belt-and-suspenders (recommended):** a nightly logical dump to object storage,
   independent of Neon, e.g. a scheduled job running
   `pg_dump "$DATABASE_URL" | gzip > buildsafe-$(date +%F).sql.gz` → S3/R2 with 30-day
   retention. This also satisfies the Privacy Act breach/■retention posture in §4.3
   (you can prove what data existed when). Not wired yet — decide host (GitHub Action,
   Vercel cron + storage, or a small VM) and I'll build it.
4. Restrict the Neon role: the app's `DATABASE_URL` should use a role with DML only,
   not `SUPERUSER`; keep the owner credentials separate and out of the app env.

## 4. Demo credentials — ✅ hardened
`scripts/seed.ts` now gates ALL demo accounts (the `*@demo.buildsafe` logins and the
shared `demo1234` password) behind `SEED_DEMO=1` (auto-on in dev, **off in production**).
Production seeding loads only the category taxonomy — never a demo login.
- ⛔ **Before launch, confirm on the live DB:** `SELECT email FROM users WHERE email LIKE '%@demo.buildsafe';`
  returns **0 rows**. If you ever seeded demo data to prod, delete those users and
  rotate `AUTH_SECRET` (invalidates any sessions minted against demo accounts).
- ⛔ Rotate every shared secret before public launch: `AUTH_SECRET`, `CRON_SECRET`,
  Stripe keys, `ABR_GUID` if it was ever pasted into chat/logs. None of the real
  secrets live in the repo (only `.env.example` placeholders) — good.

---

## 5. ⛔ LAWYER SIGN-OFF GATE (Master Plan §4 — non-negotiable before public launch)

The product was built to these guardrails; a lawyer must still review the wording and
T&Cs. Cross-reference: each item notes what the code already does.

**Defamation (§4.1 — risk #1):**
- ⛔ **T&Cs + risk-score wording** reviewed by an AU tech/media lawyer. *(Code: alerts
  state facts + linked sources, never verdicts; risk level is subscriber-gated; public
  pages show positive/neutral only; reviews carry right-of-reply and are never deleted
  except an admin `removed_legal` takedown. Lawyer must bless the exact copy.)*
- ⛔ **Honest-opinion framing** of the status rating confirmed ("based on the disclosed
  public records listed"). *(Code renders this; needs legal blessing.)*
- ⛔ **User-reported payment data** only shown aggregated/anonymised — confirm the
  threshold and wording are defensible. *(Code aggregates; never per-reporter public.)*
- ⛔ **48h dispute/correction process** — confirm the SLA and takedown mechanics are
  adequate. *(Code: disputes queue, `removed_legal` review takedown, recompute.)*

**Australian Consumer Law s18 (§4.2):**
- ⛔ No "predict"/"prediction" language anywhere public; "monitors public records and
  flags signals" framing approved. *(Code: verified clean in the R5 audit — lawyer to
  confirm marketing copy too.)*
- ⛔ Data-freshness claims ("last checked") are accurate and the badge criteria are met.

**Privacy Act 1988 (§4.3):**
- ⛔ **Privacy Policy** published (collection, use, disclosure, retention, overseas
  disclosure). **No `/privacy` page exists yet — must be written and linked before launch.**
- ⛔ **Notifiable Data Breaches** response plan documented.
- ⛔ Sole-trader/individual data handled as personal info; AFSA/bankruptcy data on
  individuals NOT republished. *(Code: no AFSA data used.)*
- ⛔ **Onshore hosting** confirmed — set Neon + Vercel regions to Australia
  (`ap-southeast-2` / `syd1`).

**Credit reporting (§4.4):**
- ⛔ T&Cs state **business-purpose use only**; not a consumer credit report.
  *(Code: this line renders on check results + alert emails — lawyer to confirm sufficiency.)*

**Verification badge integrity (§4.6):**
- ⛔ Published, objective badge criteria + monthly re-check + instant revocation are
  legally sufficient as a representation you make. *(Code: criteria published on
  profile/check pages; admin revoke path exists; cron re-check wired.)*

**Marketing law (§4.8):**
- ⛔ Spam Act: no bulk unsolicited email/SMS without consent; alert emails are to
  consented subscribers only. Testimonials real.

**Business hygiene (§4.9):**
- ⛔ Pty Ltd entity; **Professional Indemnity + Cyber insurance** (strongly recommended
  from first revenue; **required before any Phase 3 SOPA/claims work**).
- ⛔ Standalone **`/terms`, `/privacy`, `/disclaimer`** pages exist and are linked in
  the footer. **None exist yet — build + lawyer-review before launch.**

**Job board (Competitive Analysis §labour-hire):**
- ⛔ Confirm the "noticeboard, not labour-hire agency" model is clean (never set pay,
  never direct work, never invoice for labour). *(Code: rate is builder free-text; no
  labour invoicing; noticeboard disclaimer renders on /jobs.)*

**Phase 3 only (do NOT enable at launch):**
- SOPA claim assistant + lawyer referral pipeline — lawyer-in-the-loop, PI insurance,
  "document preparation, not legal advice" disclosure. Not built; keep it that way for v1.

---

### Quick pre-flight (run against the live DB/site the day of launch)
- [ ] `SELECT count(*) FROM users WHERE email LIKE '%@demo.buildsafe'` = 0
- [ ] `/api/cron/ingest` without bearer → 401
- [ ] Rapid repeat of `/api/register` from one IP → 429 (Upstash configured)
- [ ] Sentry receives a test error
- [ ] Neon PITR window ≥ 7 days + one successful test restore
- [ ] `/terms`, `/privacy`, `/disclaimer` live and linked
- [ ] Lawyer sign-off received in writing on T&Cs + risk-score + review wording
- [ ] Neon + Vercel regions = Australia
- [ ] All shared secrets rotated post-development
