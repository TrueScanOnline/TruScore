/**
 * Pure, cross-platform fingerprint for **5A candidate** change detection (not cryptographic).
 * Use only to decide re-ingest / content_changed — **not** as `dedupe_key`, `signal_id`, or
 * publication identity (those are 5B concerns).
 */
export function fingerprintIngestionContent(parts: { title: string; href?: string; content_text?: string }): string {
  const s = [parts.title, parts.href ?? '', parts.content_text ?? ''].join('\u001e');
  return simpleHash32(s);
}

function simpleHash32(s: string): string {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return `fp${(h >>> 0).toString(16).padStart(8, '0')}`;
}
