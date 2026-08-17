"use client";

import MyRankCard from "@/app/component/rankings/MyRankCard";
import {
  CyberRankingListRow,
  CyberRankingScore,
} from "@/app/component/rankings/CyberRankingListParts";
import { RankingsPageTitleCyber } from "@/app/component/rankings/RankingsPageTitleCyber";
import {
  ProCyberBadge,
  proBadgeStaticMotion,
} from "@/app/component/common/ProCyberBadge";
import CyberMenuButton from "@/app/component/ui/CyberMenuButton";
import { cyberMetricTag } from "@/lib/rankings/cyberRankVisual";
import { jp, nameOxanium } from "@/lib/fonts";
import {
  LP_RANKING_METRIC,
  LP_RANKING_MY_MINI_METRICS,
  LP_RANKING_MY_PROGRESS,
  LP_RANKING_MY_RANK,
  LP_RANKING_MY_ROW,
  LP_RANKING_MY_STATS,
  LP_RANKING_MY_UID,
  LP_RANKING_MY_VALUE,
  LP_RANKING_ROWS,
  LP_RANKING_TOTAL_ENTRIES,
} from "@/lib/lp/lpRankingPreviewMocks";
import type { RankingRowWithCountry } from "@/lib/rankings/rankingMetrics";

const METRIC_TAG = cyberMetricTag(LP_RANKING_METRIC, "ja");

function LpRankingRow({
  row,
  rank,
}: {
  row: RankingRowWithCountry;
  rank: number;
}) {
  const isYou = row.uid === LP_RANKING_MY_UID;
  return (
    <div
      className={
        isYou ? "shadow-[inset_0_0_0_1px_rgba(0,245,255,0.38)]" : undefined
      }
    >
      <CyberRankingListRow
        rank={rank}
        displayName={row.displayName}
        photoURL={null}
        metric={LP_RANKING_METRIC}
        metricTag={METRIC_TAG}
        posts={row.posts ?? 0}
        countryCode={row.countryCode}
        metricValueDelta={row.metricValueDelta}
        avgRow={{ avgTotalScore: row.avgTotalScore }}
        showFirstPlaceFrame={rank === 1}
        scoreLayout="stack"
        nameExtra={
          row.plan === "pro" ? (
            <ProCyberBadge
              {...proBadgeStaticMotion}
              compact
              ariaLabel="PRO"
            />
          ) : null
        }
        rankDeltaPlaces={row.rankDeltaPlaces}
        scoreSlot={
          <CyberRankingScore
            rank={rank}
            metric={LP_RANKING_METRIC}
            counted={row.totalScore ?? 0}
            scoreLayout="stack"
          />
        }
      />
    </div>
  );
}

/** LP / スクショ用。本番 MyRankCard + ランキング行。総合スコアのみ。写真なし。 */
export default function OfficialLpRankingScreen({
  notchPad = false,
  maxRows = 8,
}: {
  notchPad?: boolean;
  maxRows?: number;
}) {
  const rows = LP_RANKING_ROWS.slice(0, maxRows);

  return (
    <div
      className={[
        "relative overflow-hidden bg-[#05070c] text-white",
        notchPad ? "pt-7" : "pt-2",
      ].join(" ")}
    >
      <div className="space-y-2 px-3">
        <div className="flex items-start gap-2">
          <CyberMenuButton
            size="md"
            tabIndex={-1}
            aria-hidden
            className="pointer-events-none"
          />
          <div className="flex min-w-0 flex-1 flex-col items-center gap-0.5">
            <RankingsPageTitleCyber
              variant="horizon-chrome"
              title="Regular Season"
              size="sm"
            />
          </div>
          <div className="h-10 w-10 shrink-0" aria-hidden />
        </div>

        <MyRankCard
          rank={LP_RANKING_MY_RANK}
          metric={LP_RANKING_METRIC}
          value={LP_RANKING_MY_VALUE}
          displayName={LP_RANKING_MY_ROW.displayName}
          photoURL={null}
          totalPosts={LP_RANKING_MY_ROW.posts}
          language="ja"
          isPro
          displayTier="pro"
          mobileWide
          rankDeltaPlaces={LP_RANKING_MY_ROW.rankDeltaPlaces ?? 0}
          totalEntries={LP_RANKING_TOTAL_ENTRIES}
          streak={LP_RANKING_MY_ROW.streak ?? null}
          countryCode={LP_RANKING_MY_ROW.countryCode ?? "JP"}
          miniMetrics={LP_RANKING_MY_MINI_METRICS}
          leagueLabel="NBA"
          rankProgress={LP_RANKING_MY_PROGRESS}
          disableMotion
          animateRank={false}
          statsSource={LP_RANKING_MY_STATS}
        />

        <p
          className={[
            nameOxanium.className,
            "flex items-baseline gap-2 px-1 pt-1 text-[10px] font-bold uppercase tracking-[0.22em] text-[#00F5FF]",
          ].join(" ")}
        >
          TOTAL PTS
          <span
            className={[
              jp.className,
              "text-[11px] font-semibold tracking-normal text-white/50",
            ].join(" ")}
          >
            総合スコア
          </span>
        </p>
      </div>

      <div className="mt-1 px-2 pb-3">
        <div className="cyber-rank-list-panel">
          {rows.map((row, i) => (
            <LpRankingRow key={row.uid} row={row} rank={i + 1} />
          ))}
        </div>
      </div>
    </div>
  );
}
