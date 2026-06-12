"use client";

import { useMemo } from "react";
import { Check, X } from "lucide-react";
import CountryFlag from "@/app/component/games/CountryFlag";
import type { PredictionPostV2 } from "@/types/prediction-post-v2";
import { normalizeLeague } from "@/lib/leagues";
import { isFinalResultPost, type PostWithMillis } from "@/lib/result/result-page-data";
import {
  isWcGoalScorerPickValidForPredictedScore,
  normalizeWcGoalScorerPick,
} from "@/lib/wc/goalScorer";
import { getWcSquadPlayer } from "@/lib/wc/squads";
import {
  RESULT_STAT_ROW_GRID_COMPACT,
  RESULT_STAT_ROW_GRID_DEFAULT,
} from "@/lib/result/resultStatRowGrid";

export type WcGoalScorerResultInfo = {
  playerName: string;
  teamId: string;
  /** 試合確定前は null（一覧では選手名のみ表示） */
  hit: boolean | null;
};

export function useWcGoalScorerResult(
  post: PredictionPostV2
): WcGoalScorerResultInfo | null {
  return useMemo(() => {
    if (normalizeLeague(post.league) !== "wc") return null;

    const pick = normalizeWcGoalScorerPick(post.prediction?.goalScorer);
    if (!pick) return null;

    const score = post.prediction?.score;
    if (
      !score ||
      !isWcGoalScorerPickValidForPredictedScore(
        pick,
        score,
        post.home?.teamId,
        post.away?.teamId
      )
    ) {
      return null;
    }

    const playerName =
      getWcSquadPlayer(pick.teamId, pick.playerId)?.name ?? pick.playerId;

    const isFinal =
      isFinalResultPost(post as PostWithMillis) ||
      post.status === "final" ||
      post.game?.status === "final";

    if (!isFinal) {
      return { playerName, teamId: pick.teamId, hit: null };
    }

    const stats = post.stats as
      | {
          goalScorerBonus?: number;
          pointsV3Detail?: { goalScorerBonus?: number };
        }
      | null
      | undefined;
    const bonus = Number(
      stats?.goalScorerBonus ?? stats?.pointsV3Detail?.goalScorerBonus ?? 0
    );

    return {
      playerName,
      teamId: pick.teamId,
      hit: Number.isFinite(bonus) && bonus > 1e-6,
    };
  }, [post]);
}

type RowProps = {
  label: string;
  info: WcGoalScorerResultInfo;
  compact?: boolean;
};

export default function WcGoalScorerResultRow({
  label,
  info,
  compact = false,
}: RowProps) {
  return (
    <div
      className={
        compact ? RESULT_STAT_ROW_GRID_COMPACT : RESULT_STAT_ROW_GRID_DEFAULT
      }
    >
      <div className="min-w-0">
        <span
          className={
            compact
              ? "block truncate whitespace-nowrap text-[10px] font-semibold leading-none text-white"
              : "truncate text-[12px] font-semibold text-white sm:text-[13px]"
          }
        >
          {label}
        </span>
      </div>

      <div
        className={[
          "flex min-w-0 items-center gap-1 font-medium text-white/85",
          compact
            ? "text-[10px] leading-none"
            : "text-[12px] sm:text-[13px]",
        ].join(" ")}
      >
        <CountryFlag
          teamId={info.teamId}
          variant="inline"
          decorative
          className={[
            "aspect-[4/3] shrink-0",
            compact ? "h-3 w-[1.05rem]" : "h-3.5 w-[1.2rem]",
          ].join(" ")}
        />
        <span className="min-w-0 truncate">{info.playerName}</span>
      </div>

      <div className="flex min-w-0 justify-end">
        {info.hit === true ? (
          <Check
            className={[
              "text-emerald-400",
              compact ? "h-[18px] w-[18px]" : "h-5 w-5",
            ].join(" ")}
            strokeWidth={2.5}
            aria-label="correct"
          />
        ) : info.hit === false ? (
          <X
            className={[
              "text-rose-400",
              compact ? "h-[18px] w-[18px]" : "h-5 w-5",
            ].join(" ")}
            strokeWidth={2.5}
            aria-label="incorrect"
          />
        ) : null}
      </div>
    </div>
  );
}
