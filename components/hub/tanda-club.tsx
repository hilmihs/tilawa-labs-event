import type { PintuKey } from "@/lib/hub/konten";

/*
 * A drawn mark per club instead of a photo: no photos exist yet, and a line drawing
 * in the ink colour sits on the poster paper the way the rest of the site does.
 */
export function TandaClub({ club, className }: { club: PintuKey; className?: string }) {
  const umum = {
    viewBox: "0 0 48 48",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    className,
  };
  if (club === "english") {
    // A globe with a speech bubble tail: da'wah, spoken, to the world.
    return (
      <svg {...umum}>
        <circle cx="22" cy="22" r="15" />
        <path d="M7 22h30M22 7c-5 4-7 9-7 15s2 11 7 15M22 7c5 4 7 9 7 15s-2 11-7 15" />
        <path d="M33 34l7 7-1-9" />
      </svg>
    );
  }
  if (club === "arabic") {
    // Two speech bubbles facing each other: hiwar.
    return (
      <svg {...umum}>
        <path d="M6 10h22v14H16l-6 5v-5H6z" />
        <path d="M20 28v6h12l6 5v-5h4V20h-8" />
        <path d="M11 17h12" />
      </svg>
    );
  }
  if (club === "fest") {
    // A trophy with a star: the competitions.
    return (
      <svg {...umum}>
        <path d="M15 6h18v10a9 9 0 0 1-18 0z" />
        <path d="M15 9H8v3a7 7 0 0 0 7 7M33 9h7v3a7 7 0 0 1-7 7" />
        <path d="M24 25v8M17 42h14l-2-9H19z" />
        <path d="M24 10l1.5 3 3.2.4-2.4 2.2.7 3.2-3-1.7-3 1.7.7-3.2-2.4-2.2 3.2-.4z" />
      </svg>
    );
  }
  // An open book under a crescent: a night spent finishing a kitab.
  return (
    <svg {...umum}>
      <path d="M6 16c6-2 12-1 18 3 6-4 12-5 18-3v22c-6-2-12-1-18 3-6-4-12-5-18-3z" />
      <path d="M24 19v22" />
      <path d="M30 4a6 6 0 1 0 6 8 5 5 0 0 1-6-8z" />
    </svg>
  );
}
