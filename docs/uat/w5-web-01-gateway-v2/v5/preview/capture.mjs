import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../../../../..');
const publicDir = path.join(root, 'backend/vercel/public');
const shotDir = path.join(__dirname, '../screenshots');

fs.mkdirSync(shotDir, { recursive: true });

function contentType(filePath) {
  if (filePath.endsWith('.css')) return 'text/css; charset=utf-8';
  if (filePath.endsWith('.svg')) return 'image/svg+xml';
  if (filePath.endsWith('.js')) return 'text/javascript; charset=utf-8';
  if (filePath.endsWith('.png')) return 'image/png';
  if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) return 'image/jpeg';
  if (filePath.endsWith('.ttf')) return 'font/ttf';
  if (filePath.endsWith('.woff2')) return 'font/woff2';
  return 'text/html; charset=utf-8';
}

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  let filePath;
  if (urlPath === '/' || urlPath.endsWith('.html')) {
    const name = urlPath === '/' ? 'known.html' : path.basename(urlPath);
    filePath = path.join(__dirname, name);
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

async function shot(page, name, opts = {}) {
  const file = path.join(shotDir, name);
  const fullPage = opts.fullPage !== false;
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

async function main() {
  let puppeteer;
  try {
    puppeteer = (await import('puppeteer')).default;
  } catch {
    const { execSync } = await import('child_process');
    execSync('npm install puppeteer@23 --no-save', { cwd: root, stdio: 'inherit' });
    puppeteer = (await import(pathToFileURL(path.join(root, 'node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js')).href)).default;
  }

  await new Promise((resolve) => server.listen(4195, '127.0.0.1', resolve));
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--font-render-hinting=none',
    ],
  });

  const results = {};

  async function capturePage(route, prefix, widths) {
    for (const width of widths) {
      const page = await browser.newPage();
      await page.setViewport({ width, height: width >= 900 ? 900 : 844, deviceScaleFactor: 1 });
      await page.goto(`http://127.0.0.1:4195/${route}`, { waitUntil: 'networkidle2', timeout: 60000 });
      await page.waitForSelector('.v5-gallery');
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
      await new Promise((r) => setTimeout(r, 500));
      const name = `v5-${prefix}-${width}.png`;
      await shot(page, name);
      results[name] = true;
      await page.close();
    }
  }

  await capturePage('known.html', 'cadbury', [390, 1440]);
  await capturePage('unknown.html', 'unknown', [390, 1440]);
  await capturePage('no-image.html', 'no-image', [390]);

  // Reveal sequence at 390
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
    await page.goto('http://127.0.0.1:4195/known.html', { waitUntil: 'networkidle2', timeout: 60000 });
    await page.evaluate(() => document.body.classList.add('gateway-ready'));
    await page.evaluate(() => document.querySelector('.v5-gallery')?.scrollIntoView({ block: 'center' }));
    await new Promise((r) => setTimeout(r, 300));
    await shot(page, 'v5-reveal-before-390.png', { fullPage: false });
    await page.click('#mysteryMedallion');
    await new Promise((r) => setTimeout(r, 280));
    await shot(page, 'v5-reveal-during-390.png', { fullPage: false });
    await new Promise((r) => setTimeout(r, 900));
    await shot(page, 'v5-reveal-after-390.png', { fullPage: false });
    results.reveal = true;
    await page.close();
  }

  // Reduced motion
  {
    const page = await browser.newPage();
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
    await page.goto('http://127.0.0.1:4195/known.html', { waitUntil: 'networkidle2', timeout: 60000 });
    await page.evaluate(() => document.body.classList.add('gateway-ready'));
    await page.evaluate(() => document.querySelector('.v5-gallery')?.scrollIntoView({ block: 'center' }));
    await page.click('#mysteryMedallion');
    await new Promise((r) => setTimeout(r, 200));
    const anim = await page.evaluate(() => {
      const sheen = document.querySelector('.pillar-veil-sheen');
      return sheen ? getComputedStyle(sheen).animationName : null;
    });
    await shot(page, 'v5-reveal-reduced-390.png', { fullPage: false });
    results.reducedMotion = anim;
    await page.close();
  }

  // Contract-ish DOM probe
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844 });
    await page.goto('http://127.0.0.1:4195/known.html', { waitUntil: 'networkidle2' });
    results.cadbury = await page.evaluate(() => {
      const img = document.querySelector('.v5-photo img');
      const q = document.querySelector('.mystery-medallion text');
      return {
        v5: document.body.classList.contains('sheet-gateway-v5'),
        mystery: document.body.classList.contains('sheet-gateway-mystery'),
        title: document.querySelector('.product-title')?.textContent?.trim(),
        brand: document.querySelector('.brand')?.textContent?.trim(),
        img: Boolean(img),
        imgSrc: img?.getAttribute('src') || null,
        scoreDom: /\d+\s*\/\s*25/.test(document.body.innerText) || /\b(Poor|Excellent)\b/.test(document.body.innerText),
        playHref: Boolean(document.querySelector('a[href*="play.google.com"]')),
        question: q?.textContent?.trim() === '?',
        pillars: document.querySelectorAll('.pillar-tile').length,
        mysteryShapes: document.querySelectorAll('.mystery-impression').length,
        padlock: Boolean(document.querySelector('.medallion-lock')),
      };
    });
    await page.close();
  }

  fs.writeFileSync(path.join(shotDir, 'verify.json'), JSON.stringify(results, null, 2));
  await browser.close();
  server.close();
  console.log(JSON.stringify(results, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
