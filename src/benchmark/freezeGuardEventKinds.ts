/**
 * Bounded event kinds for freeze-guard logging (observability / tests). Do not use ad-hoc string
 * literals at call sites — import these constants to avoid drift.
 */

export const FREEZE_GUARD_INTENT = {
  in_place_update: 'in_place_update',
  register_initial: 'register_initial',
  supersede: 'supersede',
  read: 'read',
} as const;

export type FreezeGuardIntent = (typeof FREEZE_GUARD_INTENT)[keyof typeof FREEZE_GUARD_INTENT];

export const FREEZE_GUARD_RESULT = {
  blocked: 'blocked',
  allowed: 'allowed',
  noop: 'noop',
} as const;

export type FreezeGuardResult = (typeof FREEZE_GUARD_RESULT)[keyof typeof FREEZE_GUARD_RESULT];
