import { headers as nextHeaders } from "next/headers";
import { getPayload } from "payload";
import config from "@payload-config";

import CustomerLookupNavLinkClient from "./CustomerLookupNavLinkClient";

export default async function CustomerLookupNavLink() {
  const requestHeaders = await nextHeaders();
  const payload = await getPayload({ config });
  const result = await payload.auth({ headers: requestHeaders });

  const adminEmail = process.env.INITIAL_ADMIN_EMAIL?.toLowerCase();
  const userEmail =
    typeof result.user?.email === "string"
      ? result.user.email.toLowerCase()
      : null;

  if (!adminEmail || !userEmail || userEmail !== adminEmail) return null;

  return <CustomerLookupNavLinkClient />;
}
