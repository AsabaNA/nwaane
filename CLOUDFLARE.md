# Running the platform on Cloudflare

The same code runs two ways: on your computer with plain Node (`npm start`, nothing changed) and on Cloudflare. This guide is for the Cloudflare side: first deployment, moving your data, going live, and what to do when something goes wrong.

## How it is built
- A small **Worker** answers every request. Pages, scripts and icons come straight from Cloudflare's edge; everything else goes to one **Durable Object**.
- The **Durable Object** holds the database (SQLite, kept inside the object) and runs the same `app.js` as your local server. All schools live in this one database, exactly as they do locally.
- **R2** (file storage) keeps exam PDFs and the nightly per-school JSON exports.
- A **cron trigger** (every 15 minutes) replaces the timers: cleanups, exam-file expiry, billing refresh and the nightly backup/export.
- PDFs (report cards, badges, receipts, timetables) are built on the Worker with the same code.

## What it costs, and the limits
Prices and limits below are what Cloudflare published when this was built (checked in October 2026). Check the Workers, Durable Objects and R2 pricing pages before you commit.

**The free plan works technically, but its daily allowance of database reads is small.** Free plan, per day (resets at 00:00 UTC, which is 01:00 in Douala): 100,000 requests, 5 million database rows read, 100,000 rows written, 5 GB stored in total. When a daily limit is used up, that kind of operation **fails until the reset**, so the app would stop working in the middle of a school day.

I measured what real actions cost on the Cloudflare runtime (`/__admin/stats` shows the counters):

| Action | Small school (28 pupils) | Large school (1,105 pupils, 61 staff) |
|---|---|---|
| Principal opens the app (home screen) | 5,400 rows read | 100,000 rows read (was 270,000), about 50,000 when opened again within 10 minutes |
| Teacher opens the app | 1,600 rows read | 4,600 rows read (was 31,000) |
| Teacher saves marks for a class of 55 | n/a | 2,600 read, 111 written |
| Record a fee payment | 260 read, 9 written | 2,400 read, 9 written |
| Report card PDF for one class | 470 read | 4,800 read (was 7,600) |
| Report-card overview (all 21 classes) | n/a | 6,000 rows read (was 55,000), 1,300 when repeated |

Rows read grow roughly with school size, and a normal day has many app opens. Rough guide for the free plan: **a pilot with one to three small or medium schools fits; one large school does not** (its principal and teachers alone read more than 5 million rows on an ordinary day). Writes and requests are not the problem; reads are. Some screens (the principal's dashboard, report-card overview) read far more than they need to and can be made cheaper if you want to stay on the free plan longer.

**Workers Paid, about $5 per month, removes the worry:** it includes 25 billion rows read and 50 million rows written per month (about 800 million reads a day), 1 million requests a month then $0.15 per million, and bills extra database storage at $0.20 per GB-month. My advice: start on the free plan for the pilot, and switch to Paid before the first school that pays you, or earlier if the daily limit is ever hit. Switching is a click in the dashboard; nothing in the app changes.

**R2:** the first 10 GB stored is free, and downloads out of R2 are free.

**One database object** handles roughly a thousand simple requests per second and up to 10 GB (Cloudflare's documentation says 1 GB per object on the free plan in one place and 10 GB in another; a large school's database is about 6 MB, so this does not matter yet). That is far beyond dozens of schools. See "When you outgrow it" below.

## Before you start
1. A Cloudflare account with **R2** switched on (it asks for a payment card in the dashboard, even though the first 10 GB is free). Workers Paid is optional at the start; see the costs section above.
2. Node 22 or newer on your computer (you already have it), and the project folder with `npm install` done. That installs `wrangler`, Cloudflare's command-line tool.
3. Optional: a domain whose DNS is managed by Cloudflare, for an address like `app.your-school-platform.com`. Without it you get a free `school-platform.<your-name>.workers.dev` address.

All commands below are for PowerShell, run inside the project folder.

## First deployment
1. **Sign in:** `npx wrangler login` (a browser window opens; approve).
2. **Create the file bucket:** `npx wrangler r2 bucket create school-platform-files`
3. **Deploy:** `npm run cf:deploy`. The first run creates the Worker and the database object and prints your address, like `https://school-platform.<you>.workers.dev`.
4. **Set the secrets.** Each command asks you to paste the value:
   - `npx wrangler secret put ADMIN_KEY -c cloudflare/wrangler.toml`: a long random key that only you know. It guards the data move-in and restore tools. Make one with `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"` and keep it in your password manager.
   - `npx wrangler secret put EMAIL -c cloudflare/wrangler.toml` and `... PASSWORD ...`: your owner sign-in for `/owners` (the password must be at least 12 characters).
   - `npx wrangler secret put RESEND_API_KEY -c cloudflare/wrangler.toml` and `... MAIL_FROM ...`: so password-reset and verification e-mails go out (see Resend, as before).
5. Open the address in a browser. You should see the sign-in page. A new empty platform has no schools yet: either create them from `/owners`, or move your existing data in (next section).

## Moving your existing data in
Do this once for the cutover, and again whenever you want to refresh a test copy.
1. **Stop the local server** (so the database file is not being written to).
2. Run (PowerShell):
   ```
   $env:ADMIN_KEY = "<your ADMIN_KEY>"
   node cloudflare/move-data.js --db school.db --url https://school-platform.<you>.workers.dev
   ```
   It copies every table (photos included) and any exam PDFs from `exams-data`, and prints what it moved. It **replaces** what is on Cloudflare (add `--keep` to merge instead) and only reads your local files.
3. Run the check below.
4. Keep `school.db` and its backups until you are happy; the local copy stays untouched.

## Check that it works
```
npm run cf:smoke -- --url https://school-platform.<you>.workers.dev --code <SCHOOL CODE> --user <principal username> --password <password>
```
It signs in, reads the main screens, builds a report card and a timetable PDF, stores a small file in R2 and reads it back (using a throw-away exam it deletes again), and signs out. Every line should say PASS. Run it after every deployment.

## Going live
1. **Domain (optional but recommended).** Dashboard → Workers & Pages → `school-platform` → Settings → Domains & Routes → Add → Custom domain. Cloudflare creates the certificate for you.
2. **Tell the app its address.** Uncomment `PUBLIC_URL` in `cloudflare/wrangler.toml`, set it to your address, and run `npm run cf:deploy`. QR codes and e-mails use it.
3. **Protect the owners' console** (recommended). `/owners` already needs your e-mail and a long passphrase. For one more lock, put it behind Cloudflare Access (Zero Trust, free for a handful of users): add an application for `your-domain.com/owners*` that allows only your e-mail.
4. **Cutover day:** stop the local server, run the data move, run the smoke test, point schools to the new address, keep the local copy as a fallback for a week.

## Everyday operations
- **Update the platform:** `npm run cf:deploy`. The database is not touched; new columns are added automatically on the first request.
- **Read the logs:** `npm run cf:logs`.
- **Roll back a bad release:** `npx wrangler rollback -c cloudflare/wrangler.toml` goes back to the previous code. It does not undo data changes (see restore below).
- **Try changes locally in the Cloudflare runtime:** copy `cloudflare/.dev.vars.example` to `cloudflare/.dev.vars`, then `npm run cf:dev`. This is a separate local database; move test data into it with `move-data.js --url http://127.0.0.1:8787`.
- **Change a secret:** run the same `wrangler secret put` again.

## Backups and restoring
You have two independent safety nets:
1. **Nightly per-school exports** in the R2 bucket (`exports/school-<id>-<date>.json`, kept 7 days): readable copies of each school's data, owned by you.
2. **Point-in-time recovery, 30 days.** Cloudflare keeps the change history of the whole database. To roll everything back to a moment:
   ```
   node cloudflare/restore-point.js --url https://<your app> --key <ADMIN_KEY> --at 2026-10-24T09:30:00Z
   ```
   Times are UTC (Douala is UTC+1). The tool prints an **undo** bookmark; run it again with `--bookmark <undo>` to return to where you were. Everything moves back together (marks, payments, users, sessions). Exam PDFs in R2 are not touched.
   This feature does not exist in the local test runtime, so **it could not be tested while building this.** Practise it once on a test deployment (deploy under another name, move test data in, change something, restore) before you ever need it for real.

## When you outgrow one database object
All schools share one object, which is simple and fast. If you ever approach its limits (thousands of requests per second, or close to 10 GB), the next step is one object per school plus a small directory object for sign-in lookups. The code already filters everything by school, so this is a contained change, not a rewrite. You will know in good time: the owners' health page shows the database size.

## If something goes wrong
| Symptom | Likely cause and fix |
|---|---|
| `npm run cf:deploy` says the R2 bucket does not exist | Run step 2 of the first deployment. |
| The page loads but sign-in fails with "server" | `npm run cf:logs` while signing in; usually a missing secret (re-run step 4). |
| Owners' sign-in always refused | `EMAIL`/`PASSWORD` secrets missing, or the password is under 12 characters. |
| E-mails do not arrive | `RESEND_API_KEY` or `MAIL_FROM` missing, or the sender domain is not verified at Resend. |
| `move-data.js` says tables are missing | The deployed version is older than your local one: run `npm run cf:deploy` first. |
| `move-data.js` answers 404 | Wrong `ADMIN_KEY` (it deliberately gives no hint). |
| QR codes point to the wrong address | `PUBLIC_URL` not set (see Going live, step 2). |
| A restore says "unsupported" | You are on the local test runtime; restores only work on the real deployment. |

## What was tested while building this
In Cloudflare's runtime on a local machine: sign-in and sessions, every read screen as four roles compared answer-for-answer with the Node server on identical data, a set of writes (payments, marks, timetable generation and apply), photo storage, report-card and badge PDFs, exam files in R2, the cron jobs and nightly export. **Not tested** because they need a real account: the first deployment itself, custom domains, Access, e-mail delivery from Cloudflare, and point-in-time restore.

## AI assistant secret
`wrangler secret put GEMINI_API_KEY` (from the cloudflare folder). The assistant stays off for everybody until the owners' console switch is turned on. No other Cloudflare setting is needed.

## How reads are kept low
Cloudflare bills every row a query scans, so the heaviest screens were measured statement by statement (the Worker can trace this: send `{"reset":true,"trace":true}` to `/__admin/stats`, then read it again to see the top statements). Changes made: indexes for class headcounts, "which sequences have marks" and gate/timetable lookups; a short per-school cache (`core/memo.js`) for the ranking calculation, class averages and the daily lesson set-up, dropped as soon as any successful write goes through and expiring after 2-5 minutes; the dashboard's school-wide average mark refreshes at most every 10 minutes; the report-card overview counts students with marks directly instead of ranking every class. Results are identical to before (the Node-versus-Worker comparison suites are unchanged).
