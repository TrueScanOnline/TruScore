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
  /** Result card: sit in the claims panel, without the small grey chip. */
  appearance?: 'chip' | 'panel';
  nameColor?: string;
}

export { CERT_BADGE_ICONS } from '../constants/certDisplay';

export default function CertBadge({ certification, onPress, appearance = 'chip', nameColor }: CertBadgeProps) {
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
  const panel = appearance === 'panel';

  return (
    <Component
      style={[styles.container, panel ? styles.panel : null]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {emblem.render === 'mark' ? (
        <Image
          source={{ uri: emblem.assetRef }}
          accessibilityLabel={emblem.accessibleName}
          style={panel ? styles.panelMark : styles.mark}
          resizeMode="contain"
        />
      ) : closed ? (
        <Image
          source={closed.moduleId}
          accessibilityLabel={closed.accessibleName}
          style={panel ? styles.panelMark : styles.mark}
          resizeMode="contain"
        />
      ) : null}
      <Text style={[styles.name, panel ? styles.panelName : null, nameColor ? { color: nameColor } : null]}>
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
    gap: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  mark: { width: 32, height: 32 },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    flexShrink: 1,
  },
  panel: {
    alignSelf: 'stretch',
    maxWidth: '100%',
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderRadius: 0,
    marginRight: 0,
    marginBottom: 0,
    gap: 10,
  },
  panelMark: { width: 40, height: 40, flexShrink: 0 },
  panelName: {
    flex: 1,
    flexShrink: 1,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    textAlign: 'left',
  },
});

