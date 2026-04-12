ALTER TABLE "progress" ADD COLUMN "writing_best_time" real;--> statement-breakpoint
ALTER TABLE "progress" ADD COLUMN "speaking_best_time" real;--> statement-breakpoint
ALTER TABLE "progress" ADD COLUMN "writing_streak" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "progress" ADD COLUMN "speaking_streak" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "progress_user_lesson_idx" ON "progress" USING btree ("user_id","lesson_id");