ALTER TABLE "lessons" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "lessons" CASCADE;--> statement-breakpoint
ALTER TABLE "progress" DROP CONSTRAINT "progress_lesson_id_lessons_id_fk";
