/**
 * Local UAT server: static marketing site + /barcode/:barcode share landings.
 * Run: npx tsx scripts/serve-rveel-site.mjs
 */
import http from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderShareLandingHtml } from '../backend/vercel/lib/shareLandingHtml.bundle.mjs';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const PUBLIC = join(root, 'backend', 'vercel', 'public');
const PORT = Number(process.env.RVEEL_SITE_PORT || 4173);
const PREVIEW_BASE =
  process.env.PRODUCT_PREVIEW_BASE_URL || 'https://truscoreapi.vercel.app';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
};

function safePublicPath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const rel = decoded === '/' ? '/index.html' : decoded;
  const full = normalize(join(PUBLIC, rel));
  if (!full.startsWith(PUBLIC)) return null;
  return full;
}

async function fetchProduct(barcode) {
  try {
    const res = await fetch(
      `${PREVIEW_BASE}/api/product-preview?barcode=${encodeURIComponent(barcode)}`
    );
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.error('[share] product-preview failed', e.message);
    return null;
  }
}

async function handleBarcode(res, barcode, search) {
  const query = Object.fromEntries(new URLSearchParams(search));
  const productData = await fetchProduct(barcode);
  const html = renderShareLandingHtml({
    barcode,
    query,
    productData,
    appStoreId: process.env.APP_STORE_ID || '',
    origin: `http://127.0.0.1:${PORT}`,
  });
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(html);
}

const server = http.createServer(async (req, res) => {
  const rawUrl = req.url || '/';
  const u = new URL(rawUrl, `http://127.0.0.1:${PORT}`);
  const barcodeMatch = u.pathname.match(/^\/barcode\/([0-9]{8,14})\/?$/);
  if (barcodeMatch) {
    return handleBarcode(res, barcodeMatch[1], u.search);
  }

  let filePath = safePublicPath(u.pathname);
  if (!filePath) {
    res.writeHead(400);
    return res.end('Bad path');
  }
  if (existsSync(filePath) && statSync(filePath).isDirectory()) {
    filePath = join(filePath, 'index.html');
  }
  if (!existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    return res.end('Not found');
  }
  const ext = extname(filePath).toLowerCase();
  res.writeHead(200, { 'Content-Type': TYPES[ext] || 'application/octet-stream' });
  res.end(readFileSync(filePath));
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Rveel site http://127.0.0.1:${PORT}/`);
  console.log(`Share example http://127.0.0.1:${PORT}/barcode/9300617064879`);
});
