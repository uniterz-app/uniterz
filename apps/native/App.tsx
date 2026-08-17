import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { useFonts } from "expo-font";
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
import MaintenanceGateNative from "./src/components/MaintenanceGateNative";
import CyberAlertProvider from "./src/components/CyberAlertProvider";
import { NATIVE_PAGE_SURFACE_COLOR } from "./src/features/background/nativeBackgroundPalette";
import { ensureNativeSplashHeld } from "./src/bootstrap/nativeBootSplash";
import { prefetchRankingsLogoGlb } from "./src/features/rankings/rankingsLogoGlbCache";

ensureNativeSplashHeld();
/** チュートリアル welcome / ランキング背景の 3D ロゴを起動直後から温める */
prefetchRankingsLogoGlb();

export default function App() {
  /**
   * 見出しフォント + アイコンフォントを起動ゲートで先読み。
   * MCI / MaterialIcons が未ロードだと空の Text になり、ナビ・サイドメニューが消えて見える。
   */
  const [fontsLoaded] = useFonts({
    ...MaterialCommunityIcons.font,
    ...MaterialIcons.font,
    BebasNeue_400Regular,
    Montserrat_900Black_Italic,
    Oxanium_600SemiBold,
    Oxanium_700Bold,
    Oxanium_800ExtraBold,
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
  });

  useEffect(() => {
    ensureNativeSplashHeld();
  }, []);

  useNativeShareDeepLinks();

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: NATIVE_PAGE_SURFACE_COLOR }}>
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
              <StatusBar style="light" />
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
