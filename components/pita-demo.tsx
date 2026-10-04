/**
 * The demo banner.
 *
 * A visitor who lands on a staff screen with no way in will leave, so the access
 * codes are printed here rather than hidden. That is safe only because this build
 * is sealed: see DEMO.md — no real data, no outbound messages, and the data resets
 * every night.
 *
 * Rendered from the root layout, so it is impossible to reach a page without it.
 */
export function PitaDemo() {
  if (process.env.NEXT_PUBLIC_DEMO !== "1") return null;

  const kode = [
    ["Usher", "petugas-demo"],
    ["Committee", "panitia-demo"],
    ["Admin", "admin-demo"],
  ] as const;

  return (
    <div
      /*
       * Half the site renders dir="rtl" and a flex row inherits it, which reversed
       * this banner's parts — the word DEMO ended up on the right, after the codes.
       * Its content is latin and reads left to right in either language.
       */
      dir="ltr"
      style={{
        background: "#1F1D18",
        color: "#F7E6B8",
        fontSize: "12px",
        lineHeight: 1.45,
        padding: "7px 14px",
        display: "flex",
        flexWrap: "wrap",
        gap: "4px 18px",
        alignItems: "baseline",
        fontFamily: "ui-monospace, monospace",
      }}
    >
      <strong style={{ letterSpacing: ".08em", textTransform: "uppercase" }}>
        Demo
      </strong>
      <span>Synthetic data. Resets nightly. Nothing here is sent to anyone.</span>
      <span style={{ opacity: 0.85 }}>
        Staff codes —{" "}
        {kode.map(([peran, k], i) => (
          <span key={k}>
            {i > 0 ? " · " : ""}
            {peran}: <b>{k}</b>
          </span>
        ))}
      </span>
    </div>
  );
}
