/**
 * Web `CandleChartLoader` 相当へ委譲（旧 BlocksPulseLoader API 互換）。
 */
import { CandleChartLoaderNative } from "./CandleChartLoaderNative";
import type { StyleProp, TextStyle, ViewStyle } from "react-native";

type BlocksPulseLoaderProps = {
  pixelScale?: number;
  color?: string;
  colors?: readonly string[];
  showLabel?: boolean;
  label?: string;
  labelStyle?: StyleProp<TextStyle>;
  style?: StyleProp<ViewStyle>;
};

export function BlocksPulseLoader({
  pixelScale = 1,
  label,
  style,
}: BlocksPulseLoaderProps) {
  return (
    <CandleChartLoaderNative scale={pixelScale} label={label} style={style} />
  );
}
