import { renderShareLandingHtml } from '../../../../backend/vercel/lib/shareLandingHtml.bundle.mjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const out = __dirname;

const cadbury = {
  product_name: 'Dairy Milk Milk Chocolate',
  brands: 'Cadbury',
  image_url: 'https://images.openfoodfacts.org/images/products/930/061/706/4879/front_en.50.400.jpg',
};

const known = renderShareLandingHtml({
  barcode: '9300617064879',
  query: { ctx: 'truScore' },
  productData: cadbury,
  origin: 'http://127.0.0.1:4182',
});
const unknown = renderShareLandingHtml({
  barcode: '0000000000000',
  query: {},
  productData: null,
  origin: 'http://127.0.0.1:4182',
});
const noImage = renderShareLandingHtml({
  barcode: '9300617064879',
  query: { ctx: 'truScore' },
  productData: { product_name: 'Dairy Milk Milk Chocolate', brands: 'Cadbury' },
  origin: 'http://127.0.0.1:4182',
});

fs.writeFileSync(path.join(out, 'known.html'), known);
fs.writeFileSync(path.join(out, 'unknown.html'), unknown);
fs.writeFileSync(path.join(out, 'no-image.html'), noImage);
console.log(JSON.stringify({
  reveal: known.includes('Reveal what’s inside'),
  unknown: unknown.includes("couldn't identify"),
  mist: known.includes('pillar-veil-mist'),
  scoreDom: /\d+\s*\/\s*25/.test(known),
  auto: /triedAuto|openInApp\(true\)/.test(known),
  upc: /upcitemdb/i.test(known),
}));

