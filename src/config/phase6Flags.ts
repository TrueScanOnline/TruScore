/**
 * Phase 6 rollout framing flags.
 * Slice 0 introduces a single place to flip gated behavior.
 */
export const PHASE6_FLAGS = {
  foundationEnabled: true,
  useSingleSignalMappingOwner: true,
  enforceDoc5EnumSources: true,
} as const;

