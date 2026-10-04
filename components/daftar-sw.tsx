"use client";

import { useEffect } from "react";

/**
 * Registers the service worker on participant pages only. Its whole job is making
 * the saved ticket reachable with no network; staff routes are excluded inside the
 * worker itself so a scanner never reads a stale response.
 */
export function DaftarServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (window.location.protocol !== "https:" && window.location.hostname !== "localhost") return;
    const id = setTimeout(() => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // No offline copy on this phone; everything else still works online.
      });
    }, 1200);
    return () => clearTimeout(id);
  }, []);
  return null;
}
