// ValuesHome.tsx - Main values preferences screen with swipe tabs (v1.3)
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
import ShareValuesCard from './ShareValuesCard';
import { VALUES_COLORS, getValuesColorWithOpacity } from '../../theme/valuesColors';
import ValuesDisclaimerModal from '../../components/ValuesDisclaimerModal';
import AsyncStorage from '@react-native-async-storage/async-storage';

type TabType = 'geopolitical' | 'ethical' | 'environmental';

const DISCLAIMER_KEY = '@truescan_values_disclaimer_accepted';

export default function ValuesHome() {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('geopolitical');
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  
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
    checkDisclaimer();
  }, []);

  const checkDisclaimer = async () => {
    try {
      const accepted = await AsyncStorage.getItem(DISCLAIMER_KEY);
      if (!accepted) {
        setShowDisclaimer(true);
      }
    } catch (error) {
      console.error('[ValuesHome] Error checking disclaimer:', error);
    }
  };

  const handleAcceptDisclaimer = async () => {
    try {
      await AsyncStorage.setItem(DISCLAIMER_KEY, 'true');
      setShowDisclaimer(false);
    } catch (error) {
      console.error('[ValuesHome] Error saving disclaimer:', error);
      setShowDisclaimer(false);
    }
  };

  const renderTriStateRadio = (
    label: string,
    value: string,
    options: { value: string; label: string }[],
    onChange: (value: string) => void,
    enabled: boolean
  ) => {
    // Get theme color based on active tab
    const themeColor = activeTab === 'geopolitical' 
      ? VALUES_COLORS.geopolitical 
      : activeTab === 'ethical'
      ? VALUES_COLORS.ethical
      : VALUES_COLORS.environmental;
    
    return (
      <View style={[styles.radioGroup, { opacity: enabled ? 1 : 0.5 }]}>
        <View style={styles.radioGroupLabelContainer}>
          <Text style={[styles.radioGroupLabel, { color: colors.text }]}>
            {label.replace('△!', '')}
          </Text>
          {label.includes('△!') && (
            <Text style={[styles.geopoliticsIndicator, { color: '#ef4444' }]}>△!</Text>
          )}
        </View>
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.radioOption,
              { borderColor: colors.border },
              value === option.value && { 
                borderColor: themeColor, 
                backgroundColor: getValuesColorWithOpacity(
                  activeTab === 'geopolitical' ? 'geopolitical' : 
                  activeTab === 'ethical' ? 'ethical' : 'environmental',
                  0.1
                ),
              },
            ]}
            onPress={() => {
              if (enabled) {
                onChange(option.value);
              }
            }}
            disabled={!enabled}
          >
            <View style={[styles.radioCircle, value === option.value && { borderColor: themeColor }]}>
              {value === option.value && (
                <View style={[styles.radioInner, { backgroundColor: themeColor }]} />
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
    // Get theme color based on active tab
    const themeColor = activeTab === 'geopolitical' 
      ? VALUES_COLORS.geopolitical 
      : activeTab === 'ethical'
      ? VALUES_COLORS.ethical
      : VALUES_COLORS.environmental;
    
    return (
      <View style={[
        styles.switchRow, 
        { 
          opacity: enabled ? 1 : 0.5,
          backgroundColor: colors.card,
          borderColor: value && enabled ? themeColor : colors.border,
          borderWidth: value && enabled ? 2 : 1,
        }
      ]}>
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
          trackColor={{ false: colors.border, true: themeColor }}
          thumbColor={value && enabled ? '#fff' : colors.textSecondary}
        />
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header - v1.3 spec */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Your Values, Your Choice – Additional Insights for Scans
        </Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          These insights do not affect the TruScore
        </Text>
      </View>

      {/* Tabs */}
      <View style={[styles.tabs, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'geopolitical' && {
              borderBottomColor: VALUES_COLORS.geopolitical,
              backgroundColor: getValuesColorWithOpacity('geopolitical', 0.05),
            },
          ]}
          onPress={() => setActiveTab('geopolitical')}
        >
          <Ionicons
            name="globe-outline"
            size={20}
            color={activeTab === 'geopolitical' ? VALUES_COLORS.geopolitical : colors.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'geopolitical' ? VALUES_COLORS.geopolitical : colors.textSecondary },
            ]}
          >
            Geopolitical
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'ethical' && {
              borderBottomColor: VALUES_COLORS.ethical,
              backgroundColor: getValuesColorWithOpacity('ethical', 0.05),
            },
          ]}
          onPress={() => setActiveTab('ethical')}
        >
          <Ionicons
            name="heart-outline"
            size={20}
            color={activeTab === 'ethical' ? VALUES_COLORS.ethical : colors.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'ethical' ? VALUES_COLORS.ethical : colors.textSecondary },
            ]}
          >
            Ethical
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'environmental' && {
              borderBottomColor: VALUES_COLORS.environmental,
              backgroundColor: getValuesColorWithOpacity('environmental', 0.05),
            },
          ]}
          onPress={() => setActiveTab('environmental')}
        >
          <Ionicons
            name="leaf-outline"
            size={20}
            color={activeTab === 'environmental' ? VALUES_COLORS.environmental : colors.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'environmental' ? VALUES_COLORS.environmental : colors.textSecondary },
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
            <View style={[
              styles.masterSwitch, 
              { 
                backgroundColor: colors.card, 
                borderColor: geopoliticalEnabled ? VALUES_COLORS.geopolitical : colors.border,
                borderWidth: geopoliticalEnabled ? 2 : 1,
              }
            ]}>
              <View style={styles.masterSwitchContent}>
                <Text style={[styles.masterSwitchLabel, { color: colors.text }]}>Enable Geopolitical Insights</Text>
                <Text style={[styles.masterSwitchDescription, { color: colors.textSecondary }]}>
                  Get alerts about products linked to specific regions
                </Text>
              </View>
              <Switch
                value={geopoliticalEnabled}
                onValueChange={async (val) => {
                  await setGeopoliticalEnabled(val);
                  Toast.show({ type: 'success', text1: 'Updated', text2: 'Insights updated' });
                }}
                trackColor={{ false: colors.border, true: VALUES_COLORS.geopolitical }}
                thumbColor={geopoliticalEnabled ? '#fff' : colors.textSecondary}
              />
            </View>

            {geopoliticalEnabled && (
              <>
                {renderTriStateRadio(
                  'Israel–Palestine △!',
                  israelPalestine,
                  [
                    { value: 'neutral', label: 'Neutral (default)' },
                    { value: 'avoid_israel', label: 'Avoid Israel-linked' },
                    { value: 'avoid_palestine', label: 'Avoid Palestine-linked' },
                  ],
                  async (val) => {
                    await setIsraelPalestine(val as 'neutral' | 'avoid_israel' | 'avoid_palestine');
                    Toast.show({ type: 'success', text1: 'Updated', text2: 'Insights updated' });
                  },
                  geopoliticalEnabled
                )}

                {renderTriStateRadio(
                  'India–China △!',
                  indiaChina,
                  [
                    { value: 'neutral', label: 'Neutral' },
                    { value: 'avoid_china', label: 'Avoid China-linked' },
                    { value: 'avoid_india', label: 'Avoid India-linked' },
                  ],
                  async (val) => {
                    await setIndiaChina(val as 'neutral' | 'avoid_china' | 'avoid_india');
                    Toast.show({ type: 'success', text1: 'Updated', text2: 'Insights updated' });
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
            <View style={[
              styles.masterSwitch, 
              { 
                backgroundColor: colors.card, 
                borderColor: ethicalEnabled ? VALUES_COLORS.ethical : colors.border,
                borderWidth: ethicalEnabled ? 2 : 1,
              }
            ]}>
              <View style={styles.masterSwitchContent}>
                <Text style={[styles.masterSwitchLabel, { color: colors.text }]}>Enable Ethical Insights</Text>
                <Text style={[styles.masterSwitchDescription, { color: colors.textSecondary }]}>
                  Get alerts about animal testing and labor practices
                </Text>
              </View>
              <Switch
                value={ethicalEnabled}
                onValueChange={async (val) => {
                  await setEthicalEnabled(val);
                  Toast.show({ type: 'success', text1: 'Updated', text2: 'Insights updated' });
                }}
                trackColor={{ false: colors.border, true: VALUES_COLORS.ethical }}
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
                    Toast.show({ type: 'success', text1: 'Updated', text2: 'Insights updated' });
                  },
                  ethicalEnabled
                )}

                {renderBinarySwitch(
                  'Forced / Child Labour',
                  'Avoid products from companies linked to forced or child labor',
                  avoidForcedLabour,
                  async (val) => {
                    await setAvoidForcedLabour(val);
                    Toast.show({ type: 'success', text1: 'Updated', text2: 'Insights updated' });
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
            <View style={[
              styles.masterSwitch, 
              { 
                backgroundColor: colors.card, 
                borderColor: environmentalEnabled ? VALUES_COLORS.environmental : colors.border,
                borderWidth: environmentalEnabled ? 2 : 1,
              }
            ]}>
              <View style={styles.masterSwitchContent}>
                <Text style={[styles.masterSwitchLabel, { color: colors.text }]}>Enable Environmental Insights</Text>
                <Text style={[styles.masterSwitchDescription, { color: colors.textSecondary }]}>
                  Get alerts about unsustainable palm oil usage
                </Text>
              </View>
              <Switch
                value={environmentalEnabled}
                onValueChange={async (val) => {
                  await setEnvironmentalEnabled(val);
                  Toast.show({ type: 'success', text1: 'Updated', text2: 'Insights updated' });
                }}
                trackColor={{ false: colors.border, true: VALUES_COLORS.environmental }}
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
                    Toast.show({ type: 'success', text1: 'Updated', text2: 'Insights updated' });
                  },
                  environmentalEnabled
                )}
              </>
            )}
          </View>
        )}

        {/* Share Choices Button */}
        <View style={styles.shareContainer}>
          <ShareValuesCard />
        </View>
      </ScrollView>

      {/* Disclaimer Modal */}
      <ValuesDisclaimerModal
        visible={showDisclaimer}
        onAccept={handleAcceptDisclaimer}
        onDismiss={handleAcceptDisclaimer}
      />
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
  },
  radioGroupLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  geopoliticsIndicator: {
    fontSize: 12,
    fontWeight: 'bold',
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
  shareContainer: {
    marginTop: 24,
    marginBottom: 16,
    paddingHorizontal: 0,
  },
});

