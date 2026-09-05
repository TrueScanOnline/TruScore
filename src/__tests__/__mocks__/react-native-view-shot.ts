/**
 * Jest mock for react-native-view-shot.
 *
 * The real module is native-only, so importing shareCardGenerator under Jest would fail. This mock
 * keeps the module loadable so share services can be exercised on their live code path; it does not
 * simulate image capture.
 */

export const captureRef = jest.fn(async () => 'file:///mock-share-card.png');

export const captureScreen = jest.fn(async () => 'file:///mock-screen.png');

export const releaseCapture = jest.fn();

export default { captureRef, captureScreen, releaseCapture };
