import "react-native-gesture-handler";
import "react-native-reanimated";
import { enableScreens, enableFreeze } from "react-native-screens";
import { registerRootComponent } from "expo";

import App from "./App";

enableScreens(true);
/** 非表示タブ／スタック画面を凍結して CPU・再レンダーを抑える */
enableFreeze(true);

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
