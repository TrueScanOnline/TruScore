/**
 * Neutral source/preparation glyph mapping for S25 Source_Profiles glyph_key values.
 * Visual family: informational Ionicons — never warning / RAG risk icons.
 */

import type { Ionicons } from '@expo/vector-icons';

type IoniconName = keyof typeof Ionicons.glyphMap;

const GLYPH_MAP: Record<string, IoniconName> = {
  leaf_extract: 'leaf-outline',
  animal_origin: 'paw-outline',
  fermentation_tank: 'flask-outline',
  crystal_salt: 'diamond-outline',
  natural_transform: 'sync-outline',
  reaction_flask: 'beaker-outline',
  process_transform: 'git-compare-outline',
  enzyme_scissors: 'cut-outline',
  gas_bubbles: 'water-outline',
  petroleum_drop: 'water-outline',
  branching_routes: 'git-branch-outline',
};

/** Result card additive-count glyph — neutral, same family as source/preparation icons. */
export const S25_ADDITIVE_COUNT_GLYPH: IoniconName = 'beaker-outline';

export function glyphForSourceProfile(glyphKey: string): IoniconName {
  return GLYPH_MAP[glyphKey] ?? 'ellipse-outline';
}
