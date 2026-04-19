"use client";

import { useRowLabel } from "@payloadcms/ui";

interface IGroupRow {
  name?: string;
}

export default function GroupRowLabel() {
  const { data, rowNumber } = useRowLabel<IGroupRow>();
  const position = (rowNumber ?? 0) + 1;
  const fallback = `Group ${position}`;
  return <span>{`${position}. ${data?.name || fallback}`}</span>;
}
