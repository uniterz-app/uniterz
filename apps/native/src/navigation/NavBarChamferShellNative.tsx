import { type ReactNode, useMemo, useState } from "react";
import {
  type LayoutChangeEvent,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import MaskedView from "@react-native-masked-view/masked-view";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path as SvgPath } from "react-native-svg";
import { chamferedRectPathD, NAV_BAR_CHAMFER_CUT } from "../features/games/matchListCyberClipPath";
import { colors } from "../theme/tokens";
import { nativeBlurViewExtraProps } from "../ui/nativeBlurProps";

const NAV_BAR_MOBILE_FILL = [colors.navBarFillStart, colors.navBarFillEnd] as const;
const NAV_BAR_MOBILE_SHEEN = [
  colors.navBarSheenStart,
  "rgba(255,255,255,0.01)",
  "rgba(255,255,255,0)",
] as const;
const NAV_BLUR_INTENSITY = Platform.OS === "ios" ? 38 : 32;

type Props = {
  children: ReactNode;
};

/** Web mobile `NavBar` の `NAV_DOCK_CLIP`（14px 八角）相当 */
export default function NavBarChamferShellNative({ children }: Props) {
  const [size, setSize] = useState({ w: 0, h: 0 });

  const pathD = useMemo(
    () =>
      size.w > 0 && size.h > 0
        ? chamferedRectPathD(size.w, size.h, NAV_BAR_CHAMFER_CUT)
        : "",
    [size.w, size.h]
  );

  const hasSize = size.w > 0 && size.h > 0;

  function onLayout(e: LayoutChangeEvent) {
    const { width, height } = e.nativeEvent.layout;
    if (Math.abs(width - size.w) < 0.5 && Math.abs(height - size.h) < 0.5) return;
    setSize({ w: width, h: height });
  }

  return (
    <View style={styles.root} onLayout={onLayout}>
      {hasSize && pathD ? (
        <MaskedView
          style={[styles.mask, { width: size.w, height: size.h }]}
          maskElement={
            <Svg width={size.w} height={size.h}>
              <SvgPath d={pathD} fill="#fff" />
            </Svg>
          }
        >
          {(Platform.OS === "ios" || Platform.OS === "android") && (
            <BlurView
              intensity={NAV_BLUR_INTENSITY}
              tint="dark"
              style={StyleSheet.absoluteFillObject}
              {...nativeBlurViewExtraProps()}
            />
          )}
          <LinearGradient colors={[...NAV_BAR_MOBILE_FILL]} style={StyleSheet.absoluteFillObject} />
          <LinearGradient
            colors={["rgba(255,255,255,0.04)", "rgba(255,255,255,0)"]}
            style={styles.topInset}
          />
          <LinearGradient
            colors={[...NAV_BAR_MOBILE_SHEEN]}
            locations={[0, 0.35, 0.55]}
            style={StyleSheet.absoluteFillObject}
          />
        </MaskedView>
      ) : null}

      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: "100%",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 10,
  },
  mask: {
    position: "absolute",
    left: 0,
    top: 0,
  },
  topInset: {
    position: "absolute",
    left: NAV_BAR_CHAMFER_CUT,
    right: NAV_BAR_CHAMFER_CUT,
    top: 0,
    height: 1,
  },
  content: {
    position: "relative",
    zIndex: 2,
  },
});
