/**
 * Wave 3 Commit E — consumer methodology containment regressions.
 *
 * The legacy Methodology screen is not activated: Settings must not expose it, and the
 * Methodology route must fail closed without rendering translation keys or retired prose.
 */
import fs from 'fs';
import path from 'path';

const REPO_ROOT = path.resolve(__dirname, '../../../..');

function read(relative: string): string {
  return fs.readFileSync(path.join(REPO_ROOT, relative), 'utf8');
}

describe('Commit E — consumer methodology containment', () => {
  const settingsSource = read('app/settings.tsx');
  const methodologySource = read('app/methodology.tsx');

  it('Settings no longer exposes the stale Methodology destination', () => {
    expect(settingsSource).not.toMatch(/navigate\(\s*['"]Methodology['"]\s*\)/);
    expect(settingsSource).not.toMatch(/settings\.methodology/);
    expect(settingsSource).not.toMatch(/Methodology & how Rveel Score works/);
  });

  it('Methodology route renders neither methodology.* translation keys nor latent fallback prose', () => {
    expect(methodologySource).not.toMatch(/t\(\s*['"]methodology\./);
    expect(methodologySource).not.toMatch(/How Rveel Score works/);
    expect(methodologySource).not.toMatch(/four pillars/);
    expect(methodologySource).not.toMatch(/combining the four pillars/i);
    expect(methodologySource).not.toMatch(/transparent, rule-based scoring framework/);
    expect(methodologySource).not.toMatch(/Eco-Score letter/);
    expect(methodologySource).not.toMatch(/consumerPillarLabel/);
    expect(methodologySource).not.toMatch(/ScrollView/);
  });

  it('Methodology route redirects safely instead of activating legacy content', () => {
    expect(methodologySource).toMatch(/goBack\s*\(/);
    expect(methodologySource).toMatch(/replace\(\s*['"]DeveloperSettings['"]\s*\)/);
    expect(methodologySource).toMatch(/return\s+<\s*View\s*\/>/);
  });

  it('does not keep the legacy methodology prose as a dormant render branch', () => {
    expect(methodologySource).not.toMatch(/\|\|\s*['"`]/);
    expect(methodologySource).not.toMatch(/Body pillar|Planet pillar|Ethics pillar|Open pillar/);
  });
});
