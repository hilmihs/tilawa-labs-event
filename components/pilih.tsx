"use client";

import { useEffect, useRef } from "react";

/**
 * A `<select>` that survives a server action, with its own chevron.
 *
 * React 19 resets a form automatically once its action completes. For text inputs
 * that is invisible — they are re-populated from `defaultValue` on the re-render
 * that follows. A `<select>` is not: the reset drops the browser back to the first
 * option, and because the component's `value` prop did not change React sees nothing
 * to update and leaves the DOM showing an empty box.
 *
 * The result was a form that quietly emptied every dropdown the moment a submit was
 * rejected — someone who forgot the house-rules checkbox lost their programme,
 * semester and transport, and usually only noticed on the confirmation screen.
 *
 * So the DOM is re-synced from state after every commit. React's value stays the
 * single source of truth; this only repairs what the form reset undid.
 *
 * The chevron is a real element rather than a background image. As a background it
 * sat on the wrong side of the field on at least one Android browser, over the
 * label; as an element it is placed by the same layout engine as the text, and it
 * flips with the writing direction on its own.
 */
export function Pilih({
  id,
  name,
  value,
  onChange,
  children,
  className = "field",
}: {
  id?: string;
  /** Omitted for a step that is not submitted itself — see PilihWilayah's hidden field. */
  name?: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (el && el.value !== value) el.value = value;
  });

  return (
    <span className="relative block">
      <select
        id={id}
        ref={ref}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        // Inline, not a class: the chevron below is the one that shows, and a
        // stylesheet rule for this would depend on load order between two files.
        style={{ backgroundImage: "none" }}
        className={className}
      >
        {children}
      </select>
      <svg
        aria-hidden
        width="10"
        height="6"
        viewBox="0 0 10 6"
        className="pointer-events-none absolute end-[14px] top-1/2 -translate-y-1/2"
      >
        <path
          d="M1 1l4 4 4-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
