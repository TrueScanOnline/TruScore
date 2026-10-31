/**
 * Rasterise the Rveel mark and lockup into the store icon, Android foreground,
 * splash, and favicon. Source artwork lives in assets/brand.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { Resvg } = require('@resvg/resvg-js');
const opentype = require('opentype.js');

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const brand = join(root, 'assets', 'brand');
const assets = join(root, 'assets');
const web = join(root, 'backend', 'vercel', 'public');
mkdirSync(brand, { recursive: true });

const EMERALD = '#0E8A74';
const EMERALD_DEEP = '#075E52';
const EMERALD_LIGHT = '#1AAD90';
const PAPER = '#F7FCFA';

function render(svg, file, size) {
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng();
  writeFileSync(file, png);
  console.log(file, png.length);
}

const fontPath = join(brand, 'Outfit-SemiBold.ttf');
const font = opentype.parse(readFileSync(fontPath));
function wordPathData(size, color) {
  let x = 0;
  const commands = [];
  for (const ch of 'Rveel') {
    const glyph = font.charToGlyph(ch);
    const path = glyph.getPath(x, 0, size);
    commands.push(path.toPathData(2));
    x += (glyph.advanceWidth * size) / font.unitsPerEm;
  }
  const box = font.charToGlyph('R').getPath(0, 0, size).getBoundingBox();
  return { d: commands.join(' '), width: x, top: box.y1, bottom: box.y2 };
}
const word = wordPathData(62, PAPER);
const wordShiftY = 18 - word.top;

const mark = readFileSync(join(brand, 'rveel-mark.svg'), 'utf8')
  .replace(/^[\s\S]*?<svg[^>]*>/, '')
  .replace(/<\/svg>\s*$/, '');

const icon = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <radialGradient id="bg" cx="32%" cy="22%" r="85%">
      <stop offset="0%" stop-color="${EMERALD_LIGHT}"/>
      <stop offset="58%" stop-color="${EMERALD}"/>
      <stop offset="100%" stop-color="${EMERALD_DEEP}"/>
    </radialGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#bg)"/>
  <circle cx="512" cy="500" r="318" fill="none" stroke="rgba(255,255,255,0.14)" stroke-width="2"/>
  <g transform="translate(256 248) scale(8)">
    ${mark}
  </g>
</svg>`;

const adaptive = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <g transform="translate(288 280) scale(7)">
    ${mark}
  </g>
</svg>`;

const lockup = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${Math.ceil(86 + word.width)} 80">
  <g transform="translate(0 8)">
    ${mark}
  </g>
  <path fill="${PAPER}" d="${word.d}" transform="translate(78 ${wordShiftY})"/>
</svg>`;

const lockupInk = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${Math.ceil(86 + word.width)} 80">
  <g transform="translate(0 8)">
    ${mark.replaceAll('#F4FBF8', '#0E8A74')}
  </g>
  <path fill="#101C36" d="${word.d}" transform="translate(78 ${wordShiftY.toFixed(2)})"/>
</svg>`;

const splash = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <g transform="translate(200 430) scale(1.45)">
    ${lockup.replace(/<\?xml[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '')}
  </g>
</svg>`;

writeFileSync(join(brand, 'rveel-icon.svg'), icon);
writeFileSync(join(brand, 'rveel-adaptive.svg'), adaptive);
writeFileSync(join(brand, 'rveel-lockup.svg'), lockup);
writeFileSync(join(brand, 'rveel-lockup-ink.svg'), lockupInk);
writeFileSync(join(web, 'logo.svg'), lockupInk);
writeFileSync(join(web, 'logo-light.svg'), lockup);
writeFileSync(join(web, 'mark.svg'), `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${mark}</svg>`);

render(icon, join(assets, 'icon.png'), 1024);
render(adaptive, join(assets, 'adaptive-icon.png'), 1024);
render(splash, join(assets, 'splash.png'), 1024);
render(icon, join(assets, 'favicon.png'), 48);
render(icon, join(web, 'apple-touch-icon.png'), 180);
render(lockup, join(brand, 'lockup-light.png'), 840);
render(lockupInk, join(brand, 'lockup-ink.png'), 840);
writeFileSync(join(web, 'favicon.svg'), icon);
const og = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <radialGradient id="bg" cx="18%" cy="0%" r="90%">
      <stop offset="0%" stop-color="${EMERALD_LIGHT}"/>
      <stop offset="60%" stop-color="${EMERALD}"/>
      <stop offset="100%" stop-color="${EMERALD_DEEP}"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <g transform="translate(80 250) scale(1.15)">
    ${lockup.replace(/<\?xml[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '')}
  </g>
  <text x="80" y="430" fill="#E7F6F1" font-family="Segoe UI, sans-serif" font-size="36">See the packet before you buy.</text>
</svg>`;
render(og, join(web, 'og.png'), 1200);
