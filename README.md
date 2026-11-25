# CRYPTON — IEEE CTF

A deliberately vulnerable web application for **CRYPTON**, the **IEEE technical event**,
Department of MCA, Ramaiah Institute of Technology. Built with **React + Vite + GSAP ScrollTrigger** on the front end
and **Express + node:sqlite** on the back end.

> Run this only on an isolated local machine / lab VM. Every vulnerability is intentional.

---

## Quick start

```bash
cd ~/crypton
npm run install:all     # one-time: installs root, server and client deps
npm run dev             # starts Express (:7000) and Vite (:5173)
```

- Player UI: <http://localhost:5173>
- Vulnerable API: <http://localhost:7000>

Production build (Express serves the built React app):

```bash
npm run build
npm --prefix server start   # http://localhost:7000
```

Verify that all 10 flags are actually reachable:

```bash
npm --prefix server run verify
```

---

## Player accounts and submissions

Players must **register and log in before they can submit flags**. The account system is separate
from the intentionally broken `/api/login` used by the SQLi challenges.

| Endpoint | Purpose |
|----------|---------|
| `POST /api/player/register` | Create account (`username`, `password`) and start a session |
| `POST /api/player/login` | Log in and start a session |
| `POST /api/player/logout` | End the session |
| `GET /api/player/me` | Current player + their stats |
| `POST /api/submit` | Submit a flag — **requires player session** |
| `GET /api/scoreboard` | Snapshot summary |
| `GET /api/leaderboard` | Live leaderboard snapshot (REST) |
| `GET /api/leaderboard/stream` | Live leaderboard via Server-Sent Events |

Passwords are hashed with scrypt; sessions are random DB-backed tokens in an httpOnly cookie.
Duplicate submissions for the same flag are ignored. Submissions are stored in SQLite, so solves
survive a server restart until the database is deleted.

---

## Live leaderboard

The `/leaderboard` page opens an `EventSource` to `/api/leaderboard/stream`. Every successful flag
submission broadcasts a new ranking to all connected browsers immediately; if SSE is unavailable
the page falls back to polling `/api/leaderboard` every three seconds.

---

## Home page and animation

The theme is a futuristic cyberpunk terminal in deep midnight navy / near-black with electric cyan,
neon blue and violet-purple gradients. Neon green is reserved for interactive and success states.

**GSAP ScrollTrigger** is used across the whole site, not just the home page:

- Home: boot-timed hero entrance, clipped flag-directory row reveals, scroll-bound progress bar
  and drifting matrix grid, count-up stats and section reveals.
- Lab, Submit, Login/Register and Leaderboard: shared `useScrollReveal` hook animates headers,
  terminal windows and table rows as they enter the viewport.

Each of the **10 flags has a direct hint** on the home page — it names the endpoint and the exact
payload. The client bundle contains **hints only** (except flag 09, which is intentionally shipped
in `client/public/assets/config.js`). Real flag values live in `server/flags.js`.

---

## Flag format

Every flag is `RITCTF{TECHNICAL_PHRASE}` — the body names the vulnerability class, for example
`RITCTF{SQL_AUTHENTICATION_BYPASS}` or `RITCTF{DEBUG_ENDPOINT_INFORMATION_DISCLOSURE}`. No plain
numbers or leetspeak.

## Flag map

| # | Name | Technique | Where it hides | Direct hint / solve |
|---|------|-----------|----------------|---------------------|
| 01 | Source Recon | Recon | `client/index.html` | Read the HTML comment near the top of the document |
| 02 | Robots Are Friendly | Recon | `server/data/robots.txt` | Request `/robots.txt`; the last line is the flag |
| 03 | Admin Bypass | SQLi | `/admin` | Login with `' OR '1'='1' -- ` / any password, then open `/admin` |
| 04 | Cookie Forgery | Access control | `/member` | Login as `varun` / `hunter2`, change `role` cookie to `admin`, open `/member` |
| 05 | Profile Hopping | IDOR | `/api/users/2` | Change the user id from 1 to 2 and read `private_note` |
| 06 | Error Based SQLi | SQLi | SQLite error response | Search `'` — `debug_flag` leaks in the error JSON |
| 07 | Debug Endpoint | Misconfiguration | `/api/debug` | Open the URL; the JSON response has a `flag` field |
| 08 | Header Leak | Information disclosure | `/api/health` | DevTools → Network → response header `X-CTF-Flag` |
| 09 | Client Secret | Client-side exposure | `/assets/config.js` | Open the static file and read `CLIENT_SECRET` |
| 10 | Legacy Login | Default credentials | `/legacy-login` | Sign in with `admin` / `admin` |

Total available points: **675**.

---

## Structure

```
crypton/
├── client/                  React + Vite + GSAP
│   ├── index.html           flag 01 (HTML comment)
│   ├── public/assets/config.js  flag 09 (client secret)
│   └── src/
│       ├── data/hints.js    direct hints (no flags except the shipped config above)
│       ├── hooks/useScrollReveal.js  shared ScrollTrigger animations
│       ├── contexts/PlayerContext.jsx
│       └── pages/           Home, Lab, Auth, Submit, Leaderboard
├── server/
│   ├── flags.js             ALL 10 REAL FLAGS (server only)
│   ├── db.js                SQLite schema + seed data
│   ├── players.js           player auth, sessions, scoring, leaderboard
│   ├── index.js             vulnerable Express endpoints + checker
│   ├── verify.mjs           automated solver / regression check
│   └── data/                robots.txt, humans.txt
└── README.md
```

## Deploying and sharing

The built client and the API are designed to run on **one origin** — Express serves `client/dist`
and all `/api/*` calls are relative. That avoids CORS/cookie problems and makes sharing simple.
Use **Node 22+** (`node:sqlite` is required); Node 24 is what this was built with.

### Option A — quick public link with a tunnel (no domain needed)

1. Build the client once (no `.env` needed — empty `VITE_API_URL` means same-origin):

   ```bash
   npm run build
   ```

2. Run the server permanently:

   ```bash
   npm --prefix server install --omit=dev
   PORT=7000 COOKIE_SECURE=true pm2 start server/index.js --name crypton
   ```

   If you do not have PM2: `COOKIE_SECURE=true node server/index.js`.

3. Start a Cloudflare quick tunnel under PM2. Force HTTP/2 (`--protocol http2`) — QUIC/UDP is
   often blocked on campus/LAN networks and causes intermittent Cloudflare **error 1033**:

   ```bash
   pm2 start /home/varun/.local/bin/cloudflared \
     --name crypton-tunnel -- \
     --url http://localhost:7000 --protocol http2
   pm2 save
   pm2 logs crypton-tunnel | grep trycloudflare.com
   ```

   It prints an `https://<random>.trycloudflare.com` URL. Send that link to participants.

   > Quick tunnel URLs change when you restart `cloudflared`. For a stable URL, use a named
   > Cloudflare Tunnel bound to a domain you control.

### Option B — permanent VPS + domain + HTTPS

Point a DNS A record (for example `crypton.example.edu`) at the VPS, then:

```nginx
server {
    listen 80;
    server_name crypton.example.edu;

    location / {
        proxy_pass http://127.0.0.1:7000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Required for the SSE leaderboard stream.
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 3600s;
    }
}
```

Then:

```bash
sudo certbot --nginx -d crypton.example.edu
sudo ufw allow 80/tcp && sudo ufw allow 443/tcp
npm run build
PORT=7000 COOKIE_SECURE=true pm2 start server/index.js --name crypton
pm2 save && pm2 startup
```

Open `https://crypton.example.edu` and share it.

### If you must host the API on a different origin

Set `VITE_API_URL=https://api.example.edu` in `client/.env` and rebuild. Cookies are currently
`SameSite=Lax`, so cross-site use also needs `SameSite=None; Secure` in `server/players.js`.
Same-origin hosting (Options A/B) is strongly recommended.

### What to send participants

- **URL:** the HTTPS link above.
- **Flow:** open the home page → use the 10 direct hints → **register/login** at `/login` →
  submit flags at `/submit` → watch `/leaderboard` for live ranks.
- **Flag format:** `RITCTF{TECHNICAL_PHRASE}`.
- **Reset between batches:** delete `server/ctf.db`, then restart the server. That removes all
  accounts, submissions and solves.

> This app is intentionally vulnerable. Run it on an isolated lab VM, never on a host with real
> user data, and do not expose the raw port 7000 publicly — keep it behind HTTPS/proxy or a tunnel.

---

## Notes for organisers

- Change flag strings in `server/flags.js`, then update their hardcoded copies in
  `client/index.html` (flag 01), `server/data/robots.txt` (flag 02) and
  `client/public/assets/config.js` (flag 09). Flags 07, 08 and 10 only exist in `server/flags.js`.
- Delete `server/ctf.db` to reseed the database with new flag values.
- `/api/login` is intentionally vulnerable for flags 03/04; do not "fix" it. Player accounts
  live under `/api/player/*` and are not part of the challenges.
- Set `COOKIE_SECURE=true` behind HTTPS so session cookies are marked `Secure`.
