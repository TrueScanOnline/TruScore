export type { DynamicSignalPublicationRecord, MyChoicesChainContext } from './types';
export { buildPublicationDedupeKey, buildSignalId } from './signalIdentity';
export { classAllowsPublishable, initialSignalPublicationState } from './classGatePolicy';
export {
  materializePublicationFromCandidate,
  tryApplyPublicationIntent,
  recordMislinkReport,
  scheduleEditorial,
  applyStalenessExpiryIfDue,
  fingerprint5ANonPublicationData,
} from './publicationStateEngine';
export { computeValidUntilIso, isPastValidUntil } from './validityPolicy';
