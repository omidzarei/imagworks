import fs from 'fs';
import path from 'path';

const ROOT = '/dev-server/public/omitsu-pwa/Fonts';
const FONT_EXT = new Set(['.ttf', '.otf', '.woff', '.woff2']);

const fmt = ext => ({'.ttf':'truetype','.otf':'opentype','.woff':'woff','.woff2':'woff2'}[ext.toLowerCase()] || 'truetype');

function detectMeta(stem){
  const s = stem.toLowerCase().replace(/[-_]+/g,' ');
  let weight = 400;
  if (/\b(thin|hairline)\b/.test(s)) weight=100;
  else if (/extra ?light|ultra ?light/.test(s)) weight=200;
  else if (/\blight\b/.test(s)) weight=300;
  else if (/\bmedium\b/.test(s)) weight=500;
  else if (/semi ?bold|demi ?bold/.test(s)) weight=600;
  else if (/extra ?bold|ultra ?bold/.test(s)) weight=800;
  else if (/\b(black|heavy)\b/.test(s)) weight=900;
  else if (/\bbold\b/.test(s)) weight=700;
  else if (/\b(regular|normal|book)\b/.test(s)) weight=400;
  const style = /italic|oblique/.test(s) ? 'italic' : 'normal';
  return {weight, style};
}

// Manual mapping: file path → {family, group, label}
function describe(rel, stem){
  const lower = rel.toLowerCase();
  // Win95 — use only woff2
  if (lower.includes('win95')) return {group:'W95F', label:'W95F (Windows 95)'};
  if (stem === '_decterm')     return {group:'Decterm', label:'Decterm'};
  if (lower.includes('cinecav')) return {group:'Cinecav D Mono', label:'Cinecav D Mono'};
  if (lower.includes('ligonbold_oz')) return {group:'Ligon Bold OZ', label:'Ligon Bold OZ'};
  if (lower.includes('benyoritha')) return {group:'Benyoritha', label:'Benyoritha G334D'};
  if (lower.includes('fixedsys')) return {group:'Fixedsys62', label:'Fixedsys 62'};
  if (lower.includes('sudovariable')) return {group:'Sudo', label:'Sudo Variable'};
  if (lower.includes('screenbold')) return {group:'Screen Bold', label:'Screen Bold'};
  if (lower.includes('optician')) return {group:'Optician Sans', label:'Optician Sans'};
  if (lower.includes('sgi-text')) return {group:'SGI Text', label:'SGI Text'};

  // ArticulatCF-Bold.otf etc
  if (lower.includes('articulatcf')) {
    const variant = stem.replace(/^ArticulatCF[-_]?/i,'').replace(/([a-z])([A-Z])/g,'$1 $2').trim() || 'Regular';
    return {group:'Articulat CF', label:'Articulat CF ' + variant};
  }
  if (lower.includes('lemur')) {
    const variant = stem.replace(/^Lemur[-_]?/i,'').replace(/([a-z])([A-Z])/g,'$1 $2').trim() || 'Regular';
    return {group:'Lemur', label:'Lemur ' + variant};
  }
  if (lower.includes('wonderland')) {
    const variant = stem.replace(/^WONDERLANDPRO[-_]?/i,'').replace(/([a-z])([A-Z])/g,'$1 $2').trim() || 'Regular';
    return {group:'Wonderland Pro', label:'Wonderland Pro ' + variant};
  }
  // Fallback
  const pretty = stem.replace(/[-_]+/g,' ').replace(/([a-z])([A-Z])/g,'$1 $2');
  return {group: pretty, label: pretty};
}

function walk(dir, base=dir){
  const out=[];
  for (const e of fs.readdirSync(dir,{withFileTypes:true})){
    const full = path.join(dir,e.name);
    if (e.isDirectory()) out.push(...walk(full,base));
    else if (e.isFile()) out.push({rel: path.relative(base,full).split(path.sep).join('/'), name:e.name, ext:path.extname(e.name).toLowerCase()});
  }
  return out;
}

const files = walk(ROOT).filter(f=>FONT_EXT.has(f.ext)).sort((a,b)=>a.rel.localeCompare(b.rel,undefined,{numeric:true}));

// Win95: keep only woff2 (smallest, modern)
const seenW95 = new Set();
const filtered = [];
for (const f of files){
  if (/win95/i.test(f.rel)){
    if (f.ext !== '.woff2') continue;
    if (seenW95.has('w95')) continue;
    seenW95.add('w95');
  }
  filtered.push(f);
}

const manifest = filtered.map(f => {
  const stem = f.name.replace(/\.[^.]+$/,'');
  const meta = detectMeta(stem);
  const d = describe(f.rel, stem);
  // family is the unique label so Canvas2D resolves the right file
  return {
    family: d.label,
    group:  d.group,
    file:   'Fonts/' + f.rel,
    format: fmt(f.ext),
    weight: meta.weight,
    style:  meta.style,
    label:  d.label,
  };
});

fs.writeFileSync(path.join(ROOT,'manifest.json'), JSON.stringify(manifest, null, 2)+'\n');
console.log('Wrote', manifest.length, 'entries');
const groups = {};
manifest.forEach(m => { (groups[m.group]=groups[m.group]||[]).push(m.label); });
Object.keys(groups).sort().forEach(g => {
  console.log('\n['+g+']');
  groups[g].forEach(l => console.log('  •', l));
});
