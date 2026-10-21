import { SCORE_HIGHLIGHTS_HEADING } from '../lib/scoreHighlights';

/** Heading on the shared card for the control the sender used. */
export function shareStoryHeading(shareType: string): string {
  switch (shareType) {
    case 'nutrition':
      return 'Nutrition';
    case 'ingredients':
      return 'Ingredients';
    case 'countryOfManufacture':
      return 'Product origins';
    case 'allergens':
      return 'Allergens & additives';
    case 'ecoscore':
      return 'Planet';
    case 'palmOil':
      return 'Palm oil';
    case 'processing':
      return 'Processing';
    case 'recall':
      return 'Recall';
    case 'insights':
      return 'Insights';
    case 'highlights':
      return SCORE_HIGHLIGHTS_HEADING;
    case 'productInfo':
      return 'Product';
    default:
      return 'Rveel Score';
  }
}
