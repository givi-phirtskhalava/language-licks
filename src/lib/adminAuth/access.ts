import type { Access, FieldAccess, PayloadRequest } from "payload";

import { LANGUAGES, type TLanguageId } from "@/lib/projectConfig";

interface IAdminUser {
  id: string | number;
  email?: string;
  allowedLanguages?: TLanguageId[] | null;
  collection?: string;
}

function getUser(req: PayloadRequest): IAdminUser | null {
  const user = req.user as IAdminUser | null | undefined;
  if (!user || user.collection !== "admins") return null;
  return user;
}

export function isSuperAdmin(req: PayloadRequest): boolean {
  const user = getUser(req);
  const adminEmail = process.env.INITIAL_ADMIN_EMAIL?.toLowerCase();
  if (!user?.email || !adminEmail) return false;
  return user.email.toLowerCase() === adminEmail;
}

export function getAllowedLanguages(req: PayloadRequest): TLanguageId[] {
  if (isSuperAdmin(req)) return LANGUAGES.map((l) => l.id);
  const user = getUser(req);
  return Array.isArray(user?.allowedLanguages) ? user.allowedLanguages : [];
}

export const superAdminOnly: Access = ({ req }) => isSuperAdmin(req);

export const superAdminOnlyField: FieldAccess = ({ req }) => isSuperAdmin(req);

export const adminOrEditor: Access = ({ req }) => {
  const user = getUser(req);
  return Boolean(user);
};

export const lessonsRead: Access = ({ req }) => {
  if (isSuperAdmin(req)) return true;
  const langs = getAllowedLanguages(req);
  if (langs.length === 0) return false;
  return { language: { in: langs } };
};

export const lessonsUpdate: Access = ({ req }) => {
  if (isSuperAdmin(req)) return true;
  const langs = getAllowedLanguages(req);
  if (langs.length === 0) return false;
  return { language: { in: langs } };
};

export const lessonsCreate: Access = ({ req }) => {
  if (isSuperAdmin(req)) return true;
  return getAllowedLanguages(req).length > 0;
};

export const adminsRead: Access = ({ req }) => {
  if (isSuperAdmin(req)) return true;
  const user = getUser(req);
  if (!user) return false;
  return { id: { equals: user.id } };
};
