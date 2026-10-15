import fs from 'fs';
import path from 'path';
import i18n from '../../../i18n';

describe('search error presentation', () => {
  test('the outer search failure uses the existing error copy and the database failure does not replace it', () => {
    const source = fs.readFileSync(path.join(__dirname, '../../../../app/search.tsx'), 'utf8');
    const outer = source.slice(source.indexOf("console.error('Search error:'"), source.indexOf('}, [recentScans, t]'));
    const database = source.slice(source.indexOf("console.error('Database search error:'"), source.indexOf('const sortedResults'));
    expect(outer).toContain("setSearchError(t('search.error'))");
    expect(database).not.toContain('setSearchError');
    expect(source).toContain('{searchError}');
    expect(i18n.t('search.error')).toBe('Search error occurred');
  });
});
