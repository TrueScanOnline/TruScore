/**
 * Mechanically generate the governed Open v15 specific-identity vocabulary snapshot
 * from the current repo-native ADDITIVE_DATABASE names / aliases (Methodology v0.7).
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

const OUT_VOCAB = path.resolve(
  __dirname,
  '../src/lib/truscoreEngine/pillars/openSpecificIdentityVocabulary.generated.ts'
);
const OUT_REJECTIONS = path.resolve(
  __dirname,
  '../src/lib/truscoreEngine/pillars/openSpecificIdentityVocabulary.rejections.generated.ts'
);

/**
 * Founder-reviewed parenthetical/common aliases (Methodology v0.7).
 * Do not infer additional aliases beyond this allowlist + independently eligible base names.
 */
const FOUNDER_PARENTHETICAL_ALIAS_ALLOWLIST = new Set(
  ['msg', 'tbhq', 'bha', 'bht', 'turmeric', 'vitamin b2', 'vitamin b3'].map((s) => s.toLowerCase())
);

/**
 * Governed broad/additive-function shells. A candidate containing any of these as a
 * whole-word token (or multi-word phrase) is class-labelled and not positive identity.
 */
const CLASS_SHELL_PHRASES: string[] = [
  'anti-caking agents',
  'anti-caking agent',
  'anticaking agents',
  'anticaking agent',
  'acidity regulators',
  'acidity regulator',
  'flour treatment agents',
  'flour treatment agent',
  'flavour enhancers',
  'flavour enhancer',
  'flavor enhancers',
  'flavor enhancer',
  'firming agents',
  'firming agent',
  'foaming agents',
  'foaming agent',
  'gelling agents',
  'gelling agent',
  'glazing agents',
  'glazing agent',
  'bulking agents',
  'bulking agent',
  'mineral salts',
  'mineral salt',
  'raising agents',
  'raising agent',
  'food additives',
  'food additive',
  'food acids',
  'food acid',
  'stabilisers',
  'stabilizers',
  'stabiliser',
  'stabilizer',
  'preservatives',
  'preservative',
  'sweeteners',
  'sweetener',
  'thickeners',
  'thickener',
  'colourings',
  'colorings',
  'colouring',
  'coloring',
  'colours',
  'colors',
  'colour',
  'color',
  'emulsifiers',
  'emulsifier',
  'antioxidants',
  'antioxidant',
  'enzymes',
  'enzyme',
  'humectants',
  'humectant',
  'propellants',
  'propellant',
  'sequestrants',
  'sequestrant',
  'additives',
  'additive',
  'acids',
  'acid',
  'seasonings',
  'seasoning',
  'spices',
  'spice',
  'herbs',
  'herb',
  'blends',
  'blend',
  'vegetable gums',
  'vegetable gum',
  'flavours',
  'flavors',
  'flavour',
  'flavor',
  'flavourings',
  'flavorings',
  'flavouring',
  'flavoring',
  'extracts',
  'extract',
].sort((a, b) => b.length - a.length);

const BLOCKED_EXACT_AS_IDENTITY = new Set(CLASS_SHELL_PHRASES.map((s) => s.toLowerCase()));

type RejectionReason =
  | 'placeholder_name'
  | 'code_like'
  | 'annotation_admin'
  | 'class_labelled'
  | 'parenthetical_not_allowlisted'
  | 'blocked_shell_exact'
  | 'too_short';

interface RejectionRow {
  phrase: string;
  reason: RejectionReason;
  source: string;
}

const rejections: RejectionRow[] = [];
const rejectionCounts: Record<RejectionReason, number> = {
  placeholder_name: 0,
  code_like: 0,
  annotation_admin: 0,
  class_labelled: 0,
  parenthetical_not_allowlisted: 0,
  blocked_shell_exact: 0,
  too_short: 0,
};

function reject(phrase: string, reason: RejectionReason, source: string): void {
  rejections.push({ phrase, reason, source });
  rejectionCounts[reason] += 1;
}

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

/**
 * Source annotation / administrative wording is never positive identity evidence (v0.7).
 * Implemented as a general pattern, not a four-string deletion list.
 */
function isAnnotationOrAdminPhrase(norm: string): boolean {
  if (!norm) return true;
  if (/^(?:(?:additional|another|further|other)\s+)?variants?$/.test(norm)) return true;
  if (/^(?:an?\s+)?alternative(?:\s+(?:form|name|spelling|designation))?$/.test(norm)) return true;
  if (/\breserved(?:\s+for|\s*\/|\b)/.test(norm)) return true;
  if (/\bnot[\s-]?assigned\b/.test(norm)) return true;
  if (/\bunassigned\b/.test(norm)) return true;
  if (/\bnot[\s-]?(?:a[\s-]?)?food[\s-]?additive\b/.test(norm)) return true;
  if (/\bplaceholder\b/.test(norm)) return true;
  if (/\bthis e[\s-]?number\b/.test(norm)) return true;
  if (/^(?:plain|unspecified|ammonia|caustic sulfite|ammonia sulfite)$/.test(norm)) return true;
  return false;
}

/**
 * Class-labelled source forms put the function shell first
 * ("preservative sodium nitrite", "colour tartrazine"). Named substances that merely
 * contain a trailing component word ("citric acid") remain eligible identities.
 */
function isClassLabelledForm(norm: string): boolean {
  for (const shell of CLASS_SHELL_PHRASES) {
    const s = shell.toLowerCase();
    if (norm === s) return true;
    if (norm.startsWith(`${s} `)) return true;
  }
  return false;
}

function mechanicalSingular(phrase: string): string | null {
  if (phrase.length < 5) return null;
  if (!/[a-z]s$/i.test(phrase)) return null;
  if (/(ous|ness|asis|itis|ies|ss)$/i.test(phrase)) return null;
  if (phrase.includes(' ')) return null;
  return phrase.slice(0, -1);
}

function admitBaseCandidate(
  raw: string,
  source: string,
  into: Set<string>
): void {
  if (isCodeLikeAlias(raw)) {
    reject(normalizeIdentityPhrase(raw) || raw, 'code_like', source);
    return;
  }
  const norm = normalizeIdentityPhrase(raw);
  if (norm.length < 3) {
    reject(norm || raw, 'too_short', source);
    return;
  }
  if (BLOCKED_EXACT_AS_IDENTITY.has(norm)) {
    reject(norm, 'blocked_shell_exact', source);
    return;
  }
  if (isAnnotationOrAdminPhrase(norm)) {
    reject(norm, 'annotation_admin', source);
    return;
  }
  if (isClassLabelledForm(norm)) {
    reject(norm, 'class_labelled', source);
    return;
  }
  into.add(norm);
  const singular = mechanicalSingular(norm);
  if (singular && singular.length >= 3 && !BLOCKED_EXACT_AS_IDENTITY.has(singular)) {
    if (!isAnnotationOrAdminPhrase(singular) && !isClassLabelledForm(singular)) {
      into.add(singular);
    }
  }
}

/** Pass 1: base identities from names (parens stripped) and plain bodyMvp label forms. */
function collectBaseIdentities(): {
  bases: Set<string>;
  pendingParentheticals: Array<{ phrase: string; source: string }>;
} {
  const bases = new Set<string>();
  const pendingParentheticals: Array<{ phrase: string; source: string }> = [];
  let sourceEntryCount = 0;

  for (const info of Object.values(ADDITIVE_DATABASE)) {
    sourceEntryCount += 1;
    const name = info.name;
    if (isPlaceholderName(name)) {
      reject(normalizeIdentityPhrase(name) || name, 'placeholder_name', `name:${name}`);
      continue;
    }

    for (const slashPart of name.split(/\s*\/\s*/)) {
      const part = slashPart.trim();
      if (!part) continue;

      for (const m of part.matchAll(/\(([^)]+)\)/g)) {
        const inner = m[1].trim();
        if (!inner || isCodeLikeAlias(inner)) continue;
        const normInner = normalizeIdentityPhrase(inner);
        if (normInner.length >= 3) {
          pendingParentheticals.push({ phrase: normInner, source: `name-paren:${name}` });
        }
      }

      const base = part.replace(/\s*\([^)]*\)/g, '').trim();
      if (!base) continue;
      const withoutRoman = base.replace(/\s+[ivxlcdm]+\s*$/i, '').trim();
      admitBaseCandidate(base, `name-base:${name}`, bases);
      if (withoutRoman && withoutRoman !== base) {
        admitBaseCandidate(withoutRoman, `name-base-roman-stripped:${name}`, bases);
      }
    }

    for (const form of info.bodyMvpLabelForms ?? []) {
      // Plain-name label forms only — class+code / class+(name) patterns are not identity.
      if (isCodeLikeAlias(form)) {
        reject(normalizeIdentityPhrase(form) || form, 'code_like', `bodyMvp:${form}`);
        continue;
      }

      // Auditable class-labelled composition: "preservative (sodium nitrite)" →
      // "preservative sodium nitrite" must never become positive identity evidence.
      const classParen = form.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
      if (classParen) {
        const headNorm = normalizeIdentityPhrase(classParen[1]);
        const innerRaw = classParen[2].trim();
        const innerNorm = normalizeIdentityPhrase(innerRaw);
        if (
          headNorm &&
          innerNorm &&
          !isCodeLikeAlias(innerRaw) &&
          !/^\d/.test(innerRaw) &&
          (BLOCKED_EXACT_AS_IDENTITY.has(headNorm) || isClassLabelledForm(headNorm))
        ) {
          reject(`${headNorm} ${innerNorm}`, 'class_labelled', `bodyMvp-composed:${form}`);
        }
      }

      // Extract parenthetical plain names from body forms only as pending (same paren rules).
      for (const m of form.matchAll(/\(([^)]+)\)/g)) {
        const inner = m[1].trim();
        if (!inner || isCodeLikeAlias(inner) || /^\d/.test(inner)) continue;
        const normInner = normalizeIdentityPhrase(inner);
        if (normInner.length >= 3) {
          pendingParentheticals.push({ phrase: normInner, source: `bodyMvp-paren:${form}` });
        }
      }
      const stripped = form.replace(/\s*\([^)]*\)/g, '').trim();
      if (!stripped) continue;
      admitBaseCandidate(stripped, `bodyMvp:${form}`, bases);
    }
  }

  return { bases, pendingParentheticals };
}

const { bases, pendingParentheticals } = collectBaseIdentities();

// Pass 2: parenthetical content — allowlist or independently eligible base only.
for (const { phrase, source } of pendingParentheticals) {
  if (isAnnotationOrAdminPhrase(phrase)) {
    reject(phrase, 'annotation_admin', source);
    continue;
  }
  if (BLOCKED_EXACT_AS_IDENTITY.has(phrase)) {
    reject(phrase, 'blocked_shell_exact', source);
    continue;
  }
  if (isClassLabelledForm(phrase)) {
    reject(phrase, 'class_labelled', source);
    continue;
  }
  if (FOUNDER_PARENTHETICAL_ALIAS_ALLOWLIST.has(phrase) || bases.has(phrase)) {
    bases.add(phrase);
    continue;
  }
  reject(phrase, 'parenthetical_not_allowlisted', source);
}

const sorted = [...bases].sort((a, b) => b.length - a.length || a.localeCompare(b));
const contentHash = createHash('sha256').update(sorted.join('\n'), 'utf8').digest('hex');
const sourceEntryCount = Object.keys(ADDITIVE_DATABASE).length;

const vocabFile = `/**
 * GOVERNED Open v15 specific-identity vocabulary — frozen scoring artifact.
 *
 * Generated mechanically from repo-native ADDITIVE_DATABASE names/aliases under
 * Open v15 Scoring Methodology v0.7 source-hygiene rules.
 * Runtime Open matching must import this snapshot only. Do not read live
 * ADDITIVE_DATABASE for Open class-shell identity recognition.
 *
 * Regenerating or editing this file is a scoring-methodology change and requires
 * explicit review.
 *
 * Generated by: scripts/generate-open-specific-identity-vocabulary.ts
 * Source entries scanned: ${sourceEntryCount}
 * Phrase count: ${sorted.length}
 * Content SHA-256: ${contentHash}
 */
export const OPEN_SPECIFIC_IDENTITY_VOCAB_META = {
  source: 'ADDITIVE_DATABASE',
  methodologyVersion: 'v0.7',
  sourceEntryCount: ${sourceEntryCount},
  phraseCount: ${sorted.length},
  contentSha256: '${contentHash}',
  generatedBy: 'scripts/generate-open-specific-identity-vocabulary.ts',
  founderParentheticalAliasAllowlist: [
${[...FOUNDER_PARENTHETICAL_ALIAS_ALLOWLIST]
  .sort()
  .map((a) => `    ${JSON.stringify(a)},`)
  .join('\n')}
  ],
} as const;

/** Longest-first normalised plain-language identity phrases (lowercase, single-spaced). */
export const OPEN_SPECIFIC_IDENTITY_PHRASES: readonly string[] = Object.freeze([
${sorted.map((p) => `  ${JSON.stringify(p)},`).join('\n')}
]);
`;

const rejectionHash = createHash('sha256')
  .update(
    rejections
      .map((r) => `${r.reason}\t${r.phrase}\t${r.source}`)
      .sort()
      .join('\n'),
    'utf8'
  )
  .digest('hex');

const rejectionsFile = `/**
 * Auditable rejected-candidate report for Open specific-identity vocabulary generation (v0.7).
 * Deterministic fixture for inspection — not runtime scoring input.
 *
 * Rejection content SHA-256: ${rejectionHash}
 */
export const OPEN_SPECIFIC_IDENTITY_REJECTION_META = {
  methodologyVersion: 'v0.7',
  totalRejected: ${rejections.length},
  countsByReason: {
${Object.entries(rejectionCounts)
  .map(([k, v]) => `    ${k}: ${v},`)
  .join('\n')}
  },
  contentSha256: '${rejectionHash}',
} as const;

export type OpenSpecificIdentityRejectionReason =
${(Object.keys(rejectionCounts) as RejectionReason[]).map((k) => `  | '${k}'`).join('\n')};

export interface OpenSpecificIdentityRejection {
  phrase: string;
  reason: OpenSpecificIdentityRejectionReason;
  source: string;
}

/** Full rejected-candidate ledger (sorted by reason, then phrase). */
export const OPEN_SPECIFIC_IDENTITY_REJECTIONS: readonly OpenSpecificIdentityRejection[] =
  Object.freeze([
${rejections
  .slice()
  .sort((a, b) => a.reason.localeCompare(b.reason) || a.phrase.localeCompare(b.phrase) || a.source.localeCompare(b.source))
  .map((r) => `    ${JSON.stringify(r)},`)
  .join('\n')}
  ] as const);
`;

fs.writeFileSync(OUT_VOCAB, vocabFile, 'utf8');
fs.writeFileSync(OUT_REJECTIONS, rejectionsFile, 'utf8');

console.log(
  JSON.stringify(
    {
      outVocab: OUT_VOCAB,
      outRejections: OUT_REJECTIONS,
      sourceEntryCount,
      phraseCount: sorted.length,
      contentSha256: contentHash,
      totalRejected: rejections.length,
      rejectionCounts,
      requiredPresent: {
        lecithin: sorted.includes('lecithin'),
        xanthanGum: sorted.includes('xanthan gum'),
        potassiumSorbate: sorted.includes('potassium sorbate'),
        ascorbicAcid: sorted.includes('ascorbic acid'),
        citricAcid: sorted.includes('citric acid'),
        sodiumNitrite: sorted.includes('sodium nitrite'),
        tartrazine: sorted.includes('tartrazine'),
        aspartame: sorted.includes('aspartame'),
        msg: sorted.includes('msg'),
        tbhq: sorted.includes('tbhq'),
        bha: sorted.includes('bha'),
        bht: sorted.includes('bht'),
        turmeric: sorted.includes('turmeric'),
        vitaminB2: sorted.includes('vitamin b2'),
        vitaminB3: sorted.includes('vitamin b3'),
      },
      forbiddenAbsent: {
        alternative: !sorted.includes('alternative'),
        additionalVariant: !sorted.includes('additional variant'),
        anotherVariant: !sorted.includes('another variant'),
        reservedForAntibiotics: !sorted.includes('reserved for antibiotics'),
        preservativeSodiumNitrite: !sorted.includes('preservative sodium nitrite'),
        colourTartrazine: !sorted.includes('colour tartrazine'),
        colorTartrazine: !sorted.includes('color tartrazine'),
        sweetenerAspartame: !sorted.includes('sweetener aspartame'),
      },
    },
    null,
    2
  )
);
