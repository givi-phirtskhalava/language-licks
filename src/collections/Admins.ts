import type { CollectionConfig } from "payload";

import {
  SESSION_COOKIE_NAME,
  verifyAdminSession,
} from "@/lib/adminAuth/session";
import {
  adminsRead,
  superAdminOnly,
  superAdminOnlyField,
} from "@/lib/adminAuth/access";
import { LANGUAGES } from "@/lib/projectConfig";

function readSessionCookie(headers: Headers): string | null {
  const raw = headers.get("cookie");
  if (!raw) return null;

  for (const part of raw.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === SESSION_COOKIE_NAME) return rest.join("=");
  }

  return null;
}

export const Admins: CollectionConfig = {
  slug: "admins",
  admin: {
    useAsTitle: "email",
    defaultColumns: ["email", "name", "allowedLanguages"],
  },
  access: {
    read: adminsRead,
    create: superAdminOnly,
    update: superAdminOnly,
    delete: superAdminOnly,
  },
  auth: {
    disableLocalStrategy: { enableFields: true, optionalPassword: true },
    strategies: [
      {
        name: "google-session",
        authenticate: async ({ headers, payload }) => {
          const token = readSessionCookie(headers);
          if (!token) return { user: null };

          const session = await verifyAdminSession(token);
          if (!session) return { user: null };

          try {
            const admin = await payload.findByID({
              collection: "admins",
              id: session.adminId,
              overrideAccess: true,
            });

            return {
              user: {
                ...admin,
                collection: "admins",
                _strategy: "google-session",
              },
            };
          } catch {
            return { user: null };
          }
        },
      },
    ],
  },
  fields: [
    {
      name: "name",
      type: "text",
    },
    {
      name: "allowedLanguages",
      type: "select",
      hasMany: true,
      options: LANGUAGES.map((l) => ({ label: l.label, value: l.id })),
      admin: {
        description:
          "Languages this editor can read/edit/create lessons for. Ignored for the super admin (set via INITIAL_ADMIN_EMAIL).",
      },
      access: {
        update: superAdminOnlyField,
        create: superAdminOnlyField,
      },
    },
  ],
};
