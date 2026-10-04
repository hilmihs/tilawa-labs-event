/*
 * A deliberately small service worker. It exists for one situation: a participant
 * standing in the car park with a thousand other phones on one cell tower, opening
 * the link to their ticket.
 *
 * It caches the offline ticket page and nothing else that matters. It never caches
 * a real ticket response — those are per-person and change when someone is scanned —
 * and it never touches the API or the staff routes, which must always be live — with
 * one exception: the gate scanner, which falls back to a kept copy of itself when
 * there is no network, because scanning offline is its job.
 */
const CACHE = "nawa-v2";
const SHELL = ["/en/ticket/saved", "/ar/ticket/saved", "/icon.svg"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(SHELL))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((k) => Promise.all(k.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

/*
 * The scanner asks for its own page and the code it loaded to be kept, once it is
 * open and online. A gate phone that reloads the scanner after the network is gone
 * then still gets a working scanner and its offline list, instead of a browser error.
 */
self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data || data.jenis !== "simpan-halaman") return;
  const halaman = typeof data.halaman === "string" && data.halaman.startsWith("/scan") ? data.halaman : null;
  const aset = Array.isArray(data.aset)
    ? data.aset.filter((a) => typeof a === "string" && a.startsWith("/_next/static/"))
    : [];
  event.waitUntil(
    caches.open(CACHE).then((c) =>
      Promise.all(
        [...(halaman ? [halaman] : []), ...aset].map((u) =>
          fetch(u, { credentials: "same-origin" })
            .then((res) => {
              // A redirect means the session is gone: that is the login page, not the scanner.
              if (res.ok && !res.redirected) return c.put(u, res);
            })
            .catch(() => {}),
        ),
      ),
    ),
  );
});

function offlineTicketUrl(url) {
  const lang = url.pathname.startsWith("/ar/") ? "ar" : "en";
  return `/${lang}/ticket/saved`;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // The scanner: always live when there is a network, the kept copy when there is
  // not. The copy holds no participant data — that lives in the scanner's own store.
  if (url.pathname.startsWith("/scan") && request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches
          .match(request, { ignoreSearch: false })
          .then((hit) => hit ?? caches.match(request, { ignoreSearch: true }))
          .then((hit) => hit ?? Response.error()),
      ),
    );
    return;
  }

  // Never intercept the API or anything a member of staff relies on being current.
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/scan") ||
    url.pathname.startsWith("/panel") ||
    url.pathname.startsWith("/admin") ||
    url.pathname.startsWith("/assist") ||
    url.pathname.startsWith("/walk-in") ||
    url.pathname.startsWith("/print") ||
    url.pathname.startsWith("/gate")
  ) {
    return;
  }

  // Build output is content-hashed, so it is safe to serve from cache first.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ??
          fetch(request).then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(request, copy));
            return res;
          }),
      ),
    );
    return;
  }

  // Keep the offline page itself fresh when there is a network, fall back when not.
  if (/\/(en|ar)\/ticket\/saved$/.test(url.pathname)) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy));
          return res;
        })
        .catch(() => caches.match(request).then((hit) => hit ?? Response.error())),
    );
    return;
  }

  // A real ticket page: always try the network — it is the only thing that knows
  // whether this person has already been scanned. If it cannot be reached, hand
  // over the saved copy rather than a browser error page.
  if (/\/(en|ar)\/ticket\//.test(url.pathname) && request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches
          .match(offlineTicketUrl(url))
          .then((hit) => hit ?? caches.match("/en/ticket/saved"))
          .then((hit) => hit ?? Response.error()),
      ),
    );
  }
});
