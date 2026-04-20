import type { AdminViewServerProps } from "payload";
import { DefaultTemplate } from "@payloadcms/next/templates";
import { SetStepNav } from "@payloadcms/ui";

import LessonBoardClient from "./LessonBoardClient";
import style from "./LessonBoard.module.css";

export default function LessonBoardView(props: AdminViewServerProps) {
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
      <SetStepNav nav={[{ label: "Lessons" }]} />
      <div className={style.container}>
        <LessonBoardClient />
      </div>
    </DefaultTemplate>
  );
}
