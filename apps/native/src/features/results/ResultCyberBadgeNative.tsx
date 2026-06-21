import { type ReactNode, useMemo, useState } from "react";
import {
  type LayoutChangeEvent,
  StyleSheet,
  Text,
  View,
  type TextStyle,
} from "react-native";
import {
  Canvas,
  Group,
  LinearGradient as SkiaLinearGradient,
  Path,
  Rect,
  Skia,
  vec,
} from "@shopify/react-native-skia";
import {
  RESULT_CYBER_BADGE_CLIP_CUT,
  resultHitCyberClipPathD,
} from "./resultHitCyberClipPath";
import {
  resultCyberBadgeMetrics,
  RESULT_CYBER_BADGE_THEMES,
  type ResultCyberBadgeKind,
} from "./resultCyberBadgeThemes";

type Props = {
  kind: ResultCyberBadgeKind;
  label: string;
  /** Web `isMobile` */
  compact?: boolean;
  /** Web `hitBadgeSubtle` */
  subtle?: boolean;
  leading?: ReactNode;
  textStyle?: TextStyle;
  maxLabelWidth?: number;
};

function makeClipPath(width: number, height: number) {
  const d = resultHitCyberClipPathD(width, height, RESULT_CYBER_BADGE_CLIP_CUT);
  if (!d) return null;
  return Skia.Path.MakeFromSVGString(d);
}

/** Web `ResultOutcomeBadges` + `result*BadgeClass`（サイバー角切り・グラデ） */
export default function ResultCyberBadgeNative({
  kind,
  label,
  compact = true,
  subtle = false,
  leading = null,
  textStyle,
  maxLabelWidth,
}: Props) {
  const theme = RESULT_CYBER_BADGE_THEMES[kind];
  if (!theme) return null;
  const metrics = resultCyberBadgeMetrics(kind, compact, subtle);
  const [size, setSize] = useState({ w: 0, h: 0 });

  const clipPath = useMemo(
    () => (size.w > 0 && size.h > 0 ? makeClipPath(size.w, size.h) : null),
    [size.w, size.h]
  );

  const shadowScale = subtle ? 0.72 : 1;

  function onLayout(e: LayoutChangeEvent) {
    const { width, height } = e.nativeEvent.layout;
    if (Math.abs(width - size.w) < 0.5 && Math.abs(height - size.h) < 0.5) return;
    setSize({ w: width, h: height });
  }

  return (
    <View
      onLayout={onLayout}
      style={[
        styles.shell,
        {
          shadowColor: theme.shadowColor,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: theme.shadowOpacity * shadowScale,
          shadowRadius: theme.shadowRadius * shadowScale,
          elevation: 4,
        },
      ]}
    >
      {clipPath ? (
        <Canvas
          pointerEvents="none"
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: size.w,
            height: size.h,
          }}
        >
          <Group clip={clipPath}>
            <Rect x={0} y={0} width={size.w} height={size.h}>
              <SkiaLinearGradient
                start={vec(0, 0)}
                end={vec(0, size.h)}
                colors={[...theme.gradient]}
                positions={[...theme.gradientLocations]}
              />
            </Rect>
            <Rect x={0} y={0} width={3} height={size.h} color={theme.leftAccent} />
            <Rect
              x={RESULT_CYBER_BADGE_CLIP_CUT}
              y={0}
              width={Math.max(0, size.w - RESULT_CYBER_BADGE_CLIP_CUT * 2)}
              height={1}
              color={theme.topHighlight}
            />
          </Group>
          <Path path={clipPath} style="stroke" strokeWidth={1} color={theme.borderColor} />
        </Canvas>
      ) : null}

      <View
        style={[
          styles.content,
          {
            gap: metrics.gap,
            paddingHorizontal: metrics.paddingH,
            paddingVertical: metrics.paddingV,
          },
        ]}
      >
        {leading}
        <Text
          style={[
            styles.label,
            {
              fontSize: metrics.fontSize,
              letterSpacing: metrics.letterSpacing,
              color: theme.textColor,
              maxWidth: maxLabelWidth,
            },
            textStyle,
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    alignSelf: "flex-start",
    maxWidth: "100%",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
  },
  label: {
    fontWeight: "800",
    textTransform: "uppercase",
    includeFontPadding: false,
  },
});
