import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ErrorBoundary from '../components/ErrorBoundary';
import type { AccountStackParamList } from './tabStackParamLists';
import AccountHomeScreen from '../screens/account/AccountHomeScreen';
import AccountProfileScreen from '../screens/account/AccountProfileScreen';
import AccountPlanScreen from '../screens/account/AccountPlanScreen';
import PrivacyDataScreen from '../screens/account/PrivacyDataScreen';
import HelpSupportScreen from '../screens/account/HelpSupportScreen';
import LegalMethodologyScreen from '../screens/account/LegalMethodologyScreen';

const Stack = createNativeStackNavigator<AccountStackParamList>();

function withBoundary(Screen: React.ComponentType<any>) {
  return function Bound(props: any) {
    return (
      <ErrorBoundary>
        <Screen {...props} />
      </ErrorBoundary>
    );
  };
}

const AccountHome = withBoundary(AccountHomeScreen);
const AccountProfile = withBoundary(AccountProfileScreen);
const AccountPlan = withBoundary(AccountPlanScreen);
const PrivacyData = withBoundary(PrivacyDataScreen);
const HelpSupport = withBoundary(HelpSupportScreen);
const LegalMethodology = withBoundary(LegalMethodologyScreen);

/**
 * Account tab stack. Intentionally does not register developer-tools,
 * purchase, or methodology-reactivation routes.
 */
export default function AccountStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AccountHome" component={AccountHome} />
      <Stack.Screen name="AccountProfile" component={AccountProfile} />
      <Stack.Screen name="AccountPlan" component={AccountPlan} />
      <Stack.Screen name="PrivacyData" component={PrivacyData} />
      <Stack.Screen name="HelpSupport" component={HelpSupport} />
      <Stack.Screen name="LegalMethodology" component={LegalMethodology} />
    </Stack.Navigator>
  );
}
