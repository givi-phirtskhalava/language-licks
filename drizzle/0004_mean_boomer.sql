CREATE TABLE "speech_usage" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"month" varchar(7) NOT NULL,
	"training_seconds" real DEFAULT 0 NOT NULL,
	"testing_seconds" real DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "speech_usage" ADD CONSTRAINT "speech_usage_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "speech_usage_user_month_idx" ON "speech_usage" USING btree ("user_id","month");