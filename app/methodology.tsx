import React, { useEffect } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from './_layout';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

/**
 * Wave 3 Commit E — consumer methodology containment.
 *
 * The legacy Methodology screen is not activated in this corrective: missing i18n would
 * surface literal keys, and the latent fallback prose describes retired pillar constructs.
 * Direct route access fails closed by redirecting to DeveloperSettings (the Settings surface
 * that previously linked here) and rendering no methodology copy.
 */
export default function MethodologyScreen() {
  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.replace('DeveloperSettings');
  }, [navigation]);

  return <View />;
}
