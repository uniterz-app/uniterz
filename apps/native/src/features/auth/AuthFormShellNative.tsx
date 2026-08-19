/**
 * 認証画面共通シェル — Landing / AuthEntry と同世界観（カード枠なし）
 */
import { ReactNode } from "react";
import {
  Dimensions,
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { spacing } from "../../theme/tokens";
import AuthLandingBackgroundNative from "./AuthLandingBackgroundNative";
import AuthHexTunnelOverlayNative from "./camera3d/AuthHexTunnelOverlayNative";
import { AUTH_LANDING_FIELD_VARIANT } from "./camera3d/authLandingFieldVariant";
import UniterzLogoNative from "../profile/UniterzLogoNative";

type Props = {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
};

function HorizonRule() {
  return (
    <View style={styles.horizonSlot}>
      <LinearGradient
        colors={[
          "transparent",
          "rgba(160,245,255,0.45)",
          "rgba(255,255,255,0.95)",
          "rgba(160,245,255,0.45)",
          "transparent",
        ]}
        locations={[0, 0.25, 0.5, 0.75, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.horizonLine}
      />
    </View>
  );
}

export default function AuthFormShellNative({ title, children, footer }: Props) {
  const formWidth = Math.min(340, Dimensions.get("window").width - 40);
  const insets = useSafeAreaInsets();

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.root}>
        <AuthLandingBackgroundNative />
        {AUTH_LANDING_FIELD_VARIANT === "hexTunnel" ? (
          <AuthHexTunnelOverlayNative />
        ) : null}
        <View
          style={[
            styles.screen,
            {
              paddingTop: insets.top + 24,
              paddingBottom: Math.max(insets.bottom + 24, 32),
            },
          ]}
        >
          <ScrollView
            style={{ width: formWidth }}
            contentContainerStyle={styles.form}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={styles.logoWrap}>
              <UniterzLogoNative width={220} />
            </View>
            <HorizonRule />
            <View style={styles.titleWrap}>
              <Text style={[styles.title, title.length > 12 && styles.titleLong]}>
                {title}
              </Text>
            </View>
            {children}
            {footer}
          </ScrollView>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000000",
  },
  screen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    zIndex: 6,
  },
  form: {
    gap: 14,
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: 8,
  },
  logoWrap: {
    alignSelf: "center",
    alignItems: "center",
  },
  horizonSlot: {
    alignSelf: "center",
    width: "72%",
    maxWidth: 240,
    height: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -2,
    marginBottom: 2,
  },
  horizonLine: {
    width: "100%",
    height: 1.5,
  },
  titleWrap: {
    alignSelf: "center",
    alignItems: "center",
    transform: [{ skewX: "-10deg" }],
    marginBottom: 4,
  },
  title: {
    fontFamily: "BebasNeue_400Regular",
    fontSize: 22,
    lineHeight: 26,
    letterSpacing: 2.4,
    color: "rgba(248,250,252,0.95)",
    textAlign: "center",
  },
  titleLong: {
    fontSize: 18,
    lineHeight: 22,
    letterSpacing: 1.6,
  },
});
