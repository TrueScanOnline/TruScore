import React from 'react';
import { Image, Text, View } from 'react-native';
import { closedPrelaunchImage } from '../certifications/artwork/closedPrelaunchImage';
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
  imageOnly = false,
  markSize = 32,
}: {
  name: string;
  productionId?: string;
  surface: CertificationArtworkSurface;
  associationAdmitted?: boolean;
  color?: string;
  imageOnly?: boolean;
  markSize?: number;
}) {
  const decision = resolveCertificationArtwork({
    accessibleName: name,
    productionId,
    surface,
    platform: undefined,
    associationAdmitted,
  });
  const closed =
    decision.render === 'mark'
      ? null
      : closedPrelaunchImage({
          surface,
          productionId,
          consumerName: productionId ? null : name,
        });
  const image =
    decision.render === 'mark' ? (
      <Image source={{ uri: decision.assetRef }} accessibilityLabel={decision.accessibleName} style={{ width: markSize, height: markSize, flexShrink: 0 }} resizeMode="contain" />
    ) : closed ? (
      <Image source={closed.moduleId} accessibilityLabel={closed.accessibleName} style={{ width: markSize, height: markSize, flexShrink: 0 }} resizeMode="contain" />
    ) : null;
  if (imageOnly) return image;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      {image}
      <Text accessibilityRole="text" style={color ? { color } : undefined}>
        {name}
      </Text>
    </View>
  );
}
