CREATE TABLE "daily_activity" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"language" varchar(50) NOT NULL,
	"date_key" varchar(6) NOT NULL,
	"lessons" integer DEFAULT 0 NOT NULL,
	"reviews" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"lesson_id" integer NOT NULL,
	"phase" varchar(50) DEFAULT 'lesson' NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp,
	"interval" integer DEFAULT 1 NOT NULL,
	"next_review" varchar(10),
	"retired" boolean DEFAULT false NOT NULL,
	"writing_best_time" real,
	"speaking_best_time" real,
	"writing_streak" integer DEFAULT 0 NOT NULL,
	"speaking_streak" integer DEFAULT 0 NOT NULL,
	"first_completed_at" timestamp,
	"review_pass_count" integer DEFAULT 0 NOT NULL,
	"review_fail_count" integer DEFAULT 0 NOT NULL,
	"consecutive_fails" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255),
	"language" varchar(50) DEFAULT 'french' NOT NULL,
	"token_version" integer DEFAULT 0 NOT NULL,
	"paddle_customer_id" varchar(255),
	"paddle_subscription_id" varchar(255),
	"subscription_status" varchar(50),
	"subscription_plan_end" timestamp,
	"daily_target" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"code_hash" varchar(255) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "daily_activity" ADD CONSTRAINT "daily_activity_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progress" ADD CONSTRAINT "progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "daily_activity_user_lang_date_idx" ON "daily_activity" USING btree ("user_id","language","date_key");--> statement-breakpoint
CREATE UNIQUE INDEX "progress_user_lesson_idx" ON "progress" USING btree ("user_id","lesson_id");