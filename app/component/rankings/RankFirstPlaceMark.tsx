"use client";

import { Crown } from "lucide-react";
import { nameOxanium } from "@/lib/fonts";

export type RankFirstMarkVariant =
  | "crown-current"
  | "no1-badge"
  | "hex-medal"
  | "chevron-stack"
  | "diamond-crown"
  | "hud-wings";

const GOLD = "#FFD65A";
const GOLD_DIM = "#F59E0B";
const LIME = "#B8FF3C";
const CYAN = "#00F5FF";

export const RANK_FIRST_MARK_LABELS: Record<
  RankFirstMarkVariant,
  { title: string; subtitle: string }
> = {
  "crown-current": {
    title: "現状 — Lucide 王冠",
    subtitle: "本番で使用中。シンプルだがやや汎用アイコン感",
  },
  "no1-badge": {
    title: "案A — NO.1 HUD バッジ",
    subtitle: "斜めタブと同系のパラレログラム · 金枠 + NO.1",
  },
  "hex-medal": {
    title: "案B — ヘックスメダル",
    subtitle: "六角形アウトライン + 中央 1 · サイバー HUD 勲章",
  },
  "chevron-stack": {
    title: "案C — チェブロンスタック",
    subtitle: "上向き 3 連シェブロン · ランク上昇 / 頂点イメージ",
  },
  "diamond-crown": {
    title: "案D — ダイヤクラウン",
    subtitle: "角ばった 3 峰 · 王冠の意味を残しつつ幾何学的に",
  },
  "hud-wings": {
    title: "案E — HUD ウィング",
    subtitle: "左右ブラケット + 中央星 · チャンピオン装飾",
  },
};

export function RankFirstPlaceMark({
  variant,
  className = "",
}: {
  variant: RankFirstMarkVariant;
  className?: string;
}) {
  const wrap = ["inline-flex items-center justify-center", className].join(" ");

  if (variant === "crown-current") {
    return (
      <span className={wrap}>
        <Crown
          className="h-[16px] w-[22px] lg:h-[19px] lg:w-[26px]"
          style={{ color: "#F4C542" }}
          fill="currentColor"
          stroke="currentColor"
          strokeWidth={1.7}
          aria-hidden
        />
      </span>
    );
  }

  if (variant === "no1-badge") {
    return (
      <span
        className={[wrap, nameOxanium.className, "px-1.5 py-0.5"].join(" ")}
        style={{
          transform: "skewX(-12deg)",
          fontSize: "8px",
          fontWeight: 700,
          letterSpacing: "0.12em",
          color: "#050508",
          background: `linear-gradient(180deg, ${GOLD} 0%, ${GOLD_DIM} 100%)`,
          border: `1px solid ${LIME}`,
          boxShadow: `0 0 10px rgba(255,214,90,0.55), 0 0 4px rgba(184,255,60,0.35)`,
        }}
        aria-hidden
      >
        <span style={{ display: "inline-block", transform: "skewX(12deg)" }}>
          NO.1
        </span>
      </span>
    );
  }

  if (variant === "hex-medal") {
    return (
      <svg
        aria-hidden
        className={wrap}
        width={26}
        height={28}
        viewBox="0 0 26 28"
        fill="none"
      >
        <polygon
          points="13,1 24,7 24,19 13,27 2,19 2,7"
          stroke={LIME}
          strokeWidth={1.2}
          fill="rgba(184,255,60,0.08)"
          style={{ filter: "drop-shadow(0 0 6px rgba(184,255,60,0.45))" }}
        />
        <polygon
          points="13,4 21,9 21,18 13,23 5,18 5,9"
          stroke={GOLD}
          strokeWidth={0.8}
          fill="none"
          opacity={0.65}
        />
        <text
          x="13"
          y="17"
          textAnchor="middle"
          fill={GOLD}
          fontSize="11"
          fontWeight="700"
          fontFamily="Oxanium, sans-serif"
        >
          1
        </text>
      </svg>
    );
  }

  if (variant === "chevron-stack") {
    return (
      <svg
        aria-hidden
        className={wrap}
        width={22}
        height={20}
        viewBox="0 0 22 20"
        fill="none"
      >
        <path
          d="M11 2 L18 10 L15 10 L11 6 L7 10 L4 10 Z"
          fill={GOLD}
          style={{ filter: "drop-shadow(0 0 4px rgba(255,214,90,0.7))" }}
        />
        <path
          d="M11 7 L15 12 L13 12 L11 10 L9 12 L7 12 Z"
          fill="rgba(255,214,90,0.75)"
        />
        <path
          d="M11 11 L13 14 L11 13 L9 14 Z"
          fill={LIME}
          style={{ filter: "drop-shadow(0 0 3px rgba(184,255,60,0.5))" }}
        />
      </svg>
    );
  }

  if (variant === "diamond-crown") {
    return (
      <svg
        aria-hidden
        className={wrap}
        width={28}
        height={18}
        viewBox="0 0 28 18"
        fill="none"
      >
        <path
          d="M2 14 L8 4 L14 14 L20 4 L26 14 L26 16 L2 16 Z"
          fill="rgba(255,214,90,0.15)"
          stroke={GOLD}
          strokeWidth={1.1}
          strokeLinejoin="miter"
          style={{ filter: "drop-shadow(0 0 8px rgba(255,214,90,0.55))" }}
        />
        <path
          d="M8 4 L11 10 L14 4 L17 10 L20 4"
          stroke={LIME}
          strokeWidth={0.9}
          fill="none"
          opacity={0.85}
        />
        <circle cx="14" cy="12" r="1.2" fill={CYAN} opacity={0.9} />
      </svg>
    );
  }

  // hud-wings
  return (
    <svg
      aria-hidden
      className={wrap}
      width={32}
      height={18}
      viewBox="0 0 32 18"
      fill="none"
    >
      <path
        d="M2 9 L8 3 L8 7 L12 9 L8 11 L8 15 Z"
        fill="rgba(0,245,255,0.12)"
        stroke={CYAN}
        strokeWidth={0.9}
        style={{ filter: "drop-shadow(0 0 5px rgba(0,245,255,0.45))" }}
      />
      <path
        d="M30 9 L24 3 L24 7 L20 9 L24 11 L24 15 Z"
        fill="rgba(255,214,90,0.12)"
        stroke={GOLD}
        strokeWidth={0.9}
        style={{ filter: "drop-shadow(0 0 5px rgba(255,214,90,0.45))" }}
      />
      <polygon
        points="16,4 18.2,9.5 16,8.5 13.8,9.5"
        fill={GOLD}
        style={{ filter: "drop-shadow(0 0 4px rgba(255,214,90,0.65))" }}
      />
      <rect
        x="15.2"
        y="10"
        width="1.6"
        height="4"
        fill={LIME}
        opacity={0.85}
      />
    </svg>
  );
}

/** 順位数字の上に載せるスロット（本番 TopPodium と同位置） */
export function RankFirstMarkSlot({
  variant,
}: {
  variant: RankFirstMarkVariant;
}) {
  return (
    <div className="pointer-events-none absolute -top-2.5 left-0 z-40 lg:-top-3">
      <RankFirstPlaceMark variant={variant} />
    </div>
  );
}
