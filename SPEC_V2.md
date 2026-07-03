# BUILDSAFE — BUILD SPEC v2 ("Make it real, make it beautiful")
Save this file as `SPEC_V2.md` in the repo root. Then tell Claude Code:
"Read SPEC_V2.md. Confirm the task list back to me with estimates, then execute in order. Screenshot every page before/after."

Rules for this pass: visual + feature layer per spec. Keep the existing API contract stable unless a requirement below needs a new endpoint (messaging, imports, availability). Keep all legal guardrails from CLAUDE.md — they override everything here.

---

## R1 — REAL PHOTOGRAPHY EVERYWHERE (no more placeholder-only art)
- Source 10–20 licensed, royalty-free photos via the Unsplash or Pexels API (free keys) — NEVER hotlink Google Images results (copyright). Themes: Australian residential construction site at dusk, timber framing, crane skyline, tiler laying floor, bricklayer at wall, sparkie in switchboard, plumber under sink, renderer on scaffold, concreter pouring slab, painter cutting in, roofer on tiles, landscaper, finished home handover, builder-client handshake on site, team in hi-vis.
- Download to `/public/photos/`, convert to .webp, responsive `sizes`, lazy-load below the fold, alt text on all.
- Wire into: landing hero background/side, landing gallery, category tiles (R5), builder profile default covers, portfolio placeholder slots, onboarding side panels, login side panel.
- Keep existing SVG art ONLY as automatic fallback if a photo fails to load.
- Acceptance: no page above the fold without at least one real photo; Lighthouse image audit passes.

## R2 — PROFESSIONAL THEME PASS (kill the "basic" feel)
- Run the UI/UX Pro Max skill design-system step FIRST; produce `design-system/MASTER.md`; then apply globally.
- Fix every inconsistency: the /login password input must match email input styling (this bug is symptomatic — audit every input, select, textarea, button size, card radius, shadow, spacing rhythm across ALL pages at 375/768/1440).
- Add polish layer: glass sticky nav, consistent section rhythm (same vertical spacing scale), skeleton loaders on all data fetches, empty states with illustration + CTA, error states, toasts for every mutation, page transitions (respect prefers-reduced-motion), favicon + og-images.
- Typography/colour stay in the approved system (navy #0A1B2E / orange #FF5A1F / Space Grotesk + Inter + JetBrains Mono).
- Acceptance: UI/UX Pro Max pre-delivery checklist table = all pass, per page; zero unstyled form controls anywhere.

## R3 — TWO SIDES + IN-APP MESSAGING (community backbone)
Both sides already exist; now connect them:
- **Messaging system** (new): conversation threads between (a) customer ↔ tradie/builder, (b) builder ↔ tradie, (c) builder ↔ their team members (see R4 teams). Attach a thread automatically to: quote requests, job applications (on accept), and profile "Message" buttons.
- Features: text + image attachments, unread badges in both app sidebars, email notification on first unread ("You have a new message on BuildSafe"), typing-free simple polling or SSE (no heavy infra), report + block per conversation, admin can view reported threads only.
- Guardrails: rate-limit sends; profanity/abuse flagging queue for admin; never expose email/phone inside threads automatically — users share what they choose.
- Acceptance: e2e — customer requests quote → messages builder → builder replies → tradie applies to job → accepted → thread opens → both see unread counts.

## R4 — RICH, CUSTOMISABLE PRO PROFILES + TEAMS + IMPORTS + AI INSIGHTS
Model on what converts on Houzz/Checkatrade (research-verified): services + areas covered stated upfront; business story/values; photo & video gallery; team faces; accreditations/licences; a FEATURED review pinned prominently; quick "text highlights" (e.g. "10+ yrs · Fixed quotes · Cleans up"); complete contact block; responsiveness shown. Implement:
- **Profile builder (pro side)**: sections the owner can toggle/reorder — About/story, Services (with per-service starting price "from $X"), Areas served (suburb chips + radius), Gallery (photo/video, project albums with captions), Team ("the crew" — name, role, photo), Accreditations & licences, Featured review picker, Business hours, Contact block (phone/site/socials — owner chooses visibility), Highlights chips.
- **Customisation**: accent colour picker (from approved palette), cover photo, logo upload, layout order drag.
- **Imports**: 
  - Google Business Profile via Places API (env `GOOGLE_MAPS_API_KEY`): pull name, address, hours, phone, rating count, and reviews *summary stats* (respect ToS — display "4.6★ on Google (128)" with link, don't republish full Google review text as ours).
  - Instagram/Facebook: paste page/post URLs → oEmbed embed cards in gallery + "Follow" buttons (full Graph API import is a later phase; do link-based now).
  - Website link with auto-fetched favicon/preview card.
- **Team seats**: builder invites staff by email (role: member) — members get login, appear on profile, can be messaged (R3), can manage jobs but not billing.
- **AI insights panel (owner-only dashboard)**: charts (recharts) — profile views/week, message response time, quote win rate, job fill time; **Availability calendar** the pro sets (available / booked / away) shown as a public "Next available: ~2 weeks" indicator + typical project duration field per service ("Bathroom retile: 4–6 days"). Label projections as estimates.
- Acceptance: a builder can build a profile that looks genuinely custom in <10 min; public profile shows all sections; Google import fills fields in one click (with key) or shows graceful "connect Google" state (without).

## R5 — CATEGORY SYSTEM WITH IMAGES (both directions)
- 12+ trade categories, each with a real licensed photo tile (from R1 set): Tiling, Bricklaying, Carpentry, Electrical, Plumbing, Rendering, Concreting, Plastering, Painting, Roofing, Landscaping, Labouring (+ Builders as its own tile on customer side).
- **Customer side**: photo category grid on the app home ("What do you need done?") → tap → filtered directory of pros in that category, sorted by the 4 R's principle (relevance, recency of activity, robustness of profile, responsiveness).
- **Pro side**: same photo grid filters the job board ("What work are you looking for?"); jobs tagged with category; category shown on job cards with a small thumbnail.
- Category selection in onboarding + profile editing uses the same visual tiles (not plain chips).
- Acceptance: e2e both directions — customer: pick Tiling → see tilers; tradie: pick Bricklaying → see bricklaying jobs.

## R6 — PUBLIC PROFILE PAGE = THE FLAGSHIP PAGE
Everything from R4 rendered public at `/b/[slug]` (builders) and NEW `/t/[slug]` (tradies), plus:
- Hero: cover photo, logo/avatar, name, verified badge/status, rating + review count, location + areas, "Message" + "Request quote" + "Save" buttons, responsiveness indicator ("Replies in ~2h").
- Body: highlights chips, about/story, services with from-prices, gallery/albums, team, accreditations, availability indicator + typical durations, featured review, all reviews (two-way, verified, replies), Google rating link if connected, socials, map of service area, similar pros row.
- SEO: per-profile meta/og image, JSON-LD LocalBusiness schema, sitemap entries.
- Keep the legal split: risk detail stays subscriber-gated; public shows facts + positive/neutral only.
- Acceptance: share a profile URL in WhatsApp → rich preview card; Lighthouse SEO ≥ 95 on profile pages.

## R7 — USER-FRIENDLINESS SWEEP (steal the best, dodge the hated)
Adopt: instant global search (pros, jobs, suburbs) in the nav; mobile bottom-tab bar in both apps; onboarding progress save; "complete your profile" meter with the 4 R's tips; notification centre (bell) unifying alerts/messages/applications; helpful empty states; a public /how-it-works page per side; support page with real contact.
Never (already law, restated): pay-per-lead, expiring credits, lock-ins, review suppression, AI-only support, double-dipping.
- Acceptance: full Chromium e2e regression of every flow incl. new ones; keyboard-only pass on auth, onboarding, messaging; mobile 375px pass on every page.

## DELIVERY ORDER
1) R2 theme system + R1 photos (foundation) → 2) R5 categories → 3) R4 profiles/teams/imports/AI panel → 4) R6 public pages → 5) R3 messaging → 6) R7 sweep → 7) full regression + screenshot gallery of every page for owner review.

## ENV ADDITIONS
UNSPLASH_ACCESS_KEY or PEXELS_API_KEY · GOOGLE_MAPS_API_KEY (optional, graceful without) — document each in .env.example with the signup URL.
