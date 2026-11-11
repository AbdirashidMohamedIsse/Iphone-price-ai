"use client";

import { useEffect, useState } from "react";

/** Formats in the visitor's timezone after mount (avoids server/client mismatch). */
export function LocalTime({ iso }: { iso: string }) {
  const [text, setText] = useState(iso.slice(0, 10));
  useEffect(() => {
    setText(new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso)));
  }, [iso]);
  return <time dateTime={iso}>{text}</time>;
}
