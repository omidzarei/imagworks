#!/usr/bin/env node
/**
 * update-graphics.js
 * ------------------
 * Scans the static asset folders under /public and rewrites their manifests:
 *   - public/Graphics/manifest.json   (background graphics)
 *   - public/Fonts/manifest.json      (custom fonts)
 *
 * Drop a new PNG/JPG into /public/Graphics or a new TTF/OTF/WOFF/WOFF2 into
 * /public/Fonts (any subfolder), then run:
 *
 *   node update-graphics.js
 *
 * The SGI Photo Editor reads these manifests at startup, so new files become
 * immediately available in the Background Graphics dropdown and the Font picker.
 */

import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT          = path.dirname(fileURLToPath(import.meta.url));
const GRAPHICS_DIR  = path.join(ROOT, 'Graphics');
const FONTS_DIR     = path.join(ROOT, 'Fonts');

const IMG_EXT  = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg']);
const FONT_EXT = new Set(['.ttf', '.otf', '.woff', '.woff2']);

// ---------- helpers ----------

function prettyName(filename) {
  return filename
    .replace(/\.[^.]+$/, '')           // strip extension
    .replace(/[-_]+/g, ' ')             // dashes/underscores -> space
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, c => c.toUpperCase());
}

function fontFormat(ext) {
  switch (ext.toLowerCase()) {
    case '.ttf':   return 'truetype';
    case '.otf':   return 'opentype';
    case '.woff':  return 'woff';
    case '.woff2': return 'woff2';
    default:       return 'truetype';
  }
}

/**
 * Detect weight + style from a font filename, e.g.
 *   "ArticulatCF-BoldOblique.otf"  -> { weight: 700, style: 'italic' }
 *   "Lemur-Light.otf"              -> { weight: 300, style: 'normal' }
 */
function detectFontMeta(stem) {
  const s = splitTokens(stem).toLowerCase();
  let weight = 400;
  if (/\b(thin|hairline)\b/.test(s))                weight = 100;
  else if (/\b(extra ?light|ultra ?light)\b/.test(s)) weight = 200;
  else if (/\blight\b/.test(s))                     weight = 300;
  else if (/\b(regular|normal|book)\b/.test(s))     weight = 400;
  else if (/\bmedium\b/.test(s))                    weight = 500;
  else if (/\b(semi ?bold|demi ?bold)\b/.test(s))   weight = 600;
  else if (/\b(extra ?bold|ultra ?bold)\b/.test(s)) weight = 800;
  else if (/\b(black|heavy)\b/.test(s))             weight = 900;
  else if (/\bbold\b/.test(s))                      weight = 700;

  const style = /(italic|oblique)/.test(s) ? 'italic' : 'normal';
  return { weight, style };
}

/**
 * Insert spaces between camel-case boundaries and around punctuation so that
 * "BoldOblique" becomes "Bold Oblique" and word-boundary regexes work.
 */
function splitTokens(s) {
  return s
    .replace(/([a-z])([A-Z])/g, '$1 $2')   // camel  -> camel space
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2') // ABCDef -> ABC Def
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract a clean family name from the stem by stripping known weight/style
 * suffixes. "Wonderland Pro" stays intact even when filename has hyphens.
 */
function detectFamily(stem) {
  const cleaned = splitTokens(stem)
    .replace(/\b(thin|hairline|extra ?light|ultra ?light|light|regular|normal|book|medium|semi ?bold|demi ?bold|extra ?bold|ultra ?bold|bold|black|heavy|italic|oblique)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  // Title-case for friendlier display: WONDERLANDPRO -> Wonderlandpro? keep as-is if all caps single word
  return cleaned || splitTokens(stem);
}

function walk(dir, base = dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walk(full, base));
    } else if (entry.isFile()) {
      out.push({
        full,
        rel: path.relative(base, full).split(path.sep).join('/'),
        name: entry.name,
        ext: path.extname(entry.name).toLowerCase(),
      });
    }
  }
  return out;
}

// ---------- 1. Graphics manifest ----------

function buildGraphicsManifest() {
  if (!fs.existsSync(GRAPHICS_DIR)) {
    console.warn('[graphics] folder not found, skipping:', GRAPHICS_DIR);
    return;
  }
  const files = walk(GRAPHICS_DIR)
    .filter(f => IMG_EXT.has(f.ext))
    .sort((a, b) => a.rel.localeCompare(b.rel, undefined, { numeric: true }));

  const manifest = files.map(f => ({
    name: prettyName(path.basename(f.name)),
    file: f.rel,
  }));

  const out = path.join(GRAPHICS_DIR, 'manifest.json');
  fs.writeFileSync(out, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`[graphics] wrote ${manifest.length} entries -> ${path.relative(ROOT, out)}`);
}

// ---------- 2. Fonts manifest ----------

function buildFontsManifest() {
  if (!fs.existsSync(FONTS_DIR)) {
    console.warn('[fonts] folder not found, skipping:', FONTS_DIR);
    return;
  }
  const files = walk(FONTS_DIR)
    .filter(f => FONT_EXT.has(f.ext))
    .sort((a, b) => a.rel.localeCompare(b.rel, undefined, { numeric: true }));

  const manifest = files.map(f => {
    const stem  = f.name.replace(/\.[^.]+$/, '');
    const meta  = detectFontMeta(stem);
    const family = detectFamily(stem);
    return {
      family,                   // CSS font-family value
      file: 'Fonts/' + f.rel,   // path relative to /public
      format: fontFormat(f.ext),
      weight: meta.weight,
      style:  meta.style,
      label:  prettyName(stem), // human-readable label for the picker
    };
  });

  const out = path.join(FONTS_DIR, 'manifest.json');
  fs.writeFileSync(out, JSON.stringify(manifest, null, 2) + '\n');

  const families = [...new Set(manifest.map(m => m.family))];
  console.log(`[fonts]    wrote ${manifest.length} files across ${families.length} families -> ${path.relative(ROOT, out)}`);
  families.forEach(fam => console.log(`           - ${fam}`));
}

// ---------- run ----------

buildGraphicsManifest();
buildFontsManifest();
console.log('Done. Reload the editor — new graphics and fonts will appear automatically.');
