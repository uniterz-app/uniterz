"use client";

import clsx from "clsx";
import type { CSSProperties } from "react";
import {
  teamIdToCountryName,
  teamIdToWcCountry,
} from "@/lib/wc/wcCountry";

type Props = {
  /** "wc-jpn" 形式の teamId（iso2 未指定時） */
  teamId?: string | null | undefined;
  /** リーグ国など teamId 以外の旗（例: "de" / "gb-eng"） */
  iso2?: string | null | undefined;
  /** 試合カード用の枠サイズ等を渡す（横長矩形なら例: w-[4.5rem] h-[3rem]） */
  className?: string;
  /** 円形にしたいとき true（既定: false。横長フラッグはソフトな角丸） */
  rounded?: boolean;
  /** alt 用国名（未指定なら teamId / iso2 から自動） */
  alt?: string;
  /** true のとき装飾用（alt 空・aria-hidden） */
  decorative?: boolean;
  /**
   * inline: キープレイヤー横などの小旗（4:3 矩形・角丸最小・影なし）
   * default: 試合カード等の通常サイズ
   */
  variant?: "default" | "inline";
};

/**
 * World Cup の試合カードでユニフォームの代わりに国旗を出す。
 *
 * 実装メモ:
 *   - flag-icons の `.fi` クラスは国別に微妙な padding/aspect 指定が入っており、
 *     Tailwind での固定サイズと衝突して国によって表示サイズがバラつく。
 *   - そのため flag-icons の CSS には依存せず、`public/flags/4x3/<iso2>.svg` を
 *     `<img>` でレンダーし、`object-fit: cover` で枠にぴったり合わせる方式に統一。
 *   - これで JP / BR / その他全ての国が「外側枠 = 表示サイズ」になる。
 */
export default function CountryFlag({
  teamId,
  iso2: iso2Prop,
  className,
  rounded = false,
  alt,
  decorative = false,
  variant = "default",
}: Props) {
  const country = teamId ? teamIdToWcCountry(teamId) : null;
  const iso2 =
    iso2Prop?.toLowerCase() ?? country?.iso2.toLowerCase() ?? null;
  const countryName = decorative
    ? ""
    : alt ??
      (iso2Prop
        ? iso2 ?? "Country flag"
        : teamIdToCountryName(teamId, "en") ?? "Country flag");

  const outerStyle: CSSProperties =
    variant === "inline"
      ? {}
      : {
          boxShadow:
            "0 0 10px rgba(255,255,255,0.14), 0 1px 4px rgba(0,0,0,0.42)",
        };

  const shapeClass = rounded
    ? "rounded-full"
    : variant === "inline"
      ? "rounded-[1px]"
      : "rounded-md";

  if (!iso2) {
    return (
      <span
        aria-hidden
        className={clsx(
          "inline-block bg-white/5",
          shapeClass,
          className,
        )}
        style={outerStyle}
      />
    );
  }

  const imgFitStyle: CSSProperties =
    variant === "inline"
      ? { objectFit: "fill", objectPosition: "center" }
      : { objectFit: "cover", objectPosition: "center" };

  return (
    <span
      className={clsx(
        "inline-block overflow-hidden",
        variant === "inline"
          ? "h-[1.125rem] w-[1.5rem] shrink-0 ring-1 ring-inset ring-white/20"
          : "ring-1 ring-white/15",
        shapeClass,
        className,
      )}
      style={outerStyle}
      aria-hidden={decorative ? true : undefined}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/flags/4x3/${iso2}.svg`}
        alt={decorative ? "" : countryName}
        draggable={false}
        loading="lazy"
        decoding="async"
        className="block h-full w-full select-none"
        style={imgFitStyle}
      />
    </span>
  );
}
