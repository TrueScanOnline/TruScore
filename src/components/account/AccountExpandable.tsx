import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { resultEmeraldCard, resultEmeraldTone } from '../../theme/resultPresentation';
import { useTheme } from '../../theme';

type Props = {
  title: string;
  children: React.ReactNode;
  testID?: string;
  initiallyOpen?: boolean;
};

/**
 * Progressive-disclosure panel for Account Trust / Privacy / Help / Legal copy.
 */
export default function AccountExpandable({
  title,
  children,
  testID,
  initiallyOpen = false,
}: Props) {
  const { darkMode } = useTheme();
  const emerald = resultEmeraldTone(!!darkMode);
  const [open, setOpen] = useState(initiallyOpen);

  return (
    <View style={[styles.wrap, resultEmeraldCard(!!darkMode)]} testID={testID}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setOpen((v) => !v)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={title}
        testID={testID ? `${testID}-toggle` : undefined}
      >
        <Text style={[styles.title, { color: emerald.ink }]} maxFontSizeMultiplier={1.35}>
          {title}
        </Text>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={emerald.muted}
        />
      </TouchableOpacity>
      {open ? (
        <View style={styles.body} testID={testID ? `${testID}-body` : undefined}>
          {typeof children === 'string' ? (
            <Text style={[styles.text, { color: emerald.muted }]} maxFontSizeMultiplier={1.35}>
              {children}
            </Text>
          ) : (
            children
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 10,
    overflow: 'hidden',
  },
  header: {
    minHeight: 52,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    paddingRight: 10,
    lineHeight: 21,
  },
  body: {
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  text: {
    fontSize: 14,
    lineHeight: 21,
  },
});
