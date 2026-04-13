"use client";

import React from "react";
import cn from "clsx";
import styles from "./SettingsNeonCard.module.css";

type Props = {
  children: React.ReactNode;
  /** 外枠に付与（幅・max-width など） */
  className?: string;
  /** 外枠のインラインスタイル（幅指定など） */
  style?: React.CSSProperties;
  /** true のとき内側パディングを付けない（子が自前で管理） */
  bare?: boolean;
};

/**
 * 設定サイドバーから遷移する各種ページ向けのカードシェル。
 * 背景の放射グラデーション＋内側ハイライト＋回転する縁のアクセント。
 */
export default function SettingsNeonCard({
  children,
  className,
  style,
  bare = false,
}: Props) {
  return (
    <div className={cn(styles.shell, className)} style={style}>
      <div className={styles.spin} aria-hidden />
      <div
        className={cn(styles.inner, !bare && styles.innerPad)}
      >
        {children}
      </div>
    </div>
  );
}
