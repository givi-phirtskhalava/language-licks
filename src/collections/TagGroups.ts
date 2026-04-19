import type { CollectionConfig, TextFieldValidation } from "payload";

export const TagGroups: CollectionConfig = {
  slug: "tag-groups",
  labels: {
    singular: "Tag Groups (Language)",
    plural: "Tag Groups",
  },
  admin: {
    useAsTitle: "language",
    defaultColumns: ["language"],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: "language",
      type: "select",
      required: true,
      unique: true,
      options: [
        { label: "French", value: "french" },
        { label: "Italian", value: "italian" },
      ],
    },
    {
      name: "groups",
      type: "array",
      labels: {
        singular: "Group",
        plural: "Groups",
      },
      admin: {
        components: {
          RowLabel: "@/collections/TagGroups/GroupRowLabel#default",
        },
      },
      fields: [
        { name: "name", type: "text", required: true },
        {
          name: "tags",
          type: "array",
          labels: {
            singular: "Tag",
            plural: "Tags",
          },
          fields: [
            {
              name: "name",
              type: "text",
              required: true,
              validate: ((value, { data }) => {
                if (typeof value !== "string" || !value.trim()) return true;
                const normalized = value.trim().toLowerCase();
                const doc = data as { groups?: { tags?: { name?: string }[] }[] };
                let count = 0;
                for (const group of doc.groups ?? []) {
                  for (const tag of group.tags ?? []) {
                    if (tag.name?.trim().toLowerCase() === normalized) count++;
                  }
                }
                if (count > 1) return `Tag "${value}" already exists in another group`;
                return true;
              }) as TextFieldValidation,
            },
          ],
        },
      ],
    },
  ],
};
