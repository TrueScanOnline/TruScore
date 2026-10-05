import { visibleEvidenceImages, type EvidenceSurfaceImage } from '../../../evidenceImage/projection';
import { catalogueHeroUrl, resolveDisplayedHero } from '../../../services/heroImage';

const ingredientsPhoto: EvidenceSurfaceImage = {
  assetId: 'src_ingredients',
  journeyId: 'journey-ingredients',
  entryContext: 'ingredients',
};

describe('evidence image consumer projection', () => {
  it('follows capture, admission, refresh, rescan, and another contribution card', () => {
    const active = { journeyId: 'journey-ingredients', entryContext: 'ingredients' };
    expect(visibleEvidenceImages([ingredientsPhoto], active).map((image) => image.assetId)).toEqual([
      'src_ingredients',
    ]);

    const admittedSurface = null;
    expect(visibleEvidenceImages([ingredientsPhoto], admittedSurface)).toEqual([]);

    const refreshed = { journeyId: 'journey-refresh', entryContext: 'ingredients' };
    expect(visibleEvidenceImages([ingredientsPhoto], refreshed)).toEqual([]);

    const rescanned = { journeyId: 'journey-rescan', entryContext: 'ingredients' };
    expect(visibleEvidenceImages([ingredientsPhoto], rescanned)).toEqual([]);

    const origins = { journeyId: 'journey-ingredients', entryContext: 'origins' };
    expect(visibleEvidenceImages([ingredientsPhoto], origins)).toEqual([]);
  });
});

describe('hero image bridge', () => {
  const offSmall = 'https://images.openfoodfacts.org/front-small.jpg';
  const contributed = 'https://blob.vercel-storage.com/user-hero.jpg';

  it('shows the local photo while catalogue imagery is absent', () => {
    expect(
      resolveDisplayedHero({
        catalogueUrl: catalogueHeroUrl({ image_url: contributed }, contributed),
        interimUri: 'file:///cache/interim-hero.jpg',
        contributedUrl: contributed,
      })
    ).toBe('file:///cache/interim-hero.jpg');
  });

  it('uses a later catalogue image ahead of a more recent user photo', () => {
    expect(
      catalogueHeroUrl(
        { image_front_small_url: offSmall, image_front_url: contributed, image_url: contributed },
        contributed
      )
    ).toBe(offSmall);
    expect(
      resolveDisplayedHero({
        catalogueUrl: offSmall,
        interimUri: 'file:///cache/interim-hero.jpg',
        contributedUrl: contributed,
      })
    ).toBe(offSmall);
  });

  it('does not treat a data URL or file path as catalogue imagery', () => {
    expect(catalogueHeroUrl({ image_front_url: 'data:image/jpeg;base64,abc', image_url: 'file:///tmp/a.jpg' })).toBe(
      null
    );
  });
});
