import type { ClaimDefinition } from './types';

/** Resolve `a.b.c` against a nested plain object (locale JSON root). */
export function getStringAtPath(root: unknown, dotPath: string): string | undefined {
  const parts = dotPath.split('.');
  let cur: unknown = root;
  for (const p of parts) {
    if (cur === null || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return typeof cur === 'string' ? cur : undefined;
}

export function textViolatesMustNotSay(text: string, mustNotSay: string[]): string | undefined {
  const lower = text.toLowerCase();
  for (const phrase of mustNotSay) {
    if (lower.includes(phrase.toLowerCase())) return phrase;
  }
  return undefined;
}

export function textMissingAnchors(text: string, anchors: string[] | undefined): string | undefined {
  if (!anchors?.length) return undefined;
  const lower = text.toLowerCase();
  for (const a of anchors) {
    if (!lower.includes(a.toLowerCase())) return a;
  }
  return undefined;
}

/** Run all checks for one definition against resolved EN text. */
export function validateClaimEnText(
  text: string | undefined,
  def: ClaimDefinition
): { ok: true } | { ok: false; reason: string } {
  if (text === undefined) return { ok: false, reason: `missing i18n string at ${def.enI18nPath}` };
  const bad = textViolatesMustNotSay(text, def.mustNotSay);
  if (bad) return { ok: false, reason: `mustNotSay hit: "${bad}" (${def.claimId})` };
  const missing = textMissingAnchors(text, def.approvedAnchors);
  if (missing) return { ok: false, reason: `approvedAnchor missing: "${missing}" (${def.claimId})` };
  return { ok: true };
}
