import type { AdminViewServerProps } from "payload";
import { DefaultTemplate } from "@payloadcms/next/templates";
import { SetStepNav } from "@payloadcms/ui";

import CustomerLookupClient from "./CustomerLookupClient";
import style from "./CustomerLookup.module.css";

export default function CustomerLookupView(props: AdminViewServerProps) {
  const { initPageResult, params, searchParams } = props;
  const { locale, permissions, req, visibleEntities } = initPageResult;

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
