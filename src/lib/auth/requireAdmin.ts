import { getPayload } from "payload";
import config from "@payload-config";
import { AuthError } from "./requireAuth";

export async function requireAdmin(headers: Headers): Promise<void> {
  const payload = await getPayload({ config });
  const result = await payload.auth({ headers });

  if (!result.user || result.user.collection !== "admins") {
    throw new AuthError("Admin access required", 403);
  }
}
