/** Prove GET snapshot authorised vs mistaken POST action "snapshot" forbidden. */
const BASE = 'https://truscoreapi-uat.vercel.app';
const BARCODE = '9300617064879';

async function main() {
  const credRes = await fetch(`${BASE}/api/evidence-authority`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'issue-credential' }),
  });
  const cred = await credRes.json();
  const token = cred.token;

  const getRes = await fetch(`${BASE}/api/evidence-authority?barcode=${BARCODE}`);
  const getJson = await getRes.json();

  const postRes = await fetch(`${BASE}/api/evidence-authority`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ action: 'snapshot', barcode: BARCODE }),
  });
  const postJson = await postRes.json();

  const freeform = await fetch(`${BASE}/api/evidence-authority`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      action: 'finalize-manual-text',
      barcode: BARCODE,
      domain: 'origins',
      unitId: 'u',
      sessionId: 's',
      statement: 'Made in NZ',
      originClaimType: 'made_in',
      originCountry: 'New Zealand',
    }),
  });
  const freeformJson = await freeform.json();

  const out = {
    at: new Date().toISOString(),
    uatAlias: BASE,
    getSnapshot: {
      status: getRes.status,
      success: getJson.success,
      prevailingOrigins: (getJson.snapshot?.prevailing || [])
        .filter((r) => String(r.subjectKey || '').startsWith('origins|'))
        .map((r) => r.subjectKey),
    },
    postActionSnapshot: { status: postRes.status, error: postJson.error, policyVersion: postJson.policyVersion },
    postFreeformFinalize: {
      status: freeform.status,
      error: freeformJson.error,
      policyVersion: freeformJson.policyVersion,
    },
  };
  console.log(JSON.stringify(out, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
