/**
 * Governed commentary resolution — the single consumer source for Score Highlights L1/L2/L3.
 *
 * Keyed strictly to stable production adjustment IDs across the four pillar registries.
 * Adjustment descriptions are diagnostic text and are never read here (v0.4 §3.1).
 * Unknown IDs fail closed: the story is withheld rather than improvised.
 */

import {
  BODY_V12_ADJUSTMENT_REGISTRY,
} from '../truscoreEngine/pillars/bodyPillarV12Registry';
import { PLANET_V19_ADJUSTMENT_REGISTRY } from '../truscoreEngine/pillars/planetPillarV19Registry';
import { ETHICS_V37_ADJUSTMENT_REGISTRY } from '../truscoreEngine/pillars/ethicsPillarV37Registry';
import { OPEN_V15_ADJUSTMENT_REGISTRY } from '../truscoreEngine/pillars/openPillarV15Registry';
import { resolveOpenGovernedCopy } from './openGovernedCopy';
import { resolveInAppL3Route } from './l3/resolveL3Route';
import type { ScoreHighlightL3Route, ScoreHighlightPillar } from './types';

export interface GovernedCommentaryRow {
  pillar: ScoreHighlightPillar;
  highlightEligible: boolean;
  l1?: string;
  l2?: string;
  externalResource: string;
  synthesisFamily?: string;
}

const REGISTRY_BY_PILLAR: Record<ScoreHighlightPillar, Record<string, GovernedCommentaryRow>> = {
  Body: {},
  Planet: {},
  Ethics: {},
  Open: {},
};

function indexRegistry(
  pillar: ScoreHighlightPillar,
  rows: Record<
    string,
    {
      highlightEligible: boolean;
      highlightTitle?: string;
      highlightExplainer?: string;
      externalResource: string;
      synthesisFamily?: string;
    }
  >
): void {
  Object.entries(rows).forEach(([id, row]) => {
    REGISTRY_BY_PILLAR[pillar][id] = {
      pillar,
      highlightEligible: row.highlightEligible,
      l1: row.highlightTitle,
      l2: row.highlightExplainer,
      externalResource: row.externalResource,
      synthesisFamily: row.synthesisFamily,
    };
  });
}

indexRegistry('Body', BODY_V12_ADJUSTMENT_REGISTRY);
indexRegistry('Planet', PLANET_V19_ADJUSTMENT_REGISTRY);
indexRegistry('Ethics', ETHICS_V37_ADJUSTMENT_REGISTRY);
indexRegistry('Open', OPEN_V15_ADJUSTMENT_REGISTRY);

/** Governed registry row for a fired ID, or null when the pillar registry does not know it. */
export function governedCommentaryRow(
  pillar: ScoreHighlightPillar,
  adjustmentId: string
): GovernedCommentaryRow | null {
  return REGISTRY_BY_PILLAR[pillar][adjustmentId] ?? null;
}

/**
 * Locked organic variants (Ethics v0.2 §3). Both states score +2 and share one stable ID;
 * `organicEvidenceClass` on the fired row selects the correct locked copy, which is exactly what
 * the Ethics scorer emits that metadata for.
 */
const ORGANIC_CLAIM_ONLY_L1 = 'Organic claim identified';
const ORGANIC_CLAIM_ONLY_L2 =
  'An organic claim appears on this packet, but the packet does not show a specific organic certification.';

/**
 * KTC L1 attribution prefix (Ethics v0.2 §4). "Product owner" survives only when governed entity
 * resolution proves the benchmarked company is this product's owner; otherwise the benchmarked
 * company name from the same fired record is substituted. Never attribute a subsidiary result to a
 * different ultimate parent.
 */
const KTC_PRODUCT_OWNER_PREFIX = 'Product owner:';

type Metadata = Record<string, string | number | boolean> | undefined;

const PLANET_JURISDICTION_NAMES: Record<string, string> = {
  AU: 'Australia',
  NZ: 'New Zealand',
};

/**
 * Resolve the locked copy tokens carried by governed L2 templates from the metadata on the
 * fired row. Tokens are never resolved from raw product fields.
 */
function resolveTokens(text: string, metadata: Metadata): string {
  if (!metadata) return text;
  let out = text;
  const year = metadata.benchmarkYear;
  if (year != null) out = out.split('[Year]').join(String(year));
  const score = metadata.benchmarkScore;
  if (score != null) out = out.split('[SCORE]').join(String(score));
  const company = metadata.benchmarkCompany;
  if (company != null) out = out.split('[COMPANY]').join(String(company));
  const accounted = metadata.accountedPercent;
  if (typeof accounted === 'number') out = out.split('[X]').join(String(accounted));
  const remainder = metadata.remainderPercent;
  if (typeof remainder === 'number') out = out.split('[Y]').join(String(remainder));
  const statement = metadata.sourceStatement;
  if (typeof statement === 'string' && statement.trim()) {
    out = out.split('[STATEMENT]').join(statement.trim());
  }
  const jurisdiction = metadata.jurisdiction;
  if (typeof jurisdiction === 'string' && PLANET_JURISDICTION_NAMES[jurisdiction]) {
    out = out.split('[Australia/New Zealand]').join(PLANET_JURISDICTION_NAMES[jurisdiction]);
  }
  return out;
}

/** True when a governed template still contains an unresolved `[Token]` after substitution. */
export function hasUnresolvedToken(text: string): boolean {
  return /\[[^\]]+\]/.test(text);
}

export interface GovernedCopyOptions {
  /** Set when a faithful in-app "About these additives" destination is available. */
  additivesL3Available?: boolean;
  /** Set when the Result Product Origins (CoM) experience can be deep-linked. */
  productOriginsL3Available?: boolean;
}

/**
 * Locked L3 destination for a story (Addendum v1.0).
 * Every governed Highlight family resolves to its in-app L3. Authoritative external material
 * sits beneath that explanation inside the L3 surface — it does not replace the L3 route.
 */
export function governedL3Route(
  pillar: ScoreHighlightPillar,
  boundAdjustmentIds: readonly string[],
  _externalResource: string,
  options?: GovernedCopyOptions
): ScoreHighlightL3Route | undefined {
  const inApp = resolveInAppL3Route(pillar, boundAdjustmentIds);
  if (!inApp || inApp.kind !== 'in_app') return undefined;

  if (inApp.target === 'additives' && !options?.additivesL3Available) {
    return undefined;
  }
  if (inApp.target === 'product_origins' && !options?.productOriginsL3Available) {
    return undefined;
  }
  return inApp;
}

export interface ResolvedGovernedCopy {
  l1: string;
  l2: string;
}

/**
 * Locked L1/L2 for a single fired adjustment, with metadata tokens resolved.
 * Returns null when the registry carries no consumer copy or a token cannot be resolved.
 */
export function resolveGovernedCopy(
  pillar: ScoreHighlightPillar,
  adjustmentId: string,
  metadata: Metadata
): ResolvedGovernedCopy | null {
  const row = governedCommentaryRow(pillar, adjustmentId);
  if (!row || !row.l1 || !row.l2) return null;

  let l1 = row.l1;
  let l2 = row.l2;
  if (adjustmentId === 'ethics-v37-cert-organic' && metadata?.organicEvidenceClass === 'claim_only') {
    l1 = ORGANIC_CLAIM_ONLY_L1;
    l2 = ORGANIC_CLAIM_ONLY_L2;
  }

  if (adjustmentId.startsWith('ethics-v37-ktc-') && l1.startsWith(KTC_PRODUCT_OWNER_PREFIX)) {
    if (metadata?.benchmarkEntityRole !== 'product_owner') {
      const company = metadata?.benchmarkCompany;
      if (typeof company !== 'string' || !company.trim()) return null;
      l1 = `${company.trim()}:${l1.slice(KTC_PRODUCT_OWNER_PREFIX.length)}`;
    }
  }

  if (pillar === 'Open') {
    const openCopy = resolveOpenGovernedCopy(adjustmentId, metadata);
    if (openCopy) {
      l1 = openCopy.l1;
      l2 = openCopy.l2;
    } else if (
      adjustmentId.startsWith('open-v15-ing-clarity-') &&
      adjustmentId !== 'open-v15-ing-clarity-zero' &&
      adjustmentId !== 'open-v15-ing-clarity-unavailable' &&
      metadata?.termPresentationClass
    ) {
      return null;
    }
  }

  l1 = resolveTokens(l1, metadata);
  l2 = resolveTokens(l2, metadata);
  if (hasUnresolvedToken(l1) || hasUnresolvedToken(l2)) return null;
  return { l1, l2 };
}
