"use client";

import Link from "next/link";
import { useFormStatus } from "react-dom";
import { kirimKetuk } from "./ketuk";
import type { KunciTombol } from "@/lib/hub/konten";

/**
 * A submit button that cannot be tapped twice while the first tap is on its way.
 * With `ketuk`, the tap is also counted for the interest funnel.
 */
export function TombolKirim({
  children,
  className,
  ketuk,
}: {
  children: React.ReactNode;
  className?: string;
  ketuk?: KunciTombol;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      onClick={ketuk ? () => kirimKetuk(ketuk) : undefined}
      className={`${className ?? ""} disabled:opacity-60`}
    >
      {children}
    </button>
  );
}

/** The guest's version of the interest button: a link to sign in, counted the same way. */
export function TautanKetuk({
  href,
  ketuk,
  className,
  children,
}: {
  href: string;
  ketuk: KunciTombol;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={className} onClick={() => kirimKetuk(ketuk)}>
      {children}
    </Link>
  );
}
