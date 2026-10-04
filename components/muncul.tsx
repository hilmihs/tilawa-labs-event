"use client";

import { useEffect, useRef } from "react";

/**
 * Reveals its children as they scroll into view.
 *
 * Three rules it will not break:
 *
 * 1. The server renders the content visible. Hiding only happens in JavaScript,
 *    after this mounts. A phone that fails to run the bundle — or a search engine,
 *    or Reader mode — sees the whole page, never a blank one. An animation is not
 *    worth risking the content for.
 *
 * 2. It only hides what is already below the fold. Anything on screen at load stays
 *    on screen; otherwise the page would visibly blink as JavaScript catches up.
 *
 * 3. `prefers-reduced-motion` skips the whole thing. Someone who has asked their
 *    device for less movement has asked for a reason.
 */
export function Muncul({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    // Already in view at load: leave it exactly as the server drew it.
    if (el.getBoundingClientRect().top < window.innerHeight * 0.85) return;

    el.classList.add("akan-muncul");
    const io = new IntersectionObserver(
      ([masuk]) => {
        if (!masuk.isIntersecting) return;
        el.classList.add("sudah-muncul");
        io.disconnect();
      },
      // A little inset from the bottom, so it starts once the block is properly
      // on screen rather than the instant its first pixel appears.
      { threshold: 0.1, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={className} style={delay ? { transitionDelay: `${delay}ms` } : undefined}>
      {children}
    </div>
  );
}
