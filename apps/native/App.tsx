import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { Oxanium_700Bold, Oxanium_800ExtraBold } from "@expo-google-fonts/oxanium";
import { BebasNeue_400Regular } from "@expo-google-fonts/bebas-neue";
import { Montserrat_900Black_Italic } from "@expo-google-fonts/montserrat";
import { AlfaSlabOne_400Regular } from "@expo-google-fonts/alfa-slab-one";
import { Rajdhani_700Bold } from "@expo-google-fonts/rajdhani";
import { NotoSansJP_700Bold } from "@expo-google-fonts/noto-sans-jp";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { colors } from "./src/theme/tokens";
import { FirebaseUserProvider } from "./src/auth/FirebaseUserProvider";
import { NativeLanguageProvider } from "./src/i18n/NativeLanguageProvider";
import RootNavigator from "./src/navigation/RootNavigator";
import AppShellNative from "./src/components/AppShellNative";
import { NATIVE_PAGE_SURFACE_COLOR } from "./src/features/background/nativeBackgroundPalette";

export default function App() {
  const [fontsLoaded] = useFonts({
    BebasNeue_400Regular,
    Montserrat_900Black_Italic,
    Oxanium_700Bold,
    Oxanium_800ExtraBold,
    AlfaSlabOne_400Regular,
    Rajdhani_700Bold,
    NotoSansJP_700Bold,
  });
  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: NATIVE_PAGE_SURFACE_COLOR }}>
      <SafeAreaProvider style={{ flex: 1, backgroundColor: "transparent" }}>
        <FirebaseUserProvider>
          <NativeLanguageProvider>
          <AppShellNative>
            <NavigationContainer
              theme={{
                dark: true,
                colors: {
                  primary: colors.accent,
                  background: "transparent",
                  card: "transparent",
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
          </AppShellNative>
          </NativeLanguageProvider>
        </FirebaseUserProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
