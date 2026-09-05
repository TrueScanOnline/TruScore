/**
 * Founder-locked Body additive L3 copy.
 * Authority: Rveel_Wave3_Score_Highlights_L3_Content_Closure_Addendum_20260905_v1_1 (Body — Additives)
 * with Rveel_Wave3_Body_Score_Highlights_Founder_Locked_Commentary_L3_ID_Contract_S27_Context_20260905_v0_6.
 *
 * Used exclusively by the in-app "About these additives" experience. Consumer prose carries no
 * app-name self-reference.
 */

import type { BodyV12AdjustmentId } from '../lib/truscoreEngine/pillars/bodyPillarV12Registry';

export const ABOUT_THESE_ADDITIVES_TITLE = 'About these additives';

export const ABOUT_THESE_ADDITIVES_INTRO =
  'These are the additives identified in the information available for this product. Here\u2019s what they are, why they\u2019re used, and the evidence behind this Body finding. This may not be a complete list of every additive in the product.';

export interface AdditiveSourceLink {
  label: string;
  url: string;
}

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
  'EU/UK packs containing the detected colour(s) must warn that they \u201cmay have an adverse effect on activity and attention in children.\u201d FSANZ says the evidence has not established a causal link between the individual colours and behavioural effects, and its Australian dietary-exposure work for certain colours/additives found estimated intakes below the relevant Acceptable Daily Intakes, including for high consumers. In the US, FDA is working with industry to eliminate petroleum-based food dyes by the end of 2027, while California will prohibit these colours in specified public-school foods from the end of 2027.';

export const COLOUR_CLUSTER_SOURCES: readonly AdditiveSourceLink[] = [
  {
    label: 'FSANZ \u2014 Food colours',
    url: 'https://www.foodstandards.gov.au/consumer/additives/foodcolour',
  },
  {
    label: 'GOV.UK \u2014 Food and drink warnings',
    url: 'https://www.gov.uk/food-labelling-and-packaging/food-and-drink-warnings',
  },
  {
    label: 'US FDA \u2014 petroleum-based dye transition',
    url: 'https://www.fda.gov/food/color-additives-information-consumers/tracking-food-industry-pledges-remove-petroleum-based-food-dyes',
  },
];

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
    'The US permits titanium dioxide in food up to 1% by weight. AU/NZ uses a different control: E171 is permitted as a colouring at Good Manufacturing Practice, which requires using no more than is necessary to achieve the intended technological purpose.',
  sources: [
    {
      label: 'FSANZ \u2014 Review of titanium dioxide',
      url: 'https://www.foodstandards.gov.au/consumer/foodtech/Review-of-titanium-dioxide-as-a-food-additive',
    },
    {
      label: 'EFSA \u2014 E171 safety assessment',
      url: 'https://www.efsa.europa.eu/en/news/titanium-dioxide-e171-no-longer-considered-safe-when-used-food-additive',
    },
    {
      label: 'Health Canada \u2014 TiO2 science report',
      url: 'https://www.canada.ca/en/health-canada/services/food-nutrition/reports-publications/titanium-dioxide-food-additive-science-report.html',
    },
    {
      label: 'US FDA \u2014 Titanium dioxide in foods',
      url: 'https://www.fda.gov/industry/color-additives/titanium-dioxide-color-additive-foods',
    },
  ] as readonly AdditiveSourceLink[],
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
    'US rules pair nitrite limits for pumped bacon with a requirement to add vitamin-C-like compounds that reduce nitrosamine formation. AU/NZ also controls nitrite use through mandatory maximum levels for cured meats; EU limits were reduced from 2025 and Denmark maintains lower national limits for a range of meat products.',
  sources: [
    {
      label: 'FSANZ \u2014 Nitrates and nitrites',
      url: 'https://www.foodstandards.gov.au/consumer/additives/nitrate',
    },
    {
      label: 'USDA/FSIS \u2014 Bacon and Food Safety',
      url: 'https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/meat-catfish/bacon-and-food-safety',
    },
    {
      label: 'EU Regulation 2023/2108',
      url: 'https://eur-lex.europa.eu/eli/reg/2023/2108/oj',
    },
    {
      label: 'Danish Veterinary and Food Administration \u2014 nitrite',
      url: 'https://foedevarestyrelsen.dk/kost-og-foedevarer/foedevaresikkerhed/tilsaetninger/tilsaetningsstoffer/nitrit',
    },
  ] as readonly AdditiveSourceLink[],
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
    'The International Agency for Research on Cancer (IARC) assessed cancer hazard and placed aspartame in Group 2B \u2014 \u201cpossibly carcinogenic to humans\u201d \u2014 within its four-group hazard classification. The classification reflects the strength of evidence that something can cause cancer; it does not indicate the level of risk from a particular exposure. JECFA assessed risk at expected exposure levels and kept the acceptable daily intake at 40 mg per kg of body weight. FSANZ says current AU/NZ standards remain appropriate, while the US FDA disagrees with IARC\u2019s conclusion that the cited studies support classifying aspartame as a possible carcinogen to humans and continues to consider approved uses safe under its conditions of use.',
  sources: [
    {
      label: 'WHO \u2014 Aspartame hazard/risk assessment',
      url: 'https://www.who.int/news/item/14-07-2023-aspartame-hazard-and-risk-assessment-results-released',
    },
    {
      label: 'IARC \u2014 carcinogenic classifications',
      url: 'https://www.iarc.who.int/wp-content/uploads/2023/06/IARC_MONO_classification_2023_updated.png',
    },
    {
      label: 'FSANZ \u2014 Aspartame statement',
      url: 'https://www.foodstandards.gov.au/media/Media-statement-on-aspartame',
    },
    {
      label: 'US FDA \u2014 Aspartame and other sweeteners',
      url: 'https://www.fda.gov/food/food-additives-petitions/aspartame-and-other-sweeteners-food',
    },
  ] as readonly AdditiveSourceLink[],
};
