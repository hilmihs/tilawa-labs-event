/*
 * The no-show page's drawings, in the posters' riso manner: ink outlines, a hard
 * offset shadow, forest and leaf green on butter paper. Inline SVG, moved by the
 * `absen-*` rules in app/globals.css.
 *
 * Every drawing's resting state is its finished state (lid open, tick drawn), and
 * the animation runs *from* the start *to* it. Anyone who asked their device for less
 * motion gets no animation, so they see the finished picture rather than a closed
 * box.
 */

const INK = "var(--color-ink)";
const DAUN = "var(--color-brand-300)";
const HUTAN = "var(--color-brand)";
const KERTAS = "var(--color-paper)";
const MENTEGA = "var(--color-butter)";
const EMAS = "var(--color-warn)";

/** A four-pointed sparkle centred on (x, y). */
const kilau = (x: number, y: number, r: number) =>
  `M${x} ${y - r}L${x + r * 0.28} ${y - r * 0.28}L${x + r} ${y}L${x + r * 0.28} ${y + r * 0.28}L${x} ${y + r}L${x - r * 0.28} ${y + r * 0.28}L${x - r} ${y}L${x - r * 0.28} ${y - r * 0.28}Z`;

// Confetti leaving the open box: where each piece ends up, its turn, colour, delay.
const KONFETI_KADO = [
  { dx: -58, dy: -70, r: 220, w: EMAS, t: 0 },
  { dx: 46, dy: -84, r: -160, w: DAUN, t: 0.35 },
  { dx: -30, dy: -96, r: 300, w: HUTAN, t: 0.7 },
  { dx: 70, dy: -52, r: 140, w: MENTEGA, t: 1.05 },
  { dx: -76, dy: -40, r: -240, w: DAUN, t: 1.4 },
  { dx: 18, dy: -104, r: 200, w: EMAS, t: 1.75 },
  { dx: 88, dy: -86, r: -120, w: HUTAN, t: 2.1 },
  { dx: -12, dy: -78, r: 260, w: MENTEGA, t: 2.45 },
];

/**
 * The gift box. Closed on the first screen — a teaser that rocks now and then with
 * sparkles round it — and opened on the thank-you screen, where the lid pops, the
 * notes rise out of it and confetti drifts up.
 */
export function KadoSvg({ terbuka, denganCatatan }: { terbuka: boolean; denganCatatan: boolean }) {
  return (
    <svg viewBox="0 -40 220 220" className="absen-kado-svg" data-terbuka={terbuka ? "1" : undefined} aria-hidden>
      <ellipse cx="110" cy="166" rx="66" ry="7" fill={INK} opacity="0.12" />

      {/* Confetti, behind the lid, drifting up out of the box */}
      {terbuka && KONFETI_KADO.map((k, i) => (
        <rect
          key={i}
          x={i % 2 ? 106 : 108}
          y="82"
          width={i % 3 ? 7 : 5}
          height={i % 3 ? 4 : 8}
          rx="1"
          fill={k.w}
          stroke={INK}
          strokeWidth="1"
          className="absen-konfeti"
          style={
            {
              "--dx": `${k.dx}px`,
              "--dy": `${k.dy}px`,
              "--r": `${k.r}deg`,
              animationDelay: `${1.3 + k.t}s`,
            } as React.CSSProperties
          }
        />
      ))}

      {/* What comes out of the box: the notes when there are notes, a sprig otherwise */}
      <g className="absen-goyang">
      {terbuka ? (
      <g className="absen-isi">
        {denganCatatan ? (
          <>
            <rect x="82" y="30" width="56" height="66" rx="2" fill={INK} transform="translate(3 3)" />
            <rect x="82" y="30" width="56" height="66" rx="2" fill={KERTAS} stroke={INK} strokeWidth="2.2" />
            <path d="M91 44h38M91 53h38M91 62h30M91 71h36M91 80h22" stroke={INK} strokeWidth="2" strokeLinecap="round" opacity="0.75" />
            <circle cx="128" cy="40" r="4" fill={DAUN} stroke={INK} strokeWidth="1.4" />
          </>
        ) : (
          <>
            <path d="M110 96V44" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
            <path d="M110 70c-20-2-28-14-28-26 16 0 27 10 28 26Z" fill={DAUN} stroke={INK} strokeWidth="2.2" strokeLinejoin="round" />
            <path d="M110 58c16-2 24-12 24-24-14 0-23 9-24 24Z" fill={HUTAN} stroke={INK} strokeWidth="2.2" strokeLinejoin="round" />
          </>
        )}
      </g>
      ) : null}

      {/* The box: a hard ink shadow, the body, the ribbon */}
      <g className="absen-kotak">
        <rect x="61" y="89" width="104" height="72" rx="3" fill={INK} />
        <rect x="56" y="84" width="104" height="72" rx="3" fill={DAUN} stroke={INK} strokeWidth="2.5" />
        <rect x="99" y="84" width="18" height="72" fill={HUTAN} stroke={INK} strokeWidth="2.5" />
        {/* riso speckle */}
        <g fill={INK} opacity="0.22">
          <circle cx="70" cy="100" r="1.3" />
          <circle cx="82" cy="126" r="1" />
          <circle cx="75" cy="142" r="1.4" />
          <circle cx="138" cy="104" r="1.1" />
          <circle cx="148" cy="132" r="1.4" />
          <circle cx="130" cy="146" r="1" />
        </g>
      </g>

      {/* The lid pops off and hovers */}
      <g className="absen-tutup">
        <g className="absen-tutup-apung">
          <rect x="54" y="70" width="112" height="20" rx="3" fill={INK} transform="translate(4 4)" />
          <rect x="50" y="68" width="116" height="20" rx="3" fill={DAUN} stroke={INK} strokeWidth="2.5" />
          <rect x="99" y="68" width="18" height="20" fill={HUTAN} stroke={INK} strokeWidth="2.5" />
          <path d="M108 66c-10-18-30-20-32-8-2 10 18 10 32 8Z" fill={HUTAN} stroke={INK} strokeWidth="2.4" strokeLinejoin="round" />
          <path d="M108 66c10-18 30-20 32-8 2 10-18 10-32 8Z" fill={HUTAN} stroke={INK} strokeWidth="2.4" strokeLinejoin="round" />
          <circle cx="108" cy="65" r="5.5" fill={DAUN} stroke={INK} strokeWidth="2.2" />
        </g>
      </g>
      </g>

      {/* Sparkles around it */}
      <path d={kilau(34, 60, 9)} fill={EMAS} stroke={INK} strokeWidth="1.4" strokeLinejoin="round" className="absen-kilau" style={{ animationDelay: "1.2s" }} />
      <path d={kilau(186, 44, 11)} fill={MENTEGA} stroke={INK} strokeWidth="1.4" strokeLinejoin="round" className="absen-kilau" style={{ animationDelay: "1.7s" }} />
      <path d={kilau(178, 118, 7)} fill={DAUN} stroke={INK} strokeWidth="1.3" strokeLinejoin="round" className="absen-kilau" style={{ animationDelay: "2.3s" }} />
      <path d={kilau(44, 128, 6)} fill={MENTEGA} stroke={INK} strokeWidth="1.2" strokeLinejoin="round" className="absen-kilau" style={{ animationDelay: "2.8s" }} />
      <path d={kilau(150, 18, 6)} fill={EMAS} stroke={INK} strokeWidth="1.2" strokeLinejoin="round" className="absen-kilau" style={{ animationDelay: "3.2s" }} />
    </svg>
  );
}

/** Without notes there is no gift to promise: a sprig in a pot, swaying, instead. */
export function TunasSvg() {
  return (
    <svg viewBox="0 -10 220 190" className="absen-kado-svg" aria-hidden>
      <ellipse cx="110" cy="166" rx="54" ry="7" fill={INK} opacity="0.12" />
      <g className="absen-tunas-goyang">
        <path d="M110 118V40" stroke={INK} strokeWidth="3" strokeLinecap="round" />
        <path d="M110 92c-30-2-44-22-44-40 24 0 42 16 44 40Z" fill={DAUN} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M110 72c24-2 38-18 38-36-21 0-36 14-38 36Z" fill={HUTAN} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M110 46c-12-2-18-10-18-20 10 0 17 8 18 20Z" fill={DAUN} stroke={INK} strokeWidth="2.2" strokeLinejoin="round" />
      </g>
      <path d="M79 121h66l-8 42h-50Z" fill={INK} transform="translate(4 4)" />
      <path d="M79 121h66l-8 42h-50Z" fill={MENTEGA} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M74 112h76v12H74Z" fill={HUTAN} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
      <path d={kilau(52, 50, 9)} fill={EMAS} stroke={INK} strokeWidth="1.4" strokeLinejoin="round" className="absen-kilau" style={{ animationDelay: "0.6s" }} />
      <path d={kilau(172, 84, 7)} fill={DAUN} stroke={INK} strokeWidth="1.3" strokeLinejoin="round" className="absen-kilau" style={{ animationDelay: "1.5s" }} />
    </svg>
  );
}

/** A small hourglass beside "30 seconds", turning over now and then. */
export function JamPasirSvg() {
  return (
    <svg viewBox="0 0 24 32" width="22" height="28" className="absen-jampasir flex-none" aria-hidden>
      <path d="M4 3h16M4 29h16" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M6 3c0 8 12 8 12 13S6 21 6 29h12c0-8-12-8-12-13S18 11 18 3Z" fill={KERTAS} stroke={INK} strokeWidth="2" strokeLinejoin="round" />
      <path d="M9 26c1-3 5-3 6 0Z" fill={DAUN} />
      <path d="M9 8h6l-3 4Z" fill={DAUN} />
    </svg>
  );
}

// The thank-you burst: once, outwards from the stamp.
const KONFETI_SELESAI = Array.from({ length: 12 }, (_, i) => {
  const sudut = (i / 12) * Math.PI * 2 + 0.3;
  const jarak = 62 + (i % 3) * 12;
  return {
    dx: Math.round(Math.cos(sudut) * jarak),
    dy: Math.round(Math.sin(sudut) * jarak),
    r: (i % 2 ? 1 : -1) * (120 + i * 25),
    w: [DAUN, EMAS, HUTAN, MENTEGA][i % 4],
  };
});

/** A stamp whose tick draws itself, a sprig that grows from it, and a little confetti. */
export function SelesaiSvg() {
  return (
    <svg viewBox="0 0 200 180" className="absen-selesai-svg" aria-hidden>
      <circle cx="100" cy="92" r="66" fill="none" stroke={INK} strokeWidth="1.6" strokeDasharray="3 7" className="absen-cincin" />
      {KONFETI_SELESAI.map((k, i) => (
        <rect
          key={i}
          x="96"
          y="90"
          width={i % 2 ? 8 : 5}
          height={i % 2 ? 4 : 8}
          rx="1"
          fill={k.w}
          stroke={INK}
          strokeWidth="1"
          className="absen-ledak"
          style={{ "--dx": `${k.dx}px`, "--dy": `${k.dy}px`, "--r": `${k.r}deg` } as React.CSSProperties}
        />
      ))}
      <circle cx="104" cy="96" r="48" fill={INK} />
      <circle cx="100" cy="92" r="48" fill={HUTAN} stroke={INK} strokeWidth="2.5" className="absen-stempel" />
      <path
        d="M78 93l15 15 30-32"
        fill="none"
        stroke={MENTEGA}
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        className="absen-centang-gambar"
      />
      <g className="absen-tunas">
        <path d="M138 54c4-12 6-20 4-30" stroke={INK} strokeWidth="2.2" strokeLinecap="round" fill="none" />
        <path d="M141 36c-12-2-18-10-17-20 11 1 17 8 17 20Z" fill={DAUN} stroke={INK} strokeWidth="2" strokeLinejoin="round" />
        <path d="M142 30c9-5 16-4 21 3-8 5-15 4-21-3Z" fill={DAUN} stroke={INK} strokeWidth="2" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

/** A tick that pops into a chosen chip. */
export function Centang() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" className="absen-chip-centang" aria-hidden>
      <path d="M3 8.5l3.2 3.2L13 4.8" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Days as a little calendar, times of day as the sun (or moon) at its height. */
export function IkonWaktu({ k }: { k: string }) {
  const bingkai = (isi: React.ReactNode) => (
    <svg viewBox="0 0 24 24" width="22" height="22" className="flex-none" aria-hidden>
      {isi}
    </svg>
  );
  if (k === "hari_kerja" || k === "akhir_pekan") {
    const libur = k === "akhir_pekan";
    return bingkai(
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" fill={KERTAS} stroke="currentColor" strokeWidth="1.8" />
        <path d="M3 10h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        {libur ? (
          <rect x="13" y="13" width="5" height="5" rx="1" fill={DAUN} stroke="currentColor" strokeWidth="1.2" />
        ) : (
          <rect x="6" y="13" width="9" height="5" rx="1" fill={DAUN} stroke="currentColor" strokeWidth="1.2" />
        )}
      </>,
    );
  }
  if (k === "malam") {
    return bingkai(
      <>
        <path d="M16 4a8 8 0 1 0 4 12A7 7 0 0 1 16 4Z" fill={MENTEGA} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M2 21h20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </>,
    );
  }
  // Morning low on the left, midday high, afternoon low on the right.
  const posisi = { pagi: [7, 15], siang: [12, 8], sore: [17, 15] }[k as "pagi" | "siang" | "sore"] ?? [12, 12];
  return bingkai(
    <>
      <circle cx={posisi[0]} cy={posisi[1]} r="4.2" fill={EMAS} stroke="currentColor" strokeWidth="1.6" />
      <path d="M2 20h20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </>,
  );
}

/** Yes: a play button. No: a crossed-out screen. */
export function IkonOnline({ k }: { k: "ya" | "tidak" }) {
  return (
    <svg viewBox="0 0 48 40" width="54" height="45" className="absen-ubin-ikon" aria-hidden>
      <rect x="6" y="6" width="38" height="28" rx="3" fill={INK} />
      <rect x="3" y="3" width="38" height="28" rx="3" fill={k === "ya" ? DAUN : KERTAS} stroke={INK} strokeWidth="2.2" />
      {k === "ya" ? (
        <path d="M18 11v12l10-6Z" fill={KERTAS} stroke={INK} strokeWidth="2" strokeLinejoin="round" />
      ) : (
        <path d="M15 11l12 12M27 11 15 23" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
      )}
    </svg>
  );
}
