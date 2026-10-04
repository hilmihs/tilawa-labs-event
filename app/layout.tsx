import { DEFAULT_LANG, dirOf } from "@/lib/i18n/dict";
import type { Metadata, Viewport } from "next";
import { ViewTransition } from "react";
import { Fira_Sans } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { PitaDemo } from "@/components/pita-demo";

// Self-hosted at build time: no runtime request to a font CDN, so the pages still
// render for a phone on mosque wifi that resolves nothing.
//
// The posters' own cuts, taken from the Illustrator package: Fira Sans Light for
// running text and Fira Sans Bold for the headlines. The Arabic is Gali Modern,
// also from the package: Regular for running text and Heavy for the headlines.
const fira = Fira_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-fira",
  display: "swap",
});

const gali = localFont({
  src: [
    { path: "./fonts/GaliModern-Regular.otf", weight: "400", style: "normal" },
    { path: "./fonts/GaliModern-Heavy.otf", weight: "900", style: "normal" },
  ],
  variable: "--font-gali",
  display: "swap",
  // Gali Modern is cut small on its em: its x-height is 0.28 of the size against
  // Fira's 0.53, so at the same px the Arabic read a size and a half below the
  // English. Scaled up in the face itself, so every Arabic size in the app lands
  // right; the poster headlines, which were drawn at Gali's own scale, divide the
  // factor back out in their rtl: sizes.
  declarations: [
    { prop: "size-adjust", value: "135%" },
    /*
     * Arabic letters only. The package's cut carries Latin glyphs that draw nothing,
     * so without this every Latin run on an Arabic page — a participant's name, the
     * the institute-B-0001 number, an email, the "EN" switch — rendered as blank space. With
     * the range set, the browser takes those characters from Fira Sans instead.
     */
    {
      prop: "unicode-range",
      value: "U+0600-06FF, U+0750-077F, U+0870-08FF, U+FB50-FDFF, U+FE70-FEFF, U+200C-200F",
    },
  ],
});

export const metadata: Metadata = {
  title: { default: "Open Lecture · Tilawa Labs", template: "%s · Tilawa Labs" },
  description: "Registration and e-ticket for the open lecture.",
  applicationName: "Tilawa Labs",
  robots: { index: false, follow: false },
  // app/favicon.ico, app/icon.svg and app/apple-icon.svg are picked up by the
  // file convention; these entries just pin the order browsers try them in.
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "48x48" },
    ],
    apple: [{ url: "/apple-icon.svg", type: "image/svg+xml" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#3C542F",
  width: "device-width",
  initialScale: 1,
};

// The demo banner sits above the transition boundary so it never crossfades
// away mid-navigation — it must be on screen on every page, at all times.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // lang/dir are re-stamped per page by AturHtml in [lang]/layout. The value
    // here is what the document ships with before that runs, so it tracks the
    // default locale rather than being pinned to one language.
    <html lang={DEFAULT_LANG} dir={dirOf(DEFAULT_LANG)} className={`${fira.variable} ${gali.variable}`} suppressHydrationWarning>
      <body>
        <PitaDemo />
        {/*
          Every client navigation crossfades instead of cutting. Next runs navigations
          as React transitions, so this boundary animates on its own; the timing lives
          in globals.css under `.halaman`. It sits here, above the [lang] layout, on
          purpose: switching language remounts that layout, and React only animates a
          boundary that stays put above the change — inside the layout it would be
          replaced along with the page and nothing would move. The language switch
          marks <html> with `ganti-bahasa` for the duration (components/lang-switch.tsx),
          which gives the mirrored layouts a slower, fuller crossfade than an ordinary
          page change.
        */}
        <ViewTransition default="halaman">{children}</ViewTransition>
      </body>
    </html>
  );
}
