"use client";

import { useState } from "react";

/**
 * Copies a ready-made text. The summary a stakeholder asks for in WhatsApp is the same
 * one every time; typing the numbers over from the screen is where they go wrong.
 */
export function SalinTeks({ teks, label }: { teks: string; label: string }) {
  const [tersalin, setTersalin] = useState(false);
  return (
    <button
      type="button"
      className="btn btn-ghost h-10 text-[13px]"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(teks);
        } catch {
          // Older browsers without the clipboard API: select-and-copy fallback.
          const ta = document.createElement("textarea");
          ta.value = teks;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          ta.remove();
        }
        setTersalin(true);
        setTimeout(() => setTersalin(false), 2000);
      }}
    >
      {tersalin ? "Copied ✓" : label}
    </button>
  );
}
