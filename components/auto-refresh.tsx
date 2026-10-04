"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Refreshes server data on an interval without losing scroll position. */
export function AutoRefresh({ detik = 5 }: { detik?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, detik * 1000);
    return () => clearInterval(id);
  }, [detik, router]);
  return null;
}
