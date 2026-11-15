import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { resultEmeraldTone } from '../../theme/resultPresentation';
import { useTheme } from '../../theme';

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  showChevron?: boolean;
  disabled?: boolean;
  destructive?: boolean;
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
  isLast?: boolean;
};

export default function AccountRow({
  icon,
  label,
  value,
  onPress,
  showChevron,
  disabled = false,
  destructive = false,
  switchValue,
  onSwitchChange,
  accessibilityLabel,
  accessibilityHint,
  testID,
  isLast = false,
}: Props) {
  const { darkMode } = useTheme();
  const emerald = resultEmeraldTone(!!darkMode);
  const interactive = !!onPress && !disabled;
  const hasSwitch = typeof switchValue === 'boolean' && typeof onSwitchChange === 'function';
  const ink = destructive ? '#C44747' : emerald.ink;
  const iconColor = destructive ? '#C44747' : emerald.action;

  return (
    <TouchableOpacity
      style={[
        styles.row,
        !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: emerald.line },
        disabled && styles.disabled,
      ]}
      onPress={onPress}
      disabled={!interactive && !hasSwitch}
      activeOpacity={interactive ? 0.7 : 1}
      accessibilityRole={hasSwitch ? 'switch' : interactive ? 'button' : 'text'}
      accessibilityState={hasSwitch ? { checked: switchValue, disabled } : { disabled }}
      accessibilityLabel={accessibilityLabel || label}
      accessibilityHint={accessibilityHint}
      testID={testID}
    >
      <View style={styles.left}>
        <View style={[styles.iconWrap, { backgroundColor: darkMode ? '#243832' : '#E8F5F1' }]}>
          <Ionicons name={icon} size={20} color={iconColor} />
        </View>
        <View style={styles.copy}>
          <Text style={[styles.label, { color: ink }]}>{label}</Text>
          {value ? <Text style={[styles.value, { color: emerald.muted }]}>{value}</Text> : null}
        </View>
      </View>
      {hasSwitch ? (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          disabled={disabled}
          trackColor={{ false: emerald.line, true: emerald.action }}
          thumbColor="#fff"
          accessibilityLabel={accessibilityLabel || label}
        />
      ) : showChevron || interactive ? (
        <Ionicons name="chevron-forward" size={18} color={emerald.muted} />
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 56,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  disabled: {
    opacity: 0.55,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  copy: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  value: {
    fontSize: 13,
    marginTop: 2,
    lineHeight: 18,
  },
});
