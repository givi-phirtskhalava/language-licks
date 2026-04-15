CREATE TABLE "speech_credits" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"balance" integer DEFAULT 30 NOT NULL,
	"last_credit_date" varchar(10) NOT NULL,
	CONSTRAINT "speech_credits_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
DROP TABLE "speech_usage" CASCADE;--> statement-breakpoint
ALTER TABLE "speech_credits" ADD CONSTRAINT "speech_credits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;