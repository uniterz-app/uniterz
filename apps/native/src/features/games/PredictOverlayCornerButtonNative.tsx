/**
 * Web `.predict-overlay-close-btn` 相当の角切りコーナーボタン（× / ペン / バーガー共通）。
 */
import type { ReactNode } from "react";
import CyberChamferButtonNative from "../../ui/CyberChamferButtonNative";

type Align = "left" | "right";

type Props = {
  onPress: () => void;
  accessibilityLabel: string;
  align?: Align;
  /** false のとき親レイアウト内に埋め込み（FAB クラスター等） */
  embedded?: boolean;
  icon?: "close" | "edit" | "delete" | "menu" | "share";
  /** menu 時：展開中は × 表示 */
  open?: boolean;
  accessibilityState?: { expanded?: boolean };
  children?: ReactNode;
};

/** Web ScheduleList オーバーレイの左上 × / 右上メニュー */
export default function PredictOverlayCornerButtonNative({
  onPress,
  accessibilityLabel,
  align = "left",
  embedded = false,
  icon = "close",
  open = false,
  accessibilityState,
  children,
}: Props) {
  return (
    <CyberChamferButtonNative
      embedded={embedded}
      floatingAlign={align}
      icon={icon}
      open={open}
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={accessibilityState}
    >
      {children}
    </CyberChamferButtonNative>
  );
}
