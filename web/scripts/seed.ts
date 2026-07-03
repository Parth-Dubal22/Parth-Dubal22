/** Seed — ports the prototype's js/data.js demo state into Postgres.
 *  Clearly sample data. Run: npm run db:seed */
import { hash } from "bcryptjs";
import { db, tables } from "../lib/db";
import { sql } from "drizzle-orm";
import { categorySlugForTradeText, TRADE_TO_CATEGORY } from "../lib/data/categories";
import { seedCategories } from "./seed-categories";

/** trades text[] → taxonomy top-level slugs (R5) — dedup, drop unmappable. */
const slugsForTrades = (trades: string[]): string[] =>
  [...new Set(trades.map(categorySlugForTradeText).filter((s): s is string => !!s))];

async function main() {
  console.log("Seeding BuildSafe demo data…");
  // wipe (dev only) — categories are re-seeded from the taxonomy below
  await db.execute(sql`
    TRUNCATE users, companies, signals, watchlist_items, exposure_entries, alerts,
      subbie_panel_items, builder_checks, jobs, job_applications, reviews,
      payment_reports, verification_requests, disputes, subscriptions,
      quote_requests, email_log, tradie_profiles, builder_profiles, customer_profiles,
      company_categories, categories
    RESTART IDENTITY CASCADE`);

  /* ---- category taxonomy (R5 EXTENDED: 1086 rows from categories.json) ---- */
  const catCount = await seedCategories();
  console.log(`  categories: ${catCount}`);

  const pw = await hash("demo1234", 10);

  /* ---- users ---- */
  const [admin] = await db.insert(tables.users).values({
    email: "admin@demo.buildsafe", passwordHash: pw, name: "BuildSafe Admin", role: "admin",
  }).returning();

  const [tradie] = await db.insert(tables.users).values({
    email: "tradie@demo.buildsafe", passwordHash: pw, name: "Parth C.", role: "tradie", smsAlerts: true,
  }).returning();

  const [customer] = await db.insert(tables.users).values({
    email: "customer@demo.buildsafe", passwordHash: pw, name: "Sarah D.", role: "customer",
  }).returning();

  // builder owner users (Southpoint = the demo builder account)
  const builderUsers: Record<string, number> = {};
  for (const [key, name, email] of [
    ["sp", "Southpoint Projects", "builder@demo.buildsafe"],
    ["hc", "Harbourline Constructions", "owner@harbourline.example"],
    ["bb", "Bassline Building Group", "owner@bassline.example"],
    ["rh", "Redgum Homes (Aus)", "owner@redgum.example"],
  ] as const) {
    const [u] = await db.insert(tables.users).values({
      email, passwordHash: pw, name, role: "builder",
    }).returning();
    builderUsers[key] = u.id;
  }

  // supporting reviewer/applicant users
  const extra: Record<string, number> = {};
  for (const [key, name, role] of [
    ["okafor", "J. Okafor Tiling", "tradie"],
    ["dean", "Dean W.", "customer"],
    ["ferraro", "L. Ferraro Carpentry", "tradie"],
    ["priya", "Priya K.", "customer"],
    ["tomic", "A. Tomic Plumbing", "tradie"],
    ["silva", "R. Silva Concreting", "tradie"],
    ["nguyen", "M. Nguyen Rendering", "tradie"],
    ["procoat", "ProCoat Render Co", "tradie"],
  ] as const) {
    const [u] = await db.insert(tables.users).values({
      email: `${key}@demo.buildsafe`, passwordHash: pw, name, role: role as "tradie" | "customer",
    }).returning();
    extra[key] = u.id;
  }

  /* ---- profiles ---- */
  await db.insert(tables.tradieProfiles).values({
    userId: tradie.id, businessName: "Parth C. Tiling", abn: "84220913557",
    trades: ["Wall & Floor Tiling"], categorySlugs: slugsForTrades(["Wall & Floor Tiling"]),
    suburb: "Clyde North", state: "VIC",
    licenceNumber: null, insuranceProvider: "CoverTrade $10M",
    insuranceExpiry: new Date("2027-03-01"), insuranceVerified: true,
    availableNow: false, jobsCompleted: 37, reliabilityScore: 96,
    portfolio: [
      { art: "tile", caption: "Bathroom reno — Clyde North" },
      { art: "house", caption: "Full-floor porcelain — Officer" },
      { art: "frame", caption: "Commercial fit-out — Dandenong S." },
    ],
  });
  await db.insert(tables.tradieProfiles).values([
    { userId: extra.nguyen, businessName: "M. Nguyen Rendering", trades: ["Rendering"], categorySlugs: slugsForTrades(["Rendering"]), suburb: "Tarneit", state: "VIC", insuranceProvider: "TradeSure", insuranceExpiry: new Date("2027-01-15"), insuranceVerified: true, availableNow: true, jobsCompleted: 24, reliabilityScore: 94 },
    { userId: extra.procoat, businessName: "ProCoat Render Co", trades: ["Rendering"], categorySlugs: slugsForTrades(["Rendering"]), suburb: "Werribee", state: "VIC", insuranceProvider: "BuildCover", insuranceExpiry: new Date("2026-11-30"), insuranceVerified: true, availableNow: true, jobsCompleted: 18, reliabilityScore: 91 },
    { userId: extra.okafor, businessName: "J. Okafor Tiling", trades: ["Tiling"], categorySlugs: slugsForTrades(["Tiling"]), suburb: "Cranbourne", state: "VIC", jobsCompleted: 41, reliabilityScore: 97 },
    { userId: extra.ferraro, businessName: "L. Ferraro Carpentry", trades: ["Carpentry"], categorySlugs: slugsForTrades(["Carpentry"]), suburb: "Clyde", state: "VIC", jobsCompleted: 33, reliabilityScore: 95 },
    { userId: extra.tomic, businessName: "A. Tomic Plumbing", trades: ["Plumbing"], categorySlugs: slugsForTrades(["Plumbing"]), suburb: "Berwick", state: "VIC", jobsCompleted: 27, reliabilityScore: 92 },
    { userId: extra.silva, businessName: "R. Silva Concreting", trades: ["Concreting"], categorySlugs: slugsForTrades(["Concreting"]), suburb: "Pakenham", state: "VIC", jobsCompleted: 29, reliabilityScore: 90 },
  ]);
  await db.insert(tables.customerProfiles).values([
    { userId: customer.id, suburb: "Officer", state: "VIC", projectType: "Townhouse build" },
    { userId: extra.dean, suburb: "Berwick", state: "VIC", projectType: "Renovation" },
    { userId: extra.priya, suburb: "Point Cook", state: "VIC", projectType: "Duplex build" },
  ]);

  /* ---- companies (ABN-anchored, from data.js) ---- */
  const companyRows = [
    { key: "hc", abn: "51824753190", name: "Harbourline Constructions", slug: "harbourline-constructions", location: "Melbourne SE", licenceNumber: "DB-U 41233", riskLevel: "risk" as const, tier: "none" as const, artKind: "crane", tags: ["Volume residential"], ratingAvg: 32, reviewCount: 14 },
    { key: "bb", abn: "72610442887", name: "Bassline Building Group", slug: "bassline-building-group", location: "Werribee VIC", licenceNumber: "DB-U 55871", riskLevel: "watch" as const, tier: "none" as const, artKind: "frame", tags: ["Custom homes"], ratingAvg: 41, reviewCount: 22 },
    { key: "rh", abn: "38559201664", name: "Redgum Homes (Aus)", slug: "redgum-homes-aus", location: "Officer VIC", licenceNumber: "DB-U 60218", riskLevel: "ok" as const, tier: "buildsafe_verified" as const, artKind: "house", tags: ["Townhouses", "Renovations"], ratingAvg: 48, reviewCount: 63 },
    { key: "sp", abn: "19407226315", name: "Southpoint Projects", slug: "southpoint-projects", location: "Cranbourne VIC", licenceNumber: "DB-U 71442", riskLevel: "ok" as const, tier: "buildsafe_verified" as const, artKind: "tower", tags: ["Multi-res", "Fit-out"], ratingAvg: 47, reviewCount: 41 },
  ];
  const companies: Record<string, number> = {};
  for (const c of companyRows) {
    const [row] = await db.insert(tables.companies).values({
      abn: c.abn, name: c.name, slug: c.slug, location: c.location, state: "VIC",
      entityType: "Australian Private Company", gstRegistered: true, abnStatus: "Active",
      licenceNumber: c.licenceNumber, licenceStatus: "current", licenceSource: "VBA",
      tags: c.tags, artKind: c.artKind, tier: c.tier,
      tierGrantedAt: c.tier !== "none" ? new Date("2026-06-30") : null,
      claimedByUserId: builderUsers[c.key], riskLevel: c.riskLevel,
      lastCheckedAt: new Date("2026-06-30"), ratingAvg: c.ratingAvg, reviewCount: c.reviewCount,
    }).returning();
    companies[c.key] = row.id;
    await db.insert(tables.builderProfiles).values({ userId: builderUsers[c.key], companyId: row.id });
  }

  /* ---- company ↔ category m2m (R5 EXTENDED) — building primary for every
     builder, plus sensible secondaries from what they actually do ---- */
  const companyCategoryRows: { key: string; slug: string; primary: boolean }[] = [
    { key: "hc", slug: "building", primary: true },            // volume residential
    { key: "bb", slug: "building", primary: true },            // custom homes
    { key: "bb", slug: "carpenters", primary: false },
    { key: "rh", slug: "building", primary: true },            // townhouses + renovations
    { key: "rh", slug: "extensions-and-additions", primary: false },
    { key: "rh", slug: "bathroom", primary: false },
    { key: "sp", slug: "building", primary: true },            // multi-res + fit-out
    { key: "sp", slug: "shopfitters", primary: false },
  ];
  await db.insert(tables.companyCategories).values(
    companyCategoryRows.map((r) => ({
      companyId: companies[r.key], categorySlug: r.slug, primary: r.primary,
    })),
  );

  /* ---- signals (facts + sources, approved by admin) ---- */
  const signalRows: { key: string; d: string; t: string; lv: "ok" | "watch" | "risk"; src: string; url?: string }[] = [
    { key: "hc", d: "2026-06-14", t: "Creditor's claim — Supreme Court VIC", lv: "risk", src: "Court list", url: "https://www.supremecourt.vic.gov.au/" },
    { key: "hc", d: "2026-06-04", t: "3 verified reports of 60+ day payment delays", lv: "watch", src: "BuildSafe verified reports" },
    { key: "hc", d: "2026-05-19", t: "Two director resignations within 60 days", lv: "watch", src: "ASIC register", url: "https://connectonline.asic.gov.au/" },
    { key: "bb", d: "2026-05-19", t: "Director change recorded", lv: "watch", src: "ASIC register", url: "https://connectonline.asic.gov.au/" },
    { key: "bb", d: "2026-03-02", t: "All registers clear", lv: "ok", src: "Routine re-test" },
    { key: "rh", d: "2026-06-30", t: "All registers clear — verification renewed", lv: "ok", src: "All registers" },
    { key: "sp", d: "2026-06-28", t: "All registers clear", lv: "ok", src: "All registers" },
  ];
  const signalIds: number[] = [];
  for (const s of signalRows) {
    const [row] = await db.insert(tables.signals).values({
      companyId: companies[s.key], occurredOn: new Date(s.d), title: s.t, level: s.lv,
      sourceName: s.src, sourceUrl: s.url, status: "approved",
      reviewedBy: admin.id, reviewedAt: new Date(s.d),
    }).returning();
    signalIds.push(row.id);
  }

  /* ---- watchlist + exposure (tradie demo) ---- */
  await db.insert(tables.watchlistItems).values([
    { userId: tradie.id, companyId: companies.hc, kind: "builder" },
    { userId: tradie.id, companyId: companies.bb, kind: "builder" },
    { userId: tradie.id, companyId: companies.rh, kind: "builder" },
  ]);
  await db.insert(tables.exposureEntries).values([
    { userId: tradie.id, companyId: companies.hc, amountCents: 42300_00, kind: "owed" },
    { userId: tradie.id, companyId: companies.bb, amountCents: 18900_00, kind: "owed" },
    { userId: tradie.id, companyId: companies.rh, amountCents: 34800_00, kind: "owed" },
  ]);

  // builder demo (Southpoint) watches upward (client) and has a subbie panel
  await db.insert(tables.watchlistItems).values([
    { userId: builderUsers.sp, companyId: companies.hc, kind: "client" },
  ]);
  await db.insert(tables.subbiePanelItems).values([
    { builderUserId: builderUsers.sp, tradieUserId: tradie.id, name: "Parth C. Tiling", trade: "Tiling", insuranceExpiry: new Date("2027-03-01") },
    { builderUserId: builderUsers.sp, tradieUserId: extra.ferraro, name: "L. Ferraro Carpentry", trade: "Carpentry", insuranceExpiry: new Date("2026-08-14") },
    { builderUserId: builderUsers.sp, name: "Delta Scaffolding", trade: "Scaffolding", insuranceExpiry: new Date("2026-07-20") },
  ]);

  /* ---- alerts for the tradie (mirror data.js alerts) ---- */
  await db.insert(tables.alerts).values([
    { userId: tradie.id, signalId: signalIds[0], channel: "in_app", deliveredAt: new Date() },
    { userId: tradie.id, signalId: signalIds[1], channel: "in_app", deliveredAt: new Date() },
    { userId: tradie.id, signalId: signalIds[5], channel: "in_app", deliveredAt: new Date(), readAt: new Date() },
  ]);

  /* ---- payment reports (aggregated & anonymised in UI) ---- */
  await db.insert(tables.paymentReports).values([
    { companyId: companies.hc, reporterUserId: extra.tomic, daysLate: 90, hasInvoiceEvidence: true, verified: true },
    { companyId: companies.hc, reporterUserId: extra.okafor, daysLate: 65, hasInvoiceEvidence: true, verified: true },
    { companyId: companies.hc, reporterUserId: extra.silva, daysLate: 72, hasInvoiceEvidence: true, verified: true },
  ]);

  /* ---- jobs (from data.js; posters are the company owner accounts) ---- */
  const jobRows = [
    { by: "rh", t: "Wall & floor tiler — bathroom reno ×3", rate: "$620/day", loc: "Cranbourne VIC", start: "Mon", dur: "~2 weeks", req: "Own tools", type: "day_hire" as const, trade: "Tiling" },
    { by: "sp", t: "Bricklayers ×2 — boundary wall (day hire)", rate: "$580/day", loc: "Werribee VIC", start: "Tomorrow", dur: "2–3 days", req: "ABN required", type: "day_hire" as const, trade: "Bricklaying" },
    { by: "bb", t: "Carpenter — fix-out, townhouse project", rate: "$70/hr", loc: "Doncaster VIC", start: "This week", dur: "4 weeks", req: "White card", type: "subcontract" as const, trade: "Carpentry" },
    { by: "sp", t: "Labourers ×3 — site clean & materials", rate: "$38/hr", loc: "Clyde North VIC", start: "Friday", dur: "1 day", req: "PPE supplied", type: "day_hire" as const, trade: "Labouring" },
    { by: "sp", t: "Renderer — 2× facades, acrylic", rate: "$8,400 quote", loc: "Tarneit VIC", start: "Flexible", dur: "Quote job", req: "Acrylic experience", type: "subcontract" as const, trade: "Rendering" },
  ];
  const jobIds: number[] = [];
  for (const j of jobRows) {
    const [row] = await db.insert(tables.jobs).values({
      builderUserId: builderUsers[j.by], companyId: companies[j.by], title: j.t,
      type: j.type, rate: j.rate, location: j.loc, startText: j.start,
      duration: j.dur, requirement: j.req, trade: j.trade,
      categorySlug: TRADE_TO_CATEGORY[j.trade] ?? null, // R5: taxonomy slug alongside legacy trade
      status: "open",
    }).returning();
    jobIds.push(row.id);
  }
  // applicants on Southpoint's renderer job (prototype myJobs)
  await db.insert(tables.jobApplications).values([
    { jobId: jobIds[4], tradieUserId: extra.nguyen, note: "Available next week, insured" },
    { jobId: jobIds[4], tradieUserId: extra.procoat, note: "Can start Monday" },
  ]);

  /* ---- reviews (two-way, verified) ---- */
  await db.insert(tables.reviews).values([
    { authorUserId: customer.id, authorRole: "homeowner", subjectCompanyId: companies.rh, rating: 5, text: "Finished our townhouse on schedule. Progress payments were exactly as quoted — no surprises.", reply: "Thanks Sarah — pleasure building for you.", repliedAt: new Date("2026-06-02"), verified: true },
    { authorUserId: extra.okafor, authorRole: "subcontractor", subjectCompanyId: companies.rh, rating: 5, text: "Paid every invoice inside 14 days for two years straight. Rare and worth saying publicly.", paidOnTime: true, verified: true },
    { authorUserId: extra.dean, authorRole: "homeowner", subjectCompanyId: companies.rh, rating: 4, text: "Great build quality. Communication slowed near handover but they got there.", verified: true },
    { authorUserId: extra.ferraro, authorRole: "subcontractor", subjectCompanyId: companies.sp, rating: 5, text: "Organised sites, clear scopes, pays on time.", paidOnTime: true, verified: true },
    { authorUserId: extra.priya, authorRole: "homeowner", subjectCompanyId: companies.sp, rating: 4, text: "Solid duplex build, minor defects fixed quickly.", verified: true },
    { authorUserId: extra.tomic, authorRole: "subcontractor", subjectCompanyId: companies.hc, rating: 2, text: "90 days and chasing. Be careful with your terms.", paidOnTime: false, verified: true },
    { authorUserId: extra.silva, authorRole: "subcontractor", subjectCompanyId: companies.bb, rating: 4, text: "Decent to work with, slightly slow on variations.", paidOnTime: true, verified: true },
    // builder → tradie
    { authorUserId: builderUsers.rh, authorRole: "builder", subjectUserId: tradie.id, rating: 5, text: "Immaculate tiling across three bathrooms. On site 7am sharp every day.", verified: true },
  ]);

  /* ---- subscriptions (demo: active, no lock-in) ---- */
  await db.insert(tables.subscriptions).values([
    { userId: tradie.id, plan: "tradie_watch", status: "active", currentPeriodEnd: new Date("2026-08-01") },
    { userId: builderUsers.sp, plan: "builder_pro", status: "active", currentPeriodEnd: new Date("2026-08-01") },
  ]);

  /* ---- a shareable free check result ---- */
  await db.insert(tables.builderChecks).values({
    slug: "demo-redgum-check", companyId: companies.rh, query: "Redgum Homes",
    snapshot: {
      abn: "38559201664", name: "Redgum Homes (Aus)", abnStatus: "Active",
      entityType: "Australian Private Company", licenceNumber: "DB-U 60218",
      licenceStatus: "current", licenceSource: "VBA", publicRecordCount: 0,
      verifiedTier: "buildsafe_verified", checkedAt: new Date("2026-06-30").toISOString(),
      sources: [
        { name: "ABN Lookup (ABR)", url: "https://abr.business.gov.au/" },
        { name: "VBA practitioner register", url: "https://www.vba.vic.gov.au/" },
        { name: "ASIC published notices", url: "https://publishednotices.asic.gov.au/" },
      ],
    },
  });

  /* ---- verification request pending (Bassline applying) ---- */
  await db.insert(tables.verificationRequests).values({
    companyId: companies.bb, requestedByUserId: builderUsers.bb, tier: "id_verified",
    status: "pending", criteria: { abnMatched: true, licenceCurrent: true, insuranceSighted: false },
  });

  console.log("Seed complete.");
  console.log("Demo logins (password: demo1234):");
  console.log("  tradie@demo.buildsafe / builder@demo.buildsafe / customer@demo.buildsafe / admin@demo.buildsafe");
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
