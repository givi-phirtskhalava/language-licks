import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_lessons_language" AS ENUM('french', 'italian');
  CREATE TYPE "public"."enum_lessons_cefr" AS ENUM('A1', 'A2', 'B1', 'B2', 'C1', 'C2');
  CREATE TYPE "public"."enum_tag_groups_language" AS ENUM('french', 'italian');
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"email" varchar(255) NOT NULL,
  	"name" varchar(255),
  	"language" varchar(50) DEFAULT 'french' NOT NULL,
  	"token_version" integer DEFAULT 0 NOT NULL,
  	"paddle_customer_id" varchar(255),
  	"paddle_subscription_id" varchar(255),
  	"subscription_status" varchar(50),
  	"subscription_plan_end" timestamp,
  	"daily_target" integer DEFAULT 1 NOT NULL,
  	"created_at" timestamp DEFAULT now() NOT NULL,
  	CONSTRAINT "users_email_unique" UNIQUE("email")
  );
  
  CREATE TABLE "verification_codes" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"email" varchar(255) NOT NULL,
  	"code_hash" varchar(255) NOT NULL,
  	"expires_at" timestamp NOT NULL,
  	"created_at" timestamp DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "progress" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer NOT NULL,
  	"lesson_id" integer NOT NULL,
  	"phase" varchar(50) DEFAULT 'lesson' NOT NULL,
  	"completed" boolean DEFAULT false NOT NULL,
  	"completed_at" timestamp,
  	"interval" integer DEFAULT 1 NOT NULL,
  	"next_review" varchar(10),
  	"retired" boolean DEFAULT false NOT NULL,
  	"speaking_unlocked" boolean DEFAULT false NOT NULL,
  	"lesson_learned" boolean DEFAULT false NOT NULL,
  	"first_completed_at" timestamp,
  	"review_pass_count" integer DEFAULT 0 NOT NULL,
  	"review_fail_count" integer DEFAULT 0 NOT NULL,
  	"consecutive_fails" integer DEFAULT 0 NOT NULL
  );
  
  CREATE TABLE "daily_activity" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer NOT NULL,
  	"language" varchar(50) NOT NULL,
  	"date_key" varchar(6) NOT NULL,
  	"lessons" integer DEFAULT 0 NOT NULL,
  	"reviews" integer DEFAULT 0 NOT NULL
  );
  
  CREATE TABLE "admins_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "admins" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "lessons_grammar" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"explanation" varchar NOT NULL
  );
  
  CREATE TABLE "lessons_liaison_tips" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"phrase" varchar NOT NULL,
  	"explanation" varchar NOT NULL
  );
  
  CREATE TABLE "lessons" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"language" "enum_lessons_language" NOT NULL,
  	"sentence" varchar NOT NULL,
  	"translation" varchar NOT NULL,
  	"audio" varchar DEFAULT '/sentence.mp3' NOT NULL,
  	"order" numeric DEFAULT 0 NOT NULL,
  	"is_free" boolean DEFAULT false,
  	"cefr" "enum_lessons_cefr",
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "lessons_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "tag_groups_groups_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL
  );
  
  CREATE TABLE "tag_groups_groups" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL
  );
  
  CREATE TABLE "tag_groups" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"language" "enum_tag_groups_language" NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"admins_id" integer,
  	"media_id" integer,
  	"lessons_id" integer,
  	"tag_groups_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"admins_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "progress" ADD CONSTRAINT "progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
  ALTER TABLE "daily_activity" ADD CONSTRAINT "daily_activity_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
  ALTER TABLE "admins_sessions" ADD CONSTRAINT "admins_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "lessons_grammar" ADD CONSTRAINT "lessons_grammar_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "lessons_liaison_tips" ADD CONSTRAINT "lessons_liaison_tips_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "lessons_texts" ADD CONSTRAINT "lessons_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tag_groups_groups_tags" ADD CONSTRAINT "tag_groups_groups_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."tag_groups_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tag_groups_groups" ADD CONSTRAINT "tag_groups_groups_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."tag_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_admins_fk" FOREIGN KEY ("admins_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_lessons_fk" FOREIGN KEY ("lessons_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tag_groups_fk" FOREIGN KEY ("tag_groups_id") REFERENCES "public"."tag_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_admins_fk" FOREIGN KEY ("admins_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "progress_user_lesson_idx" ON "progress" USING btree ("user_id","lesson_id");
  CREATE UNIQUE INDEX "daily_activity_user_lang_date_idx" ON "daily_activity" USING btree ("user_id","language","date_key");
  CREATE INDEX "admins_sessions_order_idx" ON "admins_sessions" USING btree ("_order");
  CREATE INDEX "admins_sessions_parent_id_idx" ON "admins_sessions" USING btree ("_parent_id");
  CREATE INDEX "admins_updated_at_idx" ON "admins" USING btree ("updated_at");
  CREATE INDEX "admins_created_at_idx" ON "admins" USING btree ("created_at");
  CREATE UNIQUE INDEX "admins_email_idx" ON "admins" USING btree ("email");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "lessons_grammar_order_idx" ON "lessons_grammar" USING btree ("_order");
  CREATE INDEX "lessons_grammar_parent_id_idx" ON "lessons_grammar" USING btree ("_parent_id");
  CREATE INDEX "lessons_liaison_tips_order_idx" ON "lessons_liaison_tips" USING btree ("_order");
  CREATE INDEX "lessons_liaison_tips_parent_id_idx" ON "lessons_liaison_tips" USING btree ("_parent_id");
  CREATE INDEX "lessons_updated_at_idx" ON "lessons" USING btree ("updated_at");
  CREATE INDEX "lessons_created_at_idx" ON "lessons" USING btree ("created_at");
  CREATE INDEX "lessons_texts_order_parent" ON "lessons_texts" USING btree ("order","parent_id");
  CREATE INDEX "tag_groups_groups_tags_order_idx" ON "tag_groups_groups_tags" USING btree ("_order");
  CREATE INDEX "tag_groups_groups_tags_parent_id_idx" ON "tag_groups_groups_tags" USING btree ("_parent_id");
  CREATE INDEX "tag_groups_groups_order_idx" ON "tag_groups_groups" USING btree ("_order");
  CREATE INDEX "tag_groups_groups_parent_id_idx" ON "tag_groups_groups" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "tag_groups_language_idx" ON "tag_groups" USING btree ("language");
  CREATE INDEX "tag_groups_updated_at_idx" ON "tag_groups" USING btree ("updated_at");
  CREATE INDEX "tag_groups_created_at_idx" ON "tag_groups" USING btree ("created_at");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_admins_id_idx" ON "payload_locked_documents_rels" USING btree ("admins_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_lessons_id_idx" ON "payload_locked_documents_rels" USING btree ("lessons_id");
  CREATE INDEX "payload_locked_documents_rels_tag_groups_id_idx" ON "payload_locked_documents_rels" USING btree ("tag_groups_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_admins_id_idx" ON "payload_preferences_rels" USING btree ("admins_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users" CASCADE;
  DROP TABLE "verification_codes" CASCADE;
  DROP TABLE "progress" CASCADE;
  DROP TABLE "daily_activity" CASCADE;
  DROP TABLE "admins_sessions" CASCADE;
  DROP TABLE "admins" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "lessons_grammar" CASCADE;
  DROP TABLE "lessons_liaison_tips" CASCADE;
  DROP TABLE "lessons" CASCADE;
  DROP TABLE "lessons_texts" CASCADE;
  DROP TABLE "tag_groups_groups_tags" CASCADE;
  DROP TABLE "tag_groups_groups" CASCADE;
  DROP TABLE "tag_groups" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TYPE "public"."enum_lessons_language";
  DROP TYPE "public"."enum_lessons_cefr";
  DROP TYPE "public"."enum_tag_groups_language";`)
}
