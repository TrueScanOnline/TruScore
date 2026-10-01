import * as fs from 'fs';
import * as path from 'path';
import { COUNTRIES, canonicalOriginCountryName } from '../../../utils/countries';
import {
  governedOriginCountryNames,
  originCountrySlots,
  placeFromCountrySlots,
} from '../../../contribution/originCountrySelection';
import { originRowsToSubmit } from '../../../contribution/governedDisplayProjection';
import { isRecognizedOriginCountry } from '../../../lib/truscoreEngine/pillars/openPillarOriginsV15';
import { productOriginsCardPresentation } from '../../../origins/productOriginsCard';
import type { Product } from '../../../types/product';

const REPO = path.resolve(__dirname, '../../../..');

function read(rel: string): string {
  return fs.readFileSync(path.join(REPO, rel), 'utf8');
}

function country(name: string) {
  const found = COUNTRIES.find((item) => item.name === name);
  if (!found) throw new Error(`missing country ${name}`);
  return found;
}

describe('Origins contribution country selector', () => {
  const modal = read('src/components/PacketContributionModal.tsx');
  const picker = read('src/components/CountryPicker.tsx');

  test('reuses the manual product-entry country selector for every origin country', () => {
    expect(modal).toContain("import CountryPicker from './CountryPicker'");
    expect(modal).toContain('<CountryPicker');
    expect(modal).toContain('Add another country');
    expect(modal).not.toContain('Country or place stated on the pack');
    expect(picker).toContain('COUNTRIES.filter');
    expect(picker).toContain('country.name.toLowerCase().includes(searchQuery.toLowerCase())');
    expect(read('src/components/ManualProductEntryModal.tsx')).toContain("import CountryPicker from './CountryPicker'");
  });

  test('offers the full country list and accepts Canada, Ghana, and Italy', () => {
    expect(COUNTRIES.filter((item) => item.code === 'AU' || item.code === 'NZ').length).toBe(2);
    expect(COUNTRIES.length).toBeGreaterThan(2);
    for (const name of ['Canada', 'Ghana', 'Italy']) {
      expect(canonicalOriginCountryName(name)).toBe(name);
      expect(isRecognizedOriginCountry(name)).toBe(true);
    }
    const matches = COUNTRIES.filter((item) => item.name.toLowerCase().includes('gha'));
    expect(matches.map((item) => item.name)).toContain('Ghana');
    expect(matches.map((item) => item.name)).not.toContain('Australia');
  });

  test('keeps one selector per country and leaves packet wording unchanged', () => {
    const wording = 'Grown in Canada and packed beside Italian tomatoes';
    expect(originCountrySlots('', 0)).toEqual([null]);
    expect(originCountrySlots('Canada, Italy', 1).map((slot) => slot?.name ?? null)).toEqual([
      'Canada',
      'Italy',
      null,
    ]);
    const place = placeFromCountrySlots([country('Canada'), country('Ghana'), country('Italy'), null]);
    expect(place).toBe('Canada, Ghana, Italy');
    expect(governedOriginCountryNames('Canada, made up, Italy')).toEqual(['Canada', 'Italy']);
    const [row] = originRowsToSubmit([
      {
        claimType: 'grown_in',
        wording,
        place,
        ingredient: '',
        percentage: '',
      },
    ]);
    expect(row.wording).toBe(wording);
    expect(row.place).toBe(place);
    expect(governedOriginCountryNames(row.place)).toEqual(['Canada', 'Ghana', 'Italy']);
  });

  test('submitted country names still display with the captured wording', () => {
    const exactWording = 'Product of Canada';
    const card = productOriginsCardPresentation({
      barcode: '9300673555555',
      rveelGovernedOrigins: [
        {
          evidenceId: 'origin-canada',
          subjectKey: 'grown_in',
          claimType: 'grown_in',
          countries: ['Canada'],
          exactWording,
          confidence: 'limited',
        },
      ],
    } as Product);
    expect(card.facts[0].countries).toEqual(['Canada']);
    expect(card.facts[0].exactWording).toBe(exactWording);
  });
});
