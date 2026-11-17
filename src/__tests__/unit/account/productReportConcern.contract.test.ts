import fs from 'fs';
import path from 'path';
import {
  PRODUCT_REPORT_CONCERN_TYPES,
  PRODUCT_REPORT_CONCERN_LABEL_KEYS,
} from '../../../content/accountTrustContent';
import en from '../../../i18n/locales/en.json';

const root = path.resolve(__dirname, '../../../..');

describe('product report concern classification', () => {
  test('every concern type has an English label', () => {
    for (const concern of PRODUCT_REPORT_CONCERN_TYPES) {
      const key = PRODUCT_REPORT_CONCERN_LABEL_KEYS[concern].replace(/^account\./, '') as keyof typeof en.account;
      expect(typeof en.account[key]).toBe('string');
      expect(String(en.account[key]).length).toBeGreaterThan(3);
    }
  });

  test('Result report control uses concern picker and preserves product context fields', () => {
    const result = fs.readFileSync(path.join(root, 'app/result/[barcode].tsx'), 'utf8');
    expect(result).toMatch(/ProductAssessmentReportControl/);
    expect(result).toMatch(/productContext=/);
    expect(result).toMatch(/barcode:/);
    expect(result).not.toMatch(/openAssessmentReport\(/);
  });

  test('Help opens concern picker before mailto', () => {
    const help = fs.readFileSync(
      path.join(root, 'src/screens/account/HelpSupportScreen.tsx'),
      'utf8'
    );
    expect(help).toMatch(/setReportPickerOpen\(true\)/);
    expect(help).toMatch(/errorType: concern/);
  });
});
