"use client";

import MyRankRankingProgress from "@/app/component/rankings/MyRankRankingProgress";
import RankShadowWeeklyShift from "@/app/component/rankings/gap/RankShadowWeeklyShift";
import { CyberRankNumber, CyberScanlineText } from "@/app/component/rankings/CyberRankingListParts";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";
import { nameBebas, nameOxanium } from "@/lib/fonts";
import { cyberRankNumStyle } from "@/lib/rankings/cyberRankVisual";
import {
  SHADOW_RANK_PROGRESS_DAYS,
  type RankShadowAnalysis,
} from "@/lib/rankings/rankShadowAnalysis";
import {
  RANK_GAP_CHAMFER_CLIP,
  RANK_GAP_CYBER,
} from "@/lib/rankings/rankGapDonut";

type Props = {
  analysis: RankShadowAnalysis;
  language?: Language;
};

function ShadowPriorBandRange({
  low,
  high,
  priorRank,
  language,
}: {
  low: number;
  high: number;
  priorRank: number;
  language: Language;
}) {
  const numStyle = cyberRankNumStyle(priorRank, true);
  const isJa = language === "ja";

  return (
    <div className="mt-1 flex justify-center origin-center scale-[0.82] sm:scale-[0.9]">
      <CyberScanlineText>
        <span
          className={[nameBebas.className, "inline-flex items-baseline gap-0.5"].join(
            " "
          )}
        >
          {!isJa ? (
            <span
              className={[
                nameOxanium.className,
                "mr-0.5 text-[8px] font-bold uppercase tracking-wider",
              ].join(" ")}
              style={{
                color: "rgba(255,255,255,0.45)",
                transform: "skewX(-12deg)",
                display: "inline-block",
              }}
            >
              Ranks
            </span>
          ) : null}
          <span
            className="tabular-nums leading-none"
            style={{ ...numStyle, fontSize: "1.95rem" }}
          >
            {low}
          </span>
          <span
            className="leading-none"
            style={{
              ...numStyle,
              fontSize: "1.4rem",
              color: "rgba(255,255,255,0.55)",
              WebkitTextStroke: "0.8px rgba(255,43,214,0.45)",
              filter: "none",
            }}
          >
            {isJa ? "〜" : "–"}
          </span>
          <span
            className="tabular-nums leading-none"
            style={{ ...numStyle, fontSize: "1.95rem" }}
          >
            {high}
          </span>
          {isJa ? (
            <span
              className={[nameOxanium.className, "ml-0.5 text-[13px] font-bold"].join(
                " "
              )}
              style={{
                color: "rgba(255,255,255,0.72)",
                transform: "skewX(-12deg)",
                display: "inline-block",
              }}
            >
              位
            </span>
          ) : null}
        </span>
      </CyberScanlineText>
    </div>
  );
}

export default function RankShadowBandHeader({
  analysis,
  language = "ja",
}: Props) {
  const s = t(language).rankings.rankShadow;

  return (
    <div
      className="relative border px-4 py-4 sm:px-5 sm:py-5"
      style={{
        clipPath: RANK_GAP_CHAMFER_CLIP,
        WebkitClipPath: RANK_GAP_CHAMFER_CLIP,
        borderColor: RANK_GAP_CYBER.neonBorderStrong,
        backgroundColor: RANK_GAP_CYBER.cardBg,
      }}
    >
      <p
        className={[
          nameOxanium.className,
          "text-[10px] font-bold uppercase tracking-[0.2em]",
        ].join(" ")}
        style={{ color: RANK_GAP_CYBER.cyan }}
      >
        {s.headerEyebrow}
      </p>

      <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
        <div
          className="border px-2 py-2.5 text-center sm:px-3"
          style={{
            borderColor: RANK_GAP_CYBER.neonBorder,
            backgroundColor: RANK_GAP_CYBER.cardBgElevated,
          }}
        >
          <p
            className={[
              nameOxanium.className,
              "text-[8px] font-bold uppercase tracking-[0.14em] sm:text-[9px]",
            ].join(" ")}
            style={{ color: RANK_GAP_CYBER.labelMuted }}
          >
            {s.priorRankLabel}
          </p>
          <div className="mt-1 flex justify-center origin-center scale-[0.72] sm:scale-[0.8]">
            <CyberRankNumber
              rank={analysis.priorRank}
              compact={false}
              displayValue={`#${analysis.priorRank}`}
            />
          </div>
        </div>

        <div
          className="border px-2 py-2.5 text-center sm:px-3"
          style={{
            borderColor: RANK_GAP_CYBER.neonBorder,
            backgroundColor: RANK_GAP_CYBER.cardBgElevated,
          }}
        >
          <p
            className={[
              nameOxanium.className,
              "text-[8px] font-bold uppercase tracking-[0.14em] sm:text-[9px]",
            ].join(" ")}
            style={{ color: RANK_GAP_CYBER.labelMuted }}
          >
            {s.priorBandLabel}
          </p>
          <ShadowPriorBandRange
            low={analysis.priorBandLow}
            high={analysis.priorBandHigh}
            priorRank={analysis.priorRank}
            language={language}
          />
        </div>

        <div
          className="border px-2 py-2.5 text-center sm:px-3"
          style={{
            borderColor: RANK_GAP_CYBER.neonBorder,
            backgroundColor: RANK_GAP_CYBER.cardBgElevated,
          }}
        >
          <p
            className={[
              nameOxanium.className,
              "text-[8px] font-bold uppercase tracking-[0.14em] sm:text-[9px]",
            ].join(" ")}
            style={{ color: RANK_GAP_CYBER.labelMuted }}
          >
            {s.cohortCountLabel}
          </p>
          <div className="mt-1 flex items-baseline justify-center gap-1">
            <div className="origin-center scale-[0.72] sm:scale-[0.8]">
              <CyberRankNumber
                rank={analysis.cohortSize}
                compact={false}
                displayValue={String(analysis.cohortSize)}
              />
            </div>
            <span
              className={[
                nameOxanium.className,
                "pb-0.5 text-[11px] font-bold lowercase tracking-wide",
              ].join(" ")}
              style={{ color: RANK_GAP_CYBER.feedMuted }}
            >
              {s.cohortUnit}
            </span>
          </div>
        </div>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-white/52">{s.cohortExplain}</p>

      <RankShadowWeeklyShift
        currentRank={analysis.currentRank}
        priorRank={analysis.priorRank}
        language={language}
      />

      <div
        className="mt-4 border-t pt-3"
        style={{ borderColor: RANK_GAP_CYBER.divider }}
      >
        <MyRankRankingProgress
          points={analysis.rankProgressPoints}
          maxSnapshots={SHADOW_RANK_PROGRESS_DAYS}
          language={language}
          embedded
          title={s.progressTitle}
        />
      </div>
    </div>
  );
}
