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
      name: "isFree",
      type: "checkbox",
      defaultValue: false,
    },
    {
      name: "cefr",
      type: "select",
      defaultValue: "A1",
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
