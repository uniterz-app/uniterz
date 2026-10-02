/**
 * Web mobile `ResultCard` コーナー FAB — `CyberMenuButton` + 横／下フライアウト
 */
import { type ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import Animated from "react-native-reanimated";
import CyberMenuButton, {
  type CyberMenuButtonSize,
} from "./CyberMenuButton";
import {
  useCornerMenuBottomFlyoutMotion,
  useCornerMenuLeftFlyoutMotion,
  useCornerMenuRightFlyoutMotion,
} from "./cornerMenuNativeMotion";

/** メニューアンカーに対する横フライアウトの出る方向 */
export type CornerMenuHorizontalFlyout = "left" | "right";

const SIZE_PX: Record<CyberMenuButtonSize, number> = {
  xs: 24,
  sm: 28,
  md: 36,
  lg: 40,
};

type Props = {
  open: boolean;
  onToggle: () => void;
  menuLabel: string;
  /** 横フライアウト（共有・× 等）。左上配置は `right` */
  horizontalFlyout?: CornerMenuHorizontalFlyout;
  /** 既定 xs。リザルト判定前カードは sm + dim */
  size?: CyberMenuButtonSize;
  /** size より優先（例: 30） */
  dim?: number;
  /** Web `.cyber-menu-btn--white` — 枠白 */
  menuFrameWhite?: boolean;
  sideFlyout?: ReactNode;
  bottomFlyout?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export default function CornerMenuClusterNative({
  open,
  onToggle,
  menuLabel,
  horizontalFlyout = "right",
  size = "xs",
  dim,
  menuFrameWhite = false,
  sideFlyout,
  bottomFlyout,
  style,
}: Props) {
  const flyoutLeftMotion = useCornerMenuLeftFlyoutMotion(open);
  const flyoutRightMotion = useCornerMenuRightFlyoutMotion(open);
  const bottomFlyoutMotion = useCornerMenuBottomFlyoutMotion(open);
  const horizontalMotion =
    horizontalFlyout === "right" ? flyoutRightMotion : flyoutLeftMotion;
  const buttonPx = dim ?? SIZE_PX[size];
  const half = buttonPx / 2;

  return (
    <View style={[styles.hitArea, style]} pointerEvents="box-none">
      <View style={styles.anchor}>
        {sideFlyout ? (
          <Animated.View
            style={[
              horizontalFlyout === "right" ? styles.flyoutRight : styles.flyoutLeft,
              { marginTop: -half },
              horizontalMotion,
            ]}
            pointerEvents={open ? "auto" : "none"}
          >
            {sideFlyout}
          </Animated.View>
        ) : null}

        <CyberMenuButton
          size={size}
          dim={dim}
          frameWhite={menuFrameWhite}
          onPress={onToggle}
          accessibilityLabel={menuLabel}
          accessibilityState={{ expanded: open }}
        />

        {bottomFlyout ? (
          <Animated.View
            style={[
              styles.flyoutBottom,
              { marginLeft: -half },
              bottomFlyoutMotion,
            ]}
            pointerEvents={open ? "auto" : "none"}
          >
            {bottomFlyout}
          </Animated.View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  /** Web `-m-3 p-3` — タップしやすいホットエリア */
  hitArea: {
    margin: -12,
    padding: 12,
    overflow: "visible",
  },
  anchor: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  },
  /** Web `absolute right-full top-1/2 mr-1.5` — メニューが右端のとき */
  flyoutLeft: {
    position: "absolute",
    right: "100%",
    top: "50%",
    marginRight: 6,
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    zIndex: 55,
  },
  /** メニューが左端のとき — 右へ展開して画面内に収める */
  flyoutRight: {
    position: "absolute",
    left: "100%",
    top: "50%",
    marginLeft: 6,
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    zIndex: 55,
  },
  /** Web `absolute top-full left-1/2 mt-1.5 -translate-x-1/2` */
  flyoutBottom: {
    position: "absolute",
    top: "100%",
    left: "50%",
    marginTop: 6,
    zIndex: 55,
    alignItems: "center",
  },
});
