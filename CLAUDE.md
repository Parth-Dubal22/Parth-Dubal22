# CLAUDE.md — BuildSafe Project Brief
*Claude Code: read this first, every session. This is the source of truth.*

## What BuildSafe is
A two-sided platform for Australian construction — **like Uber has a rider app and a driver app**:
- **Customer app** → homeowners hire financially-verified builders, read two-way reviews, run free deposit-safety checks.
- **Pro app (tradies + builders)** → watchlists & risk alerts, exposure tracking, job board, profiles, verification badges.
- Underneath both: **one financial risk engine** monitoring public records (ASIC, courts, state licence registers) per ABN.

Business context, competitor teardown, legal analysis, pricing and marketing are in `/docs` — read all three files before major decisions.

## ⚠️ NEVER-FORGET REQUIREMENTS (owner's explicit list — do not drop any)
1. **TWO SIDES, ALWAYS.** Every feature decision must serve customer side AND pro side. Never build customer-only or tradie-only and call it done.
2. **Profiles for everyone** — customers, tradies, builders each create profiles (role-picker onboarding → tailored wizard). Tradie profiles: trades (all of them — tiling, bricklaying, carpentry, electrical, plumbing, rendering, concreting, plastering, painting, roofing, landscaping, labouring), licence, insurance w/ expiry, portfolio photos, reliability score. Builder profiles: company, ABN, builder licence, what they build, portfolio, verification tier, public page.
3. **Reviews are two-way and verified.** Customers review builders; SUBBIES review builders (incl. payment behaviour); builders review tradies. Builders can reply publicly, never delete. Never suppress negatives.
4. **Job board — builder→tradie hiring**: builders post subcontract packages AND day-hire; tradies apply free (ZERO lead fees, ever); **"Available Now" toggle** for day work; builder's risk status shown on every job card ("will I get paid?" answered upfront); applicants shown with verified licence/insurance/reliability.
5. **Risk engine features**: free builder check (name/ABN), watchlists with continuous monitoring, $ exposure tracker, SMS/push alerts, every alert cites its public source.
6. **Builders are protected too**: they watch their developers/clients (upward) and their subbie panel (downward — licence/insurance expiry tracking), plus their own health view.
7. **Verification badge tiers** (ID Verified → BuildSafe Verified → Verified + Track Record) with published criteria, monthly re-checks, instant revocation.
8. **Community layer (Phase 2)**: trade feed/forum, collapse-watch news, expert Q&A — with active moderation (we're liable as publisher).
9. **Anti-patterns forbidden** (learned from HiPages/Airtasker/Oneflare): no pay-per-lead, no expiring credits, no lock-in contracts, no review suppression, no AI-only support, no double-dipping fees.

## ⚖️ LEGAL GUARDRAILS (non-negotiable — full detail in docs/BuildSafe_Master_Plan.md §4)
- **Defamation is risk #1**: small companies (<10 staff) CAN sue in Australia; directors personally too. Therefore: alerts state FACTS with linked sources, never verdicts/predictions; risk ratings framed as opinion based on disclosed records; detailed risk info private to subscribers — public pages show positive/neutral only; user payment reports aggregated & anonymised; 48h dispute/correction process.
- ACL s18: never say "predict"; show data freshness; accuracy discipline.
- Privacy Act: sole traders = personal info; onshore hosting; privacy policy; breach plan. Not consumer credit reporting (business-purpose only, state it in T&Cs).
- Job board = noticeboard, not labour hire: never set pay, never direct work, never invoice for labour.
- SOPA claims features = Phase 3 only, lawyer-in-the-loop, "document preparation, not legal advice".
- Copy already written into the frontend reflects these — keep that language when refactoring.

## What's already built (in /site — working frontend prototype, vanilla HTML/CSS/JS, in-memory demo data)
index.html (landing, two-app hero) · onboarding.html (role picker + 3 wizards) · app-tradie.html (dashboard/watchlist/exposure/alerts/jobs+apply/Available Now/editable profile/portfolio/reviews) · app-builder.html (overview/post-a-job WORKS/applicants/watch up+down/verification tiers/reviews+reply) · app-customer.html (directory+filters/deposit-safety check WORKS/quote requests) · profile.html (public builder page, two-way reviews, write-review WORKS) · css/app.css (full design system) · js/data.js + js/app.js.
Design: fintech navy #0A1B2E × signal orange #FF5A1F, Space Grotesk/Inter/JetBrains Mono, SVG scene art (swap for real photos later, keep aspect ratios). Keep: focus states, reduced-motion, 4.5:1 contrast, no emoji-as-icons.

## Build order from here (do in this order)
1. **Stack**: Next.js (or similar) + Postgres + auth. Port the prototype pages 1:1 — design is approved, don't redesign.
2. **Data pipeline v1**: ABN Lookup API → company records; ASIC published notices scraper/feed; VBA (VIC) licence register. One record per ABN, signal log table. (Respect each source's access terms — link out where re-use is restricted.)
3. **Accounts & profiles** (3 roles), watchlists, exposure tracker, alert engine (email first, then SMS via Twilio).
4. **Free builder check** live + shareable public result pages (SEO).
5. **Job board** (post/apply/applicants/Available Now) — no payments in v1.
6. **Stripe subscriptions**: Tradie Watch $29/mo, Builder Pro $99/mo, no lock-ins, cancel anytime.
7. Verification workflow (admin approval queue), reviews with verification flow, dispute/correction queue (48h SLA).
Launch target: Victoria first. Everything else (community, directory SEO grid, escrow, SOPA engine) is Phase 2–3 per docs.

## Owner
Parth — Melbourne. Direct, dense answers; production-ready output; money-first priorities. When in doubt about scope: smallest thing someone will PAY for, then expand.
