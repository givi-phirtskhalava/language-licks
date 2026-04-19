import {
  pgTable,
  serial,
  varchar,
  integer,
  boolean,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  language: varchar("language", { length: 50 }).notNull().default("french"),
  tokenVersion: integer("token_version").notNull().default(0),
  paddleCustomerId: varchar("paddle_customer_id", { length: 255 }),
  paddleSubscriptionId: varchar("paddle_subscription_id", { length: 255 }),
  subscriptionStatus: varchar("subscription_status", { length: 50 }),
  subscriptionPlanEnd: timestamp("subscription_plan_end"),
  dailyTarget: integer("daily_target").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const verificationCodes = pgTable("verification_codes", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull(),
  codeHash: varchar("code_hash", { length: 255 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const progress = pgTable(
  "progress",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    lessonId: integer("lesson_id").notNull(),
    phase: varchar("phase", { length: 50 }).notNull().default("lesson"),
    completed: boolean("completed").notNull().default(false),
    completedAt: timestamp("completed_at"),
    interval: integer("interval").notNull().default(1),
    nextReview: varchar("next_review", { length: 10 }),
    retired: boolean("retired").notNull().default(false),
    speakingUnlocked: boolean("speaking_unlocked").notNull().default(false),
    lessonLearned: boolean("lesson_learned").notNull().default(false),
    firstCompletedAt: timestamp("first_completed_at"),
    reviewPassCount: integer("review_pass_count").notNull().default(0),
    reviewFailCount: integer("review_fail_count").notNull().default(0),
    consecutiveFails: integer("consecutive_fails").notNull().default(0),
  },
  (table) => [uniqueIndex("progress_user_lesson_idx").on(table.userId, table.lessonId)]
);

export const dailyActivity = pgTable(
  "daily_activity",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    language: varchar("language", { length: 50 }).notNull(),
    dateKey: varchar("date_key", { length: 6 }).notNull(),
    lessons: integer("lessons").notNull().default(0),
    reviews: integer("reviews").notNull().default(0),
  },
  (table) => [
    uniqueIndex("daily_activity_user_lang_date_idx").on(
      table.userId,
      table.language,
      table.dateKey
    ),
  ]
);

