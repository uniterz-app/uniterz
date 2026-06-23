import { type ReactNode, useMemo, useState } from "react";
import {
  type LayoutChangeEvent,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import { BlurView } from "expo-blur";
import {
  Canvas,
  Group,
  LinearGradient as SkiaLinearGradient,
  Rect,
  Skia,
  vec,
} from "@shopify/react-native-skia";
import { chamferedRectPathD, NAV_BAR_CHAMFER_CUT } from "../features/games/matchListCyberClipPath";
import PredictOverlayChamferCornerFillNative from "../features/games/PredictOverlayChamferCornerFillNative";
import { colors } from "../theme/tokens";
import { nativeBlurViewExtraProps } from "../ui/nativeBlurProps";

const NAV_BAR_MOBILE_FILL = [colors.navBarFillStart, colors.navBarFillEnd] as const;
const NAV_BAR_MOBILE_SHEEN = [
  colors.navBarSheenStart,
  "rgba(255,255,255,0.01)",
  "rgba(255,255,255,0)",
] as const;
const NAV_BAR_CORNER_MASK = "rgba(10,14,24,1)";
const NAV_BLUR_INTENSITY = Platform.OS === "ios" ? 38 : 32;

type Props = {
  children: ReactNode;
};

function makeSkiaPath(width: number, height: number, cut: number) {
  const d = chamferedRectPathD(width, height, cut);
  if (!d) return null;
  return Skia.Path.MakeFromSVGString(d);
}

/** Web mobile `NavBar` の `NAV_DOCK_CLIP`（14px 八角）相当 */
export default function NavBarChamferShellNative({ children }: Props) {
  const [size, setSize] = useState({ w: 0, h: 0 });

  const skiaPath = useMemo(
    () =>
      size.w > 0 && size.h > 0
        ? makeSkiaPath(size.w, size.h, NAV_BAR_CHAMFER_CUT)
        : null,
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
      {hasSize && skiaPath ? (
        <View
          pointerEvents="none"
          style={[styles.shell, { width: size.w, height: size.h }]}
        >
          {(Platform.OS === "ios" || Platform.OS === "android") && (
            <BlurView
              intensity={NAV_BLUR_INTENSITY}
              tint="dark"
              style={StyleSheet.absoluteFillObject}
              {...nativeBlurViewExtraProps()}
            />
          )}
          <Canvas
            style={{ position: "absolute", left: 0, top: 0, width: size.w, height: size.h }}
            pointerEvents="none"
          >
            <Group clip={skiaPath}>
              <Rect x={0} y={0} width={size.w} height={size.h}>
                <SkiaLinearGradient
                  start={vec(size.w * 0.5, 0)}
                  end={vec(size.w * 0.5, size.h)}
                  colors={[...NAV_BAR_MOBILE_FILL]}
                />
              </Rect>
              <Rect
                x={NAV_BAR_CHAMFER_CUT}
                y={0}
                width={Math.max(0, size.w - NAV_BAR_CHAMFER_CUT * 2)}
                height={1}
              >
                <SkiaLinearGradient
                  start={vec(NAV_BAR_CHAMFER_CUT, 0)}
                  end={vec(size.w - NAV_BAR_CHAMFER_CUT, 0)}
                  colors={["rgba(255,255,255,0.04)", "rgba(255,255,255,0)"]}
                />
              </Rect>
              <Rect x={0} y={0} width={size.w} height={size.h}>
                <SkiaLinearGradient
                  start={vec(size.w * 0.5, 0)}
                  end={vec(size.w * 0.5, size.h)}
                  colors={[...NAV_BAR_MOBILE_SHEEN]}
                  positions={[0, 0.35, 0.55]}
                />
              </Rect>
            </Group>
          </Canvas>
          <PredictOverlayChamferCornerFillNative
            width={size.w}
            height={size.h}
            cut={NAV_BAR_CHAMFER_CUT}
            fillColor={NAV_BAR_CORNER_MASK}
          />
        </View>
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
  shell: {
    position: "absolute",
    left: 0,
    top: 0,
    overflow: "hidden",
  },
  content: {
    position: "relative",
    zIndex: 2,
  },
});
