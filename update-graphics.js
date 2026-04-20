#!/usr/bin/env node
/**
 * update-graphics.js
 * Run this whenever you add or remove files from the Graphics/ folder:
 *
 *   node update-graphics.js
 *
 * It scans Graphics/, then patches the CANVAS_GRAPHICS array directly
 * inside index.html so the dropdown is updated next time you open the app.
 *
 * File names are auto-formatted as display names:
 *   my_cool_texture.png  →  "My Cool Texture"
 *   noise-2.jpg          →  "Noise 2"
 */

const fs   = require('fs');
const path = require('path');

const GRAPHICS_DIR = path.join(__dirname, 'Graphics');
const HTML_FILE    = path.join(__dirname, 'index.html');
const IMAGE_EXTS   = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg']);

function toDisplayName(filename) {
  return path.basename(filename, path.extname(filename))
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

// Scan Graphics/ folder
const files = fs.readdirSync(GRAPHICS_DIR)
  .filter(f => IMAGE_EXTS.has(path.extname(f).toLowerCase()))
  .sort();

const entries = files.map(f => ({ name: toDisplayName(f), src: 'Graphics/' + f }));
const newArray = JSON.stringify(entries);

// Patch index.html — replace the CANVAS_GRAPHICS = [...] line
let html = fs.readFileSync(HTML_FILE, 'utf8');
const before = html;
html = html.replace(
  /var CANVAS_GRAPHICS = \[.*?\];/,
  'var CANVAS_GRAPHICS = ' + newArray + ';'
);

if (html === before) {
  console.error('✗ Could not find CANVAS_GRAPHICS in index.html — nothing updated.');
  process.exit(1);
}

fs.writeFileSync(HTML_FILE, html);

console.log(`✓ index.html updated — ${entries.length} graphic(s):`);
entries.forEach(g => console.log(`  ${g.src}  →  "${g.name}"`));
