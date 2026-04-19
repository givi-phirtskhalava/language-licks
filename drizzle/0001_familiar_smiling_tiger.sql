ALTER TABLE "progress" ADD COLUMN "speaking_unlocked" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "progress" ADD COLUMN "lesson_learned" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "progress" DROP COLUMN "writing_best_time";--> statement-breakpoint
ALTER TABLE "progress" DROP COLUMN "speaking_best_time";--> statement-breakpoint
ALTER TABLE "progress" DROP COLUMN "writing_streak";--> statement-breakpoint
ALTER TABLE "progress" DROP COLUMN "speaking_streak";