/**
 * Mechanically generate the governed Open v15 specific-identity vocabulary snapshot
 * from the current repo-native ADDITIVE_DATABASE names / aliases.
 *
 * Runtime Open matching must consume the committed snapshot — not live ADDITIVE_DATABASE.
 * Regenerating this file is a scoring-methodology change and requires explicit review.
 *
 * Usage: npx tsx scripts/generate-open-specific-identity-vocabulary.ts
 */
import { createHash } from 'crypto';
import fs from 'fs';
import path from 'path';
import { ADDITIVE_DATABASE } from '../src/services/additiveDatabase';

const OUT = path.resolve(
  __dirname,
  '../src/lib/truscoreEngine/pillars/openSpecificIdentityVocabulary.generated.ts'
);

/** Phrases that are Open broad/generic disclosure terms — never positive identity evidence. */
const BLOCKED_AS_IDENTITY = new Set(
  [
    'acid',
    'acids',
    'additive',
    'additives',
    'antioxidant',
    'antioxidants',
    'aroma',
    'aromas',
    'blend',
    'blends',
    'color',
    'colors',
    'colour',
    'colours',
    'coloring',
    'colouring',
    'colorings',
    'colourings',
    'emulsifier',
    'emulsifiers',
    'enzyme',
    'enzymes',
    'essence',
    'essences',
    'extract',
    'extracts',
    'extractive',
    'extractives',
    'flavor',
    'flavors',
    'flavour',
    'flavours',
    'flavoring',
    'flavouring',
    'flavorings',
    'flavourings',
    'herb',
    'herbs',
    'preservative',
    'preservatives',
    'seasoning',
    'seasonings',
    'spice',
    'spices',
    'stabiliser',
    'stabilisers',
    'stabilizer',
    'stabilizers',
    'sweetener',
    'sweeteners',
    'thickener',
    'thickeners',
    'vegetable gum',
    'vegetable gums',
    'vegetable extract',
    'vegetable extracts',
  ].map((s) => s.toLowerCase())
);

function normalizeIdentityPhrase(raw: string): string {
  return raw
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[^a-z0-9]+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isPlaceholderName(name: string): boolean {
  const n = name.trim();
  if (!n) return true;
  if (/^e\d{3,4}[a-z]?$/i.test(n.replace(/\s+/g, ''))) return true;
  if (/^this e-number is not currently assigned/i.test(n)) return true;
  return false;
}

function isCodeLikeAlias(phrase: string): boolean {
  const p = phrase.trim().toLowerCase();
  if (!p) return true;
  if (/^e[\s-]?\d{3,4}[a-z]?$/.test(p)) return true;
  if (/^(colour|color|flavour|flavor|emulsifier|preservative|thickener)\s*\(\s*\d{3,4}/i.test(p)) {
    return true;
  }
  if (/^\d{3,4}[a-z]?$/.test(p)) return true;
  return false;
}

function mechanicalSingular(phrase: string): string | null {
  if (phrase.length < 5) return null;
  if (!/[a-z]s$/i.test(phrase)) return null;
  if (/(ous|ness|asis|itis|ies|ss)$/i.test(phrase)) return null;
  // "citric acid" — do not strip trailing s from multi-word last token carelessly when
  // the plural is the whole single token like "lecithins".
  if (phrase.includes(' ')) return null;
  return phrase.slice(0, -1);
}

function phrasesFromAdditiveName(name: string): string[] {
  const out = new Set<string>();
  if (isPlaceholderName(name)) return [];

  for (const slashPart of name.split(/\s*\/\s*/)) {
    const part = slashPart.trim();
    if (!part) continue;

    for (const m of part.matchAll(/\(([^)]+)\)/g)) {
      const inner = m[1].trim();
      if (!inner || isCodeLikeAlias(inner)) continue;
      if (/^(plain|variant|unspecified|ammonia|caustic)/i.test(inner)) continue;
      const normInner = normalizeIdentityPhrase(inner);
      if (normInner.length >= 3) out.add(normInner);
    }

    let base = part.replace(/\s*\([^)]*\)/g, '').trim();
    if (!base) continue;

    const withoutRoman = base.replace(/\s+[ivxlcdm]+\s*$/i, '').trim();
    for (const candidate of [base, withoutRoman]) {
      const norm = normalizeIdentityPhrase(candidate);
      if (norm.length >= 3 && !isCodeLikeAlias(norm)) out.add(norm);
      const singular = mechanicalSingular(norm);
      if (singular && singular.length >= 3) out.add(singular);
    }
  }

  return [...out];
}

function phrasesFromBodyMvpForms(forms: readonly string[] | undefined): string[] {
  if (!forms?.length) return [];
  const out: string[] = [];
  for (const form of forms) {
    if (isCodeLikeAlias(form)) continue;
    const norm = normalizeIdentityPhrase(form);
    if (norm.length >= 3 && !isCodeLikeAlias(norm)) out.push(norm);
  }
  return out;
}

const phrases = new Set<string>();
let sourceEntryCount = 0;

for (const info of Object.values(ADDITIVE_DATABASE)) {
  sourceEntryCount += 1;
  for (const p of phrasesFromAdditiveName(info.name)) phrases.add(p);
  for (const p of phrasesFromBodyMvpForms(info.bodyMvpLabelForms)) phrases.add(p);
}

const sorted = [...phrases]
  .filter((p) => !BLOCKED_AS_IDENTITY.has(p))
  .filter((p) => p.split(' ').every((w) => w.length > 0))
  .sort((a, b) => b.length - a.length || a.localeCompare(b));

const contentHash = createHash('sha256').update(sorted.join('\n'), 'utf8').digest('hex');

const file = `/**
 * GOVERNED Open v15 specific-identity vocabulary — frozen scoring artifact.
 *
 * Generated mechanically from repo-native ADDITIVE_DATABASE names/aliases.
 * Runtime Open matching must import this snapshot only. Do not read live
 * ADDITIVE_DATABASE for Open class-shell identity recognition.
 *
 * Regenerating or editing this file is a scoring-methodology change and requires
 * explicit review (Open v15 Methodology v0.6).
 *
 * Generated by: scripts/generate-open-specific-identity-vocabulary.ts
 * Source entries scanned: ${sourceEntryCount}
 * Phrase count: ${sorted.length}
 * Content SHA-256: ${contentHash}
 */
export const OPEN_SPECIFIC_IDENTITY_VOCAB_META = {
  source: 'ADDITIVE_DATABASE',
  sourceEntryCount: ${sourceEntryCount},
  phraseCount: ${sorted.length},
  contentSha256: '${contentHash}',
  generatedBy: 'scripts/generate-open-specific-identity-vocabulary.ts',
} as const;

/** Longest-first normalised plain-language identity phrases (lowercase, single-spaced). */
export const OPEN_SPECIFIC_IDENTITY_PHRASES: readonly string[] = Object.freeze([
${sorted.map((p) => `  ${JSON.stringify(p)},`).join('\n')}
]);
`;

fs.writeFileSync(OUT, file, 'utf8');
console.log(
  JSON.stringify(
    {
      out: OUT,
      sourceEntryCount,
      phraseCount: sorted.length,
      contentSha256: contentHash,
      samples: {
        lecithin: sorted.includes('lecithin'),
        xanthanGum: sorted.includes('xanthan gum'),
        potassiumSorbate: sorted.includes('potassium sorbate'),
        ascorbicAcid: sorted.includes('ascorbic acid'),
        citricAcid: sorted.includes('citric acid'),
        caramel: sorted.includes('caramel'),
        msg: sorted.includes('msg'),
      },
    },
    null,
    2
  )
);
