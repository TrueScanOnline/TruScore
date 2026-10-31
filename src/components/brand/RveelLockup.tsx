import { Image, type ImageStyle, type StyleProp } from 'react-native';

const light = require('../../../assets/brand/lockup-light.png');
const ink = require('../../../assets/brand/lockup-ink.png');

/** Artwork viewBox is 241 by 80. */
const ASPECT = 241 / 80;

/**
 * Rveel mark and wordmark. Light sits on emerald or a camera image.
 * Ink sits on the mint and white surfaces.
 */
export function RveelLockup({
  tone = 'light',
  height = 28,
  style,
}: {
  tone?: 'light' | 'ink';
  height?: number;
  style?: StyleProp<ImageStyle>;
}) {
  return (
    <Image
      source={tone === 'light' ? light : ink}
      accessibilityLabel="Rveel"
      accessibilityRole="image"
      style={[{ width: height * ASPECT, height }, style]}
      resizeMode="contain"
    />
  );
}
