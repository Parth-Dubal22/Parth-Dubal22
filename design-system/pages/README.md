# Per-page overrides (UI/UX Pro Max persist pattern)

**Lookup rule for any styling/UX decision:**

1. Open `design-system/pages/<page>.md` — if it exists **and** speaks to your topic, it wins.
2. Otherwise `design-system/MASTER.md` is the answer. No third source.

Page files contain **deltas only** — never restate MASTER values (a restated value is a fork
waiting to drift). If a page needs no deviation, it gets no file; absence of a file means
"MASTER applies in full".

## File naming

One file per route, named after the route path with `/` → `-` and dynamic segments spelled bare:

| Route | Override file |
|---|---|
| `/` (landing) | `pages/home.md` |
| `/login` | `pages/login.md` |
| `/onboarding` | `pages/onboarding.md` |
| `/tradie` · `/builder` · `/customer` · `/admin` | `pages/tradie.md` etc. |
| `/b/[slug]` (public builder profile) | `pages/b-slug.md` |
| `/t/[slug]` (public tradie profile, R6) | `pages/t-slug.md` |
| `/check` · `/check/[slug]` | `pages/check.md` · `pages/check-slug.md` |
| `/jobs` | `pages/jobs.md` |
| `/pricing` | `pages/pricing.md` |

## What belongs in a page file

- A deviation from a MASTER value, with the reason (e.g. "cover height 280px on `/b/[slug]`
  hero variant A/B test — overrides §11.3 clamp").
- Page-specific composition (section order, which empty-state illustration, which chart forms).
- Page-specific acceptance notes (e.g. `/b/[slug]`: Lighthouse SEO ≥95, JSON-LD LocalBusiness,
  og-image — per SPEC_V2 R6).

## What never belongs here

Token values, component recipes, accessibility invariants, legal copy rules — those are
MASTER-only. If you find yourself overriding the same thing on 2+ pages, stop: promote the
pattern into MASTER instead and delete the overrides.

No page files exist yet — the R2 theme pass applies MASTER uniformly; create files only when a
genuine per-page deviation is approved.
