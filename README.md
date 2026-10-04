# Student Lecture — registration, e-ticket, gate scanning

Registration site for the committee's programmes: a public programme list, a form
and QR e-ticket per programme, scanning at the door, and a committee dashboard. It
started as a single-event site and now serves every programme from one deployment.

Participant-facing text is **English or Arabic only**. There is no third language in
the interface. Staff screens are English.

---

## Stack

Next.js 16 (App Router, `output: "standalone"`) · React 19 · TypeScript strict ·
Drizzle ORM + `pg` · Tailwind v4 · pnpm · vitest · `jose`.

Extra dependencies are limited to `qrcode` (drawing) and `@zxing/browser` (camera).

---

## Local setup

```bash
pnpm install
cp .env.example .env          # fill it in; keep it chmod 600
docker run -d --name nawa-pg -e POSTGRES_PASSWORD=nawa -e POSTGRES_USER=nawa \
  -e POSTGRES_DB=nawa -p 55432:5432 postgres:16-alpine
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Migrations run from a laptop with `DATABASE_URL` in the environment and no Docker —
that is the escape hatch if the server shape turns out not to support
`docker compose run`.

---

## Routes

| Route | Who | What |
|---|---|---|
| `/` | public | Redirects to `/ar` — the site always leads with Arabic; the header switch changes it |
| `/[lang]` | public | Home: renders the nearest public programme's page in place (falls back to the list) |
| `/[lang]/program` | public | Programme list (every programme with `tampil` on) |
| `/[lang]/p/[slug]` | public | Programme page: hero, schedule, venue, house rules |
| `/[lang]/p/[slug]/register` | public | Registration form → redirects straight to the ticket |
| `/[lang]/p/[slug]/ticket` | public | Self-service lookup: WhatsApp number + first four letters of the name |
| `/[lang]/register`, `/[lang]/ticket` | public | Old URLs; redirect to the nearest live **public** programme |
| `/[lang]/ticket/[token]` | public | The e-ticket and its QR (the token names the programme) |
| `/[lang]/ticket/saved` | public | The same ticket drawn from localStorage — works with no network |
| `/[lang]/ticket/[token]/edit` | public | The participant edits their own details, authorised by the same token |
| `/[lang]/daftar-akun`, `/[lang]/masuk` | public | Create an account (WhatsApp + password, email required); sign in |
| `/[lang]/lupa-password`, `/[lang]/reset-password` | public | A 6-digit code emailed to the account's address; the new password signs out other devices |
| `/[lang]/akun`, `/akun/profil`, `/akun/keamanan` | participant | Account home, profile, password / email / verification |
| `/gate` | — | Enter an access code; sets an httpOnly session cookie |
| `/scan` | usher | The scanner. Works with no network. Staff screens take `?acara=<slug>` or remember the picker's choice in the `nawa_acara` cookie |
| `/[lang]/p/[slug]/ots` | public | Walk-in registration: the link shared at the venue; a queue number, no QR until the committee permits |
| `/assist` | usher | Help desk: find someone and mark them in without a QR |
| `/panel` | committee | Dashboard, refreshing every 5s |
| `/panel/ots` | committee | The walk-in queues per side; permit one, several or all against the seats still free |
| `/panel/list` | committee | Every participant, filtered by arrived / gender / walk-in |
| `/print` | committee | A4 black-and-white backup attendance list |
| `/admin` | admin | Programme list; create a new programme (as a draft) |
| `/admin/[slug]` | admin | One programme: status, details, CSV import, deactivate spam |
| `/api/health` | — | Touches the database. `{"ok":true,"db":"ok","versi":…}` |
| `/api/export` | Bearer | Full JSON pull; `?format=csv` for the dashboard button |
| `/api/export/semua` | Bearer | Every programme in one pull; `?status=pendaftaran,berlangsung` to narrow |

Three access codes, never one — `KODE_PETUGAS`, `KODE_PANITIA`, `KODE_ADMIN`.
The usher code will end up in a committee WhatsApp group; that must not open the
participant list. Codes are compared with `timingSafeEqual` and never stored on the
client.

---

## The decisions worth knowing before changing anything

**The QR carries a random 10-character code, not the participant number.** The number
is sequential and printed on every screen; if it were the QR payload, anyone who saw
a screen could draw someone else's ticket.

**`nomor` and `kode` never change once issued.** Participants keep screenshots. The
CSV import updates the soft fields and rewrites neither.

**Participant numbering comes from a locked counter row**
(`UPDATE acara_counter … RETURNING`), not `SELECT max(nomor) + 1`. A broadcast to a
thousand students means dozens of simultaneous submissions. There is a test that
fires 200 at once and asserts 200 distinct numbers with no gaps.

**Attendance is keyed by `peserta_id`.** A second scan can never write a second row;
it reports "already scanned", which is the right answer for an usher, not an error.

**The scanned ticket page stays open.** The screenshot is already in the
participant's gallery, so burning the page burns nothing — while breaking re-entry,
mis-scan recovery, and identifying someone whose phone died.

**The registration door is read from `acara.status`,** never from comparing dates, so
the committee can close early when the hall is full without moving an announced date.

**Everything is bucketed in Asia/Jakarta.** The server is almost certainly UTC. All
date handling lives in `lib/waktu.ts`; do not format dates anywhere else.

**The offline manifest carries four columns only** — code, number, first name,
gender. No WhatsApp numbers, no student numbers, no full names. The phones are
volunteers' personal phones.

**Past the quota, a registration becomes a waiting-list place, not a seat.** Nobody
is turned away — the committee decides who gets in — but the ticket says WAITING LIST
above the QR, and the landing page's button changes to "Join the waiting list". The
count happens inside the insert transaction, so two simultaneous sign-ups cannot both
read "999 taken". Silently issuing seat 1,200 for a 1,000-seat hall is the failure
this prevents.

**The QR payload never leaves over the API.** `/api/export` returns every column
except `kode`, matching what the CSV already did. Anyone holding `EXPORT_TOKEN` could
otherwise mint a working ticket for every participant. The nightly `pg_dump` still has
it, so disaster recovery is unaffected.

**`/api/export` takes `?acara=<slug>`;** without it the endpoint answers for the
nearest live programme — so an external dashboard must pin the slug or it will
silently change programme as events come and go — an unknown slug returns 404, and
`EXPORT_TOKEN` is deployment-wide, not per programme: it can read every programme,
drafts included.

**Registering for a programme creates the account.** The form asks everything once —
profile, email and a password — and on submit it creates the `pengguna` row, signs the
person in, and writes the registration with `pengguna_id` pointing at it. So a
participant leaves with a ticket *and* a way back: their own ticket page, and the next
programme without retyping any of it. Someone already signed in does not see the
account fields; CSV imports still create rows with no account.

**Participant accounts are separate from staff access.** The account cookie is
`nawa_akun` (scope `akun`); staff still use the three codes and `nawa_sesi`, so one
can never be replayed as the other. Passwords are scrypt from `node:crypto` — no
native module, the same code on the server and in CI. Reset and verification codes
are stored only as an HMAC, expire after 10 minutes and burn after 5 wrong tries.
Changing or resetting a password bumps `pengguna.sesi_versi`, which invalidates every
other session. Sign-in and code requests are rate limited per number and per address
through `acara_akses` (`wa_hash`, never the number itself). Email goes through
`lib/email`, through SendGrid's HTTPS API (`SENDGRID_API_KEY`; nawaroom.id is an
authenticated domain in SendGrid, DNS on Cloudflare with the CNAMEs set to "DNS only").
Production always uses SendGrid; locally the driver is `palsu`, which prints the code to
the dev console instead of sending it. /admin has a "Send test email" button, and
/api/health shows the driver and whether the key is present.

**`tiket_dibuka_at` is not recorded on the view that follows registration.**
Registering already lands you on the ticket, so counting that would peg the figure at
100% and warn about nothing. It measures whether people came *back* to their ticket —
which is what predicts a slow queue.

---

## The scanner, and its one honest limitation

`/scan` downloads a manifest into IndexedDB, matches codes locally, queues scans, and
flushes them when the network returns. Late scans keep their `client_scanned_at`, so
the arrival-rate chart stays true across an outage.

Two offline scanners cannot see each other. The same person scanned at two gates
while both are offline will be accepted at both, and it only surfaces at sync. The
scanner says so in the post-sync summary rather than hiding it.

Acceptance test: aeroplane mode, 20 scans, restore the network, everything syncs with
no duplicates.

---

## The offline ticket

`/[lang]/ticket/[token]` saves four fields to localStorage. `/[lang]/ticket/saved` is
a fully static page that redraws the QR from them in the browser — no server call, no
database. A small service worker (`public/sw.js`) precaches that page and falls back
to it when a real ticket page cannot be fetched.

The service worker deliberately never intercepts `/api/*` or any staff route: a
scanner reading a cached response would be worse than a scanner that says it cannot
reach the server.

## Editing, and who is allowed to do it

**Participants edit their own row from their ticket.** The ticket token is already
signed, scoped and only reachable by someone who registered or passed the number +
name lookup — so it is exactly the proof of ownership an edit needs, and self-service
editing costs no new auth story.

`nomor` and `kode` are never touched, **including when the gender changes**. The
gender letter in the number is then allowed to drift: a sister can hold a
`…-B-0042`. That is deliberate. Re-issuing the number would leave her holding a
screenshot that disagrees with the paper list on the one day the system is down,
whereas the drift costs nothing — the gate, the WhatsApp group and the attendance
list all read `gender`, never the letter.

**The WhatsApp number is the one field participants cannot change themselves.** It is
both the identity key and the recovery key; someone who typed it wrong and then edited
it wrong again would be locked out of their own ticket with no way back. The
correction lives in `/admin`, with someone who can ask them to prove who they are.

**"I cannot come" releases the seat.** It sets `konfirmasi = false` and leaves the row
active — not a deletion, and not the spam flag. Seat counts everywhere exclude it, and
the first person on the waiting list is promoted in the same transaction, ordered by
when they registered. The participant can take the seat back if plans change.

**The committee edits the event from `/admin`** — title, speaker, date, times, venue,
address, map, gate names, quota, WhatsApp group links, admin number, house rules,
feedback link, and the schedule. The group links and the admin number used to be
`NEXT_PUBLIC_*` env vars, baked into the client bundle at build time, which meant a
WhatsApp group hitting its 1,024-member cap needed a redeploy. They now live on the
event row, with env as a fallback so an unedited deployment still works.

`slug` and `prefiks_nomor` are deliberately not editable: both are baked into numbers
already issued and links already sent. `status` keeps its own separate control so that
opening or closing registration is never a side effect of fixing a typo.

### Programmes

One deployment serves every programme. `acara` is the programme table; the public
list is `/<lang>`, a programme lives at `/<lang>/p/<slug>`, and its registration
form and ticket lookup sit under that path. Staff screens show the programme chosen
in the header picker (cookie `nawa_acara`), or `?acara=<slug>` on the URL, or the
nearest live programme when nothing was chosen. `ACARA_SLUG` is only used by
`pnpm db:seed`.

## Filling in the venue map

`/admin` has three separate map fields, and they do different jobs:

- **Map link** — the URL behind the "Open in maps" button. A plain Google Maps link
  is right here.
- **Site plan image URL** — an image, shown on the landing page. This is the one
  worth doing: the question on the morning is "which one is the north gate", not
  "where is Jakarta", and a plan the committee drew answers it. Any reachable URL
  works; a file dropped into `public/` and referenced as `/denah.jpg` works too, and
  keeps it on our own domain.
- **Embed URL** — the fallback when a plain locator map is enough. Two sources need
  no account and no API key:
  - Google Maps: open the place, Share → Embed a map, copy the `src` from the
    iframe (it ends in `&output=embed`).
  - OpenStreetMap: openstreetmap.org → Share → HTML, copy the `src`
    (`.../export/embed.html?bbox=…&marker=…`).

The image wins over the embed when both are set, and the placeholder only shows while
neither is.

Note that an embed loads a third party on the landing page and will not render for
someone offline. The image does neither.

## Rate limits, and why they are in tens

`/daftar` and `/tiket` are the only public endpoints touching the data of a thousand
people, so both are limited per address: **30 registrations per IP per hour** and
**20 failed lookups per IP per ten minutes**, both overridable by env.

They are tens rather than a handful on purpose. A campus sits behind one NAT, so a
low limit refuses genuine sign-ups long before it refuses a flood — and the IP limit
was never the real defence. `unique(acara_id, wa)` is: every registration needs a
distinct WhatsApp number, so nobody fills the table by pressing submit repeatedly.
The limit is there to stop a script, and tens per hour stops a script.

Two details that make the limits behave: the attempt the limiter itself rejects is
never logged (otherwise the rolling window slides forward on each retry and locks the
visitor out permanently), and failed lookups are deduplicated per (address, last four
digits) so the ticket page's own retry loop cannot spend the budget on one person.

## Known gaps, deliberately not built

These are product decisions, not oversights. They are listed so nobody assumes they
exist:

- **No outbound H-3 confirmation.** `konfirmasi` is now written by the participant's
  own "I cannot come", but nothing *asks* them — that still needs a broadcast plan.
- **`acara_panitia` is unused.** Created early on purpose so that filling it in later
  does not touch a table holding live data.
- **No calendar (.ics) download.**
- **The speaker has no view of their own.** There is no lecturer-facing screen —
  registration, scanning and the dashboard are all the committee's.

## Tests

```bash
pnpm test
```

Six things are covered, because they are the six failures that will actually happen:

1. `normalizePhone` over real-world input, including what must return `null`
2. 200 concurrent registrations → 200 distinct numbers
3. The same CSV imported twice → no new rows, no rewritten ticket codes
4. `verifyTiketToken` rejects bad signature, expiry, wrong scope, malformed claims
5. A second scan → already-scanned, not an error, not a second row
6. Five-minute buckets computed in WIB, not UTC

---

## Deploy

A free test copy for letting people try it is a separate, simpler path —
see `DEPLOY-TEST.md`. What follows is the deployment for the event itself.

Designed for a VM running `docker compose`. That shape runs identically on an App
Service or on Container Apps and moves to another VPS in ten minutes.

```bash
# on the server, once
mkdir -p /srv/nawa && cd /srv/nawa
# put .env here, chmod 600, and docker-compose.yml alongside it
```

`azure-pipelines.yml` does: install → test (a failing test cancels the deploy) →
build → push a versioned image → SSH → pull → migrate → restart → check
`/api/health` for `"db":"ok"` → roll back if it is not.

Four rules the pipeline follows, each for a reason that has already bitten someone:

- **`DATABASE_URL` never enters a variable group.** It lives in `/srv/nawa/.env`,
  `chmod 600`. Anyone who can edit a pipeline can read a variable group.
- **Never push `latest`.** The next `docker compose pull` would silently undo a
  rollback.
- **Record the running tag before swapping,** not while rolling back. `docker image
  prune` may already have removed it — exactly when it is needed.
- **Prune only images older than a week** (`--filter "until=168h"`), so a rollback
  target still exists.

Two Dockerfile traps are handled explicitly: `ARG` is paired with `ENV` (without it
every `NEXT_PUBLIC_*` is empty in the client bundle and the WhatsApp buttons do
nothing), and migrations run from a separate `migrator` stage with a whole
`node_modules` (copying `node_modules/.bin/drizzle-kit` copies a symlink without its
package). Test both on the *first* deploy, not the night before the event.

Daily backup: `scripts/backup.sh`, via cron. It writes a `pg_dump` and, separately, a
JSON pull from `/api/export` — if Postgres itself is what broke, the JSON still opens.

---

## If the schedule slips

If the site is not live with HTTPS on the day registration was meant to open, **open
a Google Form that night** with a "your e-ticket will follow" confirmation, and import
the CSV through `/admin` once the site is up. `/admin` is the schedule-recovery
bridge, not an optional extra — the import is idempotent precisely so it can be run
repeatedly as the form fills.

---

## Placeholders still to fill

- `public/brand/nawa-lockup.svg` and `components/wordmark.tsx` hold a **placeholder
  wordmark**. Drop in the real NAWA lockup.
- `NEXT_PUBLIC_WA_ADMIN`, `NEXT_PUBLIC_WA_GRUP_IKHWAN`, `NEXT_PUBLIC_WA_GRUP_AKHWAT`
  are empty in `.env.example`.
- The venue map on the landing page is a placeholder until one of the two map fields
  in `/admin` is filled. See "Filling in the venue map" below.
- `tatib_url` (house rules) is `null` in the seed — the checkbox renders without a
  link until it is set.
