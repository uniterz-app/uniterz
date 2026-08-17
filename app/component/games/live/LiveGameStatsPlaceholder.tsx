"use client";

import { nameOxanium } from "@/lib/fonts";
import type { Language } from "@/lib/i18n/language";

type Props = {
  language?: Language;
  loading?: boolean;
  className?: string;
};

/** ライブスタッツ未登録・読込中の枠 */
export default function LiveGameStatsPlaceholder({
  language = "ja",
  loading = false,
  className = "",
}: Props) {
  const isJa = language === "ja";
  return (
    <div
      className={[
        "border px-4 py-8 text-center",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        borderColor: "rgba(255,255,255,0.22)",
        backgroundColor: "transparent",
      }}
    >
      <p
        className={[
          nameOxanium.className,
          "text-[11px] font-bold uppercase tracking-[0.14em] text-white/45",
        ].join(" ")}
      >
        {loading
          ? isJa
            ? "スタッツを読み込み中…"
            : "Loading stats…"
          : isJa
            ? "試合スタッツはまだありません"
            : "Game stats not available yet"}
      </p>
    </div>
  );
}
