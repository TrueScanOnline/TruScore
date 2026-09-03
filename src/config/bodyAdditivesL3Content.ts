/**
 * Founder-locked Body additive L3 copy (Body Score Highlights v0.5 §8).
 * Used exclusively by the in-app "About these additives" experience.
 */

import type { BodyV12AdjustmentId } from '../lib/truscoreEngine/pillars/bodyPillarV12Registry';

export const ABOUT_THESE_ADDITIVES_TITLE = 'About these additives';

export const ABOUT_THESE_ADDITIVES_INTRO =
  'These are the additives Rveel surfaced in this product. Here\u2019s what they are, why they\u2019re used and the evidence behind the Body finding. This isn\u2019t necessarily a complete list of every additive in the product.';

export const COLOUR_ADDITIVE_IDS: readonly BodyV12AdjustmentId[] = [
  'body-v12-additive-e102',
  'body-v12-additive-e110',
  'body-v12-additive-e129',
];

export const ALL_GOVERNED_BODY_ADDITIVE_IDS: readonly BodyV12AdjustmentId[] = [
  ...COLOUR_ADDITIVE_IDS,
  'body-v12-additive-e171',
  'body-v12-additive-e250',
  'body-v12-additive-e951',
];

export const COLOUR_CLUSTER_EVIDENCE_STORY =
  'EU/UK packs containing the detected colour(s) must warn that they \u201cmay have an adverse effect on activity and attention in children.\u201d FSANZ says the evidence has not established a causal link between the individual colours and behavioural effects. In the US, FDA is working with industry to eliminate petroleum-based food dyes by the end of 2027, while California will prohibit these colours in specified public-school foods from the end of 2027.';

export interface AdditiveColourTile {
  id: BodyV12AdjustmentId;
  swatch: string;
  name: string;
  whatItIs: string;
  madeFrom: string;
  whyUsed: string;
  usAlias: string;
}

export const COLOUR_TILES: readonly AdditiveColourTile[] = [
  {
    id: 'body-v12-additive-e102',
    swatch: '#F4D03F',
    name: 'Tartrazine (E102)',
    whatItIs: 'Yellow food colour',
    madeFrom: 'Petroleum-derived raw materials',
    whyUsed: 'Bright, consistent yellow colour',
    usAlias: 'Yellow 5',
  },
  {
    id: 'body-v12-additive-e110',
    swatch: '#F39C12',
    name: 'Sunset Yellow (E110)',
    whatItIs: 'Orange-yellow food colour',
    madeFrom: 'Petroleum-derived raw materials',
    whyUsed: 'Strong, consistent orange-yellow colour',
    usAlias: 'Yellow 6',
  },
  {
    id: 'body-v12-additive-e129',
    swatch: '#E74C3C',
    name: 'Allura Red (E129)',
    whatItIs: 'Red food colour',
    madeFrom: 'Petroleum-derived raw materials',
    whyUsed: 'Bright, consistent red colour',
    usAlias: 'Red 40',
  },
];

export const E171_SECTION = {
  title: 'E171 Titanium dioxide',
  microFacts: [
    { label: 'What it is', value: 'White food pigment' },
    { label: 'Made from', value: 'Naturally occurring titanium ores, manufactured into a white pigment' },
    { label: 'Why used', value: 'To whiten, brighten or increase opacity' },
  ],
  whySurfaced:
    'European food-safety experts could not rule out genotoxicity \u2014 possible damage to genetic material \u2014 and the EU stopped permitting E171 in food. FSANZ found no safety concerns in its review, while Health Canada said there was no conclusive scientific evidence that food-grade titanium dioxide is a human-health concern. The US still permits it as a food colour up to 1% by weight.',
  deeperExplanation:
    'European experts did not conclude that E171 was proven to damage DNA; they concluded that a genotoxicity concern could not be ruled out. FSANZ found no safety concerns in its review, while Health Canada said there was no conclusive scientific evidence that food-grade titanium dioxide is a human-health concern.',
  rulesDiffer:
    'The US permits titanium dioxide in food up to 1% by weight. AU/NZ uses a different control: E171 is permitted as a colouring at Good Manufacturing Practice rather than under an equivalent 1% numerical cap. Good Manufacturing Practice requires using the lowest level necessary to achieve the intended effect.',
};

export const E250_SECTION = {
  title: 'E250 Sodium nitrite',
  microFacts: [
    { label: 'What it is', value: 'Curing preservative' },
    {
      label: 'Why used',
      value: 'Helps control dangerous bacteria, extends safe shelf life, and contributes cured flavour and pink colour',
    },
  ],
  tradeOff:
    'Nitrite helps protect cured meat from dangerous bacteria, including the organism that causes botulism. It can also contribute to the formation of nitrosamines, some of which are carcinogenic. That trade-off is why regulators control nitrite use and, in some jurisdictions, require added measures to reduce nitrosamine formation.',
  context:
    'FSANZ estimates that processed meats contribute less than 10% of Australians\u2019 total dietary nitrite exposure. That broader exposure finding is separate from the specific nitrosamine issue in cured meats.',
  rulesDiffer:
    'US rules pair nitrite limits for pumped bacon with a requirement to add vitamin-C-like compounds that reduce nitrosamine formation. AU/NZ also controls nitrite use through mandatory maximum levels for cured meats, but the current Code provisions we reviewed do not include the same added mitigation requirement.',
};

export const E951_SECTION = {
  title: 'E951 Aspartame',
  microFacts: [
    { label: 'What it is', value: 'Intense artificial sweetener' },
    { label: 'Made from', value: 'Two amino acids \u2014 aspartic acid and phenylalanine' },
    { label: 'Sweetness', value: 'About 200 times sweeter than sugar' },
    { label: 'Why used', value: 'To provide sweetness in low-energy or sugar-free foods' },
  ],
  contradiction:
    'One expert group asked whether aspartame can potentially cause cancer; another asked how much risk exists at the amounts people normally consume.',
  deeperExplanation:
    'In formal terms, IARC assessed cancer hazard and classified aspartame as \u201cpossibly carcinogenic\u201d based on limited evidence. JECFA assessed risk at expected exposure levels and kept the acceptable daily intake at 40 mg per kg of body weight. FSANZ says the current AU/NZ standards remain appropriate, while the US FDA continues to consider approved uses safe under its conditions of use.',
};
