CREATE TABLE "daily_activity" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"language" varchar(50) NOT NULL,
	"date_key" varchar(6) NOT NULL,
	"lessons" integer DEFAULT 0 NOT NULL,
	"reviews" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "progress" ADD COLUMN "first_completed_at" timestamp;--> statement-breakpoint
ALTER TABLE "progress" ADD COLUMN "review_pass_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "progress" ADD COLUMN "review_fail_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "progress" ADD COLUMN "consecutive_fails" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "daily_target" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "daily_activity" ADD CONSTRAINT "daily_activity_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "daily_activity_user_lang_date_idx" ON "daily_activity" USING btree ("user_id","language","date_key");