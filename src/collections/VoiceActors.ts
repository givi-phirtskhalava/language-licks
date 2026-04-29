import type { CollectionConfig } from "payload";

import {
  getAllowedLanguages,
  isSuperAdmin,
  superAdminOnly,
  superAdminOnlyField,
} from "@/lib/adminAuth/access";

export const VoiceActors: CollectionConfig = {
  slug: "voice-actors",
  labels: {
    singular: "Voice Actor",
    plural: "Voice Actors",
  },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "language", "accent"],
    group: "Audio",
  },
  versions: {
    drafts: true,
  },
  access: {
    read: () => true,
    create: ({ req }) => {
      if (isSuperAdmin(req)) return true;
      return getAllowedLanguages(req).length > 0;
    },
    update: ({ req }) => {
      if (isSuperAdmin(req)) return true;
      const langs = getAllowedLanguages(req);
      if (langs.length === 0) return false;
      return { language: { in: langs } };
    },
    delete: superAdminOnly,
  },
  hooks: {
    beforeValidate: [
      ({ data, req, operation }) => {
        if (operation !== "create" && operation !== "update") return data;
        if (!req.user) return data;
        if (isSuperAdmin(req)) return data;
        if (!data?.language) return data;

        const allowed = getAllowedLanguages(req);
        if (!allowed.includes(data.language)) {
          throw new Error(
            `You are not allowed to ${operation} voice actors in language "${data.language}".`,
          );
        }

        return data;
      },
    ],
    beforeDelete: [
      async ({ id, req }) => {
        const result = await req.payload.find({
          collection: "audio-files",
          where: { voiceActor: { equals: id } },
          limit: 1,
          depth: 0,
          req,
        });

        if (result.totalDocs > 0) {
          throw new Error(
            `Cannot delete voice actor: ${result.totalDocs} audio recording(s) still reference this actor. Delete or reassign them first.`,
          );
        }
      },
    ],
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
    },
    {
      name: "language",
      type: "select",
      required: true,
      options: [
        { label: "French", value: "french" },
        { label: "Italian", value: "italian" },
      ],
      defaultValue: ({ req }) => {
        const fromQuery = req.query?.language;
        if (fromQuery === "french" || fromQuery === "italian") return fromQuery;
        return undefined;
      },
      access: {
        update: superAdminOnlyField,
      },
    },
    {
      name: "accent",
      type: "text",
      required: true,
    },
    {
      name: "sample",
      type: "upload",
      relationTo: "voice-actor-samples",
      required: false,
      admin: {
        description: "Optional mp3 sample so users can preview this voice.",
      },
    },
  ],
  indexes: [{ fields: ["name", "language"], unique: true }],
};
