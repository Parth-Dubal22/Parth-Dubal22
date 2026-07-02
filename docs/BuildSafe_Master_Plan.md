# Construction Risk Platform — Master Plan
*Working name: "BuildSafe" (pick your own later). Prepared July 2026. Melbourne, Australia.*

---

## 1. THE PRODUCT — WHAT WE BUILD, IN PHASES

### Phase 1 — The Risk Engine (build first, money first)
The core: monitor Australian building companies for financial distress signals and alert the people exposed to them.

**Features:**
- **Free Builder Check** — enter builder name or ABN → instant report: registration status, licence status, adverse public records found. (Lead magnet — this is the marketing engine.)
- **Watchlist Monitoring (paid)** — user adds the builders/companies they work with → automatic alerts when a new signal appears (court filing, ASIC notice, licence change, liquidation appointment).
- **Risk Signal Feed** — plain-English explanation of each signal: what it is, why it matters, what to consider doing.
- **Exposure Tracker** — user logs how much each builder owes them / how much deposit they've paid → dashboard shows total $ at risk.
- **Alert channels** — email + SMS + push. (Tradies live on their phones.)

### Phase 2 — Both-Sides Expansion
- **Builder accounts** — builders monitor their developers/clients (upward) and their subbie network (downward), plus a self-health check (ATO debt risk, DPN exposure awareness).
- **"Financially Verified" badge (paid)** — healthy builders display it on their profile, website, quotes.
- **Public directory** — homeowners search verified builders by trade + location. Launches pre-filled from Phase 1 data (no cold-start problem).
- **All trades covered** — tiling, bricklaying, carpentry, electrical, plumbing, rendering, concreting, plastering, painting, roofing, landscaping. (The engine monitors companies; trade type is just a profile tag — costs nothing extra.)

### Phase 3 — Recovery Layer (only after lawyer partnership locked)
- **SOPA Payment Claim Assistant** — guided prep of Security of Payment Act claims, state-specific, deadline tracking. Lawyer-in-the-loop review before anything is lodged.
- **Lawyer referral pipeline** — red-flagged users routed to partner construction lawyers; you earn referral fees without carrying legal risk.

---

## 2. PROFILES & ACCOUNTS — WHO USES IT AND WHAT THEY SEE

### Account type A: Subcontractor / Tradie
- Profile: name, trade(s), ABN, state, business size.
- Their watchlist: builders they currently work under.
- Exposure amounts (private to them).
- Alert preferences.

### Account type B: Builder / Head Contractor
- Profile: company name, ABN, licence number(s), trades/services, regions, insurance details, years operating, photos of work.
- Watchlist: their developers/clients + their subbie panel.
- Verification status (badge) — requires consent-based financial checks (see Legal §4.6).
- Public profile page (directory listing) — Phase 2.

### Account type C: Homeowner / Consumer (Phase 2)
- Lightweight profile: name, suburb, project type.
- Can search directory, view verified builders, request quotes.
- Can run limited free checks.

### Account type D: Enterprise / Data (later)
- Insurers, trade-credit suppliers, developers — API access to risk scores. Custom pricing.

**Profile design rules:**
- ABN is the anchor of every company record (one source of truth via ABN Lookup).
- Verification tiers: Unverified → Identity-verified (ABN + licence matched) → Financially Verified (consent-based checks).
- Builders can claim their profile (like Google Business) — claiming is free; verification is paid.

---

## 3. DATA SOURCES — WHAT POWERS THE ENGINE

| Source | What it gives | Access |
|---|---|---|
| ABN Lookup (ABR) | ABN status, entity type, GST registration | Free API |
| ASIC registers | Company status, external administration/liquidation appointments, insolvency notices (published notices site) | Public; some data fee-based — check ASIC data access terms |
| State licensing bodies (VBA in VIC, NSW Fair Trading, QBCC in QLD, etc.) | Builder licence status, conditions, suspensions, disciplinary actions | Public registers; QBCC has strong data |
| Court lists & judgments (state courts, Federal Court) | Lawsuits, judgment debts against the company | Public |
| AFSA / personal insolvency (for sole traders — careful, see Legal §4.3) | Bankruptcy of individuals | Public register, fee per search |
| Payment behaviour (user-reported) | "This builder pays late" signals from your own user base | Your proprietary moat — but highest defamation care needed (§4.1) |
| News & liquidator reports | Collapse announcements, creditor lists | Public |

**The moat:** no single source is secret — the value is fusing them per-ABN, watching continuously, and translating into plain English alerts. Over time, user-reported payment data becomes the thing nobody can copy.

---

## 4. LEGAL & COMPLIANCE — THE FULL CHECKLIST

> ⚠️ This is a build checklist, not legal advice. Before launch, one fixed-fee session with an Australian tech/media lawyer (~$1.5–3K) to review T&Cs and the risk-score wording. This is the single best money you will spend.

### 4.1 Defamation — YOUR #1 RISK. Design around it from day one.
- In Australia, companies with **fewer than 10 employees** CAN sue for defamation — and that's most builders you'll cover. Directors can also sue **personally** even when the company can't.
- Plaintiffs must show "serious harm" (post-2021 reforms), and truth is a complete defence — but you don't want to be the test case.
- **Design mitigations (these shape the product):**
  1. **Publish facts, not verdicts.** "Liquidator appointed 12/6/26 (ASIC notice #X)" = provable fact. "This builder is dodgy / about to collapse" = lawsuit bait. Every alert links to its source document.
  2. **Frame scores as opinion based on disclosed facts.** "Based on the 3 public records listed below, our system rates exposure as Elevated" — honest-opinion defence territory. Never present a score as a prediction of fact.
  3. **Keep risk detail PRIVATE to paying subscribers.** Alerts to a subscriber with a genuine business interest ≠ publishing to the world. The **public** side shows positive/neutral info only (verified badges, licence status). Never a public "wall of shame."
  4. **User-reported payment data:** aggregate and anonymise ("3 reports of 60+ day payment delays") — never publish one user's accusation verbatim. Verify reporters are real businesses with real invoices.
  5. **Dispute/correction process:** builders can flag errors; you review within 48h and correct fast. Fast correction destroys most claims before they start.
  6. **1-year limitation period** applies to defamation claims — but don't rely on it; rely on truth + sources + process.

### 4.2 Australian Consumer Law (ACL) — misleading or deceptive conduct (s18)
- Applies to ALL companies (no 10-employee limit) and to YOU.
- If your risk score is wrong in a misleading way, or your marketing overpromises ("we predict collapses"), you're exposed.
- **Rules:** never say "predict." Say "monitors public records and flags signals." Show data freshness ("last checked: date"). Disclaimers help but don't cure misleading conduct — accuracy discipline is the real protection.

### 4.3 Privacy Act 1988
- Company data ≠ personal information. But **sole traders and individuals ARE personal information** — and tons of tradies/builders are sole traders.
- You'll likely exceed the small-business exemption path anyway (trading in personal information territory) — so just comply from day one:
  - Privacy Policy (collection, use, disclosure, retention).
  - Collect only what you need; secure it; breach-response plan (Notifiable Data Breaches scheme).
  - Careful with AFSA bankruptcy data on individuals — use only for the stated purpose, never republish publicly.
- Privacy Act reforms are live/rolling (including a statutory tort for serious invasions of privacy) — build clean now, not retrofit later.

### 4.4 Credit reporting rules (Privacy Act Part IIIA)
- Part IIIA regulates **consumer** credit reporting. You are doing **commercial** risk information on businesses — stay on that side of the line:
  - Never provide reports for assessing an individual's personal/consumer credit.
  - T&Cs must state: business-purpose use only.
- If you ever want consumer-side data, that's a regulated regime — not Phase 1–2 territory.

### 4.5 Legal advice boundary (Phase 3 only)
- Preparing SOPA claims can cross into "legal practice" if you advise on rights. Unqualified legal practice is an offence in every state.
- **Structure:** software prepares documents from user inputs + qualified lawyer reviews/advises. Clear disclosure: "document preparation software, not legal advice."
- Deadline calculations MUST be human-verified until proven — one wrong date = a lost claim = your liability.

### 4.6 Verification badge integrity
- A "Financially Verified" badge is a representation YOU make → ACL exposure if it's hollow.
- Define published, objective criteria (licence current, no adverse ASIC/court records in X months, consent-based financial check passed). Re-verify on a schedule. Revoke fast when signals appear — a badge on a builder who collapses next month is your reputation gone.

### 4.7 Data source terms
- ASIC, ABR, court, and licensing data each have access/re-use terms (and some ASIC data carries fees). Read them; where commercial re-use is restricted, link out to the source instead of republishing. Budget line item, not a blocker.

### 4.8 Marketing law
- **Spam Act 2003:** no bulk unsolicited email/SMS without consent. FB group posting, content, and inbound funnels = safe. Cold email lists = fines.
- Testimonials must be real; no fake urgency or fabricated numbers in ads (ACL again).

### 4.9 Business hygiene
- Pty Ltd company (asset separation), ~$600 + ASIC annual fee.
- T&Cs + Privacy Policy + disclaimer wording — the one lawyer session covers all three.
- **Professional Indemnity + Cyber insurance:** required before Phase 3 (claims work); strongly recommended once Phase 1 revenue starts (~$2–4K/yr). Broke workaround: launch Phase 1 with tight disclaimers + facts-only alerts, buy PI from first revenue.

---

## 5. MONEY — STREAMS AND SEQUENCE

| # | Stream | Price | Starts |
|---|---|---|---|
| 1 | Subbie monitoring subscription | $29–49/mo | Weeks 2–4 |
| 2 | Builder monitoring (watch clients + subbies) | $99–149/mo | Month 2–3 |
| 3 | Lawyer referral fees | $500–2K/matter | Month 2–3 |
| 4 | Verified badge | $99–199/mo | Month 3–6 |
| 5 | Directory leads (homeowner quotes) | $30–80/lead | Phase 2 |
| 6 | Enterprise data/API (insurers, suppliers) | $2–10K/mo | Year 1–2 |

**Milestones:** 100 subs ≈ $4K/mo → 500 subs + 50 builders ≈ $25K/mo → directory + data deals = $100K+/mo potential.

---

## 6. MARKETING — $0 PLAYBOOK

1. **Free Builder Check = the whole funnel.** Check is free → "want us to watch this builder 24/7?" → subscription.
2. **Facebook trade groups** (tilers, sparkies, chippies, subbie groups): answer "builder hasn't paid me" posts helpfully, link the free check. Zero cost, warm audience.
3. **Collapse-news jacking:** every builder collapse in the news → post "the public warning signs were visible X months earlier — check YOUR builder free." Repeatable forever.
4. **Trade associations & suppliers:** webinars with Master Builders state chapters, NECA, Master Plumbers; tile/plumbing suppliers will share a free tool that protects their own customers (their debtors!).
5. **Accountants & brokers serving tradies:** referral partners — they see the cash-flow pain first.
6. **Content:** short "how to spot a dying builder" videos — the topic is fear + money, it travels.

**Pitch line (memorise it):**
*"Builders are collapsing at record rates — nearly 3,000 last year, and every collapse takes subbies' money down with it. This tool watches the builders you work for and warns you when the danger signs show up in public records — before it's too late to protect yourself. Check your builder free."*

---

## 7. BUILD ORDER — THE SPRINT

**Days 1–4 (your locked-in 60–70 hrs):**
- Day 1: data plumbing — ABN Lookup + ASIC published notices + one state licence register (start VIC/VBA) feeding one company record per ABN.
- Day 2: risk-signal logic + plain-English alert templates (facts + sources, per §4.1) + email alerts.
- Day 3: user accounts, watchlist, exposure tracker, Stripe subscription.
- Day 4: free Builder Check public page + landing page + polish. Draft T&Cs/Privacy from solid templates (lawyer session booked for week 2).
**Week 2:** launch in 5 FB groups + first collapse-news post. Target: 300 free checks, first 10 paying.
**Weeks 3–4:** iterate on alert quality, add second state's licence register, approach 2 construction lawyers for the referral partnership.
**Month 2–3:** builder-side accounts + badge waitlist.

**Scope discipline:** if a feature doesn't help get the first 100 paying users, it waits. The directory, badges, SOPA engine — all real, all later.

---

*Everything in §4 is general information, not legal advice — validate the specifics with a qualified Australian lawyer before launch.*
