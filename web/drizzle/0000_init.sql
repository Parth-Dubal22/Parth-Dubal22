CREATE TYPE "public"."alert_channel" AS ENUM('in_app', 'email', 'sms');--> statement-breakpoint
CREATE TYPE "public"."application_status" AS ENUM('applied', 'contacted', 'declined', 'withdrawn');--> statement-breakpoint
CREATE TYPE "public"."dispute_status" AS ENUM('open', 'corrected', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."dispute_target" AS ENUM('signal', 'review', 'check', 'profile');--> statement-breakpoint
CREATE TYPE "public"."exposure_kind" AS ENUM('owed', 'deposit');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('open', 'closed');--> statement-breakpoint
CREATE TYPE "public"."job_type" AS ENUM('subcontract', 'day_hire');--> statement-breakpoint
CREATE TYPE "public"."quote_status" AS ENUM('sent', 'replied', 'closed');--> statement-breakpoint
CREATE TYPE "public"."review_status" AS ENUM('published', 'removed_legal');--> statement-breakpoint
CREATE TYPE "public"."reviewer_role" AS ENUM('homeowner', 'subcontractor', 'builder');--> statement-breakpoint
CREATE TYPE "public"."signal_level" AS ENUM('ok', 'watch', 'risk');--> statement-breakpoint
CREATE TYPE "public"."signal_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."subscription_plan" AS ENUM('tradie_watch', 'builder_pro');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('active', 'past_due', 'canceled', 'incomplete');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('customer', 'tradie', 'builder', 'admin');--> statement-breakpoint
CREATE TYPE "public"."verification_status" AS ENUM('pending', 'approved', 'rejected', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."verification_tier" AS ENUM('none', 'id_verified', 'buildsafe_verified', 'track_record');--> statement-breakpoint
CREATE TYPE "public"."watch_kind" AS ENUM('builder', 'client');--> statement-breakpoint
CREATE TABLE "alerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"signal_id" integer NOT NULL,
	"channel" "alert_channel" DEFAULT 'in_app' NOT NULL,
	"delivered_at" timestamp,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "builder_checks" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(40) NOT NULL,
	"company_id" integer,
	"query" varchar(240) NOT NULL,
	"snapshot" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "builder_checks_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "builder_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"company_id" integer NOT NULL,
	CONSTRAINT "builder_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" serial PRIMARY KEY NOT NULL,
	"abn" varchar(14) NOT NULL,
	"name" varchar(240) NOT NULL,
	"slug" varchar(260) NOT NULL,
	"entity_type" varchar(120),
	"gst_registered" boolean,
	"abn_status" varchar(40),
	"location" varchar(160),
	"state" varchar(8) DEFAULT 'VIC',
	"licence_number" varchar(80),
	"licence_status" varchar(80),
	"licence_source" varchar(40),
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"art_kind" varchar(24) DEFAULT 'house' NOT NULL,
	"tier" "verification_tier" DEFAULT 'none' NOT NULL,
	"tier_granted_at" timestamp,
	"claimed_by_user_id" integer,
	"risk_level" "signal_level" DEFAULT 'ok' NOT NULL,
	"last_checked_at" timestamp,
	"rating_avg_x10" integer,
	"review_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "companies_abn_unique" UNIQUE("abn"),
	CONSTRAINT "companies_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "customer_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"suburb" varchar(120),
	"state" varchar(8) DEFAULT 'VIC',
	"project_type" varchar(120),
	CONSTRAINT "customer_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "disputes" (
	"id" serial PRIMARY KEY NOT NULL,
	"raised_by_user_id" integer NOT NULL,
	"target_type" "dispute_target" NOT NULL,
	"target_id" integer NOT NULL,
	"reason" text NOT NULL,
	"status" "dispute_status" DEFAULT 'open' NOT NULL,
	"sla_due_at" timestamp NOT NULL,
	"resolved_at" timestamp,
	"resolution" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"to_email" varchar(320) NOT NULL,
	"subject" varchar(300) NOT NULL,
	"body" text NOT NULL,
	"kind" varchar(60) NOT NULL,
	"sent_at" timestamp,
	"error" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exposure_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"company_id" integer NOT NULL,
	"amount_cents" bigint DEFAULT 0 NOT NULL,
	"kind" "exposure_kind" DEFAULT 'owed' NOT NULL,
	"note" varchar(300),
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_applications" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_id" integer NOT NULL,
	"tradie_user_id" integer NOT NULL,
	"note" varchar(500),
	"status" "application_status" DEFAULT 'applied' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"builder_user_id" integer NOT NULL,
	"company_id" integer NOT NULL,
	"title" varchar(240) NOT NULL,
	"type" "job_type" DEFAULT 'subcontract' NOT NULL,
	"rate" varchar(80) NOT NULL,
	"location" varchar(160) NOT NULL,
	"start_text" varchar(80) NOT NULL,
	"duration" varchar(80) NOT NULL,
	"requirement" varchar(200),
	"trade" varchar(120),
	"status" "job_status" DEFAULT 'open' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"reporter_user_id" integer NOT NULL,
	"days_late" integer NOT NULL,
	"has_invoice_evidence" boolean DEFAULT false NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quote_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_user_id" integer NOT NULL,
	"company_id" integer NOT NULL,
	"project_type" varchar(160),
	"note" varchar(800),
	"status" "quote_status" DEFAULT 'sent' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"author_user_id" integer NOT NULL,
	"author_role" "reviewer_role" NOT NULL,
	"subject_company_id" integer,
	"subject_user_id" integer,
	"rating" integer NOT NULL,
	"text" text NOT NULL,
	"paid_on_time" boolean,
	"reply" text,
	"replied_at" timestamp,
	"verified" boolean DEFAULT false NOT NULL,
	"job_id" integer,
	"status" "review_status" DEFAULT 'published' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "signals" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"occurred_on" timestamp NOT NULL,
	"title" varchar(300) NOT NULL,
	"detail" text,
	"level" "signal_level" NOT NULL,
	"source_name" varchar(160) NOT NULL,
	"source_url" text,
	"source_ref" varchar(200),
	"status" "signal_status" DEFAULT 'pending' NOT NULL,
	"reviewed_by" integer,
	"reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subbie_panel_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"builder_user_id" integer NOT NULL,
	"tradie_user_id" integer,
	"name" varchar(200) NOT NULL,
	"trade" varchar(120),
	"licence_number" varchar(80),
	"insurance_expiry" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"plan" "subscription_plan" NOT NULL,
	"status" "subscription_status" DEFAULT 'incomplete' NOT NULL,
	"stripe_customer_id" varchar(80),
	"stripe_subscription_id" varchar(80),
	"current_period_end" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "tradie_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"business_name" varchar(200),
	"abn" varchar(14),
	"trades" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"suburb" varchar(120),
	"state" varchar(8) DEFAULT 'VIC',
	"licence_number" varchar(80),
	"licence_verified" boolean DEFAULT false NOT NULL,
	"insurance_provider" varchar(160),
	"insurance_expiry" timestamp,
	"insurance_verified" boolean DEFAULT false NOT NULL,
	"available_now" boolean DEFAULT false NOT NULL,
	"bio" text,
	"portfolio" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"reliability_score" integer,
	"jobs_completed" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "tradie_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(320) NOT NULL,
	"password_hash" text NOT NULL,
	"name" varchar(160) NOT NULL,
	"role" "user_role" NOT NULL,
	"phone" varchar(32),
	"email_alerts" boolean DEFAULT true NOT NULL,
	"sms_alerts" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"requested_by_user_id" integer NOT NULL,
	"tier" "verification_tier" NOT NULL,
	"status" "verification_status" DEFAULT 'pending' NOT NULL,
	"criteria" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"decided_by_user_id" integer,
	"decided_at" timestamp,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "watchlist_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"company_id" integer NOT NULL,
	"kind" "watch_kind" DEFAULT 'builder' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_signal_id_signals_id_fk" FOREIGN KEY ("signal_id") REFERENCES "public"."signals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "builder_checks" ADD CONSTRAINT "builder_checks_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "builder_profiles" ADD CONSTRAINT "builder_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "builder_profiles" ADD CONSTRAINT "builder_profiles_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "companies" ADD CONSTRAINT "companies_claimed_by_user_id_users_id_fk" FOREIGN KEY ("claimed_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_profiles" ADD CONSTRAINT "customer_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_raised_by_user_id_users_id_fk" FOREIGN KEY ("raised_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_log" ADD CONSTRAINT "email_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exposure_entries" ADD CONSTRAINT "exposure_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exposure_entries" ADD CONSTRAINT "exposure_entries_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_tradie_user_id_users_id_fk" FOREIGN KEY ("tradie_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_builder_user_id_users_id_fk" FOREIGN KEY ("builder_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_reports" ADD CONSTRAINT "payment_reports_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_reports" ADD CONSTRAINT "payment_reports_reporter_user_id_users_id_fk" FOREIGN KEY ("reporter_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_requests" ADD CONSTRAINT "quote_requests_customer_user_id_users_id_fk" FOREIGN KEY ("customer_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_requests" ADD CONSTRAINT "quote_requests_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_author_user_id_users_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_subject_company_id_companies_id_fk" FOREIGN KEY ("subject_company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_subject_user_id_users_id_fk" FOREIGN KEY ("subject_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signals" ADD CONSTRAINT "signals_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signals" ADD CONSTRAINT "signals_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subbie_panel_items" ADD CONSTRAINT "subbie_panel_items_builder_user_id_users_id_fk" FOREIGN KEY ("builder_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subbie_panel_items" ADD CONSTRAINT "subbie_panel_items_tradie_user_id_users_id_fk" FOREIGN KEY ("tradie_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tradie_profiles" ADD CONSTRAINT "tradie_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_requests" ADD CONSTRAINT "verification_requests_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_requests" ADD CONSTRAINT "verification_requests_requested_by_user_id_users_id_fk" FOREIGN KEY ("requested_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_requests" ADD CONSTRAINT "verification_requests_decided_by_user_id_users_id_fk" FOREIGN KEY ("decided_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watchlist_items" ADD CONSTRAINT "watchlist_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watchlist_items" ADD CONSTRAINT "watchlist_items_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "alerts_user_idx" ON "alerts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "companies_name_idx" ON "companies" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "exposure_unique" ON "exposure_entries" USING btree ("user_id","company_id","kind");--> statement-breakpoint
CREATE UNIQUE INDEX "application_unique" ON "job_applications" USING btree ("job_id","tradie_user_id");--> statement-breakpoint
CREATE INDEX "jobs_status_idx" ON "jobs" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_report_unique" ON "payment_reports" USING btree ("company_id","reporter_user_id");--> statement-breakpoint
CREATE INDEX "reviews_company_idx" ON "reviews" USING btree ("subject_company_id");--> statement-breakpoint
CREATE INDEX "signals_company_idx" ON "signals" USING btree ("company_id");--> statement-breakpoint
CREATE UNIQUE INDEX "watch_unique" ON "watchlist_items" USING btree ("user_id","company_id");