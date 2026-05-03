import { useId, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle, ClipPath, Defs, Path, G } from "react-native-svg";
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

/** Web DotJerseyCanvas：淡いシアン白の縁 */
const JERSEY_STROKE_RGBA = "rgba(200,248,255,0.58)";

export default function JerseyMarkSvg({
  accent,
  accentEnd,
  size = 56,
}: JerseyMarkSvgProps) {
  const id = useId();
  const clipId = `jclip-${id.replace(/:/g, "")}`;
  const dots = useMemo(
    () => buildJerseyHalftoneDotList(size, accent, accentEnd),
    [size, accent, accentEnd]
  );
  const strokeW = useMemo(() => jerseyStrokeWidthForSize(size), [size]);
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
        </G>
        <Path
          d={JERSEY_PATH_D}
          fill="none"
          stroke={JERSEY_STROKE_RGBA}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokeW}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  // HalftoneJerseyMark の主色系ドロップシャドウに近づけた
  container: {
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 4,
  },
});
