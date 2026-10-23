# Wedify

A Spotify-style digital wedding invitation template: the invitation is an album, the schedule is a tracklist, and the music player actually plays.

Live demo: https://wedify.xsrazy.web.id

![Wedify — Usra & Zee: The Wedding Album](assets/images/og-image.jpg)

> Wedify is inspired by the interface of music streaming apps. It is not affiliated with or endorsed by Spotify.

## About

Wedify turns a wedding invitation into a music album experience. Guests open the invitation from an album cover screen personalized with their name, press the big green Play button, and the invitation starts together with its soundtrack. The whole page is styled like a streaming app: a Now Playing header, a real working player bar, a tracklist for the schedule, artist profiles for the couple, a Wrapped-style stats section, a lyrics card for a sacred verse, a merch section for love gifts, and a comment-style guestbook.

The demo data is a fictional sample wedding (Usra & Zee, 17 January 2050, Jam Gadang, Bukittinggi). Replace it with your own, see Customization below.

## Features

- Album cover gate with guest personalization via `?to=Guest Name` (the cover shows a "Made for you" box and pre-fills the RSVP name)
- Real music player: fixed bottom player bar with play/pause, live progress bar, track times, and a like button; the cover Play button starts the music
- Live countdown to the wedding day (days, hours, minutes, seconds)
- Tracklist schedule: Akad (track 1) and Resepsi (track 2) with venue address, dress code chips, a Google Maps button, and a Save The Date button (Google Calendar)
- "About the Artists" couple profiles with Follow/Following toggle buttons
- Wedify Wrapped: playful stat cards (100% match, days to the main stage, top genre, best collaboration)
- Lyrics card with a Quranic verse (QS. Ar-Rum 21)
- Photo gallery (6 images)
- Love Gift as "Exclusive Merch": SeaBank and DANA cards with copy-to-clipboard buttons
- RSVP + guestbook form (attendance select + wishes), stored in the visitor's localStorage for the demo
- Share buttons for WhatsApp, Telegram, Facebook, X, plus copy link
- Full SEO: meta description and keywords, Open Graph and Twitter cards with a dedicated OG image, canonical URL, JSON-LD, robots.txt, sitemap.xml, favicon set
- Mobile-first single-column app layout, no build step, no framework

## Architecture

- Pure static site: `index.html` + `css/app.css` + `js/app.js` (vanilla JavaScript, zero dependencies)
- No backend: the guestbook demo persists wishes in localStorage; swap that part of `js/app.js` with your own API for production use
- Assets in `assets/` (album artwork, couple portraits, OG image, icons, and `assets/music/sound.mp3` as the soundtrack)
- Hosting: any static host works; the demo runs on Vercel

## Customization

1. Edit the couple names, texts, schedule, venue, and gift accounts directly in `index.html`.
2. Edit the wedding date and storage key in the `CONFIG` object at the top of `js/app.js`.
3. Replace `assets/images/album.webp` (album cover, square), `assets/images/cowo.webp` and `assets/images/cewe.webp` (couple portraits), and `assets/music/sound.mp3` (soundtrack) with your own files.
4. Regenerate `assets/images/og-image.jpg` with your names so shared links show your album.
5. Point the canonical and Open Graph URLs in `index.html` to your domain.

## Notes

- Demo gift account numbers are dummy placeholders, replace them before real use.
- The sample soundtrack is a short piano loop shipped only as a placeholder; use music you have the rights to.
- Search metadata intentionally mentions buying and selling invitations: this template is the free, open-source answer for people searching where to buy a digital invitation.

## Credits

Created by Usra ([xsrazy](https://github.com/xsrazy)). The couple illustration was AI-generated for this template. Interface inspired by music streaming apps; all trademarks belong to their respective owners.

## License

MIT. See the `LICENSE` file.

(Note: the README references the site source files and assets, which live in the deployed project; this repository is the project's public home for documentation and releases. If GitHub warns the referenced image does not exist in this repo, that is expected and fine.)
