/**
 * Wave 3 Score Highlights — governed in-app L3 destination targets (L3 Content Closure Addendum v1.0).
 */

export type ScoreHighlightL3InAppTarget =
  | 'additives'
  | 'product_origins'
  | 'nutri_score'
  | 'nova'
  | 'green_score'
  | 'packaging'
  | 'ethics_fairtrade'
  | 'ethics_rainforest'
  | 'ethics_msc'
  | 'ethics_asc'
  | 'ethics_organic'
  | 'ethics_ktc'
  | 'ethics_bbfaw'
  | 'ingredient_wording';

export const L3_TITLES: Record<ScoreHighlightL3InAppTarget, string> = {
  additives: 'About these additives',
  product_origins: 'Product Origins',
  nutri_score: 'How Nutri-Score works',
  nova: 'How NOVA classifies food processing',
  green_score: 'How Green-Score estimates environmental impact',
  packaging: 'How this packaging was assessed',
  ethics_fairtrade: 'What the Fairtrade mark means',
  ethics_rainforest: 'What Rainforest Alliance certification means',
  ethics_msc: 'What the MSC blue label means',
  ethics_asc: 'What the ASC label means',
  ethics_organic: 'What this organic claim means',
  ethics_ktc: 'How KnowTheChain assessed this company',
  ethics_bbfaw: 'How BBFAW assessed this company',
  ingredient_wording: 'Ingredient wording explained',
};
