"use client";

/**
 * TODAY UNITERZ / リザルト得点上位の行（順位・アバター・名前・国旗・PTS）
 * Native `DailyScoreRankRowNative` 相当
 */
import type { ReactNode } from "react";
import { RankingsAvatarCircle } from "@/app/component/rankings/RankingsAvatarCircle";
import RankingListProSkinFx from "@/app/component/rankings/RankingListProSkinFx";
import { RankingNameBadges } from "@/app/component/common/RankingNameBadges";
import { proBadgeStaticMotion } from "@/app/component/common/ProCyberBadge";
import { rankingRowProSkinVariant } from "@/lib/rankings/rankingRowProSkinVariant";
import { nameBebas, nameOxanium } from "@/lib/fonts";
import { FLAG_SRC, getCountryCode } from "@/lib/rankings/country";

const SKEW = "skewX(-6deg)";

function rankColor(rank: number): string {
  if (rank === 1) return "#FCD34D";
  if (rank <= 3) return "#00F5FF";
  return "rgba(255,255,255,0.45)";
}

type Props = {
  rank: number;
  name: string;
  photoURL?: string | null;
  isPro: boolean;
  proLabel: string;
  /** users.planProBgVariant。未確定（undefined）の Pro はスキンを出さない */
  planProBgVariant?: string | null;
  countryCode?: string | null;
  /** 国旗の右（予想数・的中など） */
  sub?: ReactNode;
  value: string;
  valueUnit: string;
  imageLoading?: "eager" | "lazy";
  /** 不透明の背景（ぼかし backdrop 上のリザルト詳細など） */
  solid?: boolean;
  /** 名前を一段小さく（リザルト得点上位） */
  smallName?: boolean;
};

export const dailyScoreRankRowSkew = SKEW;

export default function DailyScoreRankRow({
  rank,
  name,
  photoURL,
  isPro,
  proLabel,
  planProBgVariant,
  countryCode,
  sub,
  value,
  valueUnit,
  imageLoading = "lazy",
  solid = false,
  smallName = false,
}: Props) {
  const code = getCountryCode({ countryCode: countryCode ?? undefined });
  const flagSrc = code ? FLAG_SRC[code] : undefined;
  const proSkinVariant =
    typeof planProBgVariant === "string"
      ? rankingRowProSkinVariant(isPro ? "pro" : "free", planProBgVariant)
      : null;
  return (
    <span
      className={`relative flex min-h-[60px] w-full items-center overflow-hidden rounded border text-left ${solid ? "bg-black" : proSkinVariant ? "" : "bg-white/[0.03]"} ${rank === 1 ? "border-amber-300/35" : "border-white/[0.08]"}`}
    >
      {proSkinVariant ? (
        <RankingListProSkinFx variant={proSkinVariant} intensity="medium" />
      ) : null}
      <span className="relative z-10 flex min-w-0 flex-1 items-center gap-3 px-3.5 py-2">
        <span
          className={`${nameBebas.className} w-[26px] text-center text-[28px] leading-none`}
          style={{ color: rankColor(rank), transform: SKEW }}
        >
          {rank}
        </span>
        <RankingsAvatarCircle
          photoURL={photoURL ?? undefined}
          displayName={name}
          boxClassName="h-9 w-9 shrink-0"
          shape="square"
          imageLoading={imageLoading}
        />
        <span className="flex min-w-0 flex-1 flex-col gap-[5px]">
          <span className="flex min-w-0 items-center gap-1.5">
            <span
              className={`${nameOxanium.className} block min-w-0 truncate ${smallName ? "text-[13px]" : "text-[15px]"} font-semibold uppercase tracking-[0.03em] text-white/95`}
              style={{ transform: SKEW }}
            >
              {name}
            </span>
            <RankingNameBadges
              {...proBadgeStaticMotion}
              compact
              isPro={isPro}
              proLabel={proLabel}
            />
          </span>
          {flagSrc || sub ? (
            <span
              className={`${nameOxanium.className} flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.1em] text-white/50`}
            >
              {flagSrc ? (
                <img
                  src={flagSrc}
                  alt=""
                  width={21}
                  height={14}
                  className="h-[14px] w-[21px] shrink-0 rounded-[1px] object-cover opacity-80"
                  loading="lazy"
                  decoding="async"
                />
              ) : null}
              {sub}
            </span>
          ) : null}
        </span>
        <span className="min-w-[52px] text-right">
          <span
            className={`${nameOxanium.className} block text-[26px] font-extrabold leading-none tabular-nums ${rank === 1 ? "text-[#00F5FF]" : "text-white"}`}
            style={{ transform: SKEW }}
          >
            {value}
          </span>
          <span
            className={`${nameOxanium.className} block text-[9px] font-bold tracking-[0.14em] text-white/40`}
            style={{ transform: SKEW }}
          >
            {valueUnit}
          </span>
        </span>
      </span>
    </span>
  );
}
