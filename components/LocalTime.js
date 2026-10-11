"use client";

/** A date shown in the viewer's own timezone/locale (the server runs in UTC on Vercel). */
export default function LocalTime({ iso }) {
  return (
    <time dateTime={iso} suppressHydrationWarning>
      {new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
    </time>
  );
}
