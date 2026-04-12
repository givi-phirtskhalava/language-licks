CREATE TABLE "lessons" (
	"id" serial PRIMARY KEY NOT NULL,
	"language" varchar(50) NOT NULL,
	"sentence" text NOT NULL,
	"translation" text NOT NULL,
	"audio" varchar(255) NOT NULL,
	"grammar" jsonb NOT NULL,
	"liaison_tips" jsonb NOT NULL,
	"order" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"lesson_id" integer NOT NULL,
	"phase" varchar(50) DEFAULT 'lesson' NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp,
	"interval" integer DEFAULT 86400000 NOT NULL,
	"next_review" timestamp,
	"retired" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"language" varchar(50) DEFAULT 'french' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "progress" ADD CONSTRAINT "progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progress" ADD CONSTRAINT "progress_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE no action ON UPDATE no action;