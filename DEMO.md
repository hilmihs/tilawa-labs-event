# Demo build — Tilawa Labs

**Live:** https://tilawa-labs-event.vercel.app
Vercel project `tilawa-labs-event` · Neon project `tilawa-labs-demo`, database `nawa`
(Singapore). Resets nightly at 19:00 UTC / 02:00 WIB.

This branch exists only to be deployed as a public demo. It must never be merged
back into `main`.

## What was changed, and why

| Change | Reason |
|---|---|
| `components/logo.tsx` rewritten, `components/logo-paths.ts` deleted | The production logo is the client's registered mark, drawn from their brand sheet. A demo may describe the software; it may not carry someone's identity. Same props and the **same three viewBoxes**, so no layout moved. |
| ~151 display strings neutralised across 44 files | Organisation, speaker, venue and institute names replaced with placeholders. **Field names were not touched** (`status_lipia`, `lipia`): they are schema, never reach a screen, and renaming a column would cascade through migrations and tests for nothing. |
| `db/seed-demo.ts` added | Deterministic synthetic data: 148 registrations, ~62% scanned in. Every number is in the reserved `62899…` test range. |
| `app/api/demo/reset/route.ts` added | Nightly wipe-and-reseed. 404s unless `DEMO_MODE=1`, and requires `DEMO_RESET_TOKEN`. |
| `components/pita-demo.tsx` added | Banner on every page: states the data is synthetic and prints the staff access codes, so a visitor can actually reach the staff screens. |
| `vercel.json` added | Daily cron at 19:00 UTC (02:00 WIB). Vercel Hobby allows one run per day, which is exactly the budget. |

## Two traps the first attempt fell into

Both were caught by looking at the rendered page, not by the type-checker.

**The logo's aspect ratios are load-bearing.** Callers size the logo by height
alone and let the ratio decide the width, inside flex rows that will happily
squash an SVG asking for more room than the real mark did. The first version
invented its own ratios and the header logo came out crushed. The viewBoxes in
`logo.tsx` are copied from the brand sheet's own geometry — `LOCKUP 814.9×447.6`,
`MARK 235.3²`, `WORD 561.6×194.2` — and must stay that way even though nothing
of the original artwork remains.

**`dir="rtl"` inherits into SVG text.** Half this site renders right-to-left, and
inside an RTL subtree `x` becomes the run's *right* edge, so the wordmark laid
itself out leftwards and off the viewBox. A latin wordmark is latin in both
directions, so `direction="ltr"` and `text-anchor: start` are pinned on the text
element itself rather than at each call site.

## Notes

`lib/acara/jenis-sekolah.ts` keeps `lipia` as one keyword among many in the
school-type detector. It is a heuristic over what registrants type, it is never
rendered, and dropping it would only make the detector worse.

## Before deploying — the seal

A public demo prints its own credentials, so it must be unable to do harm.
Confirm all of these in the Vercel project's environment variables:

- `EMAIL_DRIVER=palsu` and **no** `SENDGRID_API_KEY` at all. This is the only
  component in the app that can send anything to a real person.
- `DATABASE_URL` points at the demo Neon database and nothing else.
- `AUTH_SECRET`, `IP_SALT`, `EXPORT_TOKEN` are freshly generated — never reused
  from production.
- `KODE_PETUGAS` / `KODE_PANITIA` / `KODE_ADMIN` match the codes printed in
  `components/pita-demo.tsx`.
- `DEMO_MODE=1`, `NEXT_PUBLIC_DEMO=1`, and `DEMO_RESET_TOKEN` set to the same
  value as `CRON_SECRET`.

## Verified on the live deployment

- `/api/health` reports `db: ok`, `lengkap: true`, `email.driver: palsu`,
  `kunciSendgrid: false`.
- `/api/demo/reset` returns 401 with no token and with a wrong token; 200 with the
  real one.
- `vercel crons ls` shows `/api/demo/reset` on `0 19 * * *`.
- Registration, ticket lookup (WhatsApp number + first four letters) and the
  committee dashboard all work against seeded data.

## A note on Vercel env vars

This project stores every variable as *sensitive*, so `vercel env pull` returns
empty strings for all of them — including ones you just wrote. That is a read-back
limitation, not a failed write; do not "fix" it by re-adding the variables. The
only way to confirm a value landed is `/api/health` on a deployment.

## Deploying

```bash
# from this worktree
vercel link          # create a new project; do NOT reuse a production project
vercel env add       # add each variable above, Production scope
vercel --prod
```

Then seed once:

```bash
curl -X POST https://<deployment>/api/demo/reset \
  -H "Authorization: Bearer $DEMO_RESET_TOKEN"
```

## Keeping it current

`main` moves. To pick up its changes:

```bash
git fetch hilmihs
git rebase hilmihs/main
pnpm test          # the suite catches most neutralisation regressions
```

The replacement that broke a test the first time was a *test fixture* —
`jenisSekolah("LIPIA MEDAN")` is input to the detector, not copy. If a rebase
reintroduces it, leave it as it is.
