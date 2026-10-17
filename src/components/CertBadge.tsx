import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Certification } from '../types/product';
import { closedPrelaunchImage } from '../certifications/artwork/closedPrelaunchImage';
import { displayCertificationName, resolvePacketObservation } from '../certifications/resolveCertification';
import { resolveCertificationArtwork } from '../certifications/certificationArtwork';

export { displayCertificationName };

interface CertBadgeProps {
  certification: Certification;
  onPress?: () => void;
}

export { CERT_BADGE_ICONS } from '../constants/certDisplay';

export default function CertBadge({ certification, onPress }: CertBadgeProps) {
  const name = displayCertificationName(certification);
  const resolved = resolvePacketObservation({ observedWording: certification.tag || name });
  const productionId = resolved.kind === 'certification' ? resolved.certificationId : undefined;
  const emblem = resolveCertificationArtwork({
    accessibleName: name,
    productionId,
    surface: 'product_result',
    associationAdmitted: !!productionId,
  });
  const closed =
    emblem.render === 'mark'
      ? null
      : closedPrelaunchImage({
          surface: 'product_result',
          productionId: productionId || certification.id,
        });
  const Component = onPress ? TouchableOpacity : View;

  return (
    <Component
      style={styles.container}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {emblem.render === 'mark' ? (
        <Image source={{ uri: emblem.assetRef }} accessibilityLabel={emblem.accessibleName} style={styles.mark} resizeMode="contain" />
      ) : closed ? (
        <Image source={closed.moduleId} accessibilityLabel={closed.accessibleName} style={styles.mark} resizeMode="contain" />
      ) : null}
      <Text style={styles.name} numberOfLines={2}>
        {displayCertificationName(certification)}
      </Text>
    </Component>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  mark: { width: 20, height: 20 },
  name: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1a1a1a',
    flexShrink: 1,
  },
});

