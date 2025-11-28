"use client";
import * as React from "react";

type Props = {
  size?: number;          // ピクセル。既定 128
  stroke?: string;        // 線色。既定 "#000"
  strokeWidth?: number;   // 線の太さ。既定 28（見本に近い太さ）
  className?: string;
};

export default function JerseyOutline({
  size = 128,
  stroke = "#000",
  strokeWidth = 28,
  className,
}: Props) {
  return (
    <svg
      viewBox="0 0 512 512"
      width={size}
      height={size}
      className={className}
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* 外枠（タンクトップの形） */}
      <path d="
        M152 24
        c-13 0-24 11-24 24v24
        c0 72-29 132-72 167v251
        c0 12 10 22 22 22h356
        c12 0 22-10 22-22V239
        c-43-35-72-95-72-167V48
        c0-13-11-24-24-24h-14
        c-14 43-54 72-94 72s-80-29-94-72h-14
        Z" />

      {/* ボトムの細いライン（上の細線） */}
      <line x1="84" y1="420" x2="428" y2="420" />

      {/* 一番下の帯（太線に見える横帯） */}
      <rect x="84" y="452" width="344" height="36" rx="6" />

      {/* 襟（U字） */}
      <path d="
        M204 48
        c10 40 52 64 52 64s42-24 52-64" />

      {/* アームホール（左右） */}
      <path d="M128 72c0 44-12 100-44 136" />
      <path d="M428 208c-32-36-44-92-44-136" />
    </svg>
  );
}
