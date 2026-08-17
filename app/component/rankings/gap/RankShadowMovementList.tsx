"use client";

import RankShadowSparkline from "@/app/component/rankings/gap/RankShadowSparkline";
import { RankingsAvatarCircle } from "@/app/component/rankings/RankingsAvatarCircle";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";
import { nameBebas, nameOxanium } from "@/lib/fonts";
import type { RankShadowRivalEntry } from "@/lib/rankings/rankShadowRivalRoster";
import { RANK_GAP_CYBER } from "@/lib/rankings/rankGapDonut";

type Props = {
  rivals: RankShadowRivalEntry[];
  language?: Language;
  layout?: "mobile" | "web";
};

function trendTheme(rankDelta: number) {
  if (rankDelta > 0) {
    return { color: "#8ef0b8", label: "▲" };
  }
  if (rankDelta < 0) {
    return { color: RANK_GAP_CYBER.magenta, label: "▼" };
  }
  return { color: "rgba(255,255,255,0.45)", label: "—" };
}

function rowSurface(rival: RankShadowRivalEntry) {
  if (rival.rankDelta > 0) {
    return {
      borderColor: rival.isSelf
        ? "rgba(57,255,136,0.58)"
        : "rgba(57,255,136,0.34)",
      backgroundColor: rival.isSelf
        ? "rgba(16, 40, 28, 0.95)"
        : "rgba(12, 30, 20, 0.9)",
      indexColor: "#8ef0b8",
      nameColor: rival.isSelf ? "#f0fff5" : "rgba(220,255,235,0.92)",
      rankLineColor: "rgba(120,255,180,0.48)",
      avatarRingClass: "ring-2 ring-emerald-400/40",
    };
  }

  if (rival.rankDelta < 0) {
    return {
      borderColor: rival.isSelf
        ? RANK_GAP_CYBER.neonBorderStrong
        : "rgba(255,0,255,0.28)",
      backgroundColor: rival.isSelf
        ? "rgba(255,0,255,0.06)"
        : "rgba(24,8,24,0.72)",
      indexColor: rival.isSelf ? RANK_GAP_CYBER.magenta : "rgba(255,255,255,0.38)",
      nameColor: rival.isSelf ? "#fff" : "rgba(255,255,255,0.88)",
      rankLineColor: "rgba(255,0,255,0.38)",
      avatarRingClass: "ring-2 ring-fuchsia-500/30",
    };
  }

  return {
    borderColor: rival.isSelf
      ? RANK_GAP_CYBER.neonBorderStrong
      : RANK_GAP_CYBER.neonBorder,
    backgroundColor: rival.isSelf
      ? "rgba(255,0,255,0.06)"
      : RANK_GAP_CYBER.cardBgElevated,
    indexColor: rival.isSelf ? RANK_GAP_CYBER.magenta : "rgba(255,255,255,0.38)",
    nameColor: rival.isSelf ? "#fff" : "rgba(255,255,255,0.88)",
    rankLineColor: "rgba(0,245,255,0.45)",
    avatarRingClass: "ring-2 ring-cyan-500/25",
  };
}

function RankShadowMovementRow({
  rival,
  listIndex,
  trendLabel,
}: {
  rival: RankShadowRivalEntry;
  listIndex: number;
  trendLabel: string;
}) {
  const trend = trendTheme(rival.rankDelta);
  const surface = rowSurface(rival);
  const magnitude = Math.abs(rival.rankDelta);

  return (
    <div
      className="flex min-w-0 items-center gap-2 border px-2 py-2 sm:gap-2.5 sm:px-2.5"
      style={{
        borderColor: surface.borderColor,
        backgroundColor: surface.backgroundColor,
      }}
    >
      <span
        className={[nameBebas.className, "w-6 shrink-0 text-center text-lg leading-none"].join(
          " "
        )}
        style={{ color: surface.indexColor }}
      >
        {String(listIndex + 1).padStart(2, "0")}
      </span>

      <RankingsAvatarCircle
        photoURL={rival.photoURL}
        displayName={rival.displayName}
        boxClassName={["h-8 w-8 shrink-0", surface.avatarRingClass].join(" ")}
        shape="square"
        imageLoading="lazy"
      />

      <div className="min-w-0 flex-1">
        <p
          className={[
            nameOxanium.className,
            "truncate text-[11px] font-bold uppercase tracking-wide",
          ].join(" ")}
          style={{ color: surface.nameColor }}
        >
          {rival.displayName}
        </p>
        <p
          className={[
            nameOxanium.className,
            "mt-0.5 truncate text-[8px] font-semibold tabular-nums tracking-wider",
          ].join(" ")}
          style={{ color: surface.rankLineColor }}
        >
          #{rival.priorRank} → #{rival.currentRank}
        </p>
      </div>

      <RankShadowSparkline
        points={rival.progressPoints}
        rankDelta={rival.rankDelta}
        width={layoutSparkWidth}
        height={26}
      />

      <div className="flex w-10 shrink-0 flex-col items-end">
        <span
          className={[nameBebas.className, "text-sm leading-none tabular-nums"].join(" ")}
          style={{ color: trend.color }}
        >
          {trend.label} {magnitude}
        </span>
        <span
          className={[nameOxanium.className, "mt-0.5 text-[7px] font-bold tracking-wider"].join(
            " "
          )}
          style={{ color: "rgba(255,255,255,0.28)" }}
        >
          {trendLabel}
        </span>
      </div>
    </div>
  );
}

const layoutSparkWidth = 72;

export default function RankShadowMovementList({
  rivals,
  language = "ja",
}: Props) {
  const s = t(language).rankings.rankShadow;

  if (rivals.length === 0) return null;

  const gridClass = "grid grid-cols-2 gap-px";

  return (
    <div className="space-y-2">
      <div className="space-y-1 px-0.5">
        <h3
          className={[
            nameOxanium.className,
            "text-sm font-bold uppercase tracking-[0.14em]",
          ].join(" ")}
          style={{ color: RANK_GAP_CYBER.cyan }}
        >
          {s.movementRosterTitle}
        </h3>
        <p
          className={[
            nameOxanium.className,
            "text-xs leading-relaxed",
          ].join(" ")}
          style={{ color: "rgba(255,255,255,0.48)" }}
        >
          {s.movementRosterSubtitle}
        </p>
      </div>
      <div
        className={gridClass}
        style={{ backgroundColor: RANK_GAP_CYBER.divider }}
      >
        {rivals.map((rival, i) => (
          <RankShadowMovementRow
            key={rival.uid}
            rival={rival}
            listIndex={i}
            trendLabel={s.trendLabel}
          />
        ))}
      </div>
    </div>
  );
}
