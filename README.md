# SecureStore

**Fast, private, no-login text & file sharing.**

SecureStore is a lightweight, self-hostable application for sharing notes and files instantly through short links and QR codes. No accounts, no tracking — just create, edit, and share.

## Features

- **Syncable Notepad** — real-time auto-save with version history. Open the same URL on any device and your notes stay in sync.
- **Ephemeral File Transfer** — upload files up to 10MB, auto-zip multiple files, and share via custom links with configurable expiry.
- **Password Protection** — lock notes with a password. Visitors see read-only until they enter the correct password to unlock editing.
- **QR Code Sharing** — every note and file gets a shareable link with a QR code you can scan from any device.
- **Syntax Highlighting** — CodeMirror-powered editor with highlighting for JavaScript, Python, HTML, CSS, JSON, and Markdown.
- **Auto-Expire Files** — set file lifespan to 1 hour, 24 hours, or 7 days. Files are automatically cleaned up from local disk, Cloudinary, and the database when they expire.
- **Developer Console** — authenticated dashboard for request logs, contact messages, and analytics.

## Tech Stack

- **Frontend** — Next.js 16 (App Router), React 19, CodeMirror 6, QRCodeSVG
- **Backend** — Express.js, MongoDB, Mongoose, Cloudinary (optional)
- **Real-time** — client-side polling for note sync

## Project Structure

```
securestore/
├── client/                 # Next.js frontend
│   ├── public/             # Static assets (favicons, robots.txt, og-cover)
│   ├── src/
│   │   ├── app/            # App Router pages
│   │   │   ├── [slug]/     # Note editor
│   │   │   ├── files/      # File upload page
│   │   │   ├── files/[slug]/  # File download page
│   │   │   ├── dev/        # Developer console (login, log, contact, analytics)
│   │   │   ├── about/      # About page
│   │   │   ├── contact/    # Contact form page
│   │   │   ├── layout.js   # Root layout (metadata, theme, providers)
│   │   │   └── page.js     # Home page
│   │   ├── components/
│   │   │   ├── Navbar.js
│   │   │   ├── ThemeProvider.js
│   │   │   └── DevAuth.js  # Dev auth context
│   │   └── app/globals.css
│   └── next.config.mjs     # API rewrites to backend
├── server/                 # Express.js backend
│   ├── index.js            # Server entry point
│   ├── .env                # Environment variables
│   ├── models/             # Mongoose models (Note, File, Analytics, Contact)
│   ├── routes/             # API routes (notes, files, analytics, contacts, dev)
│   ├── middleware/         # requestLogger, fileValidation, devAuth
│   ├── utils/              # logger, slug, cloudinary, cleanup
│   └── logs/               # Application log files (created at runtime)
└── ...
```

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or cloud)
- Optional: Cloudinary account for cloud storage

### Backend

```bash
cd server
cp .env.example .env      # edit MONGO_URI, DEV_PASSWORD, CLOUDINARY_URL, etc.
npm install
npm run dev               # starts on port 5000 (or PORT env var)
```

### Frontend

```bash
cd client
npm install
npm run dev               # starts on port 3000, proxies /api → backend
```

Open `http://localhost:3000` in your browser.

## Developer Console

The developer console is gated by a password (`DEV_PASSWORD`, default `dev123`). After login you get a persistent JWT that unlocks:

- `/dev/log` — request logs (route, device, IP, status, duration, errors)
- `/dev/contact` — paginated contact messages (infinite scroll)
- `/dev/analytics` — views, visitors, downloads, and data transferred

## Environment Variables

### Backend (`server/.env`)
| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | no | `5000` | Server port |
| `MONGO_URI` | yes | `mongodb://localhost:27017/securestore` | MongoDB connection string |
| `CLIENT_URL` | no | `http://localhost:3000` | CORS origin |
| `CLOUDINARY_URL` | no | — | Cloudinary URL (enables cloud storage) |
| `DEV_PASSWORD` | no | `dev123` | Developer console password |
| `DEV_SECRET` | no | `securestore-dev-secret-change-me` | JWT secret for dev tokens |

### Frontend
The frontend uses Next.js rewrites to proxy `/api/*` to the backend. Set `BACKEND_URL` in `next.config.mjs` (or keep the default `http://localhost:5001`).

## Logging

Every API request is logged to `server/logs/app.log` as JSON lines with: timestamp, level, method, route, path, status code, duration, IP, user-agent, device, browser, OS, referer, and body. Errors include the error message. The `/dev/log` page renders this file in a responsive, filterable table.

## Analytics

The `Analytics` model tracks daily aggregates:
- `totalViews` — page views (split into `noteViews` / `fileViews`)
- `uniqueVisitors` — hashed IPs per day
- `totalDownloads` — file downloads
- `totalFileSize` — bytes transferred

These are surfaced in `/dev/analytics` with all-time totals, a window summary, a daily bar chart, and a daily breakdown table.

## File Lifecycle

1. On upload, the file is saved to `server/uploads/` and optionally mirrored to Cloudinary.
2. A database record stores `expiresAt` (TTL index auto-deletes expired docs).
3. A `node-cron` job runs every 15 minutes and on startup: it finds expired files, deletes the local file, deletes the Cloudinary asset, and removes the database record.

## SEO

- Favicons (SVG + PNG 16/32/48/64/180 + ICO) in `client/public/`
- `robots.txt` and `site.webmanifest`
- Open Graph cover image (`og-cover.svg`)
- Per-page metadata (title, description, Open Graph, Twitter card, canonical, JSON-LD)
- Developer pages are `noindex, nofollow`

## License

MIT