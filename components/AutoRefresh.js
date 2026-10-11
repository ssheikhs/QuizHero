"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Re-fetch the server component every few seconds while the tab is visible (live leaderboards). */
export default function AutoRefresh({ seconds = 10 }) {
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, seconds * 1000);
    return () => clearInterval(timer);
  }, [router, seconds]);

  return null;
}
