import type { CollectionConfig } from "payload";

import {
  getAllowedLanguages,
  isSuperAdmin,
  lessonsCreate,
  lessonsRead,
  lessonsUpdate,
  superAdminOnly,
} from "@/lib/adminAuth/access";

export const Lessons: CollectionConfig = {
  slug: "lessons",
  admin: {
    useAsTitle: "sentence",
    defaultColumns: ["sentence", "language", "order"],
  },
  access: {
    read: lessonsRead,
    create: lessonsCreate,
    update: lessonsUpdate,
    delete: superAdminOnly,
  },
  hooks: {
    beforeValidate: [
      ({ data, req, operation }) => {
        if (operation !== "create" && operation !== "update") return data;
        if (isSuperAdmin(req)) return data;
        if (!data?.language) return data;

        const allowed = getAllowedLanguages(req);
        if (!allowed.includes(data.language)) {
          throw new Error(
            `You are not allowed to ${operation} lessons in language "${data.language}".`,
          );
        }

        return data;
      },
    ],
    beforeChange: [
      async ({ data, operation, req }) => {
        if (operation !== "create") return data;

        const result = await req.payload.find({
          collection: "lessons",
          where: {
            language: { equals: data.language },
            cefr: { equals: data.cefr },
          },
          sort: "-order",
          limit: 1,
          depth: 0,
          req,
        });

        const maxOrder =
          typeof result.docs[0]?.order === "number" ? result.docs[0].order : 0;
        data.order = maxOrder + 1;
        return data;
      },
    ],
  },
  fields: [
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
    },
    {
      name: "sentence",
      type: "text",
      required: true,
    },
    {
      name: "translation",
      type: "text",
      required: true,
    },
    {
      name: "context",
      type: "textarea",
    },
    {
      name: "audio",
      type: "text",
      required: true,
      defaultValue: "/sentence.mp3",
    },
    {
      name: "order",
      type: "number",
      required: true,
      defaultValue: 0,
      admin: { hidden: true },
    },
    {
      name: "isFree",
      type: "checkbox",
      defaultValue: false,
    },
    {
      name: "cefr",
      type: "select",
      defaultValue: ({ req }) => {
        const fromQuery = req.query?.cefr;
        if (
          fromQuery === "A1" ||
          fromQuery === "A2" ||
          fromQuery === "B1" ||
          fromQuery === "B2" ||
          fromQuery === "C1" ||
          fromQuery === "C2"
        ) {
          return fromQuery;
        }
        return "A1";
      },
      options: [
        { label: "A1", value: "A1" },
        { label: "A2", value: "A2" },
        { label: "B1", value: "B1" },
        { label: "B2", value: "B2" },
        { label: "C1", value: "C1" },
        { label: "C2", value: "C2" },
      ],
    },
    {
      name: "tags",
      type: "text",
      hasMany: true,
      admin: {
        components: {
          Field: "@/collections/Lessons/TagsField#default",
        },
      },
    },
    {
      name: "grammar",
      type: "array",
      required: true,
      fields: [
        { name: "label", type: "text", required: true },
        { name: "explanation", type: "textarea", required: true },
      ],
    },
    {
      name: "liaisonTips",
      type: "array",
      fields: [
        { name: "phrase", type: "text", required: true },
        { name: "explanation", type: "textarea", required: true },
      ],
    },
  ],
  defaultSort: "order",
};
