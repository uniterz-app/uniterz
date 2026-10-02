/**
 * 起動 Landing / Auth 背景。
 * grainWave: 粒子のうねる帯。それ以外は黒地（金銀枠 / コートが上に乗る）。
 */
import { StyleSheet, View } from "react-native";
import AuthLandingAmoebaFieldNative from "./AuthLandingAmoebaFieldNative";
import { AUTH_LANDING_FIELD_VARIANT } from "./camera3d/authLandingFieldVariant";

type Props = {
  /** 同意ゲート・着地後など、帯アニメを止める */
  paused?: boolean;
};

export default function AuthLandingBackgroundNative({ paused = false }: Props) {
  if (AUTH_LANDING_FIELD_VARIANT === "grainWave") {
    return <AuthLandingAmoebaFieldNative paused={paused} />;
  }
  return <View style={styles.root} pointerEvents="none" />;
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000000",
  },
});
