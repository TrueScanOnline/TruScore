/** Relation the explicit migration must create before evidence requests run. */
export const EVIDENCE_AUTHORITY_SCHEMA_RELATION = 'evidence_versions';

export function assertEvidenceAuthoritySchemaReady(relationName: string | null | undefined): void {
  const name = String(relationName || '')
    .split('.')
    .pop();
  if (name !== EVIDENCE_AUTHORITY_SCHEMA_RELATION) {
    throw new Error('evidence_authority_schema_unavailable');
  }
}
