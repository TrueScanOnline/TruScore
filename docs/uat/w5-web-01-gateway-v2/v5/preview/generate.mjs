import { renderShareLandingHtml } from '../../../../../backend/vercel/lib/shareLandingHtml.bundle.mjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, '../../../../../backend/vercel/public');

const cadbury = {
  product_name: 'Dairy Milk Milk Chocolate',
  brands: 'Cadbury',
  image_url: 'https://images.openfoodfacts.org/images/products/930/061/706/4879/front_en.50.400.jpg',
};

const known = renderShareLandingHtml({
  barcode: '9300617064879',
  query: { ctx: 'truScore' },
  productData: cadbury,
  origin: 'http://127.0.0.1:4195',
});
const unknown = renderShareLandingHtml({
  barcode: '0000000000000',
  query: {},
  productData: null,
  origin: 'http://127.0.0.1:4195',
});
const noImage = renderShareLandingHtml({
  barcode: '9300617064879',
  query: { ctx: 'truScore' },
  productData: { product_name: 'Dairy Milk Milk Chocolate', brands: 'Cadbury' },
  origin: 'http://127.0.0.1:4195',
});

for (const [name, html] of [
  ['known.html', known],
  ['unknown.html', unknown],
  ['no-image.html', noImage],
]) {
  fs.writeFileSync(path.join(__dirname, name), html);
}

fs.writeFileSync(
  path.join(__dirname, 'verify-snippet.json'),
  JSON.stringify(
    {
      v5: known.includes('sheet-gateway-v5'),
      scenes: known.includes('scene-art'),
      aperture: known.includes('v5-aperture'),
      padlock: /padlock|lock path|medallion-lock/i.test(known),
      scoreDom: /\d+\s*\/\s*25/.test(known) || /\b(Poor|Excellent)\b/.test(known),
      playHref: /play\.google\.com\/store/.test(known),
      auto: /triedAuto|openInApp\(true\)/.test(known),
      img: known.includes('front_en.50.400.jpg'),
      unknown: unknown.includes("couldn't identify"),
      publicCss: fs.existsSync(path.join(publicDir, 'rveel.css')),
    },
    null,
    2
  )
);

console.log('generated v5 preview fixtures');
