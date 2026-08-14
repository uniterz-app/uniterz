/**
 * 試合一覧の線枠シェル。塗りカードではなく、上下ラベルで途切れた角丸ストローク。
 */
import { type ReactNode, useMemo, useState } from "react";
import {
  type LayoutChangeEvent,
  type StyleProp,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import { Canvas, Path, Skia } from "@shopify/react-native-skia";
import { MATCH_CARD_METRIC_FONT } from "./matchCardTypography";
import { interruptedRoundedRectStrokeD } from "./matchListLineFramePath";

export const MATCH_LINE_FRAME_BLUE = "#3D9EFF";
export const MATCH_LINE_FRAME_GOLD = "#E8C547";
/** 通常 · 予想済み */
export const MATCH_LINE_FRAME_BLUE_MUTED = "#7D93AE";
/** ピックアップ · 予想済み */
export const MATCH_LINE_FRAME_GOLD_MUTED = "#A68B32";

export function matchLineFramePaint(opts: {
  pickup: boolean;
  predicted: boolean;
}): { color: string; glow: string } {
  if (opts.pickup) {
    return opts.predicted
      ? { color: MATCH_LINE_FRAME_GOLD_MUTED, glow: "rgba(166,139,50,0.24)" }
      : { color: MATCH_LINE_FRAME_GOLD, glow: "rgba(232,197,71,0.28)" };
  }
  return opts.predicted
    ? { color: MATCH_LINE_FRAME_BLUE_MUTED, glow: "rgba(125,147,174,0.22)" }
    : { color: MATCH_LINE_FRAME_BLUE, glow: "rgba(61,158,255,0.32)" };
}

const RADIUS = 14;
const STROKE = 1.5;
const LABEL_GAP_PAD = 16;
const MIN_TICK_GAP = 12;
const CTA_WIDTH_PROBE = "REGULAR SEASON";

type Props = {
  children: ReactNode;
  topLabel?: string;
  /** ピックアップ時の左辺略号（RS / PO） */
  leftLabel?: string;
  bottomLabel: string;
  predicted?: boolean;
  pickup?: boolean;
  style?: StyleProp<ViewStyle>;
};

function makePath(
  width: number,
  height: number,
  topGap: number,
  bottomGap: number,
  leftGap: number
) {
  const d = interruptedRoundedRectStrokeD({
    width,
    height,
    radius: RADIUS,
    inset: STROKE / 2,
    topGap,
    bottomGap,
    leftGap,
  });
  if (!d) return null;
  return Skia.Path.MakeFromSVGString(d);
}

export default function MatchListLineFrameNative({
  children,
  topLabel,
  leftLabel,
  bottomLabel,
  predicted = false,
  pickup = false,
  style,
}: Props) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [topLabelW, setTopLabelW] = useState(0);
  const [ctaFixedW, setCtaFixedW] = useState(0);
  const [bottomCtaH, setBottomCtaH] = useState(0);
  const [leftLabelH, setLeftLabelH] = useState(0);
  const { color, glow } = matchLineFramePaint({ pickup, predicted });

  const topGap =
    topLabel && topLabelW > 0
      ? topLabelW + LABEL_GAP_PAD
      : MIN_TICK_GAP;
  const bottomGap =
    ctaFixedW > 0 ? ctaFixedW + LABEL_GAP_PAD : 88;
  const leftGap =
    leftLabel && leftLabelH > 0 ? leftLabelH + LABEL_GAP_PAD : 0;

  const skiaPath = useMemo(
    () =>
      size.w > 0 && size.h > 0
        ? makePath(size.w, size.h, topGap, bottomGap, leftGap)
        : null,
    [size.w, size.h, topGap, bottomGap, leftGap]
  );

  function onLayout(e: LayoutChangeEvent) {
    const { width, height } = e.nativeEvent.layout;
    if (Math.abs(width - size.w) < 0.5 && Math.abs(height - size.h) < 0.5) {
      return;
    }
    setSize({ w: width, h: height });
  }

  const hasSize = size.w > 0 && size.h > 0;

  return (
    <View style={[styles.root, style]} onLayout={onLayout}>
      {hasSize && skiaPath ? (
        <Canvas
          pointerEvents="none"
          style={[styles.canvas, { width: size.w, height: size.h }]}
        >
          <Path
            path={skiaPath}
            style="stroke"
            strokeWidth={5}
            color={glow}
            strokeCap="round"
            strokeJoin="round"
          />
          <Path
            path={skiaPath}
            style="stroke"
            strokeWidth={STROKE}
            color={color}
            strokeCap="round"
            strokeJoin="round"
          />
        </Canvas>
      ) : null}

      <View pointerEvents="none" style={styles.ctaWidthProbe}>
        <View
          onLayout={(e) => {
            const w = e.nativeEvent.layout.width;
            if (Math.abs(w - ctaFixedW) > 0.5) setCtaFixedW(w);
          }}
        >
          <Text style={styles.label}>{CTA_WIDTH_PROBE}</Text>
        </View>
      </View>

      {leftLabel ? (
        <View pointerEvents="none" style={styles.leftLabelWrap}>
          <View
            onLayout={(e) => {
              const h = e.nativeEvent.layout.height;
              if (Math.abs(h - leftLabelH) > 0.5) setLeftLabelH(h);
            }}
            style={styles.leftLabelStack}
          >
            {leftLabel.split("").map((ch, i) =>
              ch === " " ? (
                <View key={`sp-${i}`} style={styles.leftLabelSpace} />
              ) : (
                <Text key={`${ch}-${i}`} style={[styles.leftLabelChar, { color }]}>
                  {ch}
                </Text>
              )
            )}
          </View>
        </View>
      ) : null}

      {topLabel ? (
        <View pointerEvents="none" style={styles.topLabelWrap}>
          <View
            onLayout={(e) => {
              const w = e.nativeEvent.layout.width;
              if (Math.abs(w - topLabelW) > 0.5) setTopLabelW(w);
            }}
          >
            <Text style={[styles.label, { color }]} numberOfLines={1}>
              {topLabel}
            </Text>
          </View>
        </View>
      ) : null}

      <View style={styles.content}>{children}</View>

      <View
        pointerEvents="none"
        style={[
          styles.bottomCtaWrap,
          bottomCtaH > 0
            ? { transform: [{ translateY: bottomCtaH / 2 - STROKE }] }
            : null,
        ]}
      >
        <View
          onLayout={(e) => {
            const height = e.nativeEvent.layout.height;
            if (Math.abs(height - bottomCtaH) > 0.5) setBottomCtaH(height);
          }}
          style={[
            styles.cta,
            ctaFixedW > 0 ? { width: ctaFixedW, minWidth: ctaFixedW } : null,
            {
              borderColor: color,
              backgroundColor: "transparent",
            },
          ]}
        >
          <Text style={[styles.ctaLabel, { color }]} numberOfLines={1}>
            {bottomLabel}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: "relative",
    width: "100%",
    overflow: "visible",
    marginTop: 14,
    marginBottom: 18,
  },
  canvas: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    position: "relative",
    zIndex: 1,
  },
  leftLabelWrap: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 16,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 3,
    transform: [{ translateX: -8 }],
  },
  leftLabelStack: {
    alignItems: "center",
    justifyContent: "center",
    gap: 0,
  },
  leftLabelChar: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0,
    lineHeight: 13,
    includeFontPadding: false,
    textTransform: "uppercase",
    fontFamily: MATCH_CARD_METRIC_FONT,
    textAlign: "center",
  },
  leftLabelSpace: {
    height: 5,
  },
  topLabelWrap: {
    position: "absolute",
    top: 0,
    left: 24,
    right: 24,
    alignItems: "center",
    zIndex: 3,
    transform: [{ translateY: -10 }],
  },
  bottomCtaWrap: {
    position: "absolute",
    bottom: 0,
    left: 24,
    right: 24,
    alignItems: "center",
    zIndex: 3,
  },
  label: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 1.2,
    lineHeight: 18,
    includeFontPadding: false,
    textTransform: "uppercase",
    fontFamily: MATCH_CARD_METRIC_FONT,
    textAlign: "center",
    maxWidth: "100%",
  },
  ctaWidthProbe: {
    position: "absolute",
    opacity: 0,
    left: 0,
    top: 0,
    zIndex: 0,
  },
  cta: {
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 7,
    minWidth: 88,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaLabel: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1.5,
    lineHeight: 16,
    includeFontPadding: false,
    textTransform: "uppercase",
    fontFamily: MATCH_CARD_METRIC_FONT,
    textAlign: "center",
  },
});
