# Omitsu Studio — Self-Hosted PWA

Drop these files at the root (or a sub-path) of any static host (GitHub Pages, Netlify, S3, Nginx, Caddy).
All asset paths are RELATIVE so it works under sub-paths like `https://yoursite.com/omitsu/`.

## Files
- `index.html` (or `app.html`) — the editor
- `manifest.webmanifest` — PWA manifest
- `sw.js` — service worker (offline cache)
- `favicon.ico`, `apple-touch-icon.png`, `pwa-icon-192.png`, `pwa-icon-512.png` — icons

## Requirements
- Must be served over **HTTPS** (or `localhost`) for the service worker + Add-to-Home-Screen.
- No build step; pure static files.

## GitHub Pages
1. Create a repo, drop these files in the root (or `docs/`).
2. Enable Pages → main branch → root.
3. Visit `https://<user>.github.io/<repo>/` — icon and PWA install will work.
