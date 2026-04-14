import {
  pgTable,
  serial,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  jsonb,
  real,
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
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const verificationCodes = pgTable("verification_codes", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull(),
  codeHash: varchar("code_hash", { length: 255 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const lessons = pgTable("lessons", {
  id: serial("id").primaryKey(),
  language: varchar("language", { length: 50 }).notNull(),
  sentence: text("sentence").notNull(),
  translation: text("translation").notNull(),
  audio: varchar("audio", { length: 255 }).notNull(),
  grammar: jsonb("grammar").notNull().$type<{ label: string; explanation: string }[]>(),
  liaisonTips: jsonb("liaison_tips").$type<{ phrase: string; explanation: string }[]>(),
  order: integer("order").notNull(),
});

export const progress = pgTable(
  "progress",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    lessonId: integer("lesson_id")
      .notNull()
      .references(() => lessons.id),
    phase: varchar("phase", { length: 50 }).notNull().default("lesson"),
    completed: boolean("completed").notNull().default(false),
    completedAt: timestamp("completed_at"),
    interval: integer("interval").notNull().default(86400000),
    nextReview: timestamp("next_review"),
    retired: boolean("retired").notNull().default(false),
    writingBestTime: real("writing_best_time"),
    speakingBestTime: real("speaking_best_time"),
    writingStreak: integer("writing_streak").notNull().default(0),
    speakingStreak: integer("speaking_streak").notNull().default(0),
  },
  (table) => [uniqueIndex("progress_user_lesson_idx").on(table.userId, table.lessonId)]
);

export const speechUsage = pgTable(
  "speech_usage",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    month: varchar("month", { length: 7 }).notNull(),
    trainingSeconds: real("training_seconds").notNull().default(0),
    testingSeconds: real("testing_seconds").notNull().default(0),
  },
  (table) => [uniqueIndex("speech_usage_user_month_idx").on(table.userId, table.month)]
);

