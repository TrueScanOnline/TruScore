import type { TruScoreScoringContext } from '../lib/truscoreEngine';
import { useSettingsStore } from '../store/useSettingsStore';

/** User-persisted Planet packaging jurisdiction for TruScore (AU/NZ kerbside rules). */
export function getPlanetScoringContext(): TruScoreScoringContext | undefined {
  const m = useSettingsStore.getState().planetPackagingMarket;
  if (m === 'AU' || m === 'NZ') return { planetMarket: m };
  return undefined;
}
