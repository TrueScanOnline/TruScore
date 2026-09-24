/**
 * Search / Favourites list score — publication publishedScore only; fail closed without snapshot.
 */
import { listPublishedOverallScore } from '../../../utils/listPublishedScore';
import type { ProductWithTrustScore } from '../../../types/product';
import type { CrossPillarPublicationSnapshot } from '../../../lib/rateability';

function productWith(
  overrides: Partial<ProductWithTrustScore> & {
    _publication?: CrossPillarPublicationSnapshot | undefined;
  }
): ProductWithTrustScore {
  return {
    barcode: '1',
    product_name: 'X',
    trust_score: 72,
    trust_score_breakdown: { body: 18, planet: 18, ethics: 18, open: 18 },
    ...overrides,
  } as ProductWithTrustScore;
}

describe('listPublishedOverallScore', () => {
  it('Rated publication → publishedScore', () => {
    const score = listPublishedOverallScore(
      productWith({
        _publication: {
          settled: true,
          overall: {
            publicationStatus: 'rated',
            publishedScore: 64,
            internalScore: 72,
            confidence: 'limited',
            sourceQuality: 'community_or_user',
            s26: null,
            confidenceReasonCode: 'x',
            assessmentLanes: {},
            diagnostic: {},
          },
        } as CrossPillarPublicationSnapshot,
      })
    );
    expect(score).toBe(64);
  });

  it('NR publication → null (not trust_score)', () => {
    const p = productWith({
      trust_score: 72,
      _publication: {
        settled: true,
        overall: {
          publicationStatus: 'nr',
          publishedScore: null,
          internalScore: 72,
          confidence: null,
          sourceQuality: 'community_or_user',
          s26: null,
          confidenceReasonCode: 'nr',
          assessmentLanes: {},
          diagnostic: {},
        },
      } as CrossPillarPublicationSnapshot,
    });
    expect(listPublishedOverallScore(p)).toBeNull();
  });

  it('checking publication → null', () => {
    const p = productWith({
      trust_score: 72,
      _publication: {
        settled: false,
        overall: {
          publicationStatus: 'checking',
          publishedScore: null,
          internalScore: 72,
          confidence: null,
          sourceQuality: 'community_or_user',
          s26: null,
          confidenceReasonCode: 'checking',
          assessmentLanes: {},
          diagnostic: {},
        },
      } as CrossPillarPublicationSnapshot,
    });
    expect(listPublishedOverallScore(p)).toBeNull();
  });

  it('cached product without publication snapshot → null (no trust_score fallback)', () => {
    const p = productWith({ trust_score: 55, _publication: undefined });
    expect(p.trust_score).toBe(55);
    expect(listPublishedOverallScore(p)).toBeNull();
  });
});
