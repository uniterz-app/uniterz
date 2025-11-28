"use client";

import Image from "next/image";
import { ReactNode } from "react";

/** 
 * 共通ヘッダー
 * 4ページ（Timeline / Games / Trend / Ranking）で使用
 * 
 * props:
 *  - left: 左側に表示する要素（アイコンなど）
 *  - right: 右側に表示する要素（通知、設定など）
 */
type HeaderProps = {
  left?: ReactNode;
  right?: ReactNode;
};

export default function Header({ left, right }: HeaderProps) {
  return (
    <header
      className="w-full flex items-center justify-between px-4"
      style={{
        height: "48px",
        backgroundColor: "#0a3b47",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* 左側エリア */}
      <div className="flex items-center justify-start w-[56px]">
        {left}
      </div>

      {/* 中央ロゴ */}
      <div className="flex items-center justify-center flex-1">
        <Image
          src="/logo.png"
          alt="Uniterz Logo"
          width={28}
          height={28}
          priority
        />
      </div>

      {/* 右側エリア */}
      <div className="flex items-center justify-end w-[56px]">
        {right}
      </div>
    </header>
  );
}
