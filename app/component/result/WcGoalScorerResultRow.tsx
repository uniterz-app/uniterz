"use client";

import { useMemo } from "react";
import { Check, X } from "lucide-react";
import type { PredictionPostV2 } from "@/types/prediction-post-v2";
import { normalizeLeague } from "@/lib/leagues";
import { isFinalResultPost, type PostWithMillis } from "@/lib/result/result-page-data";
import {
  isWcGoalScorerPickValidForPredictedScore,
  normalizeWcGoalScorerPick,
} from "@/lib/wc/goalScorer";
import { getWcSquadPlayer } from "@/lib/wc/squads";

export type WcGoalScorerResultInfo = {
  playerName: string;
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
      return { playerName, hit: null };
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
      className={[
        "flex items-center",
        compact ? "gap-2" : "gap-2.5 sm:gap-3",
      ].join(" ")}
    >
      <div
        className={[
          "min-w-0 shrink-0",
          compact ? "w-26" : "flex w-29 sm:w-31",
        ].join(" ")}
      >
        <span
          className={
            compact
              ? "truncate text-[11px] font-semibold leading-tight text-white"
              : "truncate text-[12px] font-semibold text-white sm:text-[13px]"
          }
        >
          {label}
        </span>
      </div>

      <div
        className={[
          "min-w-0 flex-1 truncate font-medium text-white/85",
          compact
            ? "text-[11px] leading-tight"
            : "text-[12px] sm:text-[13px]",
        ].join(" ")}
      >
        {info.playerName}
      </div>

      <div
        className={[
          "flex shrink-0 justify-end",
          compact ? "w-10" : "w-11 sm:w-12",
        ].join(" ")}
      >
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
