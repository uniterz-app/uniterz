/**
 * プラン画面用 — 左上・右下 chamfer（Web `PLAN_PANEL_CHAMFER_CLIP` 相当）
 */
import { type ReactNode, useMemo, useState } from "react";
import {
  type LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import {
  Canvas,
  Fill,
  Group,
  LinearGradient as SkiaLinearGradient,
  Path,
  PathOp,
  Skia,
  vec,
  type SkPath,
} from "@shopify/react-native-skia";
import { fonts } from "../../../theme/tokens";
import {
  chamferedRectPathD,
  insetChamferedRectPathD,
} from "../../games/matchListCyberClipPath";
import { PLAN_PANEL_CUT_PX } from "../../billing/planPanelChrome";

const FILL = ["rgba(18,16,12,0.98)", "rgba(8,10,16,0.99)", "rgba(5,8,14,1)"] as const;
const BORDER = "rgba(252,211,77,0.42)";
const BORDER_W = 1.2;

type PanelProps = {
  children: ReactNode;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
};

function makePath(w: number, h: number, cut: number) {
  const d = chamferedRectPathD(w, h, cut);
  return d ? Skia.Path.MakeFromSVGString(d) : null;
}

function makeBorderRing(w: number, h: number, cut: number, stroke: number): SkPath | null {
  const outerD = chamferedRectPathD(w, h, cut);
  const innerD = insetChamferedRectPathD(w, h, cut, stroke);
  if (!outerD || !innerD) return null;
  const outer = Skia.Path.MakeFromSVGString(outerD);
  const inner = Skia.Path.MakeFromSVGString(innerD);
  if (!outer || !inner) return null;
  return Skia.Path.MakeFromOp(outer, inner, PathOp.Difference);
}

export default function PlanChamferPanelNative({
  children,
  style,
  contentStyle,
}: PanelProps) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const hasSize = size.w > 0 && size.h > 0;

  const fillPath = useMemo(
    () => (hasSize ? makePath(size.w, size.h, PLAN_PANEL_CUT_PX) : null),
    [hasSize, size.h, size.w]
  );
  const borderPath = useMemo(
    () =>
      hasSize
        ? makeBorderRing(size.w, size.h, PLAN_PANEL_CUT_PX, BORDER_W)
        : null,
    [hasSize, size.h, size.w]
  );

  function onLayout(e: LayoutChangeEvent) {
    const { width, height } = e.nativeEvent.layout;
    if (width !== size.w || height !== size.h) setSize({ w: width, h: height });
  }

  return (
    <View style={[styles.wrap, style]} onLayout={onLayout}>
      {hasSize && fillPath ? (
        <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
          <Group clip={fillPath}>
            <Fill>
              <SkiaLinearGradient
                start={vec(0, 0)}
                end={vec(0, size.h)}
                colors={[...FILL]}
              />
            </Fill>
          </Group>
          {borderPath ? <Path path={borderPath} color={BORDER} /> : null}
        </Canvas>
      ) : null}
      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  );
}

/** 斜め CTA（Web `PLAN_CTA_SLANT_CLIP` の近似） */
export function PlanSlantCtaNative({
  label,
  onPress,
  variant = "primary",
}: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "danger";
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.ctaOuter, pressed && { opacity: 0.9 }]}
    >
      <View
        style={[
          styles.ctaSkew,
          variant === "primary" ? styles.ctaPrimary : styles.ctaDanger,
        ]}
      >
        <View style={styles.ctaUnskew}>
          <Text
            style={
              variant === "primary" ? styles.ctaPrimaryText : styles.ctaDangerText
            }
          >
            {label}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "relative",
    overflow: "hidden",
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 26,
  },
  ctaOuter: {
    overflow: "hidden",
  },
  ctaSkew: {
    transform: [{ skewX: "-12deg" }],
    paddingVertical: 14,
    alignItems: "center",
  },
  ctaPrimary: {
    backgroundColor: "#fcd34d",
  },
  ctaDanger: {
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.55)",
    backgroundColor: "transparent",
  },
  ctaUnskew: {
    transform: [{ skewX: "12deg" }],
    alignItems: "center",
  },
  ctaPrimaryText: {
    fontFamily: fonts.metric,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: "#120e08",
  },
  ctaDangerText: {
    fontFamily: fonts.metric,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.8,
    textTransform: "uppercase",
    color: "#fca5a5",
  },
});
