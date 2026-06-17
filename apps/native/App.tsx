import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { Oxanium_700Bold, Oxanium_800ExtraBold } from "@expo-google-fonts/oxanium";
import { BebasNeue_400Regular } from "@expo-google-fonts/bebas-neue";
import { Montserrat_900Black_Italic } from "@expo-google-fonts/montserrat";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { colors } from "./src/theme/tokens";
import { FirebaseUserProvider } from "./src/auth/FirebaseUserProvider";
import RootNavigator from "./src/navigation/RootNavigator";

export default function App() {
  const [fontsLoaded] = useFonts({
    BebasNeue_400Regular,
    Montserrat_900Black_Italic,
    Oxanium_700Bold,
    Oxanium_800ExtraBold,
  });
  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <SafeAreaProvider>
      <FirebaseUserProvider>
        <NavigationContainer
          theme={{
            dark: true,
            colors: {
              primary: colors.accent,
              background: colors.bgPrimary,
              card: colors.surfacePrimary,
              text: colors.textPrimary,
              border: colors.borderSubtle,
              notification: colors.notificationDot,
            },
            fonts: {
              regular: { fontFamily: "System", fontWeight: "400" },
              medium: { fontFamily: "System", fontWeight: "500" },
              bold: { fontFamily: "System", fontWeight: "700" },
              heavy: { fontFamily: "System", fontWeight: "800" },
            },
          }}
        >
          <RootNavigator />
          <StatusBar style="light" />
        </NavigationContainer>
      </FirebaseUserProvider>
    </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
