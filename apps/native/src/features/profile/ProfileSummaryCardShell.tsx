/**
 * Web `SummaryCardsV2` の `Card` compact シェルに準拠。
 * - 格子: Web `PROFILE_SHELL_GRID` 相当（`profileShellGridNative.ts` で RN 向けに視認性調整）。
 * - 枠・背景・padding: `border-white/15`・`bg-[#050814]/80`・`px-2 pt-[5px] pb-[7px]`
 */
import { type ReactNode, useId } from "react";
import { Platform, StyleSheet, View, type ViewStyle } from "react-native";
import Svg, { Defs, Pattern, Rect, Path } from "react-native-svg";
import {
  PROFILE_SHELL_GRID_NATIVE,
  profileShellGridPathD,
} from "./profileShellGridNative";

type Props = {
  children: ReactNode;
  style?: ViewStyle | ViewStyle[];
};

export default function ProfileSummaryCardShell({ children, style }: Props) {
  const sid = useId().replace(/[^a-zA-Z0-9_]/g, "_");
  const pid = `grid_${sid}`;

  // 横幅は glowWrap に渡す（flex 行の子の main size）。outer のみ width だと Yoga で狭くなることがある。
  return (
    <View style={[styles.glowWrap, style]}>
      <View style={styles.outer}>
        <Svg
          width="100%"
          height="100%"
          style={[
            StyleSheet.absoluteFillObject,
            { opacity: PROFILE_SHELL_GRID_NATIVE.layerOpacity },
          ]}
          pointerEvents="none"
        >
          <Defs>
            <Pattern
              id={pid}
              width={PROFILE_SHELL_GRID_NATIVE.cellPx}
              height={PROFILE_SHELL_GRID_NATIVE.cellPx}
              patternUnits="userSpaceOnUse"
            >
              <Path
                d={profileShellGridPathD(PROFILE_SHELL_GRID_NATIVE.cellPx)}
                fill="none"
                stroke={PROFILE_SHELL_GRID_NATIVE.stroke}
                strokeWidth={PROFILE_SHELL_GRID_NATIVE.strokeWidth}
              />
            </Pattern>
          </Defs>
          <Rect width="100%" height="100%" fill={`url(#${pid})`} />
        </Svg>
        <View style={styles.inner}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  /**
   * Web `summaryCardShadowSmClass` に近いシアン系エッジ発光。
   * 影は inner の `overflow: hidden` と同じ View に付けると iOS で裁ち落ちるためラッパーに付与。
   */
  glowWrap: {
    /** Web コンパクト `rounded-lg` よりやや角張り */
    borderRadius: 8,
    minWidth: 0,
    ...Platform.select({
      ios: {
        shadowColor: "rgb(56, 189, 248)",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.22,
        shadowRadius: 5,
      },
      android: {
        elevation: 3,
        shadowColor: "rgb(56, 189, 248)",
      },
      default: {},
    }),
  },
  outer: {
    width: "100%",
    borderRadius: 8,
    borderWidth: 1,
    /** Web compact `border-white/15`（md では /10 だがモバイル準拠） */
    borderColor: "rgba(255, 255, 255, 0.15)",
    /** Web `bg-[#050814]/80` */
    backgroundColor: "rgba(5, 8, 20, 0.8)",
    overflow: "hidden",
  },
  inner: {
    /** Web `px-2 pt-[5px] pb-[7px]` */
    paddingHorizontal: 8,
    paddingTop: 5,
    paddingBottom: 7,
  },
});
