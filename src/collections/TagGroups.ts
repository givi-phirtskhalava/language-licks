import type { CollectionConfig, TextFieldValidation } from "payload";

import {
  getAllowedLanguages,
  isSuperAdmin,
  superAdminOnly,
} from "@/lib/adminAuth/access";

export const TagGroups: CollectionConfig = {
  slug: "tag-groups",
  labels: {
    singular: "Tag Groups (Language)",
    plural: "Tag Groups",
  },
  admin: {
    useAsTitle: "language",
    defaultColumns: ["language"],
    group: "Admin",
  },
  access: {
    read: ({ req }) => {
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
    create: superAdminOnly,
    delete: superAdminOnly,
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
      access: {
        update: ({ req }) => isSuperAdmin(req),
      },
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
