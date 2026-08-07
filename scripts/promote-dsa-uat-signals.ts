/**
 * One-shot: promote the four founder-authorised Signals through governed publication gates.
 * Does not change semantic scope / headline / qualification.
 */
import fs from 'fs';
import path from 'path';
import { parseCsv } from '../src/identity/workstreamA/csv';

const FILE = path.join(
  'workstreamC',
  'c-data',
  'dynamic-signals-v0.2',
  'input',
  'signals.csv'
);

const TODAY = '2026-08-08';

const PROMOTE = new Set([
  'SIG-SR-AU-003',
  'SIG-IN-GL-001',
  'SIG-IN-GL-002',
  'SIG-IN-NZ-005',
]);

const GW_SUBJECT =
  "Mars said it does not source Liberian cocoa under its Responsibly Sourced Cocoa Program; Nestlé said it does not operate in or source directly from Liberia; Unilever said Liberian exposure is very small to negligible; Hershey stated it takes deforestation allegations seriously and is committed to responsible sourcing; Mondelēz did not respond to multiple Global Witness requests for comment.";
const GW_URL =
  'https://globalwitness.org/en/campaigns/forests/chocolate-giants-fuel-deforestation-in-west-africas-last-rainforest/';

function escapeCsv(v: string): string {
  if (/[",\n\r]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

const text = fs.readFileSync(FILE, 'utf8');
const rows = parseCsv(text);
const headers = Object.keys(rows[0]);

for (const r of rows) {
  if (!PROMOTE.has(r.signal_id ?? '')) continue;

  // Complete SIG-IN-GL-002 subject-response gate from already-approved Global Witness source.
  if (r.signal_id === 'SIG-IN-GL-002' && r.subject_response_status === 'pending_review') {
    r.subject_response = GW_SUBJECT;
    r.subject_response_status = 'captured_from_source';
    r.subject_response_source_url = GW_URL;
  }

  if ((r.editorial_review_required ?? '').toUpperCase() === 'TRUE') {
    if ((r.subject_response_status ?? '') === 'pending_review') {
      throw new Error(`${r.signal_id}: subject_response still pending_review — cannot promote`);
    }
    r.editorial_review_state = 'approved';
  }

  r.review_state = 'reviewed';
  r.signal_publication_state = 'publishable';
  r.reviewed_at = TODAY;
  r.publishable_from = TODAY;
  console.log('promoted', r.signal_id, {
    review_state: r.review_state,
    signal_publication_state: r.signal_publication_state,
    editorial_review_state: r.editorial_review_state,
    subject_response_status: r.subject_response_status,
  });
}

const out = [
  headers.join(','),
  ...rows.map((r) => headers.map((h) => escapeCsv(r[h] ?? '')).join(',')),
].join('\n');
fs.writeFileSync(FILE, out + '\n', 'utf8');
console.log('wrote', FILE);
