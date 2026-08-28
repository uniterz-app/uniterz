import { useId, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle, ClipPath, Defs, Path, G } from "react-native-svg";
import {
  buildThinTripleStripeDots,
  isBlackBodyPrimary,
  JERSEY_FRAME_WHITE,
} from "../../../../../lib/jersey/jerseyThinTripleStripes";
import {
  JERSEY_PATH_D,
  VIEWBOX_H,
  VIEWBOX_W,
  accentRgbForJerseyGlow,
  buildJerseyHalftoneDotList,
  jerseyStrokeWidthForSize,
} from "./jerseyHalftoneModel";

type JerseyMarkSvgProps = {
  accent: string;
  accentEnd?: string;
  size?: number;
};

function normalizeHexKey(s: string): string {
  return s.trim().replace(/^#/, "").toLowerCase();
}

export default function JerseyMarkSvg({
  accent,
  accentEnd,
  size = 56,
}: JerseyMarkSvgProps) {
  const id = useId();
  const clipId = `jclip-${id.replace(/:/g, "")}`;
  const stripeMode =
    !!accentEnd && normalizeHexKey(accent) !== normalizeHexKey(accentEnd);

  const dots = useMemo(
    () =>
      buildJerseyHalftoneDotList(
        size,
        accent,
        stripeMode ? undefined : accentEnd
      ),
    [size, accent, accentEnd, stripeMode]
  );
  const stripe = useMemo(
    () => (stripeMode && accentEnd ? buildThinTripleStripeDots(accentEnd) : null),
    [stripeMode, accentEnd]
  );
  const strokeW = useMemo(() => jerseyStrokeWidthForSize(size), [size]);
  const blackFrame = isBlackBodyPrimary(accent);
  const glow = useMemo(
    () => accentRgbForJerseyGlow(accent, accentEnd),
    [accent, accentEnd]
  );
  const glowColor = `rgb(${glow.r},${glow.g},${glow.b})`;

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          shadowColor: glowColor,
        },
      ]}
    >
      <Svg
        width={size}
        height={size}
        viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
      >
        <Defs>
          <ClipPath id={clipId}>
            <Path d={JERSEY_PATH_D} />
          </ClipPath>
        </Defs>

        <G clipPath={`url(#${clipId})`}>
          {dots.map((dot, index) => (
            <Circle
              key={`d-${index}`}
              cx={dot.cx}
              cy={dot.cy}
              r={dot.r}
              fill={dot.fill}
            />
          ))}
          {stripe ? (
            <G
              origin={`${stripe.cx}, ${stripe.cy}`}
              rotation={stripe.rotateDeg}
            >
              {stripe.dots.map((dot, index) => (
                <Circle
                  key={`s-${index}`}
                  cx={dot.cx}
                  cy={dot.cy}
                  r={dot.r}
                  fill={dot.fill}
                  opacity={dot.opacity}
                />
              ))}
            </G>
          ) : null}
        </G>
        {blackFrame ? (
          <Path
            d={JERSEY_PATH_D}
            fill="none"
            stroke={JERSEY_FRAME_WHITE}
            strokeOpacity={0.65}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={strokeW * 0.55}
          />
        ) : null}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 4,
  },
});
