import type { AdminViewServerProps } from "payload";
import { DefaultTemplate } from "@payloadcms/next/templates";
import { SetStepNav } from "@payloadcms/ui";
import { redirect } from "next/navigation";

import CustomerLookupClient from "./CustomerLookupClient";
import style from "./CustomerLookup.module.css";

export default function CustomerLookupView(props: AdminViewServerProps) {
  const { initPageResult, params, searchParams } = props;
  const { locale, permissions, req, visibleEntities } = initPageResult;

  const adminEmail = process.env.INITIAL_ADMIN_EMAIL?.toLowerCase();
  const userEmail =
    typeof req.user?.email === "string" ? req.user.email.toLowerCase() : null;

  if (!adminEmail || !userEmail || userEmail !== adminEmail) {
    redirect("/admin");
  }

  return (
    <DefaultTemplate
      i18n={req.i18n}
      locale={locale}
      params={params}
      payload={req.payload}
      permissions={permissions}
      req={req}
      searchParams={searchParams}
      user={req.user ?? undefined}
      visibleEntities={{
        collections: visibleEntities?.collections,
        globals: visibleEntities?.globals,
      }}
    >
      <SetStepNav nav={[{ label: "Customer Lookup" }]} />
      <div className={style.container}>
        <CustomerLookupClient />
      </div>
    </DefaultTemplate>
  );
}
