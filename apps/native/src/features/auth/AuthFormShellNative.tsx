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
import { colors, fonts } from "../../theme/tokens";

type Props = {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
};

export default function AuthFormShellNative({ title, children, footer }: Props) {
  const formWidth = Math.min(320, Dimensions.get("window").width - 48);

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
          <View style={styles.pageGrid} pointerEvents="none" />
          <View style={styles.brandBlock}>
            <Text style={styles.brand}>UNITERZ</Text>
            <View style={styles.brandLine} />
          </View>
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
    paddingHorizontal: 24,
  },
  bgImage: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
  dim: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.45)" },
  card: {
    position: "relative",
    overflow: "hidden",
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    paddingTop: 16,
    paddingBottom: 28,
    paddingHorizontal: 24,
    gap: 12,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 40,
    elevation: 16,
  },
  pageGrid: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.2,
    backgroundColor: "rgba(255,255,255,0.015)",
  },
  brandBlock: {
    alignItems: "center",
    marginBottom: 4,
  },
  brand: {
    fontFamily: fonts.brand,
    fontSize: 28,
    letterSpacing: 4,
    color: "rgba(248,250,252,0.96)",
  },
  brandLine: {
    marginTop: 14,
    width: "88%",
    maxWidth: 220,
    height: 1,
    backgroundColor: "rgba(34,211,238,0.85)",
    shadowColor: "rgba(34,211,238,0.5)",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.75,
    shadowRadius: 14,
  },
  title: {
    fontFamily: fonts.brand,
    fontSize: 32,
    letterSpacing: 2,
    color: colors.textPrimary,
    textAlign: "center",
    marginTop: -2,
  },
});
