# School platform — Phases 0–1
npm install && npm start → http://localhost:3000
1. "New school? Start free" creates a school (3-month trial) + its principal. Note the school code.
2. Principal adds classes and staff (Classes / Staff menus). Staff log in with school code + username + password.
3. Secretary/principal register students, search, print class lists. FR/EN switch in the header.
After the trial, a school is blocked until `paid_until` is set in the `schools` table (billing comes in Phase 5).

## Phase 2
Principal → "Subjects & teachers": add subjects (with coefficient) per class and assign a teacher to each.
Teacher → "Enter marks": pick class/subject and sequence, enter marks /20, Save (draft) or Submit. Every mark change is logged.

## Demo data
`npm run seed` creates a demo school (code DEMO01) with users, classes, students, subjects and marks. All passwords: 12345678.

## Phase 3 — report cards
- Principal → Settings: school name, header text (one line per row), school year, sequences per term (1–4 for each of the 3 terms).
- Principal/Secretary → Report cards: pick class + term. Publishing is blocked while any mark is missing; once published, marks for that term are locked and each student gets a verification code.
- Download one card or the whole class as PDF (in the language currently selected). Public check page: /verify.html
- Averages: sequence avg = Σ(mark×coef)/Σcoef; term avg = mean of that term's sequence averages; Term 3 cards also show the annual average (mean of the 3 term averages).
After updating, run `npm install` then `npm run seed` again (the demo school is rebuilt with the new structure).

## Phase 3b — class heads, lists, staff management (version 3b)
- Principal → Classes: assign a class head teacher (a teacher can head several classes). Heads can enter marks for every subject of their class and see that class's list with overall averages.
- Students / class lists: whole school or one class; sort by name, sex, matricule, average (any sequence or term; default = latest sequence with marks, or the term average once published), class; ascending/descending; search; print.
- Teachers → "My student lists": per subject, sorted by name/sex/matricule/their own subject's mark. Teachers never see overall averages (only class heads, for their own class).
- Principal → Staff: edit name/role/password, delete (history is kept; the username becomes reusable).
- Speed: database indexes added; re-saving unchanged marks no longer writes anything.
After updating: `npm install`, then `npm run seed` (rebuilds the demo school), then `npm start`.

## Phase 4 — timetable, teacher presence, hours & pay (version 4)
**Setup:** `npm install`, `npm run seed` (rebuilds DEMO01 with a timetable and a month of attendance), `npm start`.
For QR codes to work on phones, set the public address the phones can reach, e.g. `PUBLIC_URL=https://yourschool.example npm start` (on localhost the printed QR only works on the same computer).

- **Timetable (principal):** Timetable → Day structure (start time, school days, periods and breaks of any length, QR window, spot checks per day). Classes tab: pick a subject per cell; a teacher already teaching another class at that time is refused, a teacher marked unavailable asks for confirmation. Changes apply **from the chosen date onward**; earlier days keep the old timetable. Days off tab: holidays/strikes. Print per class, per teacher, all classes, all teachers.
- **Class QR codes:** Classes page → PDF per class (or all). Reset a code if a photo leaks.
- **Daily presence:** the surveillant (or any staff with "can do the daily gate check-in") taps *Arrived* for each teacher on the **Today** screen. Only then can that teacher scan the class QR; scanning confirms the current lesson (on time / late by the school's window). A different teacher scanning becomes a *replacement* that the principal/surveillant approves. Rounds: Today also lets staff mark Present/Late/Absent/Replaced by hand. Random spot checks ask staff to go and look at a few confirmed lessons.
- **Hours & pay (principal):** monthly table per teacher, exceptions to resolve (not confirmed, replacements, failed spot checks, entries made afterwards), bulk resolve with a recorded reason, per-teacher pay rate per period with effective dates, **Approve and lock** the month, pay-sheet PDF. Teachers see their own timetable and hours. The surveillant sees hours without money.
- **Sessions:** teachers stay signed in 60 days (so QR is one tap), office staff 24 hours.
- **Demo clock:** DEMO01 runs on a settable clock (yellow bar), starting Mon 5 Oct 2026 08:52 so you can test lessons at any hour.
- Not unlockable from the screen: an approved month (by design — it is the pay record).

## Phase 5 — school fees (version 5)
- **Fee setup (principal):** Fees → Fee setup: amount per class for each of the 3 terms (or the same for all classes). Per-student discount per term (Collect → open a student).
- **Collect (principal, secretary):** pick a term, search a student, record a payment (cash / MTN MoMo / Orange Money / bank / other, reference, date). Each payment gets a numbered receipt (PDF, in the language selected). Payments cannot be edited; the principal can cancel one with a reason (it stays visible, struck through).
- **How balances work:** fees fall due term by term; a payment goes to the oldest unpaid term first. "Balance for term N" = everything due up to the end of term N minus everything paid. So a family can pay in as many installments as they like.
- **Owing list:** per class and term, sortable, with parent phone, only-owing filter, printable.
- **Report cards:** Fees → Fee setup → Report cards: print for everyone, or only for students who are paid up to that term. Held-back cards are flagged in Report cards; the principal can allow a single card (with a reason) from the student's page.
- **Teacher hours (Phase 4 follow-up):** Hours & pay → checkbox to let teachers see their estimated pay, or hours only. Day structure now shows the clock time next to each lesson/break.
After updating: `npm install`, `npm run seed`, `npm start`.

## Redesign step 1a — sign-in and create-school (Meridian look)
New fonts (public/fonts, ~65 KB), colour/type tokens (`--m-*` in public/style.css) and the new sign-in / create-school screens, in English and French. The rest of the app keeps its previous look until steps 1b and 1c.

## Redesign step 1b — app frame
After sign-in the old blue header is replaced by the Meridian frame (`public/frame.js` + the `fr-*` block at the end of `style.css`):
- **Sidebar** (dark): logo, menu grouped by role (People / Marks / Academics / Time / Money / School), user block with initials and Log out. Collapses to icons on desktop (remembered in the browser); on screens under 1024 px it becomes a drawer opened from the top-bar menu button (closes on Esc, on the dark backdrop, or after choosing a page).
- **Top bar**: school name / current page, EN | FR switch, avatar on phones. Switching language keeps you on the same page.
- Which items each role sees is unchanged (still decided by `menuOf()`); the landing page is the first item of the first group (surveillant: Today).
- Legacy pages render unchanged inside the frame; they get the new look in step 1c and steps 2–10.

## Redesign step 1c — shared parts
All old screens now use the Meridian look without any layout change (block at the end of `public/style.css`, scoped to the app frame so the QR page and PDFs are untouched):
- Buttons: primary (brand blue), tab (`.big.tab`, dark when `.on`), secondary (`.sb`); attendance toggles keep their green/amber/red/blue states.
- Fields: 48 px, thin border, brand focus ring, uppercase small labels; checkboxes use the brand colour.
- Tables: mono uppercase header row, light row lines, hover on clickable rows. Notices (`.box`, `.ok`, `.bad`, `.warn`), chips (`.chip`, `.chip.ok/.bad/.warn/.info`), stat tiles (`.tiles`) and empty states (`.empty`).
- Print: buttons, tabs and the frame are hidden; tables print plain.

## Redesign step 2 — public phone pages
`public/class.html` (QR check-in) and `public/verify.html` (report-card verification) use the Meridian look: dark class header, one large confirm button, a clear title + next step for each of the twelve states, EN|FR switch. The QR info endpoint now also returns `arrived` (gate time) and `until` (end of the on-time window) so the page can show them.

## Redesign step 3 — shared pieces + dashboard
- `public/ui.js`: `seg()` segmented control (Fees, Timetable, Report-card terms), `sortTh()`/`sortTo()`/`cmpV()` column-header sort arrows (first click A→Z, second Z→A; sort dropdowns removed from the student/class/subject lists and the fees owing list), `mkChip()` mark chips (≥10 green, 8–10 amber, <8 red).
- `dash.js` + `GET /api/dashboard` (principal, secretary): stat cards, today's timetable with status chips (Now & next / Needs attention / All), action queue, quick actions. Principal lands on the Dashboard.
- `public/dash.js`: client page; adds the Dashboard menu item under a new "Overview" group.

## Redesign step 4 — Students + Registration
- Students/class list: search, class, term-average selectors and Print on one toolbar; "directory" card with boys/girls and total chip; coloured average chips; arrow sorting.
- Register a student: two-column form (required asterisks, class placeholder, Cancel), side card showing the next matricule (`GET /api/students/next`); form clears after a successful registration and the next number updates.

## Redesign step 5 — School setup
- Staff: search + role filter + "Add staff member" toolbar, sortable table with Gate-access/Active chips, icon edit/delete buttons, add/edit form as a card.
- Classes: card grid (name, student count, class-head select, QR PDF / Link / New code), search, "Print QR codes for all classes", Add class panel. `/api/classes` now returns `n` (active students).
- Subjects & teachers: class selector + Add subject toolbar, table with a Schedule-check chip per subject (no teacher = red, timetable clashes = red, availability warnings = amber, none = green). `/api/subjects` now returns `clash` and `unavail` counts for the assigned teacher.

## Redesign step 6 — Enter marks + teacher workspace
- Enter marks: subject/sequence selectors with a status chip (Draft n/N / Submitted / Published·locked), marks table with coloured appreciation chips (≥14 green, 10–14 blue, 8–10 amber, <8 red), live summary tiles (entered, average, highest, below 10), Save draft + Submit marks (marks stay saved-as-typed; editable until the term is published).
- Teacher workspace (`vWork`, new landing for teachers): profile card with check-in chip and lesson count, "My day" with times and status chips, month hours tiles, quick actions. `/api/mytimetable` now also returns `in_at`.

## Redesign step 7 — Report cards
- Class selector + term segmented control + "Download all" (when published). Status banner: blocked (amber, "N marks missing across K subjects", Show incomplete only), ready (green, Publish), published (green).
- Table: sortable student/completeness/average/rank/annual, Complete / "n missing" chips, mark chips, per-student PDF button, "Held" chip for unpaid fees. `/api/report` now also returns `msub` (subjects with missing marks).

## Redesign step 8 — Today + Hours & pay
- Today: summary cards (teachers arrived, lessons confirmed, spot checks, replacements to approve), spot-check and replacement boxes kept with coloured Seen / Not there / Approve / Reject buttons, gate list (avatar, Arrived/Left chips and buttons; late-not-arrived rows tinted red), lessons list with period + time range under each period, current period highlighted, coloured status chips and Present / Late / Absent buttons, Started / All day segmented control.
- Hours & pay: month, Pay sheet PDF and pay-visibility toggle on the toolbar, status chip (exceptions unresolved / locked), cards (paid periods, estimated payroll, exceptions), sortable teacher table with colour chips, approve-and-lock footer, exceptions list with coloured action buttons, rates card.
- Sidebar counters on Today (spot checks + replacements awaiting) and Hours & pay (unresolved exceptions) via `GET /api/badges`.

## Redesign step 9 — Timetable + Settings
- Timetable: page subtitle, segmented tabs, toolbar (class/teacher select, "applies from" date, print buttons), grid in a card with period number + time range, break strips, today's column highlighted; day structure split into "Day timing" (weekday toggle chips) and "Periods and breaks" (rows with icon buttons); availability and days-off in cards. Shared `grid()` also restyles "My timetable".
- Settings: School identity + Academic calendar cards with "Term n sequences" selects, live report-header preview (updates as you type), Save settings.
- Day-structure save message now stays visible after saving.

## Phase 6a — Plans, free term and billing
- `billing.js`: price engine (Reports/Fees/Teacher tracking, new price list from phase 7a, no minimum per term), term calendar (per-school dates in Settings), free term at sign-up (rest of registration term; next term too if <4 weeks remain), peak usage per term, draft/sent/paid invoices, numbered receipts, status free → due → overdue → read-only (14 days after due).
- Read-only: GETs, printing and report-card publishing keep working; other writes return 402 `readonly`. A school's modules (`schools.modules`) hide menus and block routes (`403 module`).
- Page "Plan & billing" (principal), banners, dashboard alerts, term dates in Settings.
- Not yet: invoices stay drafts until the owners' console (6b) sends them; no payment gateway; the "registrations deleted within 7 days" rule is not applied.

## People lists (phone pattern) and expandable classes
- `public/lists.js` (loaded last): `av()` photo placeholder (swap this one function when real photos arrive); `mobilize()` turns any rendered people table into the phone list (No | photo | details | value) and adds the placeholder to the desktop table; used by students/class lists, staff, report cards, fees (collect + owing) and hours.
- Class and subject lists: phone sort bar ("Sort by" dropdown + Download list), search, class buttons row, header labels No / Student details / "Showing average for" (tap to pick sequence or term average). "Download list" opens the print dialog (save as PDF).
- Classes: a card opens into its class list; the other classes become a row of buttons below the search bar; "All classes" returns to the grid. Head teacher and QR controls sit under "Class settings" on phones.

## Phase 6b — Owners' console
- Open `/owners` (separate page, cookie and API at `/owners/api`). Sign in with the `EMAIL` and `PASSWORD` in `.env` (copy `.env.example`; env vars also work). There is a single Owner account, no 2-step code for now. Hardening this is the last step of the plan.
- Roles: Owner (everything), Finance (money, invoices, reminders, prices view; no school actions, no price edits), Support (schools only, no money fields at all).
- Screens: Money home (counts, estimated/invoiced/collected/outstanding, needs-action list, schools table), Schools registry and profile (extend free term, change modules, read-only, reactivate, cancel, discount, price lock, private notes; each needs a reason), Invoices (adjust draft, send, record partial payments with reference, numbered receipts REC-00001, credit notes CN-00001, PDFs), Reminders (prepared WhatsApp messages EN/FR, logged when sent), Prices (changes start next term; founding-school lock freezes a school's list), exports (invoices CSV, payments CSV, PDF summary), Activity log.
- The activity log is append-only (SQLite triggers refuse UPDATE/DELETE) and hash-chained; the page shows whether the chain is intact.
- Schools can download their own invoice and receipt PDFs from "Plan & billing". Manual read-only shows its own banner; a cancelled school cannot sign in.
- Signup now asks for an optional WhatsApp number and city (shown in the registry, used for reminder links).
- Env: `BILLING_NAME`, `PAY_TEXT` customise the invoice header and payment instructions.

## Phase 6c — Usage, support mode, reset links, announcements
- **Usage** (owners' console): per school last sign-in, active users in 7 days, students, marks entered this term (a number), report cards published; an at-risk list (signed up 7+ days with no students; free term ending within 14 days with fewer than 5 students or no marks).
- **Health**: database size, last backup, saved changes per day, errors (route and error type only, no personal data). `backup.js` makes a nightly `VACUUM INTO` copy in `backups/` (last 7 kept); owners can back up on demand. D1 limits shown are from memory: verify before launch. The off-site Cloudflare export comes in 6e.
- **Support mode**: the principal switches on "Support access" in Settings (24 hours; can be switched off at any time, which ends open sessions). Owner/Support roles can then open the school read-only (max 4 hours per session), with a reason that is logged. The school sees every session (who, when, pages viewed, areas). Writes return 403. Use a private window: the link replaces the browser's school sign-in.
- **Password reset**: owners create a one-time 24-hour link for the principal (shown on the school profile, with a prepared WhatsApp message). Owners never see or set a password. `/reset` page.
- **Announcements**: owners publish a banner (EN/FR, info or warning, from/until dates); schools can dismiss it for the session.

## Phase 6e — Cloudflare readiness
- `pwhash.js`: PBKDF2-SHA256 (100k iterations, same code path as Web Crypto on Workers). Old scrypt hashes still verify and are upgraded at the next login. The `.env` owner password is hashed the same way.
- `export.js`: per-school JSON export (no password hashes, no tokens). Written every night for all schools into `exports/` (7 days kept), `node export.js [id|all]`, and a "Download school data (JSON)" button on each school in the console.
- `cloudflare/make-d1.js` → `schema.sql` (empty tables) and `data.sql` (everything, to move a live database into D1). `cloudflare/wrangler.toml` is the config template.
- `CLOUDFLARE.md`: what changes, in what order, what it costs, and the exact commands to run on your account. Deployment itself needs your Cloudflare login, so it is not done here.

## Phase 6d — Installable app + WhatsApp share
- `manifest.webmanifest`, `sw.js`, `pwa.js`, `icons/`: the platform installs to the home screen (Android install prompt, iPhone "Add to Home Screen" hint), opens full-screen, and shows an "offline" notice. The service worker never caches `/api`, `/owners`, `/support`, `/reset` or `/c/`, so data is always live.
- Report cards: each published, non-held student row has a **WhatsApp** button that opens a pre-written EN/FR message to the guardian's number with the card's verify link (`/verify.html?code=…`). 9-digit numbers starting with 6 get +237. Students without a number show "No number". Cards held for unpaid fees are not shareable. Endpoint: `GET /api/report/share?class_id&term` (principal/secretary).

## Co-teachers per sequence
- A subject keeps one main teacher (used by the timetable and hours). On Subjects & teachers, "Different teachers by sequence" lets the principal give any sequence to another teacher (table `subject_seq`). A sequence given to a teacher is entered by that teacher alone; the others get it read-only; sequences left on "Main teacher" behave as before. The class head can always enter marks.
- Averages, ranks, completeness and report cards are unchanged (the term average is still the mean of the sequences). The server refuses mark saves from a teacher who doesn't own that sequence (403).

## UI notes round 1 — people lists and class cards
- One pattern for Students, Classes and a teacher's lists: page header with the class pills beside the title ("All classes"/"Whole school" is a pill like the others), then a card with header (name, head teacher, boys/girls, total, Print QR code, close), a toolbar (search, average of…, Print list) and the list. On phones the sort control sits in the list header ("Name A–Z ⌄") next to "Showing average for ⌄", and the sort bar is gone.
- Class cards: students | boys | girls, Class / Top / Bottom average for the latest sequence with marks, with a green ▲ / red ▼ for the change since the previous sequence (no arrow when there is nothing to compare), head teacher select, Print class list (opens the list and the print dialog), Print QR code, and a small "QR link · New code" line. New endpoint `GET /api/classes/stats`; `/api/classes` now also returns the head teacher's name.

## UI notes round 2 — subjects & teachers, list hierarchy
- Subjects & teachers: columns Subject | Coef | Teachers (status column removed). Each subject shows its teachers as chips (photo placeholder + name; a small "Seq n" tag when the teacher only takes some sequences) and an **Add a teacher** button. The dialog picks a teacher and either "Main teacher" (all sequences not given to others) or "Only some sequences" (tick sequences; ones already owned show who has them). Clicking a chip opens a small overlay: username, phone, what they teach, this month's presence (rate, present, late, absent, scheduled, days at school, last month, last seen) and "Remove from <subject>". New endpoints: `POST /api/subjects/team`, `POST /api/subjects/team/remove`, `GET /api/teacher/card`. `/api/subjects` returns `team`.
- People lists hierarchy: tinted class header band (name, head teacher, coloured boys / girls / total chips, one Print button), neutral toolbar, tinted column header, soft zebra rows, avatar tint by sex, bold average chips. Colour is used only where it carries meaning.

## UI notes round 3 — list card (phone mockup) and printed sheets
- List card follows the phone mockup: `FORM 3A | Head Teacher: …` (+ X back to the cards, only on the Classes page), `Boys 5 · Girls 7`, total pill, **Print Class List**, search, **Print Current List** (+ **Print QR Code** on the same line), then `NO | Name A–Z ⌄ | Term 2 - SQ4 ⌄`. The average dropdown shows the short label closed and the full text ("Term 2 - Sequence 4", "Term 1 - Final Average") when opened. French: "Trim. 2 - SQ4", "Trim. 1 - Moy. finale". Whole school adds the class to each row. Colour only on buttons, the active pill, the total pill and the averages.
- **Print Class List**: A4 landscape, heading = class name, academic year, head teacher; columns No., Matricule, Name (A–Z) and ten blank, unlabelled columns; names in bold 12.5pt. **Print Current List**: A4 portrait, same heading plus the average shown, every field (No., Matricule, Name, Sex, Class on whole school, Avg), in the order currently on screen and respecting the search. Card "Print class list" prints the register directly.
- Sequence labels use the number of the sequence over the year (SQ4 = second sequence of term 2), as everywhere else in the app.

## 6f — Packages, registration fee, Term 3 lock
- **Seven packages** = any combination of the three modules (owners set them per school). Price ladder per term: one module = solo price (Reports 200/student, Fees 200/student, Tracking 1,000/teacher); two modules = `*_pair` (175 / 175 / 900); all three = `*_bundle` (150 / 150 / 800). Minimum, grace and due days unchanged. All keys are editable in the owners' console (Prices; changes start next term).
- **Registration fee** (`commit_fee`, 5,000 FCFA): a school that registers in Term 2 or 3 gets an invoice `FEE-xxxx` (term 0) and its account is `pending`: writes return 402 `pending` until the owners record the payment (mobile-money reference) in the console. The free period still applies; the fee is not credited against the first bill. Payments go through `recordPayment`, so the MoMo/Orange callback can call it later.
- **Term 3**: a draft invoice is created 14 days before term end (schools in their free term and schools with no usage are skipped). When the owners send it, it is due at term end, and from that moment until it is paid in full: `/api/report`, `/report/pdf`, `/report/share`, `/hours`, `/hours/pdf`, `/fees/receipt/pdf`, `/classes/stats`, `/dashboard` return 402 `locked`, and averages are removed from class/subject lists. Data entry stays open. Platform invoices/receipts and QR/timetable PDFs stay available. Terms 1 and 2 keep the existing read-only-after-grace rule.

## Security hardening (final step)
- **Owners' console sign-in:** constant-time comparison of email and password (both always checked); lockout after 5 wrong tries per address+email, 10 per email from anywhere, 40 per address, for 15 minutes (a correct password is refused while locked); failed attempts are written to the tamper-evident audit log; passwords under 12 characters warn at start-up and are refused when `NODE_ENV=production`. `.env` is now in `.gitignore` with the databases, backups and exports.
- **Schools' sign-in:** same work whether or not the account exists (no timing hint), 60 tries per address per 10 minutes on top of the existing 5 per account, and signup is limited to 10 per address per hour.
- **Cookies:** `Secure` whenever the request is HTTPS or `NODE_ENV=production`; behind a proxy or Cloudflare set `TRUST_PROXY=1`. Still HttpOnly and SameSite.
- **Headers and requests:** nosniff, no framing, same-origin referrer, HSTS over HTTPS, and a CSP that forbids framing, plugins and foreign form targets. Any write request carrying a foreign `Origin` is refused with 403. JSON bodies are capped at 200 KB.
- **Not done (waiting on Resend):** two-step verification and e-mail verification for schools and teachers. A full script-source CSP needs the inline scripts moved out of the pages.

## Location lock for teacher confirmation
- **Setup:** Timetable → Day structure → "School location". The principal stands at the school, taps "Use my current location", and sets a radius (20–1,000 m, default 150). "Save radius" changes only the radius; "Remove" turns the lock off.
- **Rule:** once a location is set, `POST /api/qr/confirm` needs the phone's coordinates. No coordinates (permission refused, no GPS) → 403 `loc_none`; reading worse than 150 m → 403 `loc_weak`; too far → 403 `loc_far` with the distance. Up to 50 m of the phone's reported GPS error is forgiven, so a 20–25 m school still works indoors. The distance is stored on the lesson (`geo_m`).
- **Time rule (unchanged):** a lesson can only be confirmed while its period is open (from `win_before` minutes before it starts), after the surveillant has recorded the gate arrival, and only for the class whose QR was scanned.
- **Until a location is set** the check is off, so the Day structure page shows a red notice.
- Permissions-Policy now allows geolocation for the site itself (the security step had blocked it).

## Report cards redesign
- `pdf.js` is rebuilt from the approved mockups. The table rows stretch to fill the page (2 subjects or 24); the summary, remarks, signatures and QR verification block sit at the same place on every card. Text grows with the row height (sparse cards: subject up to 15 pt, marks up to 14 pt; dense cards use the largest size that fits, about 9 pt for 17 subjects).
- Each subject shows its main teacher (`subjects.teacher_id`) **beside** the subject name (below it only if the two cannot fit on one line). Per-subject rank, class average, highest and lowest average come from `report.js`.
- In bilingual mode only the **Subject** header carries the French translation; the other column titles (Seq., Avg/Moy., Coef., Total, Rank/Rang, Appreciation/Appréciation) are single. French cards use decimal commas.
- The lower part has two panels: **Student results** (term average, overall rank; school colour, thick rule on top) and **Class statistics** (class average, highest, lowest; ink, red under 10), separated by a vertical line. A thin row below shows the number of subjects, the annual average (Term 3 only) and the overall appreciation.
- **Settings → Report card design** (principal): logo (PNG/JPG, shrunk in the browser, ≤150 KB stored as a data URL), main colour (strips, headings, table lines; must be dark enough for text), optional second colour (thin line beside each strip; a lighter shade of the main one if empty), and language: English only, French only or both. A sample card (2–22 subjects) is shown beside the form and can be opened in a new tab (`GET /api/report/preview`).
- The language is the school's setting (`card_lang`); the `lang` parameter of `/api/report/pdf` is now ignored. Header lines that repeat "Republic of Cameroon" are dropped because the card prints the national lines itself.
- Class council remarks are printed as ruled lines for handwriting. There is no stored remark field yet.
- X-Frame-Options is now SAMEORIGIN (it was DENY) so the sample can show in the settings page.

## Fixes after report cards v2
- **Crash on download:** a student added after a term was published had no verification code, and drawing their card threw an error that also killed the server. Now **every student of a published class has a card with a verification code, whenever they registered**: `report.js ensureCards` issues the missing ones the first time the class's cards are listed, shared (WhatsApp) or printed. A late card keeps the class size of the original publication ("/ 12"), shows the marks on file (published terms are locked, so usually dashes) and verifies like any other (`/verify.html?code=…`). A student who moved in from another class keeps their single card for the term (one card per student and term); publishing a class no longer fails when such a student already has one.
- **Crash safety:** report-card PDFs are built fully in memory and sent in one piece, so a drawing error returns a normal 500 and can never leave a half-sent response. A global `res.on('error')` guard stops any aborted response from taking the process down.
- **School name on documents:** the name printed on report cards, fee receipts and timetable/pay sheets now always comes from Settings → School name (upper-cased). The old "Report card header" box, whose first line was the name, became "Under the school name": motto, address, phone, one per line (`head.js`). A one-time migration (`hdr_v`) removes the first line of existing headers because it held the old name; the seed was updated the same way.

## Optional subjects, late registration and the annual card (supersedes "every student gets a card")
- **Subjects come from the marks.** A subject is on a student's card for Term 1/2 only if they have at least one mark in it during that term. A blank in a sequence is a dash and that subject doesn't count in that sequence's average. A student can get a mark in a subject they hadn't done before.
- **Who gets a card.** Publishing a class + term creates a card (and verification code) for every student with at least one mark in that term. A student who registered after publication, or has no marks that term, has no card for it and gets one when a later term they have marks in is published ("No card" in Report cards). The earlier auto-issuing for late students (`ensureCards`) was removed.
- **Term 3 = annual card.** Columns T1 · T2 · T3 (each term's average for the subject, dash if none) · Annual · Coef · Total · Rank · Appreciation. A subject is on it if the student has a mark in it anywhere in the year. Annual = mean of the subject's term averages; student annual average = Σ(annual × coef) / Σ coef; the panel, rank and class statistics are of the annual average. A student needs a mark in Term 3 to get this card.
- **Marks sheets.** `mark_sheets` (subject × sequence) is "submitted" when the teacher clicks *Submit marks to school*; saving a draft reopens it. Existing data is migrated (all marks submitted → sheet submitted).
- **Teacher popup.** Submitting with blank students lists them: they will be considered not to study the subject (0 is a score). Go back / Submit anyway.
- **Publish warning.** Publishing no longer needs complete marks. If sheets are not submitted, a popup lists each teacher, their phone and the subjects/sequences, with *Cancel* / *Publish anyway*. Publishing with no marks at all is refused (`nomarks`). The dashboard counts unsubmitted sheets of sequences already under way.
- Demo seed: Lydie (Form 1A) doesn't study Biology; Ines (Form 2A) joined in Term 2 (no Term 1 card); Form 3A's Physics S4 sheet is unsubmitted.

## Report card typography (cards5)

Every text size on the card now follows the approved hierarchy (school name > big averages > title > details > table > small print), scaled together. The school name keeps its old fixed size.

- Title is "Student’s Progress Report" (French: "Bulletin de notes"). Term and school year share one line on the right; the title drops its French line below when both do not fit on one line.
- Student: the name has its own line. If it does not fit, the rest continues on a second line; if the rest still does not fit, the words that fit are kept and the others become initials ("Christophe Aminatou Bello … M. E. N. A."). Student ID and class share the next line.
- Subjects: the teacher stays beside the subject. A long subject wraps to a second line and ends with "..." if it still does not fit (rows too short to wrap get "..." on one line). A long teacher name keeps the words that fit and turns the rest into initials: "Ndimofor Asaba Akongnui" becomes "Ndimofor A. A." Titles (Mr., Mrs., Mme., Dr., Prof.) are never shortened.
- Dense cards (more than 14 subjects) shrink the scale slowly (down to x1.25) to keep rows readable.
- "Fees owing": printed at the right of the class council remarks row, in FCFA (EN `45,000`, FR `45 000`). It is the balance through the card’s term (same rule as the fees module), shown only if the school’s plan includes fees, a fee plan exists for the class, and Settings → Report card design → "Show fees owing" is ticked (column `schools.card_fees`, default on).

## Printed class lists (lists5)

- **Columns fit their content:** No., Matricule, Sex, Class and Average are only as wide as the field name or the longest value (plus a small margin). The Name column takes all the space that is left. A name that still does not fit is printed at 60% of its size (12.5 pt -> 7.5 pt); if it still does not fit it continues on the next line(s). The complete name always prints.
- **Short class name:** new field `classes.short` (up to 8 characters), required when adding a class and editable on each class card (older classes got an automatic one, e.g. "Form 4 Science" -> "F4S"). It is used only in the Class column of the whole-school list. Titles (class list, whole school, reports) keep the full name. API: `POST /api/classes {name, short}`, `POST /api/classes/short {class_id, short}`; `/api/classlist` rows carry `cls` (full) and `cs` (short).
- **Letterhead:** logo, school name and the "Under the name" lines (motto, address, phone) on two lines at the top of page 1 (`GET /api/brand`). Text shrinks to fit; it never takes a third line.
- **Pagination:** page 1 holds 25 rows; the following pages use the space the letterhead took (29 rows). Rows that need extra lines for a long name take more height.
- The class register (ten blank columns) now prints portrait like the other list so it can follow the same 25/29 rule.

## Fixed report-card typography (cards7)

`pdf.js` has one type scale (`TY`, in pt) used by every card. It no longer depends on the number of subjects, the language or the row height: the old dense/sparse scaling (`S`, per-row font sizes, smaller school name on dense cards) was removed. School name stays 22 pt (only shortened if a very long name needs it).
Crowded cards are handled by layout: rows take the height their content needs (a wrapped subject gets two lines), spare height is shared between rows, and a card with more subjects than fit (20 at this type size) continues on a second page (title bar + student line repeated, totals/summary/signatures/verification on the last page, "year · 1 / 2" page numbers). Page 1 never ends with a single orphan row on the last page (at least 4 rows move to it).
Teacher names stay beside the subject (initials for trailing names when short of room).

## Fees page (fees1)
Payments tab rebuilt after the mockup, in the app's own colours: term pills, three summary cards (class-filtered), status tabs with counts (All / Still owing / Fully paid / Partly paid / Not paid), search, class filter, sort select + clickable headers (Student, Class, Paid, Balance), 15 rows per page. The old "Owing list" tab is gone (status tabs replace it). "Print this list" sits beside the status tabs and prints exactly what is on screen (term, class, status tab, search, order) with the class-list letterhead, A4 portrait, totals row, short class names. Seed fix: `seed.js` now clears invoices/mark_sheets/subject_seq before resetting the demo school.

## Round 2 changes (fees1 + admin1)
- Settings: three tabs (School / Report cards / Support).
- Students page removed; Classes is now "Classes and students" (secretary gets it too). Search on that page finds classes or students; "Print whole school" prints the whole-school list. Click a student → overlay (identity, guardian, marks/rank per term, fees, edit, remove from school). Edit rules: name, sex, birth date, guardian, phone (class is not editable because marks belong to the class).
- Class cards: pencil → overlay (name, short name, head teacher); head teacher name shown; pass rate (share of students with an average of 10 or more); avg/pass rate below half are red; an opened list shows the same stats with highest/lowest student names, computed for the selected average basis.
- Subjects: pencil → edit name/coefficient; delete only when no marks and no lessons (also removes its timetable slots).
- Today: Gate / Lessons / Spot checks tabs, no manual Late button (QR confirmation after the on-time window still records Late automatically). Teachers write a required lesson summary (3–500 chars) in the QR confirmation page; stored in lessons.summary. Lessons tab → "Print lesson log": teacher + dates → PDF with attendance totals and material covered.
- Timetable (classes): "Print all teachers" removed. Staff list: Status removed; "Subjects and classes" with a Class head badge.

## Email and two-step sign-in (email1)
- Every account (principal, secretary, teacher, surveillant) needs a real email that has been verified with a 6-digit code. No exceptions, no manual bypass.
- New device: password, then a code emailed to the account. The device is remembered for 30 days (cookie `d`), so the emailed code is needed once a month per device. The password is needed for every new session: the sign-in cookie ends when the browser closes and the server drops it after 12 h (this replaces the old 60-day teacher sign-in). Changing an account's email forgets its devices and signs it out.
- Sign-up asks for the principal's email and gives no access until the code is entered. Staff are created with an email; their first sign-in sends the code to it, which verifies it.
- Accounts that existed before this phase (no email): at next sign-in they must add an email, then enter the code. Sessions of unverified non-demo accounts stop working.
- Forgot password: emailed link to the verified email only (valid 1 hour, once). The answer never reveals whether the account exists.
- Owners' console: password, then a code emailed to the .env EMAIL, every time (no remembered devices).
- Limits: code valid 10 min, 5 wrong tries kill the sign-in, 30 s between sends, 5 sends per sign-in.
- Setup: put `RESEND_API_KEY` (and `MAIL_FROM`, a sender you verified in Resend) in `.env`. Without a key, emails print in the server console. The DEMO01 school skips all of this.
- Tests: `MAIL_DEBUG_FILE=/path` writes outgoing mail as JSON lines instead of sending.

## Student roll call (roll1)
- Settings → School → "Student roll call": the principal picks who takes it, or switches it off (default **off**; the page and menu item only exist when it is on).
  - **Every teacher, every lesson**: the teacher of each lesson (or the replacement who confirmed it) marks absentees for that period, from the Roll call page or straight after confirming a lesson on the QR page.
  - **Class head teacher, once a day**, or **Office staff, once a day** (principal, secretary, surveillant).
- Tap the absent students; everyone else is present. Only absences are stored. Teachers can only take today's roll; principal, secretary and surveillant can open any roll to correct it (any date for the daily modes, today only for lesson mode).
- Roll call page: Today board (what is done, who is absent today for office staff) and Register (per class and date range, with totals, printable landscape).
- Student overlay shows days absent, periods missed and recent dates. Belongs to the Reports module.
- Not included yet: absences on report cards, excused/late statuses.

## Charts (charts1)
- `public/charts.js` is a small chart kit (bar, column, line, donut as plain SVG, no library) with hover tooltips, a "view as table" toggle and a Print button on every chart (prints the chart, its table and the school header on A4). `charts.css` styles it; the owners' console uses the same files.
- Look: calm. Brand blue for data, amber only as the second category, red only for what is wrong (below 10, owing, absent), grey for "not yet".
- Where: Dashboard (class averages, boys/girls, fees collected vs owing, students absent per day, lessons today); class list (spread of averages); student overlay (term averages vs class); Fees (collected/owing by class, money per month); Roll call (absences per day); owners' Money (schools by status, billing, new schools per month, estimated billing by school).
- New endpoints: `GET /api/fees/trend`, `GET /api/roll/trend`.
- Not done: charts inside the server-made PDFs (report cards, lesson log, receipts).

## Phase 7a: new prices and bulk import of students

**Prices (per term, billed on the term's peak counts).** One module alone: Report cards 100 FCFA per student, Fees 100 per student, Teacher tracking 300 per teacher. Two or more modules: Report cards 75, Fees 75, Teacher tracking 200. No minimum per term (`min_term` is 0). The commitment fee (5,000 FCFA) and the free first term are unchanged. The new list is written once, by a migration in `db.js` keyed on `prices.price_rev`; any later edit in the owners' console is kept. Schools with a price lock keep their frozen list. Exam submission (a later phase) will sit inside Report cards and Fees.

**Bulk import of students** (`imp.js`, `public/imp.js`). Principal and secretary: "Import students" on Classes and students and on Register a student.
- Reads `.xlsx` (first sheet, dates as Excel serials or text) and `.csv` (comma, semicolon or tab; UTF-8 with or without BOM). Headings in English or French; the template (`/api/import/template?lang=en|fr`) shows the layout. Two name columns (surname and first name) are joined.
- Columns: name, sex (F/M, also Fille, Féminin, Male, Masculin, G, H), date of birth (YYYY-MM-DD, DD/MM/YYYY, Excel date), class (full or short name), matricule, guardian, phone. A class chosen in the dialog fills rows with no class. Empty matricule is generated like a single registration.
- Two steps. Preview saves nothing and shows every row with its status; commit imports the valid rows in one transaction. Rows with errors are never imported. Possible duplicates (same name already active in the school, or repeated in the file) are skipped unless the box is ticked.
- Limits: 2,000 rows and 5 MB per file; the preview is kept 30 minutes and works once.
- Not included: teachers (each needs a verified email) and marks (they belong to the teacher who submits them).
- Dependency: `fflate` (already installed through pdfkit) is now declared in `package.json`.


**Class-aware import.** The import reads the class column however it is written and compares it with the school's classes (English and French forms: Form 1 A, F1A, 1A, 6e, Sixième, L6 Arts, Tle C...).
- Confident matches are merged automatically, but shown in a "Classes found in the file" panel where they can be changed.
- Ambiguous names (for example "Form 1" when 1A and 1B exist) must be decided: the Import button stays disabled until every group has a choice.
- Names that match nothing are grouped across spellings (Form 7 A / F7A / 7A becomes one group) and offered as a new class with an editable name and a suggested short code. Principal and secretary can create classes during import.
- Each group can also be skipped. Commit takes `{token,dups,map}`; `map[group]` is `{a:'merge',id}`, `{a:'new',name,short}` or `{a:'skip'}`. The result lists the classes created.

## Phase 7b: optional honour roll

Off by default. Principal: Settings, Report cards tab, "Honour roll" (`honour.js`, `public/honour.js`).
- **Criteria.** Up to three levels, each a minimum average (0 to 20) and a name; a student gets the highest level they reach. A blank name falls back to "Honour roll" / "Tableau d'honneur" in the card language, so names are required only when there are two or more levels. Optional extras: only the top N of each class, and no subject average below a given mark. The average is the term average (the annual average in Term 3). Stored in `schools.hr_on, hr_tiers, hr_top, hr_nofail`.
- **Report card.** A small filled pill with the level name sits on the "Subjects / Appreciation" line, centred; no other layout changes. The sample card in Settings shows it.
- **Sheets.** Report cards page: "Honour roll" button (only when it is on). Choose term and scope (this class, whole school as one list, or one page per class); the dialog shows how many students qualify. PDF in English or French (the interface language). Only published terms are listed; unpublished classes are named at the bottom of the sheet. Blocked with the other file downloads when the Term 3 balance is unpaid.
- **Rules worth knowing.** Honour is worked out when a card or sheet is made from the school's current criteria, so changing the criteria also changes cards printed later. Needs the Report cards module.

## Phase 8a: receipts (POS printing, codes, public check)

The platform never handles school money: schools record each payment and we save it and make the receipt.
- **POS receipt.** Fees page, payment history and the message after saving a payment: "Print receipt" opens the browser print dialog with a narrow receipt (school header, number, date, student, amount, method, balance, QR and code). Paper width (80 mm or 58 mm) is set by the principal in Fee setup (`schools.receipt_w`, per school, not per device). A reprint is marked DUPLICATE (`payments.printed`); a cancelled payment prints a VOID box. `public/rcpt.js`.
- **A5 PDF.** Kept, now with the QR and code too.
- **Receipt code.** Every payment has a unique `RP-XXXX-XXXX` code (`payments.code`); old payments were backfilled on startup.
- **Public check.** `/verify` accepts receipt codes: shows authentic or cancelled, number, date, amount, student initials and class, school. No full names.
- **Good to know.** POS printing stays available during the Term 3 lock (it is a print, not a file download); the A5 PDF stays locked. Real thermal printers were not available for testing: the layout was checked at 80 mm and 58 mm widths in a browser.
- Tests: `/tmp/s7/rc.mjs` (20 checks).

## Phase 8b: exam submission, part 1 (upload, dates, storage)

Part of Report cards and Fees: a school with either module has it. Principal, secretary and teachers get an **Exams** page (`exam.js`, `public/exam.js`, table `exams`). Merged printing, the missing-paper warning and print history are Phase 8c.
- **Entries.** An exam is a class + subject + name, with an optional date and a copies number (default: the class size). Teachers add exams for their own subjects (or classes they head); the office can add one for any teacher. A date set by the office is locked for the teacher.
- **Upload.** PDF only, 3 MB, at most 60 pages. Checked on the server by content, not by file name: it must be a real, readable PDF; password-protected PDFs are refused with a clear message. Replace, remove and delete are available. The office can upload on a teacher's behalf (the list shows who uploaded).
- **Reminder.** On sign-in, a teacher (and the office) sees a popup listing exams dated within 7 days (or past) that still have no PDF, once per sign-in.
- **Storage.** Files are kept outside the database in `exams-data/<school>/<id>.pdf` (`EXAM_DIR` overrides). All access goes through three small functions at the top of `exam.js` (`fp`, `put`, `del`), so moving to Cloudflare R2 means changing those only. Per-school cap `schools.exam_cap_mb` (default 300 MB, no screen to change it yet); the principal sees the usage bar.
- **Auto-delete.** Hourly sweep: the file is deleted 14 days after the exam date, or 30 days after upload when there is no date. The row stays as history ("Removed after the exam"). A date may be at most 120 days ahead. Stray files with no row are removed too.
- Tests: `/tmp/s7/ex.mjs` (41 checks).

## Phase 9a: sections

Sections (Anglophone, Francophone, Primary...) group classes and teachers (`sections.js`, `public/sect.js`; tables `sections`, `user_sections`, column `classes.section_id`).
- **One section = nothing changes.** Every school has at least one section (a default called "Main", created on first use). While there is only one, no screen mentions sections except a dismissible note for the principal on Classes and students ("Does your school have more than one section?"); once dismissed, a small "Add another" link stays at the bottom of the page.
- **Setting up.** "Set up sections" asks what the current section is called (renaming "Main") and the name of the new one. Existing classes and all teachers stay in the first section. Up to 8 sections; names are unique.
- **Classes and students.** With two or more sections the page opens on section cards (classes, students, teachers; "Add a section" card for the principal; rename; delete only when empty). A section shows its own classes, pills and cards, with a link back to all sections. A class can be moved to another section from its edit dialog; its students go with it.
- **Teachers.** Each teacher belongs to one or more sections (checkboxes in the staff form, required for teachers once there are two sections). The staff list can be filtered by section. Secretary and surveillant are not tied to a section.
- **Registration.** The section picker shows only with two or more sections; the class list then shows that section's classes.
- **Not changed on purpose.** One school-wide day structure and calendar; fees, report cards and honour roll work per class as before. Section pickers elsewhere (timetable, report cards) come where they are needed, starting with the exam timetable.
- Tests: `/tmp/s7/sc.mjs` (36 checks).

## Phase 9b: Exam timetable
Timetable page → new tab "Exam timetable" (principal; schools without the tracking module see only this tab).
- Setup: name, optional sequence, dates, classes (section shortcuts), exam-day start/end and max hours per class per day, align-to-bell, per-subject include / minutes / "No paper" (manual labour, sports), invigilator mode (subject teacher or auto free teacher), pool (own section, or all with a checkbox), 1-2 per room, lessons choice.
- Class groups (e.g. Lower Sixth Arts + Science) write shared subjects together as one unit.
- Engine (`examtt.js`): one day per subject, papers sit between fixed breaks; teacher availability, lessons and other papers are respected. Warnings are computed live: no date, break, class overlap, daily cap, no invigilator, unavailable, has a lesson, busy.
- Editing: move a paper, change its length (later papers repack), re-pick invigilators ("keep the ones that work"). "Other" = non-staff invigilator.
- Tests: `/tmp/s7/et.mjs` (57 checks).
Deferred to 9c: deadlines for exam submission, invigilation confirmation and pay switch, lesson suspension, print PDFs, reuse of a previous timetable.

## Phase 9c: exam dates, print, copy
- **Send to exam submission** (exam timetable page): each paper with a day gets its date in Exams (existing exam of that class and subject is reused, else one is created named after the timetable, copies = class size). "No paper" subjects are skipped. Dates set this way are locked for teachers. Re-sending after edits updates the dates; a preview shows what will change.
- **Deadline**: exam date minus N school days (Exams page, principal setting, default 3; weekends and closed days do not count). Shown as "Send by" in Exams; the teacher popup now follows the deadline (within 7 days, or overdue).
- **Print PDFs**: by day, by class (one page each), by invigilator (duties with total time). EN/FR.
- **Copy for new dates**: same papers, times, lengths and invigilators, day 1 to day 1; papers with no matching day are left unplaced.
- Tests: `/tmp/s7/ec.mjs` (44 checks). Moved to 9d: lesson suspension, invigilation confirmation, pay switch.

## Phase 9d: publish, suspended lessons, invigilation, pay
- **Publish** an exam timetable (button on its page). Only published timetables act on lessons and duties. Unpublish undoes it.
- **Lessons**: with "lessons continue", the lessons that overlap a paper of that class are suspended; with "no lessons", every lesson of those classes is suspended on every exam day. A suspended lesson (status `suspended`) cannot be confirmed (office, class QR page), is not unconfirmed, not paid, not asked for roll call, and is listed apart on Today. A lesson that already has an answer is never touched, nor a lesson in an approved month. Moving or deleting papers re-syncs the lessons.
- **Invigilation**: a teacher sees their duties on the home page and confirms with one tap (all open duties at once) after the gate check and the in-school location check. The office can mark a duty confirmed / absent / reset with a reason (paper editor, or Hours & pay). A confirmation survives an edit that keeps the same teacher.
- **Pay switch** (principal, off by default, on the exam timetable page): confirmed duties are paid by real paper length at the teacher's rate per period; shown as an Invigilation column in Hours & pay and in the teacher's own hours. Ended unconfirmed duties become "Invigilation not confirmed" exceptions that block approving the month.
- Tests: `/tmp/s7/su.mjs` (49 checks).

## Phase 8c — Exam printing (office only: principal and secretary)

Exams page → **Print exams**. Pick a scope (whole school, a timetable, class, subject, sequence, date range), see every paper that has a PDF, and get one merged PDF.

- **Copies**: each paper defaults to the exam's class size; the admin can change the count per paper for that print only (not saved on the exam).
- **Modes**: *Join every copy* (one print job, papers one after the other, files stay small because pages are reused; capped at 12,000 sheets) or *Each paper once* (a cover page lists the copies to set on the printer).
- **Groups**: classes sharing one PDF (e.g. Form 1A + 2A) print once, with copies summed. The shared file may sit on any member row.
- **Missing papers**: a warning lists them with teacher contacts; choose *Print anyway* or *Go back* and contact the teachers. A timetable scope also lists papers with no exam row.
- **History**: each print is recorded (who, when, scope, papers, sheets, skipped). Re-printing a paper already printed triggers a warning with an override. No files are stored in history.
- API: `POST /api/exams/print` (409 `print_missing` / `print_dup`, 413 `print_big`, 400 `print_empty`).

## Phase 9e — Regular timetable generator (principal only)

Timetable → **Generator** tab (needs the teacher-tracking module, like the rest of the timetable).

1. **Weekly periods**: per class and subject, set periods per week, max per day and number of double periods. "All classes" copies a subject's numbers to every class; "Fill from the current timetable" takes today's counts. Subjects with no number get no lessons.
2. **Capacity check**: flags teachers who need more periods than they have free (after their availability) and classes with more periods than the week.
3. **Rules**: always applied: one class per teacher per period, teacher availability, max per day, doubles only back to back with no break. Optional: heavy subjects (coefficient ≥ N) in the morning, avoid teacher gaps, a daily limit per teacher. Soft aims: spread subjects over the week, compact class days.
4. **Generate**: pick a start date (today or later) and a mode: *start fresh* (rebuild every class that has weekly periods) or *fill the gaps* (keep what exists). Preview by class or teacher, then *Another proposal* or *Apply*.

Applying uses the normal effective-dated slots: the old timetable stays valid up to the day before; recorded lessons are never touched. Unplaced periods are listed with a reason. A proposal is refused if rules changed after the preview. Seeded and repeatable (same seed = same result). A 20-class, 700-period school solves in under a second.
API: `GET/POST /api/timetable/gen/req`, `POST .../req/fill`, `POST .../cfg`, `GET .../check`, `POST /api/timetable/gen` (preview), `POST .../apply`.

## Phase 10 — Student ID cards (principal and secretary)

Menu: **Student ID cards** (People group). Included for every school (it belongs to no billing module).

- **Photos**: per student, JPEG only. The browser shrinks any photo to 360×480 (about 30 KB) before upload, so a phone camera works (the Photo button opens the camera on phones). *Upload many photos* matches file names to the student ID (matricule) or the full name. Photos are stored in their own table, shown only to office staff, never in lists or to teachers.
- **Card** (CR80, 85.6×54 mm): front with school logo, name, colours from Settings → Report card design, photo, name, matricule, class, school year and a QR code; back with a "return to the school" text, the school's contact lines (Settings → "Under the name"), signature line. Language follows the report-card language setting (English, French or both).
- **Print**: A4 sheets, 10 per page (backs are mirrored: print double-sided, flip on the long edge), or one card per page for a card printer. Scope: selected students, the class shown, or everyone shown; optional "only cards not printed yet". A student with no photo triggers a warning with *Print anyway* (empty photo box).
- **Code and check**: each card has a code (ID-XXXX-XXXX). The public verification page shows name, class, school and year, and whether the card is valid, expired (past school year), replaced (lost or damaged) or the student has left. It never shows the photo or date of birth.
- **Lost or damaged card**: *Replace card* voids the old code and prepares a new one for the next print. A new school year (August) issues fresh codes on the next print.
- API: `GET /api/idcards`, `POST /api/idcards/print|match|replace`, `GET|POST /api/students/:id/photo`, `POST /api/students/:id/photo/delete`; public `GET /api/verify?code=ID-…`.

## Demo data (node seed.js / npm run seed)

The default demo school is now a full Cameroonian secondary school (school code DEMO01, password 12345678):

- **Anglophone section**: Form 1-5, Lower Sixth Arts/Science, Upper Sixth Arts/Science (9 classes, 28 teachers).
- **Francophone section**: 6ème, 5ème, 4ème, 3ème, 2nde A and C, 1ère A4, C, D, Tle A4, C, D (12 classes, 30 teachers).
- 50 to 56 students per class (about 1,100 in all), four sequences of marks, Term 1 published, fees and payments, four weeks of lesson attendance.
- Subjects, weekly periods and coefficients follow the Cameroonian curriculum (Anglophone O-Level and A-Level subjects; Francophone premier and second cycle, series A, C, D). The timetable is generated with the timetable generator.
- Re-running the seed resets only the demo school and now works on any existing database (it removes the demo school's rows from every table, including ones added in later phases).
- `DEMO_SIZE=small node seed.js` builds the old 4-class, 5-teacher school that the automated tests use.
- Teachers log in with their surname as username (for example tabe, ngu, eyong, fotso, tchoumi, kamdem).

## Phase 10c: timetable page redesign (from the "simple timetable" mockup)

The Timetable page now opens on a start screen (principal) with tiles: Make a new timetable, See / change a timetable, Print timetables, School day hours, Days off, Exam timetable.

- **Make a new timetable** is a 3-step wizard: 1 Day structure (start time, lesson length, lessons per day, school days, breaks; QR windows, spot checks and school location under "More settings"), 2 Teachers' days (tap a day: absent, morning only, available; "exact hours" for single periods), 3 Lessons per week (class by class, +/- steppers, teacher choice per subject; maximum per day and double lessons under a switch). The step 3 page ends with a readiness check and the **Create the timetable** button.
- Create shows a **suggested timetable** (by class or by teacher). Nothing is saved until **Use this timetable** is pressed.
- **Colour per teacher**: every teacher has one colour, the same in the class view, the teacher view, "My timetable", the suggestion and the printed PDFs.
- **Tap a lesson** (principal, class view) to open the change window: every subject of the class with a tag (free, teaching another class, not available then, already at its weekly number).
- New API (principal only): `GET /api/timetable/wiz/teachers`, `POST /api/timetable/wiz/day`, `GET /api/timetable/wiz/options`. Teachers' days are still stored as `unavail` cells: "absent" = every period of the day, "morning only" = the periods from 12:00 on (or the second half of the day if none start after 12:00).
- Files: `public/ttui.js` (new), `ttwiz.js` (new), CSS block "Timetable page" in `style.css`, colours in `pdf4.js`. The old tabs' code (Availability, Generator, Day structure) is still in `p4.js` / `ttgen.js` but no longer reachable.

## Phase 10d: class cards (from the "classroom cards" mockup v2)

Classes page cards: class name as the headline (26 px), students / boys / girls and the head teacher under it, one quiet strip with class average (trend arrow) and pass rate (bar, amber under 50 %), then top and bottom averages in small grey text. Quiet actions: class list and QR code; Edit, QR link and New code are in the "⋯" menu (principal). The whole card opens the class. "Term 2 · Sequence 4" is stated once above the grid (a card only repeats it if its period differs). Code: `clRows` in `public/lists.js`, block "Class cards" in `style.css`.

## Phase 10e: staff list, Record payment

- **Staff list** (from the staff mockup): one row per subject with its classes as small chips showing the class **short name** (hover for the full name); the class head's chip is highlighted with a star; email and gate access sit under the name; names stay on one line; a Print list button prints the list without filters and buttons. `/api/users` now also returns each class's `short` and `cid`. Code: `sfSc` / `sfRows` in `public/index.html`, block "Staff list" in `style.css`.
- **Record payment** is its own item in the Money menu (principal and secretary, when the school has the fees module): search a student, see what is owed per term, quick-fill buttons for each term's balance, record the payment, print the receipt, "Record another payment". Code: `public/recpay.js`. The Fees page is unchanged.
- The full demo school now sets explicit class short names (F1, L6 Arts, U6 Sci, 6e, 1A4, TC …).
- Re-run `npm run seed` to get the short names in the demo.

## Phase 10f: student photos as WebP, ID cards from Classes and students
- The "Student ID cards" menu page is gone. **Print ID Cards** sits beside "Print QR codes for all classes" (principal and secretary). It opens a dialog: tick classes or the whole school, choose layout, optional "only cards not printed yet", bulk photo upload by file name. If students have no photo, a warning says how many and offers **Print anyway**.
- Each class (card and class page) has **Print ID badges** next to **Print class list**.
- Click a student's name: overlay with details; **Edit** changes name, sex, date of birth, guardian, phone **and the photo** (drag to centre the face, zoom). The overlay also has **Print ID card** and **Replace lost card**.
- **Register a student** has a photo field with the same crop widget.
- Photos: the browser crops to 3:4 and writes 480x640 WebP; the server re-encodes with `sharp` (quality 85 stepping down, then size down to 360x480 at worst) so every stored photo is WebP and at most 100 KB. Old JPEG photos convert automatically (at startup and on first read). PDFs get a JPEG made on the fly (pdfkit cannot embed WebP); nothing extra is stored.
- New dependency: `sharp`. Run `npm install` after unzipping.

## Phase 10g: navigation and overlay polish
- **Breadcrumb bar** above every page (`public/ov2.js`): `Classes and students › Form 3A`, with sections `All sections › Anglophone › Form 3A`, and `Timetable › New timetable`. Earlier crumbs are clickable. It follows the page automatically.
- **Classes and students**: Add class now sits on the same line as Print ID Cards (search bar is narrower on desktop); the spread-of-averages graph under the quick stats is removed.
- **Student photos** appear in the circle placeholders of the class list (small 96x128 WebP thumbnails, cached; office roles only). Initials/silhouette remain when there is no photo.
- **Student overlay** redesigned from the mockup: header with Edit and close, compact identity strip (3 x 2), term tabs inline with the stats, footer with Remove, Print ID card and Replace lost card.
- **Staff overlay** (same layout): click a name, or the pencil, in Staff. Edit in the overlay (name, email, role, password, gate access, sections). Shows subjects and classes with short-name chips.
- **Timetable**: a tab group at the top (See / change, New timetable, School day, Days off, Exam timetable, Print). If a timetable exists the page opens on See / change; if not, on New timetable. New route `GET /api/timetable/wiz/status`.

## Phase 10h — Exam separator sheets
- Bulk exam printing can insert a **sorting sheet before each exam**: full-bleed black top band and black edge stripes (visible on the side of a stack), huge "n of N", subject, classes, date, copies / pages per copy / sheets in total, per-class copies for grouped exams, setters, and a "papers start on the next sheet" banner. EN/FR.
- Print dialog: "Separator sheet before each exam" (on by default) and "Double-sided printing" (adds a blank back so every exam starts on a fresh sheet).
- Fixed: copies are now embedded as real page objects (the old code reused one page object, producing a structurally invalid PDF in some viewers).

## Phase 10i — Report cards by section
- **Report cards page** is now a term overview: one row per class, grouped under section headings (headings and the section filter appear only in multi-section schools). Status per class: Published (cards, held for fees), Ready to publish, Marks missing (count + teachers), No marks. Click a row for the existing student list (PDF, WhatsApp). Breadcrumb: Report cards › Anglophone › Form 1A.
- **Publish**: per class, "Publish all ready" per section, and school-wide. Classes with missing mark sheets are skipped and named.
- **Print report cards** dialog: term, tick sections/classes (only published classes), separator sheet (class, section, term, card count, class teacher, student list), double-sided option, warnings for students with no card and students held for fees (Print anyway). One merged PDF ordered by section then class. `POST /api/rc/print`.
- **Per section**: report-card language and own term dates (Report cards › Language and calendar, principal only). A section left on the school setting follows it. Single-class PDFs use the section's language too.
- Billing still follows the school calendar and the number of sequences per term is still one school-wide plan.
- Fixed: the class page showed the payment page's subtitle (shared key).
- API: `GET /api/rc/overview`, `POST /api/rc/publish`, `POST /api/rc/print`, `GET/POST /api/rc/config[/:id]`.

## Phase 10j — Staff ID badges and gate scan
- **Badges**: Staff page › "Print ID badges" (pick people, A4 sheet or card printer, only-new filter, no-photo warning) and, per person, the staff overlay (photo upload with crop/zoom, print badge, replace lost badge). Same CR80 layout as student cards with staff wording; QR opens `/t/<code>`. Photos are WebP ≤100 KB like students'.
- **Gate scan**: scanning the QR with any phone camera opens a page where the gate person (principal, surveillant, teachers with gate access) taps **Arrived** or **Left**; it writes the same gate log as the Today screen. Today also has a "Scan badge" button (in-app camera where the browser supports it, plus typing the code).
- **Left early**: marking Left while the teacher still has lessons scheduled asks for confirmation and stores flag `early` (shown on Today as "left early").
- Public scan (no sign-in) shows only name, role and whether the badge is valid, expired, replaced or no longer on staff; photo and attendance need a gate sign-in. Only teachers get attendance; other staff badges identify only.
- Defaults I chose where you hadn't answered: the gate person confirms Left (no automatic toggle); early-leave is visible to anyone who can see the Today screen.
- API: `GET /api/staffbadges`, `POST /api/staffbadges/print|replace`, `GET/POST /api/staff/:id/photo[/delete]`, `GET /api/tscan/info|photo`, `POST /api/tscan/mark`, page `/t/:code`.

## Phase 10k — Backups and "Your data" export
- **Settings › School › Your data** (principal): one click downloads a ZIP with spreadsheets (students, staff, subjects, marks, report cards, payments, teacher attendance; UTF-8 CSV for Excel), `school.json` (everything the school owns, structured, for moving or restoring) and all student/staff photos as WebP files. No password hashes or sessions. Once per 30 s; each download is audited. The page also shows the last automatic backup.
- `school.json` now includes tables that belong to a school through a parent row (teacher sections, subject sequences, class groups, roll absences, exam papers/invigilation/print items) and replaces photo blobs with a size note.
- **Backups**: the nightly backup is now integrity-checked after it is written (a failed check is logged as a failed backup). `node restore.js` lists backups; `node restore.js <file>` puts one back (stop the server first; the current database is kept as `school.db.before-restore`). Restore was tested end to end.
- Exam paper PDFs are not in the backup or export: they are deleted automatically two weeks after each exam.

## Phase 10l — timetable colours, editing and exam grid
- **Colours:** 8 pale, clearly different colours, then the same 8 again each with a shape (triangle, square, circle, diamond, star, cross, hexagon). One palette (`ttpal.js`, served at `/api/palette`) drives the screen, the regular timetable PDF and the exam timetable PDF. Regular timetables colour by teacher; exam timetables colour by subject.
- **Teacher drop-downs** show what each teacher teaches and where: "Physics (F1A, F2A) · Biology (F3A)".
- **Mobile:** the time column stays in view while the timetable scrolls sideways.
- **Suggested timetable is editable right away:** tap any period (class or teacher view). Options show who is busy / unavailable; stats and "changes" are recomputed (`GET /api/timetable/gen/:id/options`, `POST /api/timetable/gen/:id/set`).
- **Exam timetable** now opens as a grid like the regular one (By class / By invigilator / List). Tap a paper to edit; tap an empty cell to place one of the class's papers. Warnings are listed above the grid. The PDF "By class" and "By invigilator" are drawn in the same grid style.

## Phase 10m — system-wide search
- **Where:** a search box in the top bar (icon on phones). Open it with the box, **Ctrl+K** (⌘K) or **/**. No AI involved.
- **What it finds:** students (name, matricule with or without the dash, guardian, phone), staff, classes, subjects, pages, and **buttons**. People and classes come as **cards** (photo or initials, class, what a teacher teaches) with quick actions (Open, Record payment, ID badge, Timetable, Subjects).
- **Buttons:** choosing "Print staff ID badges" opens Staff, scrolls to the button and makes it glow with a "Click here" bubble until it is clicked (or Esc, or you leave the page). If a button only exists inside a menu, the glow lands on the menu and the bubble says which.
- **Tolerance:** accents and capitals ignored, word order ignored, typos (swapped, missing or extra letters), sounds-alike names (Tchoumi / Tchumy), English and French words for the same thing (pay / paiement, print / imprimer, fees / frais).
- **Roles:** the server hands each user only what they may find. Principal: everything. Secretary: students and classes. Teacher: students of the classes they teach (open only the class they head). Surveillant: pages and buttons only.
- **Files:** `public/sxcore.js` (engine, pure functions), `public/sxreg.js` (list of pages and buttons: **add a line here when you add a button**), `public/sx.js` (screen), `search.js` (server list, `GET /api/search/index`).
- **For Cloudflare:** the engine has no DOM, database or Node dependency and moves as is. The server side is one role-filtered batch of reads when the box opens (ETag + `private, no-cache`, so an unchanged list costs a 304); typing never calls the server, so it costs no D1 reads. The list is refreshed when the box opens and is older than 90 seconds.
- **Checks:** `sx.mjs` (index per role, privacy, 304, engine on real data) and a browser test that opens every page for every role and fails if a registered button is missing.

## Phase 10n — timetable redesign (regular timetables)
Matches the new mockup for lesson timetables. **Exam timetables keep their current screens inside the new four-tab page; they are restyled in the next phase (10o).**
- **Four tabs:** Timetables · + Create new · Exam timetables · School calendar. The old Print and Days off tabs are gone; every timetable has its own *Print this timetable* button, and each section box has *Print section*.
- **Overview:** one box per section (one box "All classes" when the school has a single section), class chips green (has a timetable → opens it), dashed (none → starts the wizard with that class chosen) or amber (a clash, an unavailable teacher or a changed teacher). By teacher shows the same layout, with a "2 sections" tag for teachers in two. `GET /api/timetable/overview`.
- **Create new, 5 steps:** Who is it for? (whole school, a section, some classes, one teacher; "only fill the missing" or "redo all") → School day → Teachers' days → Lessons → Review. Warnings on the review step are buttons that jump to the step that fixes them. If every class already has a timetable, a dialog offers *Go to Timetables and edit* or *Create a new one anyway*.
- **Scoped generation:** `/api/timetable/gen` and `/gen/check` take `classes: [ids]` or `teacher_id`. Lessons of teachers in classes that are not being rebuilt are treated as fixed, so nothing lands on top of them. *One teacher* places only that teacher's lessons and pins everything else in their classes.
- **School day:** ribbon view with *Yes, looks right* / *Change*. **Breaks are now dragged by a handle (mouse, pen, touch) instead of arrow buttons**; ↑/↓ keys on the handle also work. A break can never end up first or last.
- **Teachers' days:** tap cycles all day → morning only → **afternoon only (new)** → not coming. Press-and-hold or right-click opens exact hours. "Also in [section]" tag.
- **Lessons:** compact subject cards, teacher drop-down limited to teachers who teach that subject somewhere (with *Show all teachers…*), max/day and doubles in a small dialog, week bar, class tabs with dots.
- **Grouped lessons (generator rule):** a subject that appears twice in a day is now always in back-to-back periods, never split by a break or another subject; a free period is preferred. `stats.split` counts violations (0 from the generator).
- **Drag and drop to swap** (suggested timetable and live timetable, class view): pick a lesson up and drop it on another cell. The target glows green if the swap is valid, red with a short reason if not (teacher busy elsewhere, teacher not available, daily maximum, group would be split, teacher daily limit). Dropping on an empty cell moves the lesson. Tap still opens the change window. Touch: press and hold to pick up. `POST /api/timetable/gen/:id/swap` and `POST /api/timetable/swap` (`all:1` returns every target's verdict in one call; `check:1` only answers). The rules are one pure function, `ttswap.js`.
- **Unsaved-changes guard:** a suggested timetable that is not used yet, or a school-day edit not saved, triggers the browser's leave-page warning on close/reload and a confirm on any in-app navigation (sidebar, tabs).
- **Phone:** the grid shows one day at a time with day tabs (today first), no horizontal scroll.
- **Not done / differences from the mockup:** a different school day per section is not possible yet (the platform has one school day); changing the day in the wizard changes it for the whole school. Teacher timetables are read-only (drag works in class view). Dev-note extras of the exam screens are in 10o.
- **Checks:** `tn.mjs` (45: grouping over several seeds, swap verdict vs brute force on every target, live swap, scoped and teacher generation, overview, afternoon-only) and `tn_ui.py` (24: tabs, chips, wizard, break drag, guard, section scope, phone).
- Service worker cache `sp-v26`.

## Phase 10o — exam timetable redesign and wizard fixes
- **Exam timetables** follow the mockup: overview (exam list cards with Ready/Open/Print, one box per section with chips and "Create for …", class-groups card), a 4-step wizard (Who → Dates & times with a tap-to-pick calendar and striped closed days → Papers with quick lengths and a switch per subject → Supervision & create), an overlap warning, and a restyled timetable view (Section / Class / Teacher, dropdown + pills, Morning/Afternoon rows, break bands, print button).
- **Class groups** can hold any number of classes, from any section. A group still needs at least 2.
- **Exam day**: by default the school's own day (its lessons and breaks). Or choose "a different day for exams" and build it with the same day editor (start time, paper slots, breaks); it is stored on the exam timetable only and never changes the regular timetable. (The short-lived "break between papers" option was removed.) New PDF view `?view=section[&id=]`, one A4 sheet per section.
- **Lesson wizard**: class chips are grey when not included and blue with a tick when included (a small green dot marks "already has a timetable"); "One teacher" is a dropdown with a search box; several sections can be picked at once; class (or teacher) pills sit beside the dropdown on the suggested and view screens; the lessons-per-week editor appears under a suggestion, with "Try again with these numbers".
- New files: `public/ettwz.js`. Service worker cache `sp-v27`. Tests: `to_ui.py` (44 UI checks), `eo.mjs` (15 server checks).
- **Does it fit?** Steps 3 and 4 of the exam wizard ask the server to place the papers without saving anything and show the result live: all papers fit, or which classes are short and by how many, with a one-click "Shorten papers to fit". Creating with papers that won't fit asks first. A timetable that left papers unplaced has a "Start again with other dates or lengths" button that reopens the wizard with the same choices. (`POST /api/examtt/generate` accepts `dry:true`.)

## Phase 10p — class days, live lessons per week, teacher availability, side by side
- **Class days off.** New `classes.off_days`; `GET/POST /api/timetable/class-days` (one list for many classes, or `items:[{class_id,off}]`). Wizard step 2 has a classes × weekdays grid (filter box, tap a day name to switch it for every class shown). The generator, swap check, manual set and live timetable all refuse an off day; grids show it hatched "No school".
- **Mon–Fri first.** Days after Friday get a heavy score penalty; they are only used when Monday–Friday cannot take the lesson.
- **Live lessons per week.** `POST /api/timetable/gen/:id/adjust {subject_id?, drop?}` (`ttgen.reconcile`): surplus lessons are removed where it hurts least, missing ones are added in the best free slot, nothing else moves. If a lesson fits nowhere the response says how many (`adj.short`).
- **Teacher pills.** Each pill opens that teacher's availability (same day picker as wizard step 3, hold a day for exact hours). "Edit availability" opens the same for every teacher of the timetable shown. After a change the suggestion is repaired through `adjust {drop:1}`.
- **Break between same-subject lessons.** Per subject (`gen_req.split_ok`, in the ⋯ window) and for all subjects (`gen_cfg.split`, step 5 rules).
- **Side by side** (screens ≥ 1100 px): both the suggested and the live timetable; each pane has its own class selector, pills, drag and tap editing.
- Not built yet: moving several consecutive lessons at once (waiting for the decision on the proposed "Select lessons" mode).

## Phase 10q — shared subjects, practical sessions, marks in parts

- **Several teachers, one subject.** In the timetable wizard (step 4) each subject card has "+ Teachers · practical". Every teacher gets their own lessons per week; together they make the total. The subject stays one entry on the report card, under the main teacher's name. Teachers are tracked separately on timetables, availability, hours and "my timetable".
- **Practical sessions.** A subject can have a practical: its own teacher, lessons per week, optional doubles. It is a timetable period only (tagged Practical / TP, also in PDFs): no exam, no mark, no report card entry.
- **Marks in parts (optional, off by default).** Tick "each teacher enters their own mark" in the same window. Each teacher sees and enters only their own column; the subject mark is the average (equal weight) once everyone has entered. Left off, the usual way works: one teacher enters the average.
- Changes made under a suggestion adjust it live. Cell editor now lists one line per teacher and practical.
- Tables: subject_teachers, subject_prac, mark_parts, mark_part_sheets; subjects.parts, slots.kind. Tests: p11.mjs, p11_ui.py.

## Phase 10r — select lessons (move a block of consecutive periods)

- New **Select lessons** button next to "Side by side" (suggested timetable and live class timetable).
- Tap a lesson, then another on the same day: everything between is one block. Doubles (same lesson in two periods in a row, shown with a link icon) are always selected together.
- Every other place glows green (the block fits) or red (tap it to read why: teacher busy/away, daily maximum, split lessons, class day off, block runs past the end of the day, overlap). Tap a green place or drag the selected block onto it: the two blocks swap lesson by lesson, in order. A free period on the same day also works as a target; drag does the same-day shift too.
- Same checks as single swaps, applied to the whole block at once (`ttswap.evaluateMany`); `n` parameter on `/api/timetable/swap` and `/api/timetable/gen/:id/swap` (default 1, so nothing changes for single swaps).
- Tests: p12.mjs (rules + API), p12_ui.py (tap, reasons, drag, phone).

## Phase 10s — scroll fixes, two-row pills, searchable selectors, exam timetable changes, Subjects & teachers as a tab

- **Scroll kept:** the "Days each class comes to school" block and every pill list keep their scroll position when you tick a day or pick a class (`twKeepScroll`, `PSCR`).
- **Pills:** at most two rows (scroll sideways beyond that), for classes and teachers, on suggested, live and exam timetables.
- **Search boxes:** the class/teacher dropdowns on timetable and exam pages are type-to-filter boxes (any `select[data-srch]`).
- **Exams:**
  - *No invigilator* option (wizard step 4 and "Lengths, invigilators…" panel): nothing is assigned and no invigilator warnings. Stored as `inv_mode='none'`.
  - *Drag and drop* on the class grid: move a paper to another cell or swap two papers; green/red glow with the reason. Blocked only by the class's own rules (two papers at once, daily hours cap, break); invigilators of moved papers are picked again. `POST /api/examtt/:id/swap`.
  - *Phone layout* is the regular timetable's: day tabs, one day at a time, time column on the left.
  - *Publish* is at the bottom of the page. The top "Send to exam submission" button is gone: after publishing a popup offers to send; if you press Not now, a "Send to exam submission" button appears next to Unpublish until the dates are sent.
- **Subjects & teachers** is no longer a sidebar page; it is a tab in Timetable (also for schools without the timetable module). `vSubjects()` still works as the way in from search.
- Tests: p13.mjs, p13_ui.py.

## Phase R1 — Cloudflare restructure: foundation
Nothing changes for you locally: `npm start` still runs plain Node + SQLite (`server.js`).
- `core/web.js`: Express-compatible router built on the standard Fetch API (so the same routes run on Node and on Workers). Express and cookie-parser are no longer dependencies.
- `core/serve-node.js`: the Node http bridge + static file server.
- `core/driver-node.js` + `core/runtime.js`: database seam. db.js uses the injected driver, else node:sqlite.
- `core/jobs.js`: all background timers (cleanups, exam sweep, billing touch, backup tick) register here; on Cloudflare a cron trigger calls `runDue()`.
- `app.js` builds the app; `server.js` only listens.
- Tests: `p14` (web layer) added to the regression loop.

## Phase R2 — Cloudflare restructure: files and images
Local behaviour is unchanged (same folders, same env overrides `EXAM_DIR`, `EXPORT_DIR`, `BACKUP_DIR`).
- `core/storage.js`: one async file interface (`put/get/del/exists/list`) for exam PDFs and the nightly exports. Disk on Node, an R2 bucket on Cloudflare (the Worker sets `runtime.storage`). Exam upload, view, delete, sweep and print now go through it.
- Backups: on Node still `VACUUM INTO` a file. On Cloudflare the database has built-in point-in-time recovery, so the nightly job records that and still writes the per-school JSON exports to storage.
- `core/image.js` + `public/badge.js`: photos are resized in the browser. One upload now carries the stored WebP (max 100 KB), a JPEG for printing and a 96x128 thumbnail; the server only checks and stores them. `student_photos` / `staff_photos` gained `print` and `thumb` columns. On Node, sharp (now an optional dependency) still converts odd single-image uploads and fills old photos in the background; on Cloudflare it is not used.
- Tests: `p15` (storage + image + framed upload) and `p15_ui` (the real browser upload).

## Phase R3 — Cloudflare restructure: PDFs
Local behaviour is unchanged. All 11 PDF outputs (report cards, badges, receipts, invoices, timetables, honour roll, exam timetables, payroll and teacher logs, class QR sheets, the owners' billing export) now go through two seams:
- `core/pdfkit.js`: one place that provides `PDFDocument`, `toBuf(doc, draw)` and `pipe(doc, res)`. `pipe` replaces the old `doc.pipe(res)`: the finished file is collected and sent in one piece (the Worker has no streaming file system). On Node it uses the pdfkit package as before; on Cloudflare the Worker entry registers the three standard fonts the app uses (Helvetica, Helvetica-Bold, Helvetica-Oblique) and hands pdfkit over through `runtime.pdfkit`.
- `core/qr.js`: QR codes as PNG without Node-only code (same call shapes as the `qrcode` package). Checked module-for-module against `qrcode` for three configurations.
- Verified on the real Workers runtime (workerd, via `wrangler dev`): the actual badge generator (card and sheet layouts, accented names), QR PNGs and a pdf-lib merge. The full app runs there from R4.
- Tests: `p16` (both PDF paths, error handling, QR equality).

## Phase R4 — Cloudflare restructure: the Worker
The whole app now runs on Cloudflare's runtime (tested locally with `wrangler dev`) as well as on plain Node. Nothing changes for local use: `npm start` is still Node + SQLite.
- `cloudflare/worker.js`: the entry. A stateless Worker serves exact static files from the assets binding (with the security headers) and sends everything else to one Durable Object, which loads the same `app.js`, with SQLite inside the object as the database (`core/driver-do.js`), R2 for files (`core/storage-r2.js`), the standard PDF fonts, and a cron trigger calling `core/jobs.js` in place of the Node timers.
- `cloudflare/move-data.js` (`npm run cf:move`): copies a local `school.db` into the Cloudflare database (photos included, parents before children, safe to re-run). Protected by the `ADMIN_KEY` secret.
- `cloudflare/wrangler.toml`: replaces the old D1 template. `npm run cf:dev` starts the Cloudflare version locally (put `ADMIN_KEY` in `cloudflare/.dev.vars`, see `.dev.vars.example`).
- Bug found and fixed by the strict Worker runtime: `ttwiz.js` (timetable overview) assigned two variables without declaring them, which on Node silently created shared globals.
- Verified on the Worker runtime: login (PBKDF2), sessions, every GET route as four roles compared with the Node server on identical data (328 requests), a set of writes (payments, marks, timetable generation and apply) compared the same way, photo BLOBs, badge and report-card PDFs, exam PDFs in R2, and the nightly cron writing the exports to R2.

## Phase R5 — Cloudflare restructure: deploy kit
- `CLOUDFLARE.md` is rewritten as a step-by-step guide (first deployment, data move-in, go-live, operations, backups and restore, limits, troubleshooting).
- `npm run cf:deploy`, `cf:smoke`, `cf:logs`, `cf:restore`, `cf:dev`, `cf:move`.
- `cloudflare/smoke.js`: sign-in, read screens, PDFs and an R2 round trip against any deployed address; run it after every deploy.
- `cloudflare/restore-point.js` + the `/__admin/restore` door: roll the database back to any moment in the last 30 days (needs the real deployment).
- `cloudflare/move-data.js` now also uploads exam PDFs from `exams-data` to R2.
- `wrangler.toml`: logs on, `PUBLIC_URL` / `BILLING_NAME` placeholders.

### R5 follow-up: usage counters and cost guide
`core/driver-do.js` counts the rows read and written (what Cloudflare bills); `POST /__admin/stats` (with the ADMIN_KEY) returns them. `CLOUDFLARE.md` now has measured numbers for what the free plan can carry.

## AI assistant (Gemini)

A chat assistant (button at the bottom right) that answers questions about the school's own data in English or French. It is read-only and role-scoped: the principal gets results, fees, hours and attendance; the secretary results and fees; the surveillant hours and attendance; a teacher only their own subjects and marks. Phone numbers, guardians and dates of birth are never given to it. Support sessions never see it.

**Three gates, all must be open**
1. Owners' console → *AI assistant* → big **Master switch**. One click turns it off for every school at once (checked on every request, written to the activity log). It starts OFF.
2. The Gemini key must be configured as the secret `GEMINI_API_KEY` (Cloudflare: `wrangler secret put GEMINI_API_KEY`; own server: `.env`). It is never stored in the database.
3. Each school's principal opts in under Settings → AI assistant (the consent text says what is sent to Google). The owners can also block a single school.

**Settings (owners' console)**: model name (default `gemini-3.5-flash-lite`; any model name can be typed, no update needed), questions per user / school / all schools per day, token prices for the cost estimate, *Test connection*.
Usage is logged as counts and tokens only. Questions and answers are not stored on the server.
Use a **paid** Gemini key: on the free tier Google may use the data to improve its products.

## Accounting export / import (Sage and Ciel)

Settings → *Accounting (Sage / Ciel)* (principal). One file layout for both packages: CSV, semicolon-separated, UTF-8 with BOM, dates dd/mm/yyyy, FCFA without decimals, columns `Journal;Date;Piece;Compte;Tiers;Libelle;Debit;Credit`, one line per debit and per credit, always balanced.

- **Fee payments received**: debit cash / mobile money / bank, credit the student account (411, matricule as *Tiers*), piece = receipt number.
- **Fees owed (per term)**: debit student account, credit fees income, dated the first day of the term; includes any imported opening balance in Term 1.
- **Teacher pay (hours)**: debit payroll expense, credit staff payable, per teacher for a month (needs the tracking module).
- **Platform subscription invoices**: invoices (debit expense, credit supplier) and payments made.
- Account numbers and journal codes default to SYSCOHADA values and are editable per school. If a chart of accounts has been imported, saving an account that is not in it asks for confirmation.
- **Import chart of accounts**: two columns (account, label); replaces the stored chart.
- **Import opening balances**: student accounts by matricule, as Debit/Credit columns or one balance column. A preview shows matches before anything is saved. Amounts are added to Term 1 fees (replacing an earlier import for the same student); credit balances and other accounts are ignored. They can be removed again.
- Exports follow the same rules as other statistics: blocked while a Term 3 invoice is unpaid.

## Teacher report cards

Teacher reports (principal menu, complete package only: reports + fees + tracking). A private, informational profile per teacher for a term or the whole year, with a Print / PDF button. It is not a score, there is no ranking or comparison table between teachers, teachers cannot see it and it is not linked to pay.

- **Results, relative to other subjects:** for each subject the teacher teaches, the subject's average is compared with the same students' coefficient-weighted average in their other subjects (points out of 20). A weak class therefore does not count against the teacher, only a subject that lags behind the same students' other subjects. Bands: +1 or more above, between -1 and +1 in line, -1 or less below. Classes with fewer than 8 students are flagged as low confidence. The class average per sequence is shown as the trend.
- **Presence and duties:** lessons (scheduled, present, late, absent, replaced, not confirmed, covered for colleagues, lessons with a "what was taught" summary), marks (sequence sheets submitted, submitted after report cards were published, not submitted), roll calls (when the school uses them), exam invigilation (assigned, confirmed, missed), gate (days, arrived by day start + 15 min, early departures, back-filled entries).
- Subjects are those assigned to the teacher (including per-sequence assignments). Opening a profile is written to the school's activity log. Output is blocked while a Term 3 invoice is unpaid, like other statistics.


## School sign-up wizard
The sign-up screen (`public/signup.js`, `public/signup.css`) is a 5-step wizard: School & admin, Packages, Review, Verify email, Done. Package prices come from `GET /api/prices` (the live price table), so owners' price changes show up at once. `POST /api/signup` now accepts `modules` (CSV, stored on the school) and derives the principal's username from the full name when none is sent; it returns `username`. Discount/referral codes are not built yet.

## Referral programme
- `referral.js`, `public/ref.html` (page at `/ref`): anyone can create a referral account (email verified with a 6-digit code). The dashboard shows their code and link (`/?ref=CODE` opens the school sign-up with the code filled in), referred schools (name, date, status, earned), totals and payouts. Referrers never see a school's email, people or payments.
- A school that signs up with a code gets 10% off, and the referrer earns 10% of what it pays. The year is 365 days from sign-up: an invoice counts if its term starts inside that year (it is flagged `invoices.ref_pct` when drafted). Commission is booked per payment received (`referral_earnings`) on those invoices only; the commitment fee is excluded. A manual discount set in the owners' console wins if it is higher than 10%.
- Owners' console, Referrals tab: totals, per-referrer earned/paid/payable, **Record payout** (amount cannot exceed what is payable; MoMo/Orange/bank need a reference; logged in the activity log), and Disable/Enable (owner only). Payouts are made by hand outside the platform.
