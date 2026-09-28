import AsyncStorage from '@react-native-async-storage/async-storage';
import { governedCertificationLabels } from '../../../contributions/certificationLane';
import { getLocalEvidenceById } from '../../../contributions/evidenceStore';
import {
  CONTRIBUTION_NOTICE_ADDED,
  CONTRIBUTION_NOTICE_SAVED,
  resultContributionActions,
} from '../../../contribution/resultContributionActions';
import { calculateEthicsPillar } from '../../../lib/truscoreEngine/pillars/ethicsPillar';
import {
  __resetMemoryPrivateBytesForTests,
  __setPrivateByteStoreForTests,
  __setSessionPersistenceForTests,
  addManualEvidenceUnit,
  getSession,
  handoffReviewedUnits,
  openSessionForProduct,
  upsertSession,
} from '../../../packetContribution';
import type { Product } from '../../../types/product';
import type { CrossPillarPublicationSnapshot } from '../../../lib/rateability/types';

const memory = new Map<string, string>();

beforeEach(() => {
  memory.clear();
  __resetMemoryPrivateBytesForTests();
  __setSessionPersistenceForTests(null);
  __setPrivateByteStoreForTests(null);
  (AsyncStorage.getItem as jest.Mock).mockImplementation(async (key: string) =>
    memory.has(key) ? memory.get(key)! : null
  );
  (AsyncStorage.setItem as jest.Mock).mockImplementation(async (key: string, value: string) => {
    memory.set(key, value);
  });
});

function published(partial: {
  nutrition: 'resolved' | 'unassessed';
  processing: 'resolved' | 'unassessed';
  ingredient: 'resolved' | 'unassessed';
  origins: 'resolved' | 'unassessed';
  transparencyRated: boolean;
  packet: 'assessed' | 'unassessed_or_incomplete';
  certifications?: Product['certifications'];
}): Product {
  return {
    barcode: '9300000000000',
    certifications: partial.certifications ?? [],
    _publication: {
      settled: true,
      body: { assessmentLanes: { nutrition: partial.nutrition, processing: partial.processing } },
      transparency: {
        publicationStatus: partial.transparencyRated ? 'rated' : 'nr',
        assessmentLanes: { ingredient_clarity: partial.ingredient, origins: partial.origins },
      },
      claims: { assessmentLanes: { packet: partial.packet, benchmark: 'unassessed_or_incomplete' } },
    } as CrossPillarPublicationSnapshot,
  } as Product;
}

describe('consumer contribution journey recovery', () => {
  it('uses the specified confirmation strings', () => {
    expect(CONTRIBUTION_NOTICE_ADDED).toBe('Thanks - your contribution has been added.');
    expect(CONTRIBUTION_NOTICE_SAVED).toBe(
      'We couldn’t submit this yet. Your contribution has been saved on this device so you can try again.'
    );
  });

  it('shows one ingredients action when either ingredient lane is unresolved and hides it when both are resolved', () => {
    const both = resultContributionActions(
      published({
        nutrition: 'unassessed',
        processing: 'unassessed',
        ingredient: 'unassessed',
        origins: 'unassessed',
        transparencyRated: false,
        packet: 'unassessed_or_incomplete',
      })
    );
    expect(both.addNutrition).toBe(true);
    expect(both.addIngredients).toBe(true);
    expect(both.updateNutrition).toBe(false);
    expect(both.originsAction).toBe('add');
    expect(both.packetClaimsAction).toBe('add');

    const clarityOnly = resultContributionActions(
      published({
        nutrition: 'resolved',
        processing: 'resolved',
        ingredient: 'unassessed',
        origins: 'resolved',
        transparencyRated: true,
        packet: 'assessed',
      })
    );
    expect(clarityOnly.addNutrition).toBe(false);
    expect(clarityOnly.addIngredients).toBe(true);
    expect(clarityOnly.updateNutrition).toBe(true);
    expect(clarityOnly.updateIngredients).toBe(false);
    expect(clarityOnly.packetClaimsAction).toBe('update');

    const resolved = resultContributionActions(
      published({
        nutrition: 'resolved',
        processing: 'resolved',
        ingredient: 'resolved',
        origins: 'unassessed',
        transparencyRated: true,
        packet: 'assessed',
      })
    );
    expect(resolved.addIngredients).toBe(false);
    expect(resolved.updateIngredients).toBe(true);
    expect(resolved.originsAction).toBe('complete');
  });

  it('does not invent a certification scoring tag for unmapped wording', () => {
    expect(governedCertificationLabels('Fairtrade')).toEqual(['en:fair-trade']);
    expect(governedCertificationLabels('a sentence that is not a scheme')).toBeUndefined();
  });

  it('submits a reviewed manual ingredient list without a photo and does not admit it locally', async () => {
    const session = await openSessionForProduct({ barcode: '9300000000999' });
    const unit = await addManualEvidenceUnit({
      sessionId: session.sessionId,
      domain: 'ingredients_nutrition',
      section: 'ingredients',
      statement: 'oats, water',
      support: { coverage: 'whole_image', sourceAssetId: 'manual-text-only' },
    });
    const latest = await getSession(session.sessionId);
    await upsertSession({
      ...latest!,
      units: latest!.units.map((row) =>
        row.unitId === unit.unitId ? { ...row, status: 'reviewed', reviewAction: 'manual_entry' } : row
      ),
    });
    const results = await handoffReviewedUnits({ sessionId: session.sessionId });
    expect(results[0]?.outcome).toBe('submitted');
    if (results[0]?.outcome === 'submitted') {
      const stored = await getLocalEvidenceById(results[0].evidenceId);
      expect(stored?.admissionStatus).not.toBe('admitted');
    }
  });

  it('does not report incomplete coverage after an assessed packet absence when coverage was omitted', () => {
    const ethics = calculateEthicsPillar(
      { barcode: '9300000000888', product_name: 'Oats' } as Product,
      { admittedPacketAbsence: true }
    );
    expect(ethics.score).toBe(15);
    expect(ethics.details.claimsAssessment?.publication_packet_lane).toBe('assessed');
    expect(ethics.details.claimsAssessment?.assessment_state).toBe('assessed_neutral');
    expect(ethics.details.claimsAssessment?.packet_coverage_state).toBe('complete');
    expect(ethics.details.claimsAssessment?.fired_adjustments ?? []).toHaveLength(0);
    expect(ethics.adjustments.some((row) => row.value === 0 && row.id !== 'ethics-v37-base')).toBe(false);
  });
});
