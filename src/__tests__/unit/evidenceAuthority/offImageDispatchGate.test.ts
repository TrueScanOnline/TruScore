import { offImageDispatchDecision, offImageFieldAllowed } from '../../../evidenceAuthority/offImageDispatchGate';

describe('OFF image dispatch gate', () => {
  it('allows the product photo fields and keeps country labels off the path', () => {
    expect(offImageFieldAllowed('front')).toBe(true);
    expect(offImageFieldAllowed('ingredients')).toBe(true);
    expect(offImageFieldAllowed('nutrition')).toBe(true);
    expect(offImageFieldAllowed('packaging')).toBe(true);
    expect(offImageFieldAllowed('country_label')).toBe(false);
    expect(offImageFieldAllowed('other')).toBe(false);
  });

  it('requires the UAT live account and refuses production', () => {
    const ready = { execute: '1', hasUser: true, hasPassword: true, networkAllowed: true };
    expect(offImageDispatchDecision({ ...ready, authorityEnv: 'uat' })).toBe('ok');
    expect(offImageDispatchDecision({ ...ready, authorityEnv: 'production' })).toBe('disabled');
    expect(offImageDispatchDecision({ ...ready, authorityEnv: 'uat', hasPassword: false })).toBe('unconfigured');
    expect(offImageDispatchDecision({ ...ready, authorityEnv: 'uat', execute: '' })).toBe('unconfigured');
    expect(offImageDispatchDecision({ ...ready, authorityEnv: 'uat', networkAllowed: false })).toBe('unconfigured');
  });
});