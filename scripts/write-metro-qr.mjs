import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const QR = require('qrcode');

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const url = process.argv[2] || 'exp://192.168.1.228:8081';
const outDir = join(root, 'design', 'wave5');
const png = join(outDir, 'metro-qr.png');

await QR.toFile(png, url, {
  width: 640,
  margin: 2,
  color: { dark: '#101C36', light: '#F7FCFA' },
});

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Rveel Expo Go QR</title>
  <style>
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      font-family: "Segoe UI", system-ui, sans-serif;
      background:
        radial-gradient(900px 500px at 80% -10%, rgba(39,184,153,.28), transparent 60%),
        #eef6f4;
      color: #101c36;
    }
    main {
      background: #fff;
      border: 1px solid #e1ece8;
      border-radius: 28px;
      padding: 28px;
      box-shadow: 0 18px 40px rgba(16,28,54,.08);
      text-align: center;
      max-width: 440px;
    }
    img { width: 300px; height: 300px; border-radius: 18px; }
    h1 { margin: 0 0 8px; font-size: 28px; letter-spacing: -0.04em; }
    p { margin: 8px 0; color: #536477; }
    code {
      display: inline-block;
      margin-top: 8px;
      padding: 8px 12px;
      border-radius: 999px;
      background: #eef6f4;
      color: #087b68;
      font-weight: 700;
    }
    a { color: #087b68; font-weight: 700; }
  </style>
</head>
<body>
  <main>
    <h1>Scan with Expo Go</h1>
    <p>Phone and PC on the same Wi‑Fi.</p>
    <img src="metro-qr.png" alt="Expo Go QR code for ${url}">
    <p><code>${url}</code></p>
    <p>Website for review: <a href="http://127.0.0.1:4173/">http://127.0.0.1:4173/</a></p>
  </main>
</body>
</html>`;

writeFileSync(join(outDir, 'metro-qr.html'), html);
console.log(png);
console.log(url);
