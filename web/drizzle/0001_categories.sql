CREATE TABLE "categories" (
	"slug" varchar(120) PRIMARY KEY NOT NULL,
	"name" varchar(160) NOT NULL,
	"parent" varchar(120),
	"synonyms" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "company_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"category_slug" varchar(120) NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "category_slug" varchar(120);--> statement-breakpoint
ALTER TABLE "tradie_profiles" ADD COLUMN "category_slugs" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "company_categories" ADD CONSTRAINT "company_categories_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_categories" ADD CONSTRAINT "company_categories_category_slug_categories_slug_fk" FOREIGN KEY ("category_slug") REFERENCES "public"."categories"("slug") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "categories_parent_idx" ON "categories" USING btree ("parent");--> statement-breakpoint
CREATE UNIQUE INDEX "company_category_unique" ON "company_categories" USING btree ("company_id","category_slug");--> statement-breakpoint
CREATE INDEX "company_categories_slug_idx" ON "company_categories" USING btree ("category_slug");