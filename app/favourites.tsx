import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { TabParamList } from '../src/navigation/AppTabs';
import type { FavouritesStackParamList } from '../src/navigation/tabStackParamLists';
import { useFavoritesStore } from '../src/store/useFavoritesStore';
import { fetchProduct } from '../src/services/productService';
import { useTheme } from '../src/theme';
import { resultEmeraldCard, resultEmeraldTone, resultPresentation } from '../src/theme/resultPresentation';
import { listPublishedOverallScore } from '../src/utils/listPublishedScore';

type NavigationProp = NativeStackNavigationProp<FavouritesStackParamList>;

export default function FavouritesScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { t } = useTranslation();
  const { colors, darkMode } = useTheme();
  const emerald = resultEmeraldTone(!!darkMode);
  const page = resultPresentation.canvas[darkMode ? 'dark' : 'light'];
  const filled = resultPresentation.emerald.action.light;
  const { favorites, removeFavorite, initializeStore, clearFavorites } = useFavoritesStore();
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      loadFavorites();
    }, [])
  );

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    setLoading(true);
    try {
      await initializeStore();
    } catch (error) {
      console.error('Failed to load favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = (barcode: string, productName: string) => {
    Alert.alert(
      t('favorites.removeTitle'),
      t('favorites.removeMessage', { name: productName || barcode }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.remove'),
          style: 'destructive',
          onPress: async () => {
            await removeFavorite(barcode);
          },
        },
      ]
    );
  };

  const handleClearAll = () => {
    Alert.alert(
      t('favorites.clearAllTitle'),
      t('favorites.clearAllMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.clear'),
          style: 'destructive',
          onPress: async () => {
            await clearFavorites();
          },
        },
      ]
    );
  };

  const handleItemPress = (barcode: string) => {
    navigation.navigate('Result', { barcode });
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: page }]}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={emerald.action} />
          <Text style={[styles.loadingText, { color: emerald.muted }]}>
            {t('common.loading')}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: page }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: page, borderBottomColor: emerald.line }]}>
        <Text style={[styles.title, { color: emerald.ink }]}>{t('favorites.title')}</Text>
        {favorites.length > 0 && (
          <TouchableOpacity onPress={handleClearAll} style={styles.clearAllButton}>
            <Text style={[styles.clearAllText, { color: colors.error }]}>
              {t('favorites.clearAll')}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Favorites List */}
      {favorites.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="heart-outline" size={80} color={emerald.muted} />
          <Text style={[styles.emptyText, { color: emerald.ink }]}>{t('favorites.empty')}</Text>
          <Text style={[styles.emptySubtext, { color: emerald.muted }]}>
            {t('favorites.emptyMessage')}
          </Text>
          <TouchableOpacity
            style={[styles.startButton, { backgroundColor: filled }]}
            onPress={() => {
              const tabNav = navigation.getParent() as BottomTabNavigationProp<TabParamList>;
              tabNav.navigate('Scan', { screen: 'ScanHome' });
            }}
          >
            <Ionicons name="barcode-outline" size={20} color="#fff" />
            <Text style={styles.startButtonText}>{t('favorites.startScanning')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.barcode}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.favoriteItem, resultEmeraldCard(!!darkMode)]}
              onPress={() => handleItemPress(item.barcode)}
            >
              <View style={styles.favoriteContent}>
                <View style={[styles.favoriteIcon, { backgroundColor: emerald.chevronCircle }]}>
                  <Ionicons name="heart" size={24} color={emerald.action} />
                </View>
                <View style={styles.favoriteTextContainer}>
                  <Text style={[styles.favoriteProductName, { color: emerald.ink }]} numberOfLines={2}>
                    {item.product?.product_name || item.barcode}
                  </Text>
                  <Text style={[styles.favoriteBarcode, { color: emerald.muted }]}>
                    {t('search.barcode')}: {item.barcode}
                  </Text>
                  {(() => {
                    const published = listPublishedOverallScore(item.product);
                    if (published === null) return null;
                    return (
                    <View style={styles.favoriteScore}>
                      <Text style={[styles.favoriteScoreLabel, { color: emerald.muted }]}>
                        {t('result.trustScore')}: 
                      </Text>
                      <Text style={[styles.favoriteScoreValue, { color: emerald.action }]}>
                        {published}/100
                      </Text>
                    </View>
                    );
                  })()}
                </View>
              </View>
              <TouchableOpacity
                onPress={() => handleRemoveFavorite(item.barcode, item.product?.product_name || '')}
                style={styles.removeButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="heart" size={24} color={colors.error} />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  clearAllButton: {
    padding: 8,
  },
  clearAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    marginBottom: 24,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 22,
    minHeight: 44,
    gap: 8,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  favoriteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginBottom: 12,
  },
  favoriteContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  favoriteIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteTextContainer: {
    flex: 1,
  },
  favoriteProductName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  favoriteBarcode: {
    fontSize: 12,
    marginBottom: 4,
  },
  favoriteScore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  favoriteScoreLabel: {
    fontSize: 12,
  },
  favoriteScoreValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  removeButton: {
    padding: 8,
  },
});

