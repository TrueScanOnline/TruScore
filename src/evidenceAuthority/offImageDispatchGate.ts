/** Product photos the live OFF account may receive. Country-label stays off this path. */
export const OFF_IMAGE_DISPATCH_FIELDS = ['front', 'ingredients', 'nutrition', 'packaging'] as const;

export type OffImageDispatchField = (typeof OFF_IMAGE_DISPATCH_FIELDS)[number];

export function offImageFieldAllowed(field: string): field is OffImageDispatchField {
  return (OFF_IMAGE_DISPATCH_FIELDS as readonly string[]).includes(field);
}

/**
 * Production never dispatches. UAT dispatches only when the live-write execute
 * flag and both account secrets are present. The secrets themselves stay on the server.
 */
export function offImageDispatchDecision(input: {
  authorityEnv: string;
  execute: string;
  hasUser: boolean;
  hasPassword: boolean;
  networkAllowed: boolean;
}): 'ok' | 'disabled' | 'unconfigured' {
  if (input.authorityEnv === 'production') return 'disabled';
  if (!input.networkAllowed || input.execute !== '1' || !input.hasUser || !input.hasPassword) return 'unconfigured';
  return 'ok';
}
