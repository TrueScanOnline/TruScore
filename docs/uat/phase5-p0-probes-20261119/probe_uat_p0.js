/**
 * Phase 5 P0 probes against live UAT — no invent; prints HTTP outcomes only.
 * Uses Cadbury 9300617064879 for snapshot/withdraw check; structured admit uses a disposable claim.
 */
const BASE = process.env.RVEEL_UAT_BASE || 'https://truscoreapi-uat.vercel.app';
const BARCODE = '9300617064879';

async function post(path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text.slice(0, 400) };
  }
  return { status: res.status, json };
}

async function main() {
  const out = { base: BASE, at: new Date().toISOString() };

  const cred = await post('/api/evidence-authority', { action: 'issue-credential' });
  out.credential = { status: cred.status, success: cred.json?.success, contributorId: cred.json?.contributorId };
  const token = cred.json?.token || cred.json?.credential || cred.json?.accessToken;
  if (!token) {
    console.log(JSON.stringify({ ...out, error: 'no_token', cred: cred.json }, null, 2));
    process.exit(1);
  }

  // P0-4 negatives
  out.freeform = await post(
    '/api/evidence-authority',
    {
      action: 'finalize-manual-text',
      barcode: BARCODE,
      domain: 'origins',
      unitId: 'probe-freeform',
      sessionId: 'probe-session',
      statement: 'Made in New Zealand',
      originClaimType: 'made_in',
      originCountry: 'New Zealand',
    },
    token
  );

  out.photo = await post(
    '/api/upload-photo',
    { barcode: BARCODE, contentType: 'image/jpeg', bytesBase64: 'aaaa' },
    token
  );

  // Snapshot for Antarctica withdraw check
  out.snapshot = await post('/api/evidence-authority', { action: 'snapshot', barcode: BARCODE }, token);
  const prev = out.snapshot.json?.snapshot?.prevailing || out.snapshot.json?.prevailing || [];
  const withdrawn = out.snapshot.json?.snapshot?.withdrawnSubjectKeys || out.snapshot.json?.withdrawnSubjectKeys || [];
  out.originsPrevailing = prev
    .filter((row) => String(row.subjectKey || '').startsWith('origins|'))
    .map((row) => ({
      subjectKey: row.subjectKey,
      country: row.evidence?.originStructured?.primaryCountry || row.evidence?.claimValue,
      versionId: row.versionId,
    }));
  out.withdrawnOrigins = withdrawn.filter((k) => String(k).startsWith('origins|'));

  console.log(JSON.stringify(out, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
