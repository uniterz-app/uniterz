"use client";

import clsx from "clsx";
import type { CSSProperties } from "react";
import {
  teamIdToCountryName,
  teamIdToWcCountry,
} from "@/lib/wc/wcCountry";

type Props = {
  /** "wc-jpn" 形式の teamId */
  teamId: string | null | undefined;
  /** 試合カード用の枠サイズ等を渡す（横長矩形なら例: w-[4.5rem] h-[3rem]） */
  className?: string;
  /** 円形にしたいとき true（既定: false。横長フラッグはソフトな角丸） */
  rounded?: boolean;
  /** alt 用国名（未指定なら teamIdToCountryName から自動） */
  alt?: string;
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
  className,
  rounded = false,
  alt,
}: Props) {
  const country = teamIdToWcCountry(teamId);
  const iso2 = country?.iso2.toLowerCase() ?? null;
  const countryName =
    alt ?? teamIdToCountryName(teamId, "en") ?? "Country flag";

  const outerStyle: CSSProperties = {
    boxShadow:
      "0 0 10px rgba(255,255,255,0.14), 0 1px 4px rgba(0,0,0,0.42)",
  };

  const shapeClass = rounded ? "rounded-full" : "rounded-md";

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

  return (
    <span
      className={clsx(
        "inline-block overflow-hidden ring-1 ring-white/15",
        shapeClass,
        className,
      )}
      style={outerStyle}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/flags/4x3/${iso2}.svg`}
        alt={countryName}
        draggable={false}
        loading="lazy"
        decoding="async"
        className="block h-full w-full select-none"
        style={{ objectFit: "cover", objectPosition: "center" }}
      />
    </span>
  );
}
