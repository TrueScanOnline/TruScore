// Sharing module exports
export { ShareService } from './services/ShareService';
export { ShareContentBuilder } from './services/ShareContentBuilder';
export type { ShareContent, ShareOptions, ShareResult, SharePlatform, ShareableItem } from './types';
export {
  buildAdditiveDetailSharePayload,
  buildAdditivesOverviewSharePayload,
  buildEmptyAdditivesOverviewSharePayload,
  buildAdditivesShareMessage,
  additivesShareText,
  ADDITIVES_OVERVIEW_HIGHLIGHT_LIMIT,
} from './additivesShareContent';
export type { AdditiveSharePayload, AdditiveShareHighlight } from './additivesShareContent';


