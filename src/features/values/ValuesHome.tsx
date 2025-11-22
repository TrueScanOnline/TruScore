// ValuesHome.tsx - Main values preferences screen with swipe tabs
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { useValuesStore } from '../../store/useValuesStore';
import Toast from 'react-native-toast-message';

type TabType = 'geopolitical' | 'ethical' | 'environmental';

export default function ValuesHome() {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('geopolitical');
  
  const {
    israelPalestine,
    indiaChina,
    avoidAnimalTesting,
    avoidForcedLabour,
    avoidPalmOil,
    geopoliticalEnabled,
    ethicalEnabled,
    environmentalEnabled,
    setIsraelPalestine,
    setIndiaChina,
    setAvoidAnimalTesting,
    setAvoidForcedLabour,
    setAvoidPalmOil,
    setGeopoliticalEnabled,
    setEthicalEnabled,
    setEnvironmentalEnabled,
    initializeStore,
  } = useValuesStore();

  useEffect(() => {
    initializeStore();
  }, []);

  const renderTriStateRadio = (
    label: string,
    value: string,
    options: { value: string; label: string }[],
    onChange: (value: string) => void,
    enabled: boolean
  ) => {
    return (
      <View style={[styles.radioGroup, { opacity: enabled ? 1 : 0.5 }]}>
        <Text style={[styles.radioGroupLabel, { color: colors.text }]}>{label}</Text>
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.radioOption,
              { borderColor: colors.border },
              value === option.value && { borderColor: colors.primary, backgroundColor: colors.primary + '20' },
            ]}
            onPress={() => {
              if (enabled) {
                onChange(option.value);
              }
            }}
            disabled={!enabled}
          >
            <View style={[styles.radioCircle, value === option.value && { borderColor: colors.primary }]}>
              {value === option.value && (
                <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />
              )}
            </View>
            <Text style={[styles.radioLabel, { color: colors.text }]}>{option.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderBinarySwitch = (
    label: string,
    description: string,
    value: boolean,
    onChange: (value: boolean) => void,
    enabled: boolean
  ) => {
    return (
      <View style={[styles.switchRow, { opacity: enabled ? 1 : 0.5 }]}>
        <View style={styles.switchContent}>
          <Text style={[styles.switchLabel, { color: colors.text }]}>{label}</Text>
          <Text style={[styles.switchDescription, { color: colors.textSecondary }]}>{description}</Text>
        </View>
        <Switch
          value={value && enabled}
          onValueChange={(val) => {
            if (enabled) {
              onChange(val);
            }
          }}
          disabled={!enabled}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={value && enabled ? '#fff' : colors.textSecondary}
        />
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Values Preferences
        </Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          Additional Insights for Scans – These insights do not affect the TruScore
        </Text>
      </View>

      {/* Tabs */}
      <View style={[styles.tabs, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'geopolitical' && styles.activeTab]}
          onPress={() => setActiveTab('geopolitical')}
        >
          <Ionicons
            name="globe-outline"
            size={20}
            color={activeTab === 'geopolitical' ? colors.primary : colors.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'geopolitical' ? colors.primary : colors.textSecondary },
            ]}
          >
            Geopolitical
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'ethical' && styles.activeTab]}
          onPress={() => setActiveTab('ethical')}
        >
          <Ionicons
            name="heart-outline"
            size={20}
            color={activeTab === 'ethical' ? colors.primary : colors.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'ethical' ? colors.primary : colors.textSecondary },
            ]}
          >
            Ethical
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'environmental' && styles.activeTab]}
          onPress={() => setActiveTab('environmental')}
        >
          <Ionicons
            name="leaf-outline"
            size={20}
            color={activeTab === 'environmental' ? colors.primary : colors.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'environmental' ? colors.primary : colors.textSecondary },
            ]}
          >
            Environmental
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {activeTab === 'geopolitical' && (
          <View style={styles.tabContent}>
            {/* Master Switch */}
            <View style={[styles.masterSwitch, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.masterSwitchContent}>
                <Text style={[styles.masterSwitchLabel, { color: colors.text }]}>Enable Geopolitical Insights</Text>
                <Text style={[styles.masterSwitchDescription, { color: colors.textSecondary }]}>
                  Get alerts about products linked to specific regions
                </Text>
              </View>
              <Switch
                value={geopoliticalEnabled}
                onValueChange={setGeopoliticalEnabled}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={geopoliticalEnabled ? '#fff' : colors.textSecondary}
              />
            </View>

            {geopoliticalEnabled && (
              <>
                {renderTriStateRadio(
                  'Israel–Palestine',
                  israelPalestine,
                  [
                    { value: 'neutral', label: 'Neutral (default)' },
                    { value: 'avoid_israel', label: 'Avoid Israel-linked' },
                    { value: 'avoid_palestine', label: 'Avoid Palestine-linked' },
                  ],
                  (val) => setIsraelPalestine(val as 'neutral' | 'avoid_israel' | 'avoid_palestine'),
                  geopoliticalEnabled
                )}

                {renderTriStateRadio(
                  'India–China',
                  indiaChina,
                  [
                    { value: 'neutral', label: 'Neutral' },
                    { value: 'avoid_china', label: 'Avoid China-linked' },
                    { value: 'avoid_india', label: 'Avoid India-linked' },
                  ],
                  async (val) => {
                    await setIndiaChina(val as 'neutral' | 'avoid_china' | 'avoid_india');
                    Toast.show({ type: 'success', text1: 'Updated', text2: 'Preference saved' });
                  },
                  geopoliticalEnabled
                )}
              </>
            )}
          </View>
        )}

        {activeTab === 'ethical' && (
          <View style={styles.tabContent}>
            {/* Master Switch */}
            <View style={[styles.masterSwitch, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.masterSwitchContent}>
                <Text style={[styles.masterSwitchLabel, { color: colors.text }]}>Enable Ethical Insights</Text>
                <Text style={[styles.masterSwitchDescription, { color: colors.textSecondary }]}>
                  Get alerts about animal testing and labor practices
                </Text>
              </View>
              <Switch
                value={ethicalEnabled}
                onValueChange={setEthicalEnabled}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={ethicalEnabled ? '#fff' : colors.textSecondary}
              />
            </View>

            {ethicalEnabled && (
              <>
                {renderBinarySwitch(
                  'Animal Testing / Cruelty',
                  'Avoid products from companies that test on animals or engage in animal cruelty',
                  avoidAnimalTesting,
                  async (val) => {
                    await setAvoidAnimalTesting(val);
                    Toast.show({ type: 'success', text1: 'Updated', text2: 'Preference saved' });
                  },
                  ethicalEnabled
                )}

                {renderBinarySwitch(
                  'Forced / Child Labour',
                  'Avoid products from companies linked to forced or child labor',
                  avoidForcedLabour,
                  async (val) => {
                    await setAvoidForcedLabour(val);
                    Toast.show({ type: 'success', text1: 'Updated', text2: 'Preference saved' });
                  },
                  ethicalEnabled
                )}
              </>
            )}
          </View>
        )}

        {activeTab === 'environmental' && (
          <View style={styles.tabContent}>
            {/* Master Switch */}
            <View style={[styles.masterSwitch, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.masterSwitchContent}>
                <Text style={[styles.masterSwitchLabel, { color: colors.text }]}>Enable Environmental Insights</Text>
                <Text style={[styles.masterSwitchDescription, { color: colors.textSecondary }]}>
                  Get alerts about unsustainable palm oil usage
                </Text>
              </View>
              <Switch
                value={environmentalEnabled}
                onValueChange={setEnvironmentalEnabled}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={environmentalEnabled ? '#fff' : colors.textSecondary}
              />
            </View>

            {environmentalEnabled && (
              <>
                {renderBinarySwitch(
                  'Unsustainable Palm Oil',
                  'Avoid products containing unsustainable palm oil',
                  avoidPalmOil,
                  async (val) => {
                    await setAvoidPalmOil(val);
                    Toast.show({ type: 'success', text1: 'Updated', text2: 'Preference saved' });
                  },
                  environmentalEnabled
                )}
              </>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#0A84FF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  tabContent: {
    gap: 16,
  },
  masterSwitch: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  masterSwitchContent: {
    flex: 1,
    marginRight: 16,
  },
  masterSwitchLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  masterSwitchDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  radioGroup: {
    marginBottom: 24,
  },
  radioGroupLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  radioLabel: {
    fontSize: 14,
    flex: 1,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  switchContent: {
    flex: 1,
    marginRight: 16,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  switchDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
});

