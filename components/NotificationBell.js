"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const relative = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

function timeAgo(iso) {
  const seconds = Math.round((new Date(iso).getTime() - Date.now()) / 1000);
  const steps = [
    [60, "second"],
    [60, "minute"],
    [24, "hour"],
    [7, "day"],
    [4.35, "week"],
    [12, "month"],
  ];
  let value = seconds;
  for (const [size, unit] of steps) {
    if (Math.abs(value) < size) return relative.format(Math.round(value), unit);
    value /= size;
  }
  return relative.format(Math.round(value), "year");
}

// Only follow links inside this site.
const isInternal = (link) => typeof link === "string" && link.startsWith("/") && !link.startsWith("//");

export default function NotificationBell() {
  const [data, setData] = useState({ unread: 0, items: [] });
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (res.ok) setData(await res.json());
    } catch {
      // offline — keep the last list
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(() => document.visibilityState === "visible" && load(), 15000); // same 15s poll as the original
    return () => clearInterval(timer);
  }, [load]);

  async function markAllRead() {
    setData((d) => ({ unread: 0, items: d.items.map((n) => ({ ...n, read: true })) }));
    await fetch("/api/notifications", { method: "POST" }).catch(() => {});
  }

  return (
    <div className="dropdown dropdown-end">
      <button tabIndex={0} className="btn btn-ghost btn-circle" aria-label={`Notifications${data.unread ? `, ${data.unread} unread` : ""}`}>
        <div className="indicator">
          <span className="text-xl" aria-hidden="true">
            🔔
          </span>
          {data.unread > 0 && <span className="indicator-item badge badge-error badge-xs font-bold text-white">{data.unread > 9 ? "9+" : data.unread}</span>}
        </div>
      </button>
      <div tabIndex={0} className="dropdown-content z-50 mt-3 w-80 rounded-box bg-base-100 text-base-content shadow-xl sm:w-96">
        <div className="flex items-center justify-between border-b border-base-300 px-4 py-3">
          <strong>Notifications</strong>
          <button type="button" className="btn btn-ghost btn-xs" onClick={markAllRead} disabled={!data.unread}>
            Mark all read
          </button>
        </div>
        <ul className="max-h-96 overflow-y-auto">
          {!loaded && (
            <li className="p-4 text-center">
              <span className="loading loading-dots loading-sm" />
            </li>
          )}
          {loaded && !data.items.length && <li className="p-6 text-center text-sm opacity-60">No notifications yet</li>}
          {data.items.map((n) => {
            const body = (
              <>
                <p className="text-sm">{n.message}</p>
                <p className="mt-0.5 text-xs opacity-50">{timeAgo(n.createdAt)}</p>
              </>
            );
            const cls = `block border-b border-base-200 px-4 py-3 ${n.read ? "" : "bg-primary/5 border-l-4 border-l-primary"}`;
            return (
              <li key={n.id}>
                {isInternal(n.link) ? (
                  <Link href={n.link} className={`${cls} hover:bg-base-200`} onClick={() => document.activeElement?.blur()}>
                    {body}
                  </Link>
                ) : (
                  <div className={cls}>{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
