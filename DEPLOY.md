# BuildSafe — Vercel + Neon deployment runbook

The app lives in **`web/`** (Next.js 16, App Router, Drizzle ORM → Postgres).
It is deploy-ready: `next build` is green, `web/vercel.json` is valid, and the
Drizzle migrations are in `web/drizzle/`.

> These steps must run somewhere with network access to `vercel.com` and your
> Neon host. The Claude sandbox that built this cannot reach either
> (`api.vercel.com` and `console.neon.tech` are blocked by its egress policy),
> which is why this is a runbook rather than a completed deploy.

## 1. Neon database
1. Create a project at https://console.neon.tech (region: pick AU — `ap-southeast-2` — for latency + the onshore-hosting note in CLAUDE.md).
2. Copy the **pooled** connection string (`...-pooler...`, `?sslmode=require`). That is your `DATABASE_URL`.
3. Push the schema and seed once (from `web/`, with `DATABASE_URL` pointing at Neon):
   ```bash
   cd web
   export DATABASE_URL='postgresql://…-pooler…/neondb?sslmode=require'
   npx drizzle-kit push        # creates all tables (idempotent)
   npm run db:seed             # 1086 categories + demo data (OPTIONAL in prod — see note)
   ```
   Note: `db:seed` inserts the demo companies/logins. For a real launch, run
   `drizzle-kit push` only and seed just the category taxonomy
   (`npx tsx scripts/seed-categories.ts`), skipping the demo accounts.

## 2. Vercel project
1. Import the GitHub repo at https://vercel.com/new.
2. **Root Directory: `web`** (critical — the app is not at repo root).
3. Framework preset: **Next.js** (auto-detected). Build/Install commands: defaults.
4. Deploy once to create the project (it will fail health checks until env vars are set — that's expected).

## 3. Environment variables (Vercel → Settings → Environment Variables, Production)
| Var | Value | Required |
|---|---|---|
| `DATABASE_URL` | Neon pooled connection string | **yes** |
| `AUTH_SECRET` | `openssl rand -base64 32` | **yes** (NextAuth) |
| `AUTH_TRUST_HOST` | `true` | **yes** on Vercel |
| `NEXT_PUBLIC_APP_URL` | `https://<your-domain>` | **yes** (og/absolute URLs) |
| `CRON_SECRET` | `openssl rand -hex 32` | **yes** (protects `/api/cron/ingest`) |
| `ABR_GUID` | your ABN Lookup GUID | for live ingest |
| `INGEST_BATCH` | `25` | optional |
| `SMTP_HOST/PORT/USER/PASS`, `MAIL_FROM` | your SMTP | for real alert emails (else logged) |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_TRADIE`, `STRIPE_PRICE_BUILDER` | Stripe | for live billing (else demo mode) |
| `GOOGLE_MAPS_API_KEY` | Places API key | optional (R4 imports) |

Redeploy after setting them (Deployments → ⋯ → Redeploy) so they take effect.

## 4. Domain
1. Vercel → Settings → Domains → add your domain (e.g. `buildsafe.com.au`).
2. At your registrar, add the records Vercel shows (apex `A 76.76.21.21`, or `CNAME`
   for `www`). TLS provisions automatically.
3. Set `NEXT_PUBLIC_APP_URL` to the final `https://` domain and redeploy.

## 5. Cron
`web/vercel.json` already registers a daily cron (`0 15 * * *` = 01:00 AEST) →
`/api/cron/ingest`. Vercel sends `Authorization: Bearer $CRON_SECRET` automatically.
Daily cadence needs the **Vercel Pro** plan (Hobby allows one daily cron only).

## 6. Post-deploy verification
- `GET /` → 200, landing renders.
- Sign in at `/login` with a demo account (if seeded): `tradie@demo.buildsafe` / `demo1234`.
- `GET /find` → 26 category tiles; `/find/tilers` → category page.
- `GET /api/cron/ingest` **without** the bearer → 401 (auth gate live).
- Trigger the cron once manually (Vercel → Crons → Run) → JSON summary with `"mode":"live"` once `ABR_GUID` is set.

## Notes
- ORM is **Drizzle**, not Prisma (Prisma's engine download is blocked in some CI/sandbox networks; Drizzle is pure JS).
- No `/terms` or `/privacy` pages yet — add before public launch (the lawyer session in `docs/BuildSafe_Master_Plan.md` §4 produces them).
