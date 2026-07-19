/**
 * 認証画面共通シェル — Landing / AuthEntry と同世界観（カード枠なし）
 */
import { ReactNode } from "react";
import {
  Dimensions,
  Keyboard,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { spacing } from "../../theme/tokens";
import AuthLandingBackgroundNative from "./AuthLandingBackgroundNative";

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
        <View
          style={[
            styles.screen,
            {
              paddingTop: insets.top + 24,
              paddingBottom: Math.max(insets.bottom + 24, 32),
            },
          ]}
        >
          <View style={[styles.form, { width: formWidth }]}>
            <Text style={styles.brandWordmark}>UNITERZ</Text>
            <HorizonRule />
            <Text style={styles.title}>{title}</Text>
            {children}
            {footer}
          </View>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#041418",
  },
  screen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    zIndex: 2,
  },
  form: {
    gap: 14,
  },
  brandWordmark: {
    color: "#e6e4de",
    fontFamily: "BebasNeue_400Regular",
    textAlign: "center",
    letterSpacing: 5,
    fontSize: 34,
    lineHeight: 34,
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
  title: {
    fontFamily: "BebasNeue_400Regular",
    fontSize: 26,
    lineHeight: 30,
    letterSpacing: 1.6,
    color: "rgba(248,250,252,0.95)",
    textAlign: "center",
    marginBottom: 4,
  },
});
