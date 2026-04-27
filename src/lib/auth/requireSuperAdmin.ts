import { getPayload } from "payload";
import config from "@payload-config";
import { AuthError } from "./requireAuth";

export async function requireSuperAdmin(headers: Headers): Promise<void> {
  const payload = await getPayload({ config });
  const result = await payload.auth({ headers });

  if (!result.user || result.user.collection !== "admins") {
    throw new AuthError("Admin access required", 403);
  }

  const adminEmail = process.env.INITIAL_ADMIN_EMAIL?.toLowerCase();
  const userEmail =
    typeof result.user.email === "string"
      ? result.user.email.toLowerCase()
      : null;

  if (!adminEmail || !userEmail || userEmail !== adminEmail) {
    throw new AuthError("Admin access required", 403);
  }
}
