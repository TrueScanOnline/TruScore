import type { IngestedSignalCandidate } from './types';

/**
 * In-memory candidate table for tests and app wiring before a real DB. Idempotent on `idempotency_key`.
 */
export class InMemoryCandidateIngestionStore {
  private readonly byIdempotencyKey = new Map<string, IngestedSignalCandidate>();

  get(idempotencyKey: string): IngestedSignalCandidate | null {
    return this.byIdempotencyKey.get(idempotencyKey) ?? null;
  }

  list(): IngestedSignalCandidate[] {
    return Array.from(this.byIdempotencyKey.values());
  }

  size(): number {
    return this.byIdempotencyKey.size;
  }

  /** Insert or replace by idempotency key. */
  upsert(candidate: IngestedSignalCandidate): { action: 'created' | 'updated' } {
    const had = this.byIdempotencyKey.has(candidate.idempotency_key);
    this.byIdempotencyKey.set(candidate.idempotency_key, candidate);
    return { action: had ? 'updated' : 'created' };
  }

  clearForTests(): void {
    this.byIdempotencyKey.clear();
  }
}
