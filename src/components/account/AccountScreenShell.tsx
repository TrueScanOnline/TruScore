import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { resultEmeraldTone, resultPresentation } from '../../theme/resultPresentation';
import { useTheme } from '../../theme';

type Props = {
  title: string;
  onBack?: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  testID?: string;
};

export default function AccountScreenShell({ title, onBack, children, footer, testID }: Props) {
  const { darkMode } = useTheme();
  const emerald = resultEmeraldTone(!!darkMode);
  const page = resultPresentation.canvas[darkMode ? 'dark' : 'light'];
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: page }]} testID={testID}>
      <View
        style={[
          styles.header,
          {
            backgroundColor: page,
            borderBottomColor: emerald.line,
            paddingTop: Math.max(insets.top, 12),
          },
        ]}
      >
        {onBack ? (
          <TouchableOpacity
            onPress={onBack}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-back" size={24} color={emerald.action} />
          </TouchableOpacity>
        ) : (
          <View style={styles.backPlaceholder} />
        )}
        <Text style={[styles.title, { color: emerald.ink }]} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.backPlaceholder} />
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: 28 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {children}
        {footer}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 52,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backPlaceholder: {
    width: 44,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: resultPresentation.emerald.space.page,
  },
});
