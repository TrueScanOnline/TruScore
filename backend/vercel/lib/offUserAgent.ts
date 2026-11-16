/**
 * Server-side OFF User-Agent. Never invent a contact mailbox.
 * Prefer OFF_API_CONTACT_EMAIL, then EXPO_PUBLIC_SUPPORT_EMAIL / SUPPORT_EMAIL.
 */

export function resolveOffContactEmail(env: NodeJS.ProcessEnv = process.env): string {
  const dedicated = String(env.OFF_API_CONTACT_EMAIL || '').trim();
  if (dedicated) return dedicated;
  const support = String(
    env.EXPO_PUBLIC_SUPPORT_EMAIL || env.SUPPORT_EMAIL || env.RVEEL_SUPPORT_EMAIL || ''
  ).trim();
  return support;
}

export function buildServerOffUserAgent(env: NodeJS.ProcessEnv = process.env): string {
  const contact = resolveOffContactEmail(env);
  if (contact) return `Rveel/1.0.0 (${contact})`;
  return 'Rveel/1.0.0';
}

export function isOffContactConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  return resolveOffContactEmail(env).length > 0;
}

/** Public OFF contribution requires explicit server entitlement. Default OFF. */
export function isOffPublicContributionEnabledServer(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.OFF_PUBLIC_CONTRIBUTION_ENABLED === '1' || env.EXPO_PUBLIC_OFF_PUBLIC_CONTRIBUTION === '1';
}
