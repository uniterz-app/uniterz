/** 認証画面共通シェル（Web AuthFormBranding 相当） */
import { ReactNode } from "react";
import {
  Dimensions,
  Image,
  Keyboard,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { colors, fonts, spacing } from "../../theme/tokens";

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
          <Text style={styles.title}>{title}</Text>
          {children}
          {footer}
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgPrimary, alignItems: "center", justifyContent: "center" },
  bgImage: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
  dim: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.45)" },
  card: {
    backgroundColor: "rgba(10,17,24,0.88)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: {
    fontFamily: fonts.brand,
    fontSize: 32,
    letterSpacing: 2,
    color: colors.textPrimary,
    textAlign: "center",
  },
});
