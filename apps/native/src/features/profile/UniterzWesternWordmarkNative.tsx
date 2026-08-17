/**
 * Web `UniterzWesternWordmark` 相当 — アウトライン SVG ワードマーク
 */
import { View } from "react-native";
import Svg, { G, Path } from "react-native-svg";
import {
  UNITERZ_WESTERN_GLYPH_VIEW,
  type UniterzWesternVariantId,
  uniterzWesternWordPaths,
} from "../../../../../lib/units/uniterzWesternGlyphs";

type Props = {
  variant?: UniterzWesternVariantId;
  width?: number;
  fill?: string;
  gap?: number;
  arched?: boolean;
  arch?: number;
};

export default function UniterzWesternWordmarkNative({
  variant = "a",
  width = 280,
  fill = "#e8f7ff",
  gap = 12,
  arched = true,
  arch = 12,
}: Props) {
  const glyphs = uniterzWesternWordPaths(variant);
  const { width: gw, height: gh } = UNITERZ_WESTERN_GLYPH_VIEW;
  const n = glyphs.length;
  const totalW = n * gw + Math.max(0, n - 1) * gap;
  const totalH = gh + (arched ? arch : 0);
  const height = (totalH / totalW) * width;

  return (
    <View accessibilityLabel="UNITERZ">
      <Svg width={width} height={height} viewBox={`0 0 ${totalW} ${totalH}`}>
        {glyphs.map((g, i) => {
          const t = n === 1 ? 0.5 : i / (n - 1);
          const rise = arched ? arch * Math.sin(Math.PI * t) : 0;
          const x = i * (gw + gap);
          const y = arch - rise;
          return (
            <G key={`${g.char}-${i}`} transform={`translate(${x}, ${y})`}>
              <Path d={g.d} fill={fill} fillRule="evenodd" />
            </G>
          );
        })}
      </Svg>
    </View>
  );
}
