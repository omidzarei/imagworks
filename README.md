# Omitsu Studio — Self-Host PWA

Drop these files at the root of any static host (Nginx, Caddy, Apache, Netlify, Cloudflare Pages, GitHub Pages, S3+CloudFront, etc.).

## Files
- `index.html` — the app (also available as `app.html`)
- `manifest.webmanifest` — PWA manifest
- `sw.js` — service worker (offline cache)
- `pwa-icon-192.png`, `pwa-icon-512.png`, `apple-touch-icon.png`, `favicon.ico`

## Requirements
1. Serve over **HTTPS** (required for service workers + PWA install).
2. `sw.js` MUST be served from the site root (`/sw.js`) with `Content-Type: application/javascript`.
3. `manifest.webmanifest` MUST be served with `Content-Type: application/manifest+json` (most hosts do this automatically).

## Install
- **iPhone Safari**: open the site → Share → Add to Home Screen.
- **Android Chrome / Desktop Chrome / Edge**: address-bar install icon, or menu → Install app.

## Nginx snippet
```
location = /sw.js { add_header Cache-Control "no-cache"; }
location = /manifest.webmanifest { types { } default_type application/manifest+json; }
```
