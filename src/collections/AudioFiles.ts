import type { CollectionConfig } from "payload";
import { randomBytes } from "crypto";

import {
  getAllowedLanguages,
  isSuperAdmin,
  superAdminOnly,
} from "@/lib/adminAuth/access";
import type { TLanguageId } from "@/lib/projectConfig";

const LANG_SHORT: Record<TLanguageId, string> = {
  french: "fr",
  italian: "it",
};

function resolveRelationId(value: unknown): number | null {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  if (value && typeof value === "object" && "id" in value) {
    const id = (value as { id: unknown }).id;
    if (typeof id === "number") return id;
    if (typeof id === "string") {
      const n = Number(id);
      return Number.isFinite(n) ? n : null;
    }
  }
  return null;
}

export const AudioFiles: CollectionConfig = {
  slug: "audio-files",
  labels: {
    singular: "Audio File",
    plural: "Audio Files",
  },
  admin: {
    useAsTitle: "filename",
    defaultColumns: ["filename", "lesson", "speed", "voiceActor", "language"],
    group: "Audio",
  },
  upload: {
    mimeTypes: ["audio/mpeg"],
  },
  access: {
    read: () => true,
    create: ({ req }) => {
      if (isSuperAdmin(req)) return true;
      const langs = getAllowedLanguages(req);
      if (langs.length === 0) return false;
      return { language: { in: langs } };
    },
    update: ({ req }) => {
      if (isSuperAdmin(req)) return true;
      const langs = getAllowedLanguages(req);
      if (langs.length === 0) return false;
      return { language: { in: langs } };
    },
    delete: superAdminOnly,
  },
  fields: [
    {
      name: "lesson",
      type: "relationship",
      relationTo: "lessons",
      required: true,
      hasMany: false,
      defaultValue: ({ req }) => {
        const fromQuery = req.query?.lesson;
        const n = Number(fromQuery);
        return Number.isFinite(n) && n > 0 ? n : undefined;
      },
    },
    {
      name: "speed",
      type: "select",
      required: true,
      options: [
        { label: "Normal", value: "normal" },
        { label: "Slow", value: "slow" },
      ],
      defaultValue: ({ req }) => {
        const fromQuery = req.query?.speed;
        if (fromQuery === "normal" || fromQuery === "slow") return fromQuery;
        return undefined;
      },
    },
    {
      name: "voiceActor",
      type: "relationship",
      relationTo: "voice-actors",
      required: true,
      hasMany: false,
      filterOptions: ({ data }) => {
        if (data?.language) return { language: { equals: data.language } };
        return true;
      },
    },
    {
      name: "language",
      type: "select",
      required: true,
      options: [
        { label: "French", value: "french" },
        { label: "Italian", value: "italian" },
      ],
      admin: { hidden: true },
    },
  ],
  indexes: [{ fields: ["lesson", "speed", "voiceActor"], unique: true }],
  hooks: {
    beforeValidate: [
      async ({ data, req }) => {
        if (!data) return data;

        const lessonId = resolveRelationId(data.lesson);
        if (lessonId !== null && !data.language) {
          const lesson = await req.payload
            .findByID({
              collection: "lessons",
              id: lessonId,
              depth: 0,
              req,
            })
            .catch(() => null);
          if (lesson?.language) {
            data.language = lesson.language;
          }
        }

        const voiceActorId = resolveRelationId(data.voiceActor);
        if (voiceActorId !== null && data.language) {
          const voiceActor = await req.payload
            .findByID({
              collection: "voice-actors",
              id: voiceActorId,
              depth: 0,
              req,
            })
            .catch(() => null);
          if (voiceActor && voiceActor.language !== data.language) {
            throw new Error(
              `Voice actor language "${voiceActor.language}" does not match audio file language "${data.language}".`,
            );
          }
        }

        return data;
      },
    ],
    beforeChange: [
      ({ data, req }) => {
        if (!req.file) return data;

        const lessonId = resolveRelationId(data.lesson);
        const speed = data.speed;
        const language = data.language as TLanguageId | undefined;

        if (lessonId === null || !speed || !language) return data;

        const langShort = LANG_SHORT[language];
        if (!langShort) return data;

        const hash = randomBytes(4).toString("hex");
        data.filename = `${lessonId}-${speed}-${hash}.mp3`;
        data.prefix = `audio/${langShort}`;

        return data;
      },
    ],
  },
};
