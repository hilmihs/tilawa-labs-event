import Link from "next/link";

const TAB = [
  { key: "live", href: "/panel", label: "Live (event day)" },
  { key: "ringkasan", href: "/panel/ringkasan", label: "Summary & charts" },
  { key: "peserta", href: "/panel/list", label: "Participants" },
  { key: "trafik", href: "/panel/trafik", label: "Traffic" },
] as const;

/** The dashboard's three views, carrying the chosen programme between them. */
export function TabPanel({ aktif, acara }: { aktif: (typeof TAB)[number]["key"]; acara: string }) {
  const qs = `?acara=${encodeURIComponent(acara)}`;
  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-[var(--color-line)] bg-white px-5" aria-label="Dashboard">
      {TAB.map((t) => (
        <Link
          key={t.key}
          href={`${t.href}${qs}`}
          aria-current={t.key === aktif ? "page" : undefined}
          className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2.5 text-[14px] font-medium ${
            t.key === aktif
              ? "border-brand font-semibold text-brand"
              : "border-transparent text-[var(--color-ink-2)] hover:text-[var(--color-ink)]"
          }`}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
