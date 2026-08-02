"use client";

import type { ReactNode } from "react";
import { useId } from "react";

/** 前日比順位 — 枠アクセント（上昇=ライム / 下降=シアン / 変動なし=ニュートラル） */
export type MyRankCardFrameTone = "up" | "down" | "neutral";

export const MY_RANK_PRO_CHAMFER_CUT = 14;
export const MY_RANK_PRO_BRACKET_ARM = 26;

export function resolveMyRankCardFrameTone(
  rankDeltaPlaces?: number | null
): MyRankCardFrameTone {
  if (
    typeof rankDeltaPlaces !== "number" ||
    !Number.isFinite(rankDeltaPlaces) ||
    rankDeltaPlaces === 0
  ) {
    return "neutral";
  }
  return rankDeltaPlaces > 0 ? "up" : "down";
}

const TONE_CLASS: Record<MyRankCardFrameTone, string> = {
  up: "",
  down: "my-rank-card-frame--rank-down",
  neutral: "my-rank-card-frame--rank-neutral",
};

/** 右下チャムファー — クリップ外に描画して枠線と一致させる */
function MyRankProChamferCorner({ idPrefix }: { idPrefix: string }) {
  const gold = `${idPrefix}-chamfer-gold`;
  const fill = `${idPrefix}-chamfer-fill`;
  const cut = MY_RANK_PRO_CHAMFER_CUT;
  const arm = MY_RANK_PRO_BRACKET_ARM;
  const size = cut + arm;
  const stroke = 1.5;
  const inset = stroke / 2;

  return (
    <svg
      className="pointer-events-none absolute right-0 bottom-0 z-[5]"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden
    >
      <defs>
        <linearGradient id={gold} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fff4d4" />
          <stop offset="22%" stopColor="#e8c66a" />
          <stop offset="55%" stopColor="#c89a3a" />
          <stop offset="82%" stopColor="#f0cc72" />
          <stop offset="100%" stopColor="#8f6820" />
        </linearGradient>
        <linearGradient id={fill} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#a67c28" />
          <stop offset="45%" stopColor="#d4af5a" />
          <stop offset="100%" stopColor="#f0cc72" />
        </linearGradient>
      </defs>
      <polygon
        points={`${size - cut},${size} ${size},${size} ${size},${size - cut}`}
        fill={`url(#${fill})`}
      />
      <path
        d={`M ${inset} ${size - inset} L ${size - cut} ${size - inset}`}
        fill="none"
        stroke={`url(#${gold})`}
        strokeWidth={stroke}
        strokeLinecap="square"
      />
      <path
        d={`M ${size - inset} ${size - cut} L ${size - inset} ${inset}`}
        fill="none"
        stroke={`url(#${gold})`}
        strokeWidth={stroke}
        strokeLinecap="square"
      />
      <path
        d={`M ${size - cut} ${size - inset} L ${size - inset} ${size - cut}`}
        fill="none"
        stroke={`url(#${gold})`}
        strokeWidth={stroke}
        strokeLinecap="square"
      />
    </svg>
  );
}

/** MyRankCard 外枠 — 順位変動でライム / シアン / ニュートラル */
export function MyRankCardFrame({
  children,
  className = "",
  tone = "up",
  proSpec = false,
  hideLeftEdge = false,
}: {
  children: ReactNode;
  className?: string;
  tone?: MyRankCardFrameTone;
  /** Pro 仕様 — ゴールド四隅ブラケット + 右下チャムファー */
  proSpec?: boolean;
  /** Free — 左端アクセント色を出さない */
  hideLeftEdge?: boolean;
}) {
  const chamferId = useId().replace(/[^a-zA-Z0-9-_]/g, "x");

  const frameClass = [
    "my-rank-card-frame relative",
    TONE_CLASS[tone],
    proSpec ? "my-rank-card-frame--pro-spec" : "",
    hideLeftEdge ? "my-rank-card-frame--no-left-edge" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const frame = (
    <div className={frameClass}>
      {proSpec ? (
        <>
          <div
            aria-hidden
            className="my-rank-card-frame__pro-ambient pointer-events-none absolute inset-0"
          />
          <div
            aria-hidden
            className="my-rank-card-frame__pro-scan pointer-events-none absolute inset-0"
          />
        </>
      ) : null}
      <div aria-hidden className="my-rank-card-frame__grid pointer-events-none absolute inset-0" />
      <div aria-hidden className="my-rank-card-frame__edge pointer-events-none absolute inset-0" />
      {proSpec ? (
        <>
          <div
            aria-hidden
            className="my-rank-card-frame__pro-bracket my-rank-card-frame__pro-bracket--tl pointer-events-none absolute left-0 top-0"
          />
          <div
            aria-hidden
            className="my-rank-card-frame__pro-bracket my-rank-card-frame__pro-bracket--tr pointer-events-none absolute right-0 top-0"
          />
          <div
            aria-hidden
            className="my-rank-card-frame__pro-bracket my-rank-card-frame__pro-bracket--bl pointer-events-none absolute bottom-0 left-0"
          />
        </>
      ) : null}
      <div className="relative z-10">{children}</div>
    </div>
  );

  if (!proSpec) return frame;

  return (
    <div className="my-rank-card-frame-pro-host relative">
      {frame}
      <MyRankProChamferCorner idPrefix={chamferId} />
    </div>
  );
}
