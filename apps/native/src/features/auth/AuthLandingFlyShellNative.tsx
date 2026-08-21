/**
 * 起動 Landing と認証フォームを同じ世界に置く。
 * expo-gl あり: 本物の 3D フィールド + HUD 通過 + コンソールドック。
 * なし: 2D 背景 + 疑似カメラ前進にフォールバック。
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { hideNativeBootSplash } from "../../bootstrap/nativeBootSplash";
import LandingScreenNative from "../legal/LandingScreenNative";
import AuthEntryScreen from "./AuthEntryScreen";
import AuthLandingBackgroundNative from "./AuthLandingBackgroundNative";
import AuthHexTunnelOverlayNative from "./camera3d/AuthHexTunnelOverlayNative";
import { AUTH_LANDING_FIELD_VARIANT } from "./camera3d/authLandingFieldVariant";
import AuthLandingHudPassNative from "./AuthLandingHudPassNative";
import AuthLandingWorldCameraNative from "./AuthLandingWorldCameraNative";
import AuthLegalConsentGateNative from "./AuthLegalConsentGateNative";
import AuthLandingGlCanvasNative, {
  isExpoGLNativeLinked,
} from "./camera3d/AuthLandingGlCanvasNative";

type AuthMode = "login" | "signup";

export default function AuthLandingFlyShellNative() {
  const [flying, setFlying] = useState(false);
  const [landed, setLanded] = useState(false);
  const [mode, setMode] = useState<AuthMode>("login");
  const [consentOpen, setConsentOpen] = useState(false);
  const [glOk, setGlOk] = useState(() => isExpoGLNativeLinked());
  const consoleOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    hideNativeBootSplash();
  }, []);

  useEffect(() => {
    Animated.timing(consoleOpacity, {
      toValue: landed ? 1 : 0,
      duration: landed ? 320 : 220,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      useNativeDriver: true,
    }).start();
  }, [consoleOpacity, landed]);

  const startFly = useCallback((next: AuthMode) => {
    setFlying((wasFlying) => {
      if (wasFlying) return wasFlying;
      setMode(next);
      return true;
    });
  }, []);

  const handleBack = useCallback(() => {
    setLanded(false);
    setFlying(false);
  }, []);

  const handleGetStarted = useCallback(() => {
    setConsentOpen(true);
  }, []);

  const handleConsentAgree = useCallback(() => {
    setConsentOpen(false);
    startFly("signup");
  }, [startFly]);

  const handleFlyComplete = useCallback(() => {
    setLanded(true);
  }, []);

  const handleGlUnavailable = useCallback(() => {
    setGlOk(false);
  }, []);

  const hud = (
    <LandingScreenNative
      hideBackground
      skipBootSplash
      onGetStarted={handleGetStarted}
      onLogIn={() => startFly("login")}
    />
  );

  const hexTunnel = AUTH_LANDING_FIELD_VARIANT === "hexTunnel";
  const skipGl = hexTunnel || AUTH_LANDING_FIELD_VARIANT === "grainWave";

  if (!glOk) {
    return (
      <View style={styles.root}>
        <AuthLandingBackgroundNative />
        {hexTunnel ? <AuthHexTunnelOverlayNative /> : null}
        <AuthLandingWorldCameraNative
          active
          flying={flying}
          onFlyComplete={handleFlyComplete}
          overlay={hud}
        >
          <AuthEntryScreen
            embedded
            initialMode={mode}
            interactive={landed}
            onBack={handleBack}
          />
        </AuthLandingWorldCameraNative>
        <AuthLegalConsentGateNative
          visible={consentOpen}
          onClose={() => setConsentOpen(false)}
          onAgree={handleConsentAgree}
        />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <AuthLandingBackgroundNative />
      {hexTunnel ? <AuthHexTunnelOverlayNative /> : null}
      {skipGl ? null : (
        <AuthLandingGlCanvasNative
          flying={flying}
          onUnavailable={handleGlUnavailable}
        />
      )}
      <AuthLandingHudPassNative
        flying={flying}
        onFlyComplete={handleFlyComplete}
        overlay={hud}
      />
      <Animated.View
        style={[styles.consoleLayer, { opacity: consoleOpacity }]}
        pointerEvents={landed ? "auto" : "none"}
      >
        <AuthEntryScreen
          embedded
          initialMode={mode}
          interactive={landed}
          onBack={handleBack}
        />
      </Animated.View>
      <AuthLegalConsentGateNative
        visible={consentOpen}
        onClose={() => setConsentOpen(false)}
        onAgree={handleConsentAgree}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000000",
  },
  consoleLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 30,
  },
});
