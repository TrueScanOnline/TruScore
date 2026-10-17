import { closedPrelaunchModule } from './closedPrelaunchMarks';
import { selectClosedPrelaunchMark, type ClosedPrelaunchSurface } from './closedPrelaunchSelection';

export function closedPrelaunchImage(input: {
  surface: ClosedPrelaunchSurface;
  researchId?: string | null;
  productionId?: string | null;
  consumerName?: string | null;
}): { moduleId: number; accessibleName: string } | null {
  const mark = selectClosedPrelaunchMark({
    enabled: process.env.EXPO_PUBLIC_CLOSED_PRELAUNCH_VISUAL_UAT === '1',
    ...input,
  });
  if (!mark) return null;
  const moduleId = closedPrelaunchModule(mark.researchId);
  if (moduleId == null) return null;
  return { moduleId, accessibleName: mark.alt || mark.consumerName };
}
