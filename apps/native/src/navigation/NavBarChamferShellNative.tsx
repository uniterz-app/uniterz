/**
 * Web mobile `NavBar` の `NAV_DOCK_CLIP`（14px 八角）相当。
 * 角切り外は透明。ガラス感は Skia BackdropBlur（clip 内）で再現。
 */
import { type ReactNode, useMemo, useState } from "react";
import {
  type LayoutChangeEvent,
  StyleSheet,
  View,
} from "react-native";
import {
  BackdropBlur,
  Canvas,
  Fill,
  Group,
  LinearGradient as SkiaLinearGradient,
  Path,
  PathOp,
  Rect,
  Skia,
  vec,
  type SkPath,
} from "@shopify/react-native-skia";
import {
  chamferedRectPathD,
  insetChamferedRectPathD,
  NAV_BAR_CHAMFER_CUT,
} from "../features/games/matchListCyberClipPath";
import { colors } from "../theme/tokens";

/** A03 — 黒ドック。Native は BackdropBlur 越しに下地が透けるので不透明寄り。 */
const NAV_BAR_MOBILE_FILL = [
  colors.navBarFillStart,
  colors.navBarFillEnd,
] as const;
const NAV_BAR_MOBILE_SHEEN = [
  colors.navBarSheenStart,
  "rgba(255,255,255,0.01)",
  "rgba(255,255,255,0)",
] as const;
/** Web `backdrop-filter: blur(4px)` 相当（強すぎると透け感が増すので控えめ） */
const NAV_BAR_BACKDROP_BLUR = 3;
const NAV_BAR_BORDER = colors.navBarBorder;
const NAV_BAR_BORDER_WIDTH = 1;

type Props = {
  children: ReactNode;
  fill?: readonly [string, string];
  sheen?: readonly [string, string, string];
  border?: string;
};

function makeSkiaPath(width: number, height: number, cut: number) {
  const d = chamferedRectPathD(width, height, cut);
  if (!d) return null;
  return Skia.Path.MakeFromSVGString(d);
}

function makeBorderRingPath(
  width: number,
  height: number,
  cut: number,
  strokeWidth: number
): SkPath | null {
  const outerD = chamferedRectPathD(width, height, cut);
  const innerD = insetChamferedRectPathD(width, height, cut, strokeWidth);
  if (!outerD || !innerD) return null;
  const outer = Skia.Path.MakeFromSVGString(outerD);
  const inner = Skia.Path.MakeFromSVGString(innerD);
  if (!outer || !inner) return null;
  return Skia.Path.MakeFromOp(outer, inner, PathOp.Difference);
}

/** Web mobile `NavBar` の `NAV_DOCK_CLIP`（14px 八角）相当 */
export default function NavBarChamferShellNative({
  children,
  fill = NAV_BAR_MOBILE_FILL,
  sheen = NAV_BAR_MOBILE_SHEEN,
  border = NAV_BAR_BORDER,
}: Props) {
  const [size, setSize] = useState({ w: 0, h: 0 });

  const skiaPath = useMemo(
    () =>
      size.w > 0 && size.h > 0
        ? makeSkiaPath(size.w, size.h, NAV_BAR_CHAMFER_CUT)
        : null,
    [size.w, size.h]
  );

  const borderRingPath = useMemo(
    () =>
      size.w > 0 && size.h > 0
        ? makeBorderRingPath(
            size.w,
            size.h,
            NAV_BAR_CHAMFER_CUT,
            NAV_BAR_BORDER_WIDTH
          )
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
          <Canvas
            opaque={false}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: size.w,
              height: size.h,
            }}
            pointerEvents="none"
          >
            <Group clip={skiaPath}>
              {/* Web `backdrop-filter: blur(4px)` — 角切り内だけぼかす */}
              <BackdropBlur blur={NAV_BAR_BACKDROP_BLUR}>
                <Fill color="transparent" />
              </BackdropBlur>
              <Rect x={0} y={0} width={size.w} height={size.h}>
                <SkiaLinearGradient
                  start={vec(size.w * 0.5, 0)}
                  end={vec(size.w * 0.5, size.h)}
                  colors={[...fill]}
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
                  colors={[...sheen]}
                  positions={[0, 0.35, 0.55]}
                />
              </Rect>
            </Group>
            {borderRingPath ? (
              <Path path={borderRingPath} style="fill" color={border} />
            ) : null}
          </Canvas>
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
    backgroundColor: "transparent",
    /** 矩形影が角切りに黒い三角を残すので使わない */
    shadowColor: "transparent",
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  shell: {
    position: "absolute",
    left: 0,
    top: 0,
    overflow: "visible",
    backgroundColor: "transparent",
  },
  content: {
    position: "relative",
    zIndex: 2,
  },
});
