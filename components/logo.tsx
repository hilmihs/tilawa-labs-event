/**
 * Demo wordmark.
 *
 * The production component draws the client's registered logo from vector paths
 * taken off their brand sheet. A brand mark is the one asset a demo must never
 * carry: it is the organisation's identity, not a description of the software.
 * So this build sets the name in type instead.
 *
 * The three viewBoxes below are the *original* ones, copied from the brand
 * sheet's own geometry. Keeping them matters more than it looks: callers size the
 * logo by height alone and let the ratio decide the width, inside flex rows that
 * will happily squash an SVG that asks for more room than the real mark did. Get
 * the ratio wrong and the header logo is crushed — which is exactly what the
 * first version of this file did.
 *
 * The lockup is diagonal, not stacked: the logogram occupies the top-left square
 * and the name sits in the lower-right block.
 */

export type LogoTone = "dark" | "light" | "mono" | "ink" | "cream";

const NAMA = "Tilawa Labs";

/** Brand-sheet geometry. Do not round these — the ratios are load-bearing. */
const LOCKUP = { w: 814.9, h: 447.6 } as const;
const MARK = { w: 235.3, h: 235.3 } as const;
const WORD = { x: 253.3, y: 253.4, w: 561.6, h: 194.2 } as const;

type Warna = { body: string; accent: string };

const TONE: Record<LogoTone, Warna> = {
  dark: { body: "#3D6C46", accent: "#A2C083" },
  light: { body: "#F7E6B8", accent: "#A2C083" },
  mono: { body: "currentColor", accent: "currentColor" },
  ink: { body: "#1F1D18", accent: "#8FB33A" },
  cream: { body: "#F7E6B8", accent: "#8FB33A" },
};

export const LOGO_RATIO = {
  mark: MARK.w / MARK.h,
  wordmark: WORD.w / WORD.h,
  lockup: LOCKUP.w / LOCKUP.h,
} as const;

/**
 * A gate with a light column standing in the opening — the same idea as the
 * original logogram, drawn from scratch so none of its outlines are reused.
 * Authored in a 0–100 box and scaled by the caller.
 */
function Mark({ body, accent }: Warna) {
  return (
    <g>
      <path d="M8 4 H62 A30 30 0 0 1 92 34 V66 A30 30 0 0 1 62 96 H8 Z" fill={body} />
      <rect x="34" y="22" width="15" height="78" fill={accent} />
    </g>
  );
}

/**
 * textLength pins the run to the width the viewBox promises. Without it the drawn
 * width depends on whichever serif the viewer happens to have, and the name either
 * overflows its block or drifts away from the logogram.
 */
function Nama({ x, y, w, h, fill }: { x: number; y: number; w: number; h: number; fill: string }) {
  return (
    <text
      x={x}
      y={y + h * 0.78}
      textLength={w}
      lengthAdjust="spacingAndGlyphs"
      /*
       * The site runs dir="rtl" on half its pages and that inherits straight into
       * SVG text, where it turns `x` into the run's RIGHT edge — the name then
       * lays out leftwards and off the viewBox. A latin wordmark is latin in both
       * directions, so pin it here rather than at every call site.
       */
      direction="ltr"
      textAnchor="start"
      style={{ unicodeBidi: "isolate" }}
      fill={fill}
      fontFamily="Georgia, 'Times New Roman', serif"
      fontSize={h * 0.82}
    >
      {NAMA}
    </text>
  );
}

export function Logo({
  kind = "lockup",
  height = 24,
  tone = "dark",
  className,
  title = NAMA,
  decorative = false,
}: {
  kind?: "lockup" | "mark" | "wordmark";
  height?: number;
  tone?: LogoTone;
  className?: string;
  title?: string;
  decorative?: boolean;
}) {
  const warna = TONE[tone];
  const width = height * LOGO_RATIO[kind];

  const a11y = decorative
    ? ({ "aria-hidden": true } as const)
    : ({ role: "img", "aria-label": title } as const);

  const common = {
    width,
    height,
    className,
    style: { display: "block" as const },
    ...a11y,
  };

  if (kind === "mark") {
    return (
      <svg viewBox={`0 0 ${MARK.w} ${MARK.h}`} {...common}>
        <g transform={`scale(${MARK.w / 100})`}>
          <Mark {...warna} />
        </g>
      </svg>
    );
  }

  if (kind === "wordmark") {
    return (
      <svg viewBox={`0 0 ${WORD.w} ${WORD.h}`} {...common}>
        <Nama x={0} y={0} w={WORD.w} h={WORD.h} fill={warna.body} />
      </svg>
    );
  }

  return (
    <svg viewBox={`0 0 ${LOCKUP.w} ${LOCKUP.h}`} {...common}>
      <g transform={`scale(${MARK.w / 100})`}>
        <Mark {...warna} />
      </g>
      <Nama x={WORD.x} y={WORD.y} w={WORD.w} h={WORD.h} fill={warna.body} />
    </svg>
  );
}
