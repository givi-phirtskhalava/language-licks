import {
  pgTable,
  serial,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  language: varchar("language", { length: 50 }).notNull().default("french"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const lessons = pgTable("lessons", {
  id: serial("id").primaryKey(),
  language: varchar("language", { length: 50 }).notNull(),
  sentence: text("sentence").notNull(),
  translation: text("translation").notNull(),
  audio: varchar("audio", { length: 255 }).notNull(),
  grammar: jsonb("grammar").notNull().$type<{ label: string; explanation: string }[]>(),
  liaisonTips: jsonb("liaison_tips").notNull().$type<{ phrase: string; explanation: string }[]>(),
  order: integer("order").notNull(),
});

export const progress = pgTable("progress", {
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
});
