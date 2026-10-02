import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { useFonts, loadAsync as loadFontsAsync } from "expo-font";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { Oxanium_600SemiBold, Oxanium_700Bold, Oxanium_800ExtraBold } from "@expo-google-fonts/oxanium";
import { BebasNeue_400Regular } from "@expo-google-fonts/bebas-neue";
import { Montserrat_900Black_Italic } from "@expo-google-fonts/montserrat";
import { AlfaSlabOne_400Regular } from "@expo-google-fonts/alfa-slab-one";
import { Rajdhani_700Bold } from "@expo-google-fonts/rajdhani";
import { Michroma_400Regular } from "@expo-google-fonts/michroma";
import { Orbitron_700Bold, Orbitron_800ExtraBold } from "@expo-google-fonts/orbitron";
import { Audiowide_400Regular } from "@expo-google-fonts/audiowide";
import { ChakraPetch_700Bold } from "@expo-google-fonts/chakra-petch";
import { Exo2_800ExtraBold } from "@expo-google-fonts/exo-2";
import {
  NotoSansJP_400Regular,
  NotoSansJP_600SemiBold,
  NotoSansJP_700Bold,
} from "@expo-google-fonts/noto-sans-jp";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { colors } from "./src/theme/tokens";
import { FirebaseUserProvider } from "./src/auth/FirebaseUserProvider";
import { NativeLanguageProvider } from "./src/i18n/NativeLanguageProvider";
import RootNavigator from "./src/navigation/RootNavigator";
import { navigationRef } from "./src/navigation/navigationRef";
import { useNativeShareDeepLinks } from "./src/navigation/useNativeShareDeepLinks";
import AppShellNative from "./src/components/AppShellNative";
import TutorialRestartCoverNative from "./src/features/tutorial/TutorialRestartCoverNative";
import MaintenanceGateNative from "./src/components/MaintenanceGateNative";
import CyberAlertProvider from "./src/components/CyberAlertProvider";
import { APP_MESH_BG_FALLBACK } from "../../lib/app/appMeshBackground";
import { ensureNativeSplashHeld } from "./src/bootstrap/nativeBootSplash";
import { initNativeObservability } from "./src/observability/initNativeObservability";

ensureNativeSplashHeld();
initNativeObservability();

/**
 * Games / タブバー初回に必要な最小セット。
 * NotoSansJP はパッケージが大きく Android で特に遅いので後読み。
 */
const CRITICAL_FONTS = {
  ...MaterialCommunityIcons.font,
  ...MaterialIcons.font,
  BebasNeue_400Regular,
  Montserrat_900Black_Italic,
  Oxanium_600SemiBold,
  Oxanium_700Bold,
  Oxanium_800ExtraBold,
};

const DEFERRED_FONTS = {
  AlfaSlabOne_400Regular,
  Rajdhani_700Bold,
  Michroma_400Regular,
  Orbitron_700Bold,
  Orbitron_800ExtraBold,
  Audiowide_400Regular,
  ChakraPetch_700Bold,
  Exo2_800ExtraBold,
  NotoSansJP_400Regular,
  NotoSansJP_600SemiBold,
  NotoSansJP_700Bold,
};

export default function App() {
  const [criticalFontsLoaded] = useFonts(CRITICAL_FONTS);

  useEffect(() => {
    ensureNativeSplashHeld();
  }, []);

  useEffect(() => {
    if (!criticalFontsLoaded) return;
    void loadFontsAsync(DEFERRED_FONTS).catch(() => {});
  }, [criticalFontsLoaded]);

  useNativeShareDeepLinks();

  if (!criticalFontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: APP_MESH_BG_FALLBACK }}>
      <SafeAreaProvider style={{ flex: 1, backgroundColor: "transparent" }}>
        <MaintenanceGateNative>
        <FirebaseUserProvider>
          <NativeLanguageProvider>
          <CyberAlertProvider>
          <AppShellNative>
            <NavigationContainer
              ref={navigationRef}
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
              <StatusBar style="light" translucent backgroundColor="transparent" />
              <TutorialRestartCoverNative />
            </NavigationContainer>
          </AppShellNative>
          </CyberAlertProvider>
          </NativeLanguageProvider>
        </FirebaseUserProvider>
        </MaintenanceGateNative>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
