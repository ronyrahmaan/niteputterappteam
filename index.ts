import 'react-native-gesture-handler';
// Reanimated causes web bundling issues; load it only on native
import { Platform } from 'react-native';
if (Platform.OS !== 'web') {
  require('react-native-reanimated');
}
import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
