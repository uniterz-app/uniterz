"use client";

import React from "react";

type Props = {
  open: boolean;
  message: string;
  onClose: () => void;
  title?: string; // ← 任意のタイトル
  icon?: string;  // ← ★ アイコンを追加
};

export default function SimpleCenterModal({
  open,
  message,
  onClose,
  title = "お知らせ",
  icon,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* 背景（ブラー追加） */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* モーダル本体 */}
      <div className="relative bg-[#1e1e1f] text-white p-6 rounded-2xl shadow-xl w-[90%] max-w-[360px]">

        {/* タイトル行（アイコン入り） */}
        <div className="text-[18px] font-bold mb-2 flex items-center gap-2">
          {icon && <span className="text-[20px]">{icon}</span>}
          {title}
        </div>

        <p className="text-[14px] text-white/80 leading-relaxed mb-5">
          {message}
        </p>

        <button
          className="w-full py-2 rounded-xl bg-blue-500 hover:bg-blue-600 transition text-white font-bold"
          onClick={onClose}
        >
          確認しました
        </button>
      </div>
    </div>
  );
}
