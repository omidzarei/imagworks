# SGI Imageworks — Self-Host PWA Package

A standalone, installable Progressive Web App version of the SGI IRIX-themed
photo & video editor. No build step required — just static files.

## Contents
- `index.html` — the entire editor (single-file app)
- `manifest.webmanifest` — PWA manifest (installable, standalone)
- `sw.js` — service worker (offline cache)
- `ScreenBold.ttf` — SGI Screen bitmap font
- `pwa-icon-*.png`, `apple-touch-icon.png`, `splash-logo.png`, `favicon.ico` — icons
- `placeholder-tile.png`, `placeholder.svg` — UI assets

## Quick start (any static host)

Drop the entire folder onto any static web host and serve it over **HTTPS**
(required for PWA install + service workers). Examples:

### Option A — Local test
```bash
cd sgi-imageworks-pwa
python3 -m http.server 8080
# open http://localhost:8080
```
(Service worker won't install on plain `http://` except on `localhost`.)

### Option B — Nginx
```nginx
server {
  listen 443 ssl http2;
  server_name editor.example.com;
  root /var/www/sgi-imageworks-pwa;
  index index.html;

  # Correct MIME types
  types {
    application/manifest+json webmanifest;
    font/ttf                  ttf;
    image/png                 png;
    image/svg+xml             svg;
    text/javascript           js;
  }

  # Never cache the SW or manifest
  location = /sw.js              { add_header Cache-Control "no-cache"; }
  location = /manifest.webmanifest { add_header Cache-Control "no-cache"; }

  # Long-cache static assets
  location ~* \.(png|ttf|ico|svg)$ { add_header Cache-Control "public, max-age=31536000, immutable"; }
}
```

### Option C — Caddy
```caddy
editor.example.com {
  root * /var/www/sgi-imageworks-pwa
  encode zstd gzip
  file_server
  @sw path /sw.js /manifest.webmanifest
  header @sw Cache-Control "no-cache"
}
```

### Option D — GitHub Pages / Netlify / Vercel / Cloudflare Pages
Just upload the folder. HTTPS and correct MIME types are handled automatically.

## Install on iPhone / iPad
1. Open the URL in **Safari**.
2. Tap **Share** → **Add to Home Screen**.
3. Launch from the home-screen icon — runs full-screen, offline-capable.

## Install on Android / Chrome / Edge
Open the URL → browser menu → **Install app** (or **Add to Home screen**).

## Updating
Bump `CACHE` version in `sw.js` (e.g. `sgi-imageworks-v2`) so installed clients
refresh their cached files on next launch.
