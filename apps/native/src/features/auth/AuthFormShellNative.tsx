/** 認証画面共通シェル — AppShell のワイヤーフレーム地形を背面に透過表示 */
import { ReactNode } from "react";
import {
  Dimensions,
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { colors, fonts, radius, spacing } from "../../theme/tokens";

type Props = {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
};

export default function AuthFormShellNative({ title, children, footer }: Props) {
  const formWidth = Math.min(330, Dimensions.get("window").width - 26);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.root}>
        <View style={styles.dim} pointerEvents="none" />
        <View style={[styles.card, { width: formWidth }]}>
          <Text style={styles.brandWordmark}>UNITERZ</Text>
          <View style={styles.brandDivider} pointerEvents="none" />
          <Text style={styles.title}>{title}</Text>
          {children}
          {footer}
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xs,
  },
  dim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(2,6,23,0.08)",
  },
  card: {
    backgroundColor: "rgba(8,14,24,0.72)",
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.28)",
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 18,
    gap: 10,
    overflow: "hidden",
    shadowColor: "#020617",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: Platform.OS === "ios" ? 0.34 : 0,
    shadowRadius: 30,
    elevation: 11,
  },
  brandWordmark: {
    color: "#e6e4de",
    fontFamily: "BebasNeue_400Regular",
    textAlign: "center",
    letterSpacing: 4.2,
    fontSize: 26,
    lineHeight: 26,
    marginTop: 4,
  },
  brandDivider: {
    alignSelf: "center",
    width: "70%",
    height: 1,
    marginBottom: 4,
    backgroundColor: "rgba(34,211,238,0.85)",
    shadowColor: "rgba(34,211,238,0.6)",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 14,
    elevation: 8,
  },
  title: {
    fontFamily: fonts.brand,
    fontSize: 30,
    lineHeight: 34,
    letterSpacing: 1.4,
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: 4,
  },
});
