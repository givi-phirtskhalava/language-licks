UPDATE "progress" SET "interval" = GREATEST(1, ROUND("interval" / 86400000.0)) WHERE "interval" > 1000;--> statement-breakpoint
UPDATE "progress" SET "next_review" = TO_CHAR("next_review"::timestamp, 'YYYY-MM-DD') WHERE "next_review" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "progress" ALTER COLUMN "interval" SET DEFAULT 1;--> statement-breakpoint
ALTER TABLE "progress" ALTER COLUMN "next_review" SET DATA TYPE varchar(10);