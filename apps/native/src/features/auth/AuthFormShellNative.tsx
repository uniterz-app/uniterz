/** 認証画面共通シェル（Web `AuthBackdrop` + `AuthFormBranding` 相当） */
import { ReactNode } from "react";
import {
  Dimensions,
  Image,
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
        <Image
          source={require("../../../assets/AuthFormScreen.png")}
          style={styles.bgImage}
          resizeMode="cover"
        />
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
    backgroundColor: colors.bgPrimary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xs,
  },
  bgImage: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
  dim: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(2,6,23,0.12)" },
  card: {
    backgroundColor: "rgba(11,18,32,0.14)",
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: "rgba(226,232,240,0.42)",
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
