/**
 * BuildSafe — Drizzle schema (Postgres).
 * ABN is the anchor of every company record (one source of truth).
 * Signals state FACTS with sources; risk detail stays private to subscribers.
 */
import {
  pgTable, pgEnum, text, varchar, integer, bigint, boolean, timestamp,
  jsonb, serial, uniqueIndex, index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/* ---------- enums ---------- */
export const userRole = pgEnum("user_role", ["customer", "tradie", "builder", "admin"]);
export const signalLevel = pgEnum("signal_level", ["ok", "watch", "risk"]);
export const signalStatus = pgEnum("signal_status", ["pending", "approved", "rejected"]);
export const verificationTier = pgEnum("verification_tier", ["none", "id_verified", "buildsafe_verified", "track_record"]);
export const verificationStatus = pgEnum("verification_status", ["pending", "approved", "rejected", "revoked"]);
export const jobType = pgEnum("job_type", ["subcontract", "day_hire"]);
export const jobStatus = pgEnum("job_status", ["open", "closed"]);
export const applicationStatus = pgEnum("application_status", ["applied", "contacted", "declined", "withdrawn"]);
export const reviewerRole = pgEnum("reviewer_role", ["homeowner", "subcontractor", "builder"]);
export const reviewStatus = pgEnum("review_status", ["published", "removed_legal"]);
export const disputeTarget = pgEnum("dispute_target", ["signal", "review", "check", "profile"]);
export const disputeStatus = pgEnum("dispute_status", ["open", "corrected", "rejected"]);
export const subscriptionPlan = pgEnum("subscription_plan", ["tradie_watch", "builder_pro"]);
export const subscriptionStatus = pgEnum("subscription_status", ["active", "past_due", "canceled", "incomplete"]);
export const exposureKind = pgEnum("exposure_kind", ["owed", "deposit"]);
export const watchKind = pgEnum("watch_kind", ["builder", "client"]);
export const quoteStatus = pgEnum("quote_status", ["sent", "replied", "closed"]);
export const alertChannel = pgEnum("alert_channel", ["in_app", "email", "sms"]);

/* ---------- users & profiles ---------- */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  role: userRole("role").notNull(),
  phone: varchar("phone", { length: 32 }),
  emailAlerts: boolean("email_alerts").notNull().default(true),
  smsAlerts: boolean("sms_alerts").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const customerProfiles = pgTable("customer_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  suburb: varchar("suburb", { length: 120 }),
  state: varchar("state", { length: 8 }).default("VIC"),
  projectType: varchar("project_type", { length: 120 }),
});

export const tradieProfiles = pgTable("tradie_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  businessName: varchar("business_name", { length: 200 }),
  abn: varchar("abn", { length: 14 }),
  trades: jsonb("trades").$type<string[]>().notNull().default([]), // legacy names — kept as-is
  // R5 EXTENDED: taxonomy top-level slugs (source of truth for /find + pickers).
  // Index 0 = primary category.
  categorySlugs: jsonb("category_slugs").$type<string[]>().notNull().default([]),
  suburb: varchar("suburb", { length: 120 }),
  state: varchar("state", { length: 8 }).default("VIC"),
  licenceNumber: varchar("licence_number", { length: 80 }),
  licenceVerified: boolean("licence_verified").notNull().default(false),
  insuranceProvider: varchar("insurance_provider", { length: 160 }),
  insuranceExpiry: timestamp("insurance_expiry"),
  insuranceVerified: boolean("insurance_verified").notNull().default(false),
  availableNow: boolean("available_now").notNull().default(false),
  bio: text("bio"),
  portfolio: jsonb("portfolio").$type<{ art: string; caption: string }[]>().notNull().default([]),
  reliabilityScore: integer("reliability_score"), // 0..100; null until enough data
  jobsCompleted: integer("jobs_completed").notNull().default(0),
});

/* ---------- category taxonomy (R5 EXTENDED — SPEC_V2_CATEGORIES) ----------
 * Seeded from lib/data/categories.json (232 top-level + 854 sub = 1086 rows)
 * by scripts/seed-categories.ts. slug is the natural PK; parent is the
 * top-level slug for subcategories (null for top-levels). */
export const categories = pgTable("categories", {
  slug: varchar("slug", { length: 120 }).primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  parent: varchar("parent", { length: 120 }),
  synonyms: jsonb("synonyms").$type<string[]>().notNull().default([]),
  description: text("description"), // our own one-liners; popular 26 now, rest later
}, (t) => [index("categories_parent_idx").on(t.parent)]);

/* ---------- companies (ABN-anchored) ---------- */
export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  abn: varchar("abn", { length: 14 }).notNull().unique(), // digits only
  name: varchar("name", { length: 240 }).notNull(),
  slug: varchar("slug", { length: 260 }).notNull().unique(),
  entityType: varchar("entity_type", { length: 120 }),
  gstRegistered: boolean("gst_registered"),
  abnStatus: varchar("abn_status", { length: 40 }),
  location: varchar("location", { length: 160 }),
  state: varchar("state", { length: 8 }).default("VIC"),
  licenceNumber: varchar("licence_number", { length: 80 }),
  licenceStatus: varchar("licence_status", { length: 80 }),
  licenceSource: varchar("licence_source", { length: 40 }), // e.g. "VBA"
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  artKind: varchar("art_kind", { length: 24 }).notNull().default("house"),
  tier: verificationTier("tier").notNull().default("none"),
  tierGrantedAt: timestamp("tier_granted_at"),
  claimedByUserId: integer("claimed_by_user_id").references(() => users.id),
  // Derived, private-facing risk level (subscribers only). Public pages never render this.
  riskLevel: signalLevel("risk_level").notNull().default("ok"),
  lastCheckedAt: timestamp("last_checked_at"), // data freshness (ACL discipline)
  ratingAvg: integer("rating_avg_x10"), // 0..50 (x10 to avoid float)
  reviewCount: integer("review_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [index("companies_name_idx").on(t.name)]);

/* Company ↔ category m2m — one primary (the headline trade) + secondaries. */
export const companyCategories = pgTable("company_categories", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  categorySlug: varchar("category_slug", { length: 120 }).notNull()
    .references(() => categories.slug, { onDelete: "cascade" }),
  primary: boolean("is_primary").notNull().default(false),
}, (t) => [
  uniqueIndex("company_category_unique").on(t.companyId, t.categorySlug),
  index("company_categories_slug_idx").on(t.categorySlug),
]);

export const builderProfiles = pgTable("builder_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  companyId: integer("company_id").notNull().references(() => companies.id),
});

/* ---------- risk engine ---------- */
export const signals = pgTable("signals", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  occurredOn: timestamp("occurred_on").notNull(),
  title: varchar("title", { length: 300 }).notNull(), // FACT statement, never a verdict
  detail: text("detail"),
  level: signalLevel("level").notNull(),
  sourceName: varchar("source_name", { length: 160 }).notNull(), // every signal cites its public source
  sourceUrl: text("source_url"),
  sourceRef: varchar("source_ref", { length: 200 }),
  status: signalStatus("status").notNull().default("pending"), // human-in-the-loop review queue
  reviewedBy: integer("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [index("signals_company_idx").on(t.companyId)]);

export const watchlistItems = pgTable("watchlist_items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  companyId: integer("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  kind: watchKind("kind").notNull().default("builder"), // builders also watch upward (clients)
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [uniqueIndex("watch_unique").on(t.userId, t.companyId)]);

export const exposureEntries = pgTable("exposure_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  companyId: integer("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  amountCents: bigint("amount_cents", { mode: "number" }).notNull().default(0),
  kind: exposureKind("kind").notNull().default("owed"),
  note: varchar("note", { length: 300 }),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [uniqueIndex("exposure_unique").on(t.userId, t.companyId, t.kind)]);

export const alerts = pgTable("alerts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  signalId: integer("signal_id").notNull().references(() => signals.id, { onDelete: "cascade" }),
  channel: alertChannel("channel").notNull().default("in_app"),
  deliveredAt: timestamp("delivered_at"),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [index("alerts_user_idx").on(t.userId)]);

/* Builder's subbie panel (downward watch: licence/insurance expiry tracking) */
export const subbiePanelItems = pgTable("subbie_panel_items", {
  id: serial("id").primaryKey(),
  builderUserId: integer("builder_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tradieUserId: integer("tradie_user_id").references(() => users.id), // linked account if on platform
  name: varchar("name", { length: 200 }).notNull(),
  trade: varchar("trade", { length: 120 }),
  licenceNumber: varchar("licence_number", { length: 80 }),
  insuranceExpiry: timestamp("insurance_expiry"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/* ---------- free builder check (shareable, SEO) ---------- */
export const builderChecks = pgTable("builder_checks", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 40 }).notNull().unique(),
  companyId: integer("company_id").references(() => companies.id),
  query: varchar("query", { length: 240 }).notNull(),
  // Facts snapshot at check time: registration, licence, count of public records.
  // Public result pages show facts + sources only — no risk score.
  snapshot: jsonb("snapshot").$type<{
    abn?: string; name?: string; abnStatus?: string; entityType?: string;
    licenceNumber?: string; licenceStatus?: string; licenceSource?: string;
    publicRecordCount?: number; verifiedTier?: string; checkedAt: string;
    sources: { name: string; url?: string }[];
  }>().notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/* ---------- job board (noticeboard, not labour hire) ---------- */
export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  builderUserId: integer("builder_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  companyId: integer("company_id").notNull().references(() => companies.id),
  title: varchar("title", { length: 240 }).notNull(),
  type: jobType("type").notNull().default("subcontract"),
  rate: varchar("rate", { length: 80 }).notNull(), // builder-stated; platform never sets pay
  location: varchar("location", { length: 160 }).notNull(),
  startText: varchar("start_text", { length: 80 }).notNull(),
  duration: varchar("duration", { length: 80 }).notNull(),
  requirement: varchar("requirement", { length: 200 }),
  trade: varchar("trade", { length: 120 }), // legacy label — kept working (R5)
  // R5 EXTENDED: taxonomy top-level slug. FK-ish by convention (validated in
  // the API against lib/data/categories), no hard FK so legacy/imported jobs
  // never break on taxonomy edits.
  categorySlug: varchar("category_slug", { length: 120 }),
  status: jobStatus("status").notNull().default("open"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [index("jobs_status_idx").on(t.status)]);

export const jobApplications = pgTable("job_applications", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull().references(() => jobs.id, { onDelete: "cascade" }),
  tradieUserId: integer("tradie_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  note: varchar("note", { length: 500 }),
  status: applicationStatus("status").notNull().default("applied"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [uniqueIndex("application_unique").on(t.jobId, t.tradieUserId)]);

/* ---------- reviews (two-way, verified, never suppressed) ---------- */
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  authorUserId: integer("author_user_id").notNull().references(() => users.id),
  authorRole: reviewerRole("author_role").notNull(),
  subjectCompanyId: integer("subject_company_id").references(() => companies.id), // customer/subbie → builder
  subjectUserId: integer("subject_user_id").references(() => users.id),           // builder → tradie
  rating: integer("rating").notNull(), // 1..5
  text: text("text").notNull(),
  paidOnTime: boolean("paid_on_time"), // subbie→builder payment behaviour flag
  reply: text("reply"),      // builders reply publicly, never delete
  repliedAt: timestamp("replied_at"),
  verified: boolean("verified").notNull().default(false), // verified-transaction review
  jobId: integer("job_id").references(() => jobs.id),
  status: reviewStatus("status").notNull().default("published"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [index("reviews_company_idx").on(t.subjectCompanyId)]);

/* Aggregated & anonymised payment reports (never published verbatim) */
export const paymentReports = pgTable("payment_reports", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  reporterUserId: integer("reporter_user_id").notNull().references(() => users.id),
  daysLate: integer("days_late").notNull(),
  hasInvoiceEvidence: boolean("has_invoice_evidence").notNull().default(false),
  verified: boolean("verified").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [uniqueIndex("payment_report_unique").on(t.companyId, t.reporterUserId)]);

/* ---------- verification workflow ---------- */
export const verificationRequests = pgTable("verification_requests", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  requestedByUserId: integer("requested_by_user_id").notNull().references(() => users.id),
  tier: verificationTier("tier").notNull(),
  status: verificationStatus("status").notNull().default("pending"),
  criteria: jsonb("criteria").$type<Record<string, boolean>>().notNull().default({}),
  decidedByUserId: integer("decided_by_user_id").references(() => users.id),
  decidedAt: timestamp("decided_at"),
  note: text("note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/* ---------- disputes / corrections (48h SLA) ---------- */
export const disputes = pgTable("disputes", {
  id: serial("id").primaryKey(),
  raisedByUserId: integer("raised_by_user_id").notNull().references(() => users.id),
  targetType: disputeTarget("target_type").notNull(),
  targetId: integer("target_id").notNull(),
  reason: text("reason").notNull(),
  status: disputeStatus("status").notNull().default("open"),
  slaDueAt: timestamp("sla_due_at").notNull(), // createdAt + 48h
  resolvedAt: timestamp("resolved_at"),
  resolution: text("resolution"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/* ---------- subscriptions (no lock-ins, cancel anytime) ---------- */
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  plan: subscriptionPlan("plan").notNull(),
  status: subscriptionStatus("status").notNull().default("incomplete"),
  stripeCustomerId: varchar("stripe_customer_id", { length: 80 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 80 }),
  currentPeriodEnd: timestamp("current_period_end"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/* ---------- customer quote requests ---------- */
export const quoteRequests = pgTable("quote_requests", {
  id: serial("id").primaryKey(),
  customerUserId: integer("customer_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  companyId: integer("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  projectType: varchar("project_type", { length: 160 }),
  note: varchar("note", { length: 800 }),
  status: quoteStatus("status").notNull().default("sent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/* ---------- outbound email log (alert engine, email first) ---------- */
export const emailLog = pgTable("email_log", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  toEmail: varchar("to_email", { length: 320 }).notNull(),
  subject: varchar("subject", { length: 300 }).notNull(),
  body: text("body").notNull(),
  kind: varchar("kind", { length: 60 }).notNull(),
  sentAt: timestamp("sent_at"),
  error: text("error"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/* ---------- relations ---------- */
export const usersRelations = relations(users, ({ one, many }) => ({
  tradieProfile: one(tradieProfiles, { fields: [users.id], references: [tradieProfiles.userId] }),
  builderProfile: one(builderProfiles, { fields: [users.id], references: [builderProfiles.userId] }),
  customerProfile: one(customerProfiles, { fields: [users.id], references: [customerProfiles.userId] }),
  watchlist: many(watchlistItems),
  exposure: many(exposureEntries),
  alerts: many(alerts),
  subscription: one(subscriptions, { fields: [users.id], references: [subscriptions.userId] }),
}));

export const companiesRelations = relations(companies, ({ many, one }) => ({
  signals: many(signals),
  reviews: many(reviews),
  jobs: many(jobs),
  claimedBy: one(users, { fields: [companies.claimedByUserId], references: [users.id] }),
  categories: many(companyCategories),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  companies: many(companyCategories),
}));

export const companyCategoriesRelations = relations(companyCategories, ({ one }) => ({
  company: one(companies, { fields: [companyCategories.companyId], references: [companies.id] }),
  category: one(categories, { fields: [companyCategories.categorySlug], references: [categories.slug] }),
}));

export const signalsRelations = relations(signals, ({ one, many }) => ({
  company: one(companies, { fields: [signals.companyId], references: [companies.id] }),
  alerts: many(alerts),
}));

export const alertsRelations = relations(alerts, ({ one }) => ({
  user: one(users, { fields: [alerts.userId], references: [users.id] }),
  signal: one(signals, { fields: [alerts.signalId], references: [signals.id] }),
}));

export const watchlistRelations = relations(watchlistItems, ({ one }) => ({
  user: one(users, { fields: [watchlistItems.userId], references: [users.id] }),
  company: one(companies, { fields: [watchlistItems.companyId], references: [companies.id] }),
}));

export const exposureRelations = relations(exposureEntries, ({ one }) => ({
  user: one(users, { fields: [exposureEntries.userId], references: [users.id] }),
  company: one(companies, { fields: [exposureEntries.companyId], references: [companies.id] }),
}));

export const jobsRelations = relations(jobs, ({ one, many }) => ({
  poster: one(users, { fields: [jobs.builderUserId], references: [users.id] }),
  company: one(companies, { fields: [jobs.companyId], references: [companies.id] }),
  applications: many(jobApplications),
}));

export const jobApplicationsRelations = relations(jobApplications, ({ one }) => ({
  job: one(jobs, { fields: [jobApplications.jobId], references: [jobs.id] }),
  tradie: one(users, { fields: [jobApplications.tradieUserId], references: [users.id] }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  author: one(users, { fields: [reviews.authorUserId], references: [users.id] }),
  subjectCompany: one(companies, { fields: [reviews.subjectCompanyId], references: [companies.id] }),
  subjectUser: one(users, { fields: [reviews.subjectUserId], references: [users.id] }),
}));

export const tradieProfilesRelations = relations(tradieProfiles, ({ one }) => ({
  user: one(users, { fields: [tradieProfiles.userId], references: [users.id] }),
}));

export const builderProfilesRelations = relations(builderProfiles, ({ one }) => ({
  user: one(users, { fields: [builderProfiles.userId], references: [users.id] }),
  company: one(companies, { fields: [builderProfiles.companyId], references: [companies.id] }),
}));
