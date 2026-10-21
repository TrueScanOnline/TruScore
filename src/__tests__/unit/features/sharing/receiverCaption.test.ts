import { buildReceiverCaption } from '../../../../features/sharing/receiverCaption';

describe('receiver caption', () => {
  test('puts the sender note once, then the product, the section, and one link', () => {
    const caption = buildReceiverCaption({
      note: 'Worth a look',
      productName: 'Tomatoes Mexican Style',
      section: 'Nutrition',
      summary: 'Per 100 g\nEnergy 22 kcal',
      url: 'https://truescan.app/barcode/9400547009879?ctx=nutrition',
      includeSummary: false,
    });
    expect(caption).toBe(
      [
        'Worth a look',
        '',
        'Tomatoes Mexican Style',
        'Nutrition',
        '',
        'Open in Rveel',
        'https://truescan.app/barcode/9400547009879?ctx=nutrition',
      ].join('\n')
    );
    expect(caption.match(/truescan\.app/g)).toHaveLength(1);
  });

  test('includes the shared facts when the card image is not attached', () => {
    const caption = buildReceiverCaption({
      productName: 'Tomatoes Mexican Style',
      section: 'Nutrition',
      summary: 'Per 100 g\nEnergy 22 kcal',
      url: 'https://truescan.app/barcode/9400547009879',
      includeSummary: true,
    });
    expect(caption).toContain('Per 100 g');
    expect(caption).toContain('Energy 22 kcal');
    expect(caption).not.toContain("Thought you'd find this interesting");
  });
});
