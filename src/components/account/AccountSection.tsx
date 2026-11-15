import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { resultEmeraldTone, resultPresentation } from '../../theme/resultPresentation';
import { useTheme } from '../../theme';

type Props = {
  title: string;
  children: React.ReactNode;
};

export default function AccountSection({ title, children }: Props) {
  const { darkMode } = useTheme();
  const emerald = resultEmeraldTone(!!darkMode);

  return (
    <View style={styles.section}>
      <Text style={[styles.title, { color: emerald.muted }]}>{title}</Text>
      <View
        style={[
          styles.group,
          {
            backgroundColor: emerald.card,
            borderColor: emerald.line,
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 22,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 4,
  },
  group: {
    borderRadius: resultPresentation.emerald.radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
});
