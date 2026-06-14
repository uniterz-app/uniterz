"use client";

import { Menu } from "lucide-react";
import {
  CYBER_MENU_ICON_CLASS,
  CYBER_MENU_ICON_STROKE,
  cyberMenuButtonClasses,
  type CyberMenuButtonSize,
} from "@/lib/ui/cyberMenuButton";

type Props = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  size?: CyberMenuButtonSize;
  /** 未読バッジ等（ボタン右上） */
  badge?: React.ReactNode;
  className?: string;
};

/** 角切りシアン枠のハンバーガーボタン（全画面共通） */
export default function CyberMenuButton({
  size = "sm",
  badge,
  className = "",
  type = "button",
  ...rest
}: Props) {
  return (
    <button
      type={type}
      className={cyberMenuButtonClasses(size, className)}
      {...rest}
    >
      <Menu
        className={CYBER_MENU_ICON_CLASS[size]}
        strokeWidth={CYBER_MENU_ICON_STROKE}
        aria-hidden
      />
      {badge}
    </button>
  );
}
