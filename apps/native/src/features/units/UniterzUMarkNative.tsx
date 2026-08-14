/** Web `UniterzUMark` 相当 — 確定版 U マーク（アーチなし直立） */
import Svg, { Path } from "react-native-svg";
import {
  UNITERZ_U_MARK_PATHS,
  UNITERZ_U_MARK_VIEWBOX,
} from "@/lib/units/uniterzUMark";

type Props = {
  size?: number;
  color?: string;
};

export default function UniterzUMarkNative({
  size = 28,
  color = "rgba(255,237,213,0.92)",
}: Props) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox={`0 0 ${UNITERZ_U_MARK_VIEWBOX} ${UNITERZ_U_MARK_VIEWBOX}`}
      accessibilityLabel="UNITERZ U"
      accessibilityRole="image"
    >
      {UNITERZ_U_MARK_PATHS.map((d) => (
        <Path key={d} d={d} fill={color} />
      ))}
    </Svg>
  );
}
