// backend/vercel/api/nz-prices.ts

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { chromium } from 'playwright';

interface PriceResult {
  store: string;
  price: number;
  special: boolean;
  name: string;
  size?: string;
  url: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { barcode } = req.query;
  if (!barcode || typeof barcode !== 'string') {
    return res.status(400).json({ error: 'Barcode required' });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
    javaScriptEnabled: true,
  });
  const page = await context.newPage();
  const prices: PriceResult[] = [];

  try {
    // === WOOLWORTHS NZ (ex-Countdown) – working Nov 2025 ===
    await page.goto(`https://www.woolworths.co.nz/shop/search?q=${barcode}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000); // let JS load

    const woolworthsData = await page.evaluate(() => {
      const tile = document.querySelector('.product-tile');
      if (!tile) return null;
      const name = tile.querySelector('h3 a')?.textContent?.trim();
      const priceWhole = tile.querySelector('.price-whole')?.textContent?.trim();
      const priceFraction = tile.querySelector('.price-fraction')?.textContent?.trim() || '00';
      const price = parseFloat(`${priceWhole}.${priceFraction}`);
      const special = !!tile.querySelector('.special-price');
      const link = (tile.querySelector('h3 a') as HTMLAnchorElement)?.href;
      const size = tile.querySelector('.product-tile__size')?.textContent?.trim();
      return { price, name, special, link: link ? `https://www.woolworths.co.nz${link}` : '', size };
    });

    if (woolworthsData?.price) {
      prices.push({
        store: 'Woolworths',
        price: woolworthsData.price,
        special: woolworthsData.special,
        name: woolworthsData.name || 'Unknown',
        size: woolworthsData.size,
        url: woolworthsData.link || 'https://www.woolworths.co.nz',
      });
    }

    // === PAK'NSAVE – working Nov 2025 ===
    await page.goto(`https://www.paknsave.co.nz/shop/search?q=${barcode}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(4000);

    const pakData = await page.evaluate(() => {
      const card = document.querySelector('.fs-product-card');
      if (!card) return null;
      const priceText = card.querySelector('.fs-price__value')?.textContent?.replace('$', '').trim();
      const price = priceText ? parseFloat(priceText) : null;
      const name = card.querySelector('.fs-product-card__description')?.textContent?.trim();
      const special = !!card.querySelector('.fs-price--special');
      const link = (card.querySelector('a') as HTMLAnchorElement)?.href;
      return { price, name, special, link: link ? `https://www.paknsave.co.nz${link}` : '' };
    });

    if (pakData?.price) {
      prices.push({
        store: "Pak'nSave",
        price: pakData.price,
        special: pakData.special,
        name: pakData.name || 'Unknown',
        url: pakData.link || 'https://www.paknsave.co.nz',
      });
    }

    // === NEW WORLD – same engine as Pak'nSave ===
    await page.goto(`https://www.newworld.co.nz/shop/search?q=${barcode}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(4000);

    const nwData = await page.evaluate(() => {
      const card = document.querySelector('.fs-product-card');
      if (!card) return null;
      const priceText = card.querySelector('.fs-price__value')?.textContent?.replace('$', '').trim();
      const price = priceText ? parseFloat(priceText) : null;
      const name = card.querySelector('.fs-product-card__description')?.textContent?.trim();
      const special = !!card.querySelector('.fs-price--special');
      const link = (card.querySelector('a') as HTMLAnchorElement)?.href;
      return { price, name, special, link: link ? `https://www.newworld.co.nz${link}` : '' };
    });

    if (nwData?.price) {
      prices.push({
        store: 'New World',
        price: nwData.price,
        special: nwData.special,
        name: nwData.name || 'Unknown',
        url: nwData.link || 'https://www.newworld.co.nz',
      });
    }

    const sorted = prices
      .filter(p => p.price > 0)
      .sort((a, b) => a.price - b.price);

    res.setHeader('Cache-Control', 's-maxage=7200, stale-while-revalidate=3600');
    return res.json({ prices: sorted.length > 0 ? sorted : [] });

  } catch (error) {
    console.error('Scraping error:', error);
    res.status(500).json({ prices: [] });
  } finally {
    await browser.close();
  }
}

export const config = {
  maxDuration: 60,
};
