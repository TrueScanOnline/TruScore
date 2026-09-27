/**
 * Bounded engineering comparison through the 4A.1 extraction contract.
 * Fixture observations only. Not a production provider selection and not an auto-A threshold.
 */

export type FeasibilityApproach = 'direct_vlm' | 'ocr_assisted' | 'ocr_degraded';

export type FeasibilityObservation = {
  text: string;
  section: 'nutrition' | 'ingredients' | 'origin' | 'claim' | 'unknown';
  leakedFromNeighbour: boolean;
  unsupported: boolean;
  unitOrBasisMistake: boolean;
};

export type FeasibilityScenarioResult = {
  scenarioId: string;
  approach: FeasibilityApproach;
  status: 'observations' | 'abstained' | 'failed';
  observations: FeasibilityObservation[];
  latencyMs: number;
  relativeCost: 'low' | 'moderate' | 'high';
};

export type FeasibilitySummary = {
  productionProviderSelected: false;
  automaticAThresholdsEstablished: false;
  results: FeasibilityScenarioResult[];
  notes: string[];
};

type Scenario = {
  id: string;
  description: string;
  runs: Record<FeasibilityApproach, Omit<FeasibilityScenarioResult, 'scenarioId' | 'approach'>>;
};

/** Difficult non-personal AU/NZ pack situations described as text fixtures, not photographs of people. */
const SCENARIOS: Scenario[] = [
  {
    id: 'au-muesli-back-panel',
    description: 'AU muesli back panel: nutrition table beside a “high in fibre” claim and the ingredients list.',
    runs: {
      direct_vlm: {
        status: 'observations',
        latencyMs: 2400,
        relativeCost: 'high',
        observations: [
          { text: 'Fibre 9.5g per 100g', section: 'nutrition', leakedFromNeighbour: false, unsupported: false, unitOrBasisMistake: false },
          { text: 'Sugars 18g', section: 'nutrition', leakedFromNeighbour: true, unsupported: true, unitOrBasisMistake: true },
        ],
      },
      ocr_assisted: {
        status: 'observations',
        latencyMs: 900,
        relativeCost: 'moderate',
        observations: [
          { text: 'Fibre 9.5g per 100g', section: 'nutrition', leakedFromNeighbour: false, unsupported: false, unitOrBasisMistake: false },
        ],
      },
      ocr_degraded: {
        status: 'abstained',
        latencyMs: 400,
        relativeCost: 'low',
        observations: [],
      },
    },
  },
  {
    id: 'nz-juice-mixed-origin',
    description: 'NZ juice: “Made in New Zealand from imported and local ingredients” beside the nutrition panel.',
    runs: {
      direct_vlm: {
        status: 'observations',
        latencyMs: 2200,
        relativeCost: 'high',
        observations: [
          { text: 'Made in New Zealand', section: 'origin', leakedFromNeighbour: false, unsupported: true, unitOrBasisMistake: false },
        ],
      },
      ocr_assisted: {
        status: 'observations',
        latencyMs: 800,
        relativeCost: 'moderate',
        observations: [
          {
            text: 'Made in New Zealand from imported and local ingredients',
            section: 'origin',
            leakedFromNeighbour: false,
            unsupported: false,
            unitOrBasisMistake: false,
          },
        ],
      },
      ocr_degraded: {
        status: 'observations',
        latencyMs: 350,
        relativeCost: 'low',
        observations: [
          { text: 'Made in New Zealand from imported and local ingredients', section: 'origin', leakedFromNeighbour: false, unsupported: false, unitOrBasisMistake: false },
        ],
      },
    },
  },
  {
    id: 'bilingual-cracker-basis',
    description: 'Bilingual cracker panel where per-serve and per-100g figures sit in adjacent columns.',
    runs: {
      direct_vlm: {
        status: 'observations',
        latencyMs: 2600,
        relativeCost: 'high',
        observations: [
          { text: 'Energy 210kJ', section: 'nutrition', leakedFromNeighbour: false, unsupported: false, unitOrBasisMistake: true },
        ],
      },
      ocr_assisted: {
        status: 'abstained',
        latencyMs: 1100,
        relativeCost: 'moderate',
        observations: [],
      },
      ocr_degraded: {
        status: 'abstained',
        latencyMs: 300,
        relativeCost: 'low',
        observations: [],
      },
    },
  },
];

export function runBoundedFeasibilityComparison(): FeasibilitySummary {
  const results: FeasibilityScenarioResult[] = [];
  for (const scenario of SCENARIOS) {
    (['direct_vlm', 'ocr_assisted', 'ocr_degraded'] as const).forEach((approach) => {
      results.push({ scenarioId: scenario.id, approach, ...scenario.runs[approach] });
    });
  }
  return {
    productionProviderSelected: false,
    automaticAThresholdsEstablished: false,
    results,
    notes: [
      'Compared as fixture observations through one contract. No live vendor call and no provider was selected.',
      'Direct VLM-shaped output was more willing to emit a value and also more willing to leak a neighbouring claim or drop a qualifier.',
      'OCR-assisted output abstained on the ambiguous per-serve/per-100g panel and kept the mixed-origin sentence intact.',
      'Degraded OCR abstained on the crowded nutrition panel. That abstention is a success, not an empty fact.',
      'Consumer correction burden is highest where a model emits a confident-looking value that is unsupported or the wrong basis.',
    ],
  };
}

export function countFeasibilityDefects(summary: FeasibilitySummary): {
  leakage: number;
  unsupported: number;
  unitOrBasisMistakes: number;
  abstentions: number;
} {
  return summary.results.reduce(
    (counts, result) => {
      if (result.status === 'abstained') counts.abstentions += 1;
      for (const observation of result.observations) {
        if (observation.leakedFromNeighbour) counts.leakage += 1;
        if (observation.unsupported) counts.unsupported += 1;
        if (observation.unitOrBasisMistake) counts.unitOrBasisMistakes += 1;
      }
      return counts;
    },
    { leakage: 0, unsupported: 0, unitOrBasisMistakes: 0, abstentions: 0 }
  );
}
