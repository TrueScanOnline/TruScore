import 'react-native-gesture-handler';
import { registerRootComponent } from 'expo';
import RootLayout from './app/_layout';

// registerRootComponent calls AppRegistry.registerComponent('TrueScan', () => RootLayout);
registerRootComponent(RootLayout);

