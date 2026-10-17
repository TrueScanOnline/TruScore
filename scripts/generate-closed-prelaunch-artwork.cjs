/**
 * Copies authentic display files for closed pre-launch visual UAT.
 * Does not grant rights. A missing, ambiguous or sample-only mark stays text
 * on review and product Results.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const repo = path.resolve(__dirname, '..');
const extracted = path.join(process.env.TEMP, 'rveel-art', 'Rveel_Certification_Artwork_Package_v1_0_20261017');
const register = require(path.join(extracted, 'artwork_register.json'));
const catalogue = require(path.join(repo, 'src/certifications/governed/packet_certification_manual_discovery_v1_0_1.json'));
const selection = require(path.join(repo, 'src/certifications/governed/packet_certification_selection_v1_0_3.json'));
const names = new Map(catalogue.entries.map((entry) => [entry.id, entry.consumer_name]));
const outDir = path.join(repo, 'src/certifications/artwork/files');
const rasterExt = new Set(['.png', '.jpg', '.jpeg', '.webp']);

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

const byResearch = new Map();
for (const asset of register.assets) {
  for (const id of asset.research_certification_ids || []) {
    const list = byResearch.get(id) || [];
    list.push(asset);
    byResearch.set(id, list);
  }
}

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

const marks = [];
const exceptions = [];
for (const row of selection.register.filter((item) => item.selectable)) {
  const assets = (byResearch.get(row.id) || []).filter(
    (asset) => !(asset.technical_holds || []).length && rasterExt.has(path.extname(asset.display_path || '').toLowerCase())
  );
  const clean = assets.filter((asset) => asset.asset_class === 'packet_mark' && asset.sample_or_watermark !== true);
  const displays = clean.filter((asset) => /\/display\.(png|jpg|jpeg|webp)$/i.test(asset.display_path));
  const samples = assets.filter((asset) => asset.sample_or_watermark === true || asset.asset_class !== 'packet_mark');
  let chosen = null;
  let surfaces = [];
  if (displays.length === 1) {
    chosen = displays[0];
    surfaces = ['recognition_example', 'contribution_review', 'product_result'];
  } else if (displays.length > 1) {
    exceptions.push({ id: row.id, reason: 'Multiple display files. No variant was chosen.' });
  } else if (clean.length === 1) {
    chosen = clean[0];
    surfaces = ['recognition_example', 'contribution_review', 'product_result'];
  } else if (clean.length > 1) {
    exceptions.push({ id: row.id, reason: 'Multiple packet marks and no single display file.' });
  } else if (samples.length === 1) {
    chosen = samples[0];
    surfaces = ['recognition_example'];
    exceptions.push({ id: row.id, reason: 'Only a sample or watermarked file. Review and Results use the name.' });
  } else if (samples.length > 1) {
    exceptions.push({ id: row.id, reason: 'Multiple sample files. None are shown.' });
  } else {
    exceptions.push({ id: row.id, reason: 'No packaged raster mark.' });
  }
  if (!chosen) continue;
  const source = path.join(extracted, chosen.display_path);
  const digest = sha256(source);
  if (chosen.display_sha256 && digest !== chosen.display_sha256) {
    exceptions.push({ id: row.id, reason: 'Display file hash does not match the register.' });
    continue;
  }
  const ext = path.extname(chosen.display_path).toLowerCase();
  const filename = `${row.id}${ext}`;
  fs.copyFileSync(source, path.join(outDir, filename));
  marks.push({
    researchId: row.id,
    consumerName: names.get(row.id),
    productionId: row.existing_production_id,
    assetId: chosen.asset_id,
    variantId: chosen.artwork_variant_id,
    file: filename,
    sha256: digest,
    alt: chosen.alt_text,
    sample: chosen.sample_or_watermark === true,
    rightsRoute: (chosen.rights || {}).route_status || 'unknown',
    writtenPermission: false,
    surfaces,
  });
}

const manifest = {
  policy: 'closed_prelaunch_visual_uat',
  rightsGrant: false,
  publicAllowlist: [],
  marks,
  exceptions,
};
fs.writeFileSync(path.join(repo, 'src/certifications/artwork/closedPrelaunchManifest.json'), JSON.stringify(manifest, null, 2) + '\n');
const requires = marks
  .map((mark) => `  ${JSON.stringify(mark.researchId)}: require('./files/${mark.file}'),`)
  .join('\n');
fs.writeFileSync(
  path.join(repo, 'src/certifications/artwork/closedPrelaunchMarks.ts'),
  `/** Authentic files for closed pre-launch visual UAT. Not a rights grant. */\nconst marks: Record<string, number> = {\n${requires}\n};\n\nexport function closedPrelaunchModule(researchId: string): number | null {\n  return marks[researchId] ?? null;\n}\n`
);
fs.writeFileSync(
  path.join(repo, 'src/certifications/artwork/closedPrelaunchMarks.stub.ts'),
  `/** Public and store builds resolve here and bundle no certification artwork. */\nexport function closedPrelaunchModule(_researchId: string): number | null {\n  return null;\n}\n`
);
console.log(`marks ${marks.length} exceptions ${exceptions.length}`);
