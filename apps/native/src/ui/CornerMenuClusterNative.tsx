/**
 * Web mobile `ResultCard` コーナー FAB — `CyberMenuButton` + 横／下フライアウト
 */
import { type ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import Animated from "react-native-reanimated";
import CyberMenuButton from "./CyberMenuButton";
import {
  useCornerMenuBottomFlyoutMotion,
  useCornerMenuLeftFlyoutMotion,
  useCornerMenuRightFlyoutMotion,
} from "./cornerMenuNativeMotion";

/** メニューアンカーに対する横フライアウトの出る方向 */
export type CornerMenuHorizontalFlyout = "left" | "right";

type Props = {
  open: boolean;
  onToggle: () => void;
  menuLabel: string;
  /** 横フライアウト（共有・× 等）。左上配置は `right` */
  horizontalFlyout?: CornerMenuHorizontalFlyout;
  sideFlyout?: ReactNode;
  bottomFlyout?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export default function CornerMenuClusterNative({
  open,
  onToggle,
  menuLabel,
  horizontalFlyout = "right",
  sideFlyout,
  bottomFlyout,
  style,
}: Props) {
  const flyoutLeftMotion = useCornerMenuLeftFlyoutMotion(open);
  const flyoutRightMotion = useCornerMenuRightFlyoutMotion(open);
  const bottomFlyoutMotion = useCornerMenuBottomFlyoutMotion(open);
  const horizontalMotion =
    horizontalFlyout === "right" ? flyoutRightMotion : flyoutLeftMotion;

  return (
    <View style={[styles.hitArea, style]} pointerEvents="box-none">
      <View style={styles.anchor}>
        {sideFlyout ? (
          <Animated.View
            style={[
              horizontalFlyout === "right" ? styles.flyoutRight : styles.flyoutLeft,
              horizontalMotion,
            ]}
            pointerEvents={open ? "auto" : "none"}
          >
            {sideFlyout}
          </Animated.View>
        ) : null}

        <CyberMenuButton
          size="xs"
          onPress={onToggle}
          accessibilityLabel={menuLabel}
          accessibilityState={{ expanded: open }}
        />

        {bottomFlyout ? (
          <Animated.View
            style={[styles.flyoutBottom, bottomFlyoutMotion]}
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
    marginTop: -14,
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
    marginTop: -14,
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
    marginLeft: -14,
    zIndex: 55,
    alignItems: "center",
  },
});
