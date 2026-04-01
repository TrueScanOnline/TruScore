/**
 * Verifies authenticated Open Food Facts writes use the same endpoint and fields
 * as the app (https://world.openfoodfacts.org/cgi/product_jqm2.pl).
 *
 * Credentials: EXPO_PUBLIC_OFF_USER_ID + EXPO_PUBLIC_OFF_PASSWORD in environment
 * or repo-root .env (same names as the Expo app).
 *
 * OFF expects user_id = account username from your profile when you signed up;
 * if you store an email in USER_ID, this script also tries the local-part (before @).
 *
 * Uses a fresh random valid EAN-13 each run so we do not stomp a known real product.
 */

import * as fs from 'fs';
import * as path from 'path';

const OFF_EDIT = 'https://world.openfoodfacts.org/cgi/product_jqm2.pl';
const USER_AGENT = 'TrueScan-FoodScanner/verify-off-submission';

function loadEnvFile(): void {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const m = line.match(/^\s*(EXPO_PUBLIC_OFF_USER_ID|EXPO_PUBLIC_OFF_PASSWORD)\s*=\s*(.*)$/);
    if (!m) continue;
    const key = m[1];
    let val = m[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

function randomEan13(): string {
  const body = `9${String(Math.floor(Math.random() * 1e11)).padStart(11, '0')}`;
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(body[i]!, 10) * (i % 2 === 0 ? 1 : 3);
  }
  const check = (10 - (sum % 10)) % 10;
  return body + check;
}

function pickUserIds(primary: string): string[] {
  const p = primary.trim();
  const out: string[] = [p];
  if (p.includes('@')) {
    const local = p.split('@')[0]!.trim();
    if (local && !out.includes(local)) out.push(local);
  }
  return out;
}

function redactSnippet(text: string): string {
  return text
    .slice(0, 700)
    .replace(/password=[^&\s"']+/gi, 'password=***')
    .replace(/user_id=[^&\s"']+/gi, 'user_id=***');
}

async function trySubmit(
  userId: string,
  password: string,
  barcode: string
): Promise<{ ok: boolean; snippet: string; authSuspect: boolean }> {
  const form = new FormData();
  form.append('code', barcode);
  form.append('user_id', userId);
  form.append('password', password);
  form.append('product_name', `TrueScan OFF connectivity test ${new Date().toISOString().slice(0, 19)}Z`);
  form.append('brands', 'TrueScan automated test');
  form.append('ingredients_text', 'water (automated connectivity test — safe to delete)');

  const res = await fetch(OFF_EDIT, {
    method: 'POST',
    headers: { 'User-Agent': USER_AGENT },
    body: form,
  });
  const text = await res.text();
  const authSuspect =
    /log\s*in|sign\s*in|wrong\s*password|invalid.*password|incorrect.*password|authentication\s*required/i.test(
      text
    );
  const ok =
    res.ok &&
    !authSuspect &&
    (text.includes('status="ok"') || text.includes('"status":1') || text.includes('Product saved'));
  return { ok, snippet: redactSnippet(text), authSuspect };
}

async function main(): Promise<void> {
  loadEnvFile();
  const rawUser = process.env.EXPO_PUBLIC_OFF_USER_ID || '';
  const password = process.env.EXPO_PUBLIC_OFF_PASSWORD || '';
  if (!rawUser || !password) {
    console.error(
      'Missing EXPO_PUBLIC_OFF_USER_ID or EXPO_PUBLIC_OFF_PASSWORD (.env at repo root or environment).'
    );
    process.exit(1);
  }

  const barcode = process.env.VERIFY_OFF_BARCODE?.trim() || randomEan13();

  console.log('Open Food Facts — authenticated write check (product_jqm2.pl)');
  console.log(`Barcode (test): ${barcode}`);
  console.log('Trying user_id: configured value, then local-part if value looks like an email.\n');

  let attempt = 0;
  for (const userId of pickUserIds(rawUser)) {
    attempt++;
    const label = attempt === 1 ? 'primary EXPO_PUBLIC_OFF_USER_ID' : 'alternate (email local-part)';
    process.stdout.write(`Attempt ${attempt} (${label})… `);
    const { ok, snippet, authSuspect } = await trySubmit(userId, password, barcode);
    if (ok) {
      console.log('OK');
      console.log(`\n✅ Authenticated OFF write succeeded.`);
      console.log(`   Product URL: https://world.openfoodfacts.org/product/${barcode}`);
      console.log('   You may delete this test product from OFF if you prefer.\n');
      process.exit(0);
    }
    console.log('failed');
    if (authSuspect) {
      console.log('   (Response suggests login / password problem — check OFF username & password.)\n');
    }
    console.log(`   Snippet: ${snippet}\n`);
  }

  console.error(
    '❌ All attempts failed. Set EXPO_PUBLIC_OFF_USER_ID to your Open Food Facts **username** ' +
      '(see https://world.openfoodfacts.org/ profile / settings — often not your full email).'
  );
  process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
