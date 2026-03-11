/**
 * TruScore Analysis Types
 * Used for in-app "Score breakdown" and logging so you can see exactly
 * which databases affected each pillar and by how much.
 */

/** How the database/lookup was queried (barcode, brand, parent, or product field) */
export type QueryKeyType = 'barcode' | 'product_name' | 'brand' | 'parent' | 'product_field';

/** One entry in the product fetch trace: which DB was queried, with what key, order, and result */
export interface FetchTraceEntry {
  database: string;
  queryKeyType: QueryKeyType;
  order: number;
  hit: boolean;
  responseTimeMs?: number;
}

/** A single adjustment with optional source attribution for analysis */
export interface PillarAdjustmentWithSource {
  description: string;
  value: number;
  type: 'positive' | 'negative' | 'neutral';
  /** Which database/source provided the data that led to this adjustment */
  sourceDatabase?: string;
  /** How that source was queried (barcode, brand, parent, product field) */
  queryKeyType?: QueryKeyType;
  /** Best-available reference URL for this source (e.g. BBFAW, DOL). Not always the exact report. */
  referenceUrl?: string;
}

/** Per-pillar analysis: base, final, and each adjustment with source */
export interface PillarAnalysis {
  pillarName: 'Body' | 'Planet' | 'Ethics' | 'Open';
  baseScore: number;
  finalScore: number;
  /** Running total after each step (for display) */
  adjustments: PillarAdjustmentWithSource[];
  /** Which data sources this pillar used (deduplicated) */
  dataSourcesUsed: Array<{ database: string; queryKeyType: QueryKeyType; returnedResult: boolean; order: number }>;
}

/** Full TruScore analysis: fetch trace + per-pillar breakdown */
export interface TruScoreAnalysis {
  barcode: string;
  totalScore: number;
  /** Order and result of each database query during product fetch */
  fetchTrace: FetchTraceEntry[];
  /** Per-pillar breakdown with source attribution */
  pillars: {
    Body: PillarAnalysis;
    Planet: PillarAnalysis;
    Ethics: PillarAnalysis;
    Open: PillarAnalysis;
  };
  /** Timestamp when this analysis was generated (matches the score on screen) */
  generatedAt: number;
}
