"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { GATES } from "@/lib/acara/view-model";

const K_GATE = "nawa.gate";

/**
 * Which station's log to show. The gate lives in the URL so the page can be read on a
 * laptop at the desk, but a phone that already picked its gate for the shift (the
 * scanner remembers it under the same key) should not have to pick it again — so with
 * no `gate` in the URL this puts the remembered one there.
 */
export function GateLog({ gate, acara }: { gate: string | null; acara: string | null }) {
  const router = useRouter();
  const sp = useSearchParams();

  useEffect(() => {
    if (sp.get("gate")) return;
    let ingat: string | null = null;
    try {
      ingat = localStorage.getItem(K_GATE);
    } catch {
      // Storage blocked: the chips below still work.
    }
    if (!ingat || !(GATES as readonly string[]).includes(ingat)) return;
    const q = new URLSearchParams(sp.toString());
    q.set("gate", ingat);
    router.replace(`/scan/log?${q.toString()}`);
  }, [router, sp]);

  const tautan = (g: string | null) => {
    const q = new URLSearchParams();
    if (acara) q.set("acara", acara);
    if (g) q.set("gate", g);
    else q.set("gate", "semua");
    const s = q.toString();
    return `/scan/log${s ? `?${s}` : ""}`;
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      <Link
        href={tautan(null)}
        className={`rounded-[8px] border px-2.5 py-1 text-[13px] font-medium ${
          gate ? "border-[var(--color-line)] bg-white text-[var(--color-ink-2)]" : "border-brand bg-brand-100 font-semibold text-brand"
        }`}
      >
        All gates
      </Link>
      {GATES.map((g) => (
        <Link
          key={g}
          href={tautan(g)}
          className={`rounded-[8px] border px-2.5 py-1 text-[13px] font-medium ${
            gate === g
              ? "border-brand bg-brand-100 font-semibold text-brand"
              : "border-[var(--color-line)] bg-white text-[var(--color-ink-2)]"
          }`}
        >
          {g}
        </Link>
      ))}
    </div>
  );
}
