import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../../../../..');
const publicDir = path.join(root, 'backend/vercel/public');
const previewDir = path.join(__dirname, '../preview');
const phase = process.argv[2] === 'after' ? 'after' : 'before';
const outDir = path.join(__dirname, phase);

fs.mkdirSync(outDir, { recursive: true });

function contentType(filePath) {
  if (filePath.endsWith('.css')) return 'text/css; charset=utf-8';
  if (filePath.endsWith('.svg')) return 'image/svg+xml';
  if (filePath.endsWith('.ttf')) return 'font/ttf';
  if (filePath.endsWith('.png')) return 'image/png';
  if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) return 'image/jpeg';
  return 'text/html; charset=utf-8';
}

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  let filePath;
  if (urlPath === '/' || urlPath.endsWith('.html')) {
    const name = urlPath === '/' ? 'known.html' : path.basename(urlPath);
    filePath = path.join(previewDir, name);
  } else {
    filePath = path.join(publicDir, urlPath.replace(/^\//, ''));
  }
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404);
    res.end('missing');
    return;
  }
  res.writeHead(200, { 'Content-Type': contentType(filePath) });
  res.end(fs.readFileSync(filePath));
});

async function shot(page, name, fullPage = true) {
  const file = path.join(outDir, name);
  if (fullPage) {
    const height = await page.evaluate(() => Math.min(Math.max(document.body.scrollHeight, 900), 4200));
    const width = page.viewport().width;
    await page.setViewport({ width, height, deviceScaleFactor: 1 });
    await page.screenshot({ path: file, fullPage: false, captureBeyondViewport: false });
  } else {
    await page.screenshot({ path: file, fullPage: false });
  }
  return file;
}

async function measure(page) {
  return page.evaluate(() => {
    const h1 = document.querySelector('#gateway-headline');
    const lede = document.querySelector('.v5-intro .lede');
    const theatre = document.querySelector('.v5-theatre');
    const hero = document.querySelector('.v5-product-card');
    const intro = document.querySelector('.v5-intro');
    const context = document.querySelector('.v5-intro .context');
    const gallery = document.querySelector('.mystery-stage');
    const openName = document.querySelector('[data-pillar="open"] .pillar-name');
    const openIcon = document.querySelector('[data-pillar="open"] .pillar-icon');
    const dog = document.querySelector('[data-pillar="body"] .pillar-dogear');
    const stack = document.querySelectorAll('.stack-card');
    const box = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return {
        top: Math.round(r.top),
        bottom: Math.round(r.bottom),
        height: Math.round(r.height),
        width: Math.round(r.width),
        marginTop: cs.marginTop,
        marginBottom: cs.marginBottom,
        paddingTop: cs.paddingTop,
        paddingBottom: cs.paddingBottom,
        display: cs.display,
        position: cs.position,
        clip: cs.clip,
        overflow: cs.overflow,
        visibility: cs.visibility,
        fontSize: cs.fontSize,
        text: (el.textContent || '').trim().slice(0, 80),
      };
    };
    const gapLedeToHero = hero && lede ? Math.round(hero.getBoundingClientRect().top - lede.getBoundingClientRect().bottom) : null;
    const gapH1ToHero = hero && h1 ? Math.round(hero.getBoundingClientRect().top - h1.getBoundingClientRect().bottom) : null;
    const medallion = document.querySelector('.medallion-disc') || document.querySelector('.mystery-medallion');
    const socket = document.querySelector('.medallion-socket');
    const intersects = (a, b) => {
      if (!a || !b) return null;
      const ra = a.getBoundingClientRect();
      const rb = b.getBoundingClientRect();
      return !(ra.right <= rb.left || ra.left >= rb.right || ra.bottom <= rb.top || ra.top >= rb.bottom);
    };
    const stackRects = Array.from(stack).map((el, i) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return {
        i,
        top: Math.round(r.top),
        left: Math.round(r.left),
        right: Math.round(r.right),
        bottom: Math.round(r.bottom),
        width: Math.round(r.width),
        height: Math.round(r.height),
        layoutW: el.offsetWidth,
        layoutH: el.offsetHeight,
        transform: cs.transform,
        filter: cs.filter,
        background: cs.backgroundColor,
        border: cs.border,
      };
    });
    const pillarNames = Array.from(document.querySelectorAll('.pillar-name')).map((el) => {
      const cs = getComputedStyle(el);
      return {
        text: (el.textContent || '').trim(),
        fontSize: cs.fontSize,
        whiteSpace: cs.whiteSpace,
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
        wraps: el.scrollHeight > el.clientHeight + 1,
      };
    });
    return {
      h1: box(h1),
      lede: box(lede),
      context: box(context),
      intro: box(intro),
      theatre: box(theatre),
      hero: box(hero),
      gallery: box(gallery),
      openName: box(openName),
      openIcon: box(openIcon),
      dog: box(dog),
      stackCount: stack.length,
      stackRects,
      stageSize: gallery
        ? {
            width: Math.round(gallery.getBoundingClientRect().width),
            height: Math.round(gallery.getBoundingClientRect().height),
          }
        : null,
      pillarNames,
      gapLedeToHero,
      gapH1ToHero,
      openNameHitsMedallion: intersects(openName, medallion),
      openIconHitsMedallion: intersects(openIcon, medallion),
      openNameHitsSocket: intersects(openName, socket),
      openIconHitsSocket: intersects(openIcon, socket),
      galleryBorder: gallery ? getComputedStyle(gallery).border : null,
      galleryBoxShadow: gallery ? getComputedStyle(gallery).boxShadow : null,
      heroBoxShadow: hero ? getComputedStyle(hero).boxShadow : null,
    };
  });
}

async function main() {
  const puppeteer = (await import('puppeteer')).default;
  await new Promise((resolve) => server.listen(4197, '127.0.0.1', resolve));
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });

  const report = { phase };

  for (const width of [390, 1440]) {
    const page = await browser.newPage();
    await page.setViewport({ width, height: width >= 900 ? 900 : 844, deviceScaleFactor: 1 });
    await page.goto('http://127.0.0.1:4197/known.html', { waitUntil: 'networkidle2', timeout: 60000 });
    await page.evaluate(() => document.body.classList.add('gateway-ready'));
    await page.evaluate(async () => {
      if (document.fonts?.ready) await document.fonts.ready;
      const img = document.querySelector('.v5-photo img');
      if (img && !img.complete) {
        await new Promise((resolve) => {
          img.addEventListener('load', resolve, { once: true });
          img.addEventListener('error', resolve, { once: true });
          setTimeout(resolve, 4000);
        });
      }
    });
    await new Promise((r) => setTimeout(r, 400));
    report[`w${width}`] = await measure(page);
    await shot(page, `full-${width}.png`, true);

    // Close-ups
    await page.evaluate(() => document.querySelector('.v5-theatre')?.scrollIntoView({ block: 'start' }));
    await new Promise((r) => setTimeout(r, 150));
    await shot(page, `hero-zone-${width}.png`, false);

    await page.evaluate(() => document.querySelector('.mystery-stage')?.scrollIntoView({ block: 'center' }));
    await new Promise((r) => setTimeout(r, 150));
    await shot(page, `perspectives-${width}.png`, false);

    const openTile = await page.$('[data-pillar="open"]');
    if (openTile) await openTile.screenshot({ path: path.join(outDir, `transparency-${width}.png`) });
    const bodyDog = await page.$('[data-pillar="body"] .pillar-dogear');
    if (bodyDog) await bodyDog.screenshot({ path: path.join(outDir, `dogear-body-${width}.png`) });
    const heroDog = await page.$('.v5-product-card .hero-dogear');
    if (heroDog) await heroDog.screenshot({ path: path.join(outDir, `dogear-hero-${width}.png`) });
    const perspDog = await page.$('.mystery-stage .perspectives-dogear');
    if (perspDog) await perspDog.screenshot({ path: path.join(outDir, `dogear-perspectives-${width}.png`) });
    const bodyTile = await page.$('[data-pillar="body"]');
    if (bodyTile) await bodyTile.screenshot({ path: path.join(outDir, `pillar-body-${width}.png`) });
    const wrap = await page.$('.v5-gallery-wrap');
    if (wrap) await wrap.screenshot({ path: path.join(outDir, `stack-wrap-${width}.png`) });

    await page.close();
  }

  fs.writeFileSync(path.join(outDir, 'metrics.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  await browser.close();
  server.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
