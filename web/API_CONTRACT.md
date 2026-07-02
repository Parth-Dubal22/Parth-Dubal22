# BuildSafe API contract (v1)

Every JSON endpoint returns `{ ok: true, ...data }` or `{ ok: false, error: string }` with proper HTTP status.
Auth: NextAuth session cookie; use `apiUser(...roles)` from `@/lib/session`. Server components query the DB
directly with drizzle; **mutations always go through these routes**.

| Route | Method | Auth | Body → Result |
|---|---|---|---|
| `/api/register` | POST | public | `{role:'customer'\|'tradie'\|'builder', name, email, password, profile:{…role fields}}` → `{ok}` then client signs in via next-auth `signIn("credentials")` |
| `/api/profile` | PUT | any | partial profile fields for own role → `{ok}` |
| `/api/availability` | POST | tradie | `{availableNow:boolean}` → `{ok, availableNow}` |
| `/api/watchlist` | POST | tradie/builder | `{companyId?, abn?, name?, kind:'builder'\|'client'}` (companyId or abn/name lookup) → `{ok, item}` |
| `/api/watchlist` | DELETE | tradie/builder | `?companyId=` → `{ok}` |
| `/api/exposure` | PUT | tradie/builder | `{companyId, amountCents, kind:'owed'\|'deposit', note?}` (upsert) → `{ok}` |
| `/api/alerts/read` | POST | any | `{alertId}` → `{ok}` |
| `/api/check` | POST | public | `{query}` (name or ABN) → `{ok, slug}`; client navigates to `/check/[slug]` |
| `/api/jobs` | POST | builder | `{title, type:'subcontract'\|'day_hire', rate, location, startText, duration, requirement?, trade?}` → `{ok, job}` |
| `/api/jobs/[id]/apply` | POST | tradie | `{note?}` → `{ok}` (unique per tradie) |
| `/api/applications/[id]` | POST | builder(job owner) | `{action:'accept'\|'decline'}` → `{ok}`; accept ⇒ status `contacted` + adds tradie to the builder's subbie panel |
| `/api/jobs/[id]` | PATCH | builder(owner) | `{status:'open'\|'closed'}` → `{ok}` |
| `/api/reviews` | POST | any | `{subjectCompanyId? \| subjectUserId?, rating:1..5, text, paidOnTime?, authorRole:'homeowner'\|'subcontractor'\|'builder'}` → `{ok, review}` |
| `/api/reviews/[id]/reply` | POST | builder(subject company owner) | `{reply}` → `{ok}` (reply is public, review never deleted) |
| `/api/payment-reports` | POST | tradie | `{companyId, daysLate, hasInvoiceEvidence}` → `{ok}` (displayed only aggregated & anonymised) |
| `/api/quotes` | POST | customer | `{companyId, projectType?, note?}` → `{ok}` |
| `/api/disputes` | POST | any | `{targetType:'signal'\|'review'\|'check'\|'profile', targetId, reason}` → `{ok, slaDueAt}` (48h SLA) |
| `/api/billing/checkout` | POST | tradie/builder | `{plan:'tradie_watch'\|'builder_pro'}` → `{ok, url}` (Stripe Checkout; **demo mode** without keys: activates sub, returns `{ok, demo:true}`) |
| `/api/billing/cancel` | POST | subscriber | `{}` → `{ok}` (cancel anytime — no lock-ins) |
| `/api/stripe/webhook` | POST | stripe sig | Stripe events → 200 |
| `/api/admin/signals/[id]` | POST | admin | `{action:'approve'\|'reject'}` → `{ok}` (approve ⇒ fan out alerts + emails to watchers, recompute company riskLevel) |
| `/api/admin/verifications/[id]` | POST | admin | `{action:'approve'\|'reject'\|'revoke', note?}` → `{ok}` (approve ⇒ set company tier; revoke ⇒ tier none) |
| `/api/admin/disputes/[id]` | POST | admin | `{action:'corrected'\|'rejected', resolution}` → `{ok}` |

Shared conventions:
- Money in **cents** in DB/API; format with `centsToMoney` from `@/lib/format`.
- Risk detail (signals list, riskLevel, exposure) requires `canSeeRiskDetail(user)` from `@/lib/access` — subscribers/admin only. Public pages (`/b/[slug]`, `/check/[slug]`) show **facts + positive/neutral info only**, with source links and "last checked" freshness.
- Company rating stored as `ratingAvg` ×10 (int). Convert with `ratingX10ToNumber`.
- Never present risk as a prediction or verdict. Copy style: "monitors public records and flags signals".
