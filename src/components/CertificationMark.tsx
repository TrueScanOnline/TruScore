import React from 'react';
import { Image, Text } from 'react-native';
import {
  resolveCertificationArtwork,
  type CertificationArtworkSurface,
} from '../certifications/certificationArtwork';

export default function CertificationMark({
  name,
  productionId,
  surface,
  associationAdmitted,
  color,
}: {
  name: string;
  productionId?: string;
  surface: CertificationArtworkSurface;
  associationAdmitted?: boolean;
  color?: string;
}) {
  const decision = resolveCertificationArtwork({
    accessibleName: name,
    productionId,
    surface,
    platform: undefined,
    associationAdmitted,
  });
  if (decision.render === 'mark') {
    return (
      <Image
        source={{ uri: decision.assetRef }}
        accessibilityLabel={decision.accessibleName}
        style={{ width: 20, height: 20 }}
      />
    );
  }
  return (
    <Text accessibilityRole="text" style={color ? { color } : undefined}>
      {decision.accessibleName}
    </Text>
  );
}
