# Wedify

A Spotify-style digital wedding invitation with a real backend and admin dashboard: the invitation is an album, the schedule is a tracklist, the music player actually plays, and every word on the page can be edited from the dashboard.

Live demo: https://wedify.xsrazy.web.id
Dashboard: https://wedify.xsrazy.web.id/dashboard

![Wedify — Usra & Zee: The Wedding Album](assets/images/og-image.jpg)

> Wedify is inspired by the interface of music streaming apps. It is not affiliated with or endorsed by Spotify.

## About

Wedify turns a wedding invitation into a music album experience. Guests open the invitation from an album cover screen personalized with their name, press the big green Play button, and the invitation starts together with its soundtrack. The whole page is styled like a streaming app: a Now Playing header, a real working player bar, a tracklist for the schedule, artist profiles for the couple with real Follow buttons, a Wrapped-style stats section, a lyrics card for a sacred verse, a merch section for love gifts, and a comment-style guestbook.

Unlike a static template, Wedify ships with its own backend and admin dashboard. The couple logs in and edits everything (names, photos, music, schedule, venue, gift accounts, gallery, the verse) from a form; changes go live for every guest immediately. Follows and wishes are stored in a real database, and the dashboard shows live statistics, comment moderation, a guest list with personalized link generation, and a CSV export.

The demo data is a fictional sample wedding (Usra & Zee, 17 January 2050, Jam Gadang, Bukittinggi). Replace it from the dashboard, no code changes needed.

## Features

- Album cover gate with guest personalization via `?to=Guest Name` (the cover shows a "Made for you" box and pre-fills the RSVP name)
- Real music player: fixed bottom player bar with play/pause, live progress bar, track times, and a like button; the cover Play button starts the music
- Real Follow buttons: one follow per visitor per artist, stored in the database; clicking again unfollows and the count goes down, on the page and in the dashboard
- Live countdown to the wedding day (days, hours, minutes, seconds)
- Tracklist schedule: Akad (track 1) and Resepsi (track 2) with venue address, dress code chips, a Google Maps button, and a Save The Date button (Google Calendar)
- "About the Artists" couple profiles with follower counts
- Wedify Wrapped: playful stat cards (match percentage, days to the main stage, top genre, best collaboration)
- Lyrics card with a Quranic verse (QS. Ar-Rum 21)
- Photo gallery fed from the dashboard settings
- Love Gift as "Exclusive Merch": bank/e-wallet cards with masked numbers and copy-to-clipboard buttons
- RSVP + guestbook stored server-side, with attendance badges
- Admin dashboard (`/dashboard`):
  - Home: live statistics (comments, likes, present, absent, followers per artist), comment moderation, CSV download
  - Konten Web: one form for all site content (couple, album, music, schedule, venue, dress code, verse, Wrapped texts, gift accounts, gallery, share text)
  - Tamu: guest list that generates personalized invitation links and WhatsApp share links
  - Setting: admin name, change password, guest access key regeneration, comment toggles (replies, editing, deletion, bad-word filter)
- Full SEO: meta description and keywords, Open Graph and Twitter cards with a dedicated OG image, canonical URL, JSON-LD, robots.txt, sitemap.xml, favicon set
- Every `*.vercel.app` URL permanently redirects to the canonical domain
- Mobile-first single-column app layout, no build step, no framework

## Architecture

- Front end: static `index.html` + `css/app.css` + `js/app.js` (vanilla JavaScript, zero dependencies). The page renders entirely from `GET /api/config`, with built-in fallback content if the API is unreachable.
- Back end: zero-dependency Node.js Vercel Functions in `api/` (CommonJS):
  - `GET /api/config` — public site content + guest access key + follow counts and the visitor's own follow state
  - `GET/POST /api/comment`, `GET/POST/PATCH/PUT/DELETE /api/comment/:id` — guestbook with replies, likes, owner-token editing, moderation
  - `POST /api/follow` — toggles a follow for `groom` or `bride` (one per visitor IP)
  - `POST /api/session` — admin login (JWT, 7 days, token-version revocation on password change)
  - `GET/PATCH /api/user` — admin profile, settings, and the site content (whitelist-validated merge)
  - `PUT /api/key` — regenerate the guest access key
  - `GET /api/stats` — dashboard statistics
  - `GET /api/download` — comments CSV export (formula-injection safe)
  - `GET/POST /api/guest`, `DELETE /api/guest/:id` — saved guest list for personalized links
- Database: one versioned JSON document in a private Vercel Blob store. Writes are serialized with optimistic concurrency; the newest version always wins, so a stale copy can never shadow fresh data. Passwords are scrypt-hashed; a bad-word filter, per-IP rate limits, and strict presence parsing are built in.
- Dashboard: `dashboard.html` with Bootstrap 5 and modular vanilla JS in `js/` (session, comments, guests, site editor). The Konten Web tab is Wedify's addition on top of the dashboard pattern.
- Hosting: Vercel (static files + Functions + Blob). `vercel.json` enables clean URLs and redirects every `*.vercel.app` host to the canonical domain.

## Setup (forks)

1. Fork or clone this repository and import it into Vercel (no build command, no framework preset).
2. Create a private Vercel Blob store and connect it to the project (this provides the `BLOB_READ_WRITE_TOKEN` environment variable).
3. Set these environment variables (names only; choose your own values):
   - `BLOB_READ_WRITE_TOKEN` (added automatically when the store is connected)
   - `AUTH_SECRET` — long random string used to sign admin tokens
   - `ADMIN_EMAIL` — the dashboard login email
   - `ADMIN_PASSWORD` — the initial dashboard password (change it after the first login)
   - `INITIAL_ACCESS_KEY` — the initial guest access key embedded via `/api/config`
4. Deploy, open `/dashboard`, log in, and fill in the Konten Web form. The database document is created automatically on first use with demo content.

## Customization

Almost everything is edited from the dashboard (Konten Web tab): couple names and parents, album artwork and photos (URLs or paths), soundtrack file, wedding date and countdown target, schedule, venue, maps link, calendar times, dress code, the verse, Wrapped texts, gift accounts, gallery images (one URL per line), and the share text. Code changes are only needed for layout or entirely new sections; the fallback demo content lives at the top of `js/app.js` and the database seed defaults in `api/_lib.js`.

## Notes

- Demo gift account numbers are dummy placeholders, replace them before real use.
- The sample soundtrack is a short piano loop shipped only as a placeholder; use music you have the rights to.
- Follow identity is per visitor IP (the same model as comment likes), so counts can differ across a visitor's networks.
- Search metadata intentionally mentions buying and selling invitations: this template is the free, open-source answer for people searching where to buy a digital invitation.

## Credits

Created by Usra ([xsrazy](https://github.com/xsrazy)). The couple illustration was AI-generated for this template. The dashboard and guestbook backend are adapted from the author's earlier wedding invitation project. Interface inspired by music streaming apps; all trademarks belong to their respective owners.

## License

MIT. See the `LICENSE` file.
