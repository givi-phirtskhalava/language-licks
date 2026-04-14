ALTER TABLE "users" ADD COLUMN "paddle_customer_id" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "paddle_subscription_id" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "subscription_status" varchar(50);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "subscription_plan_end" timestamp;