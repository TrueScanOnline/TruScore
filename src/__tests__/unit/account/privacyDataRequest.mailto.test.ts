import { buildPrivacyDataRequestMailto } from '../../../utils/reportPrivacyMailto';
import { buildAssessmentReportMailto } from '../../../utils/reportAssessmentMailto';

describe('privacy data request mailto', () => {
  test('returns null when support email is missing', () => {
    expect(buildPrivacyDataRequestMailto('', 'Subject')).toBeNull();
    expect(buildPrivacyDataRequestMailto('   ', 'Subject')).toBeNull();
  });

  test('builds a personal-information request without GTIN or pack-photo demand', () => {
    const url = buildPrivacyDataRequestMailto('privacy@example.test', 'RVEEL personal data request', {
      requestType: 'access',
      description: 'Please confirm what is stored about this device.',
    });
    expect(url).toMatch(/^mailto:/);
    const decoded = decodeURIComponent(url!);
    expect(decoded).toMatch(/personal information request/i);
    expect(decoded).toMatch(/Request type: access/);
    expect(decoded).toMatch(/does not require a barcode or pack photographs/i);
    expect(decoded).toMatch(/does not transmit, confirm receipt, delete an account/i);
    expect(decoded).not.toMatch(/Barcode \/ GTIN/);
    expect(decoded).not.toMatch(/Please attach pack photos/);
    expect(decoded).not.toMatch(/incorrect assessment report/i);
  });

  test('assessment report mailto remains product-oriented and distinct', () => {
    const assessment = decodeURIComponent(
      buildAssessmentReportMailto('support@example.test', 'Report', {
        barcode: '4088700300930',
      }) || ''
    );
    const privacy = decodeURIComponent(
      buildPrivacyDataRequestMailto('support@example.test', 'Privacy', {
        requestType: 'deletion',
      }) || ''
    );
    expect(assessment).toMatch(/Barcode \/ GTIN/);
    expect(privacy).not.toMatch(/Barcode \/ GTIN/);
    expect(privacy).toMatch(/Request type: deletion/);
  });
});

describe('PrivacyDataScreen uses privacy request opener', () => {
  test('screen source wires openPrivacyDataRequest rather than openAssessmentReport', () => {
    const fs = require('fs');
    const path = require('path');
    const src = fs.readFileSync(
      path.resolve(__dirname, '../../../screens/account/PrivacyDataScreen.tsx'),
      'utf8'
    );
    expect(src).toMatch(/openPrivacyDataRequest/);
    expect(src).not.toMatch(/openAssessmentReport/);
  });
});
