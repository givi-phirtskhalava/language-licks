import type { CollectionConfig } from "payload";

export const Tags: CollectionConfig = {
  slug: "tags",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "group"],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
      unique: true,
    },
    {
      name: "group",
      type: "select",
      required: true,
      options: [
        { label: "Tenses & Moods", value: "tenses" },
        { label: "Topics", value: "topics" },
        { label: "Grammar", value: "grammar" },
      ],
    },
    {
      name: "order",
      type: "number",
      required: true,
      defaultValue: 0,
    },
  ],
  defaultSort: "order",
};
