"use client";

import { useState } from "react";

export function Pilihan({
  name,
  value,
  onChange,
  options,
}: {
  name: string;
  value: string;
  onChange?: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  const [local, setLocal] = useState(value);
  const current = onChange ? value : local;
  const set = (v: string) => {
    setLocal(v);
    onChange?.(v);
  };
  return (
    <div className="flex gap-2">
      <input type="hidden" name={name} value={current} />
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => set(o.value)}
          aria-pressed={current === o.value}
          className={`min-h-12 flex-1 rounded-[6px] border-[1.5px] px-2 py-2 text-[15px] font-medium leading-[1.25] ${
            current === o.value
              ? "border-[var(--color-ink)] bg-brand font-semibold text-[var(--color-butter)]"
              : "border-[var(--color-line)] bg-white text-[var(--color-ink)]"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
