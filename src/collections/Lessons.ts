import type { CollectionConfig } from "payload";

export const Lessons: CollectionConfig = {
  slug: "lessons",
  admin: {
    useAsTitle: "sentence",
    defaultColumns: ["sentence", "language", "order"],
  },
  access: {
    read: () => true,
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
    },
    {
      name: "tags",
      type: "relationship",
      relationTo: "tags",
      hasMany: true,
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
