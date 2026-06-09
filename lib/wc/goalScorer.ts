/**
 * WC ゴール得点者予想・試合結果の得点者リスト。
 * オウンゴールは ownGoal: true で管理し、ボーナス判定から除外する。
 */

import { getWcSquad } from "@/lib/wc/squads";
import {
  findSquadPlayer,
  findSquadPlayerByName,
} from "@/lib/wc/squadTypes";

export type WcGoalScorerPick = {
  playerId: string;
  teamId: string;
};

export type WcGameGoalScorer = WcGoalScorerPick & {
  minute?: number | null;
  ownGoal?: boolean;
};

export const WC_GOAL_SCORER_BONUS_POINTS = 2;

export function normalizeWcGoalScorerPick(
  raw: unknown
): WcGoalScorerPick | null {
  if (!raw || typeof raw !== "object") return null;
  const playerId = String((raw as WcGoalScorerPick).playerId ?? "").trim();
  const teamId = String((raw as WcGoalScorerPick).teamId ?? "").trim();
  if (!playerId || !teamId) return null;
  return { playerId, teamId };
}

function parseWcGoalScorerMinute(raw: unknown): number | null {
  if (raw == null || raw === "") return null;
  return Number.isFinite(Number(raw)) ? Number(raw) : null;
}

export type WcGoalScorerResolveContext = {
  homeTeamId: string | null | undefined;
  awayTeamId: string | null | undefined;
};

/**
 * goalScorers を正規化する。
 * - 従来: { playerId, teamId, minute?, ownGoal? }
 * - 簡易: { name, minute?, side?: "home"|"away", teamId?, ownGoal? }
 */
export function resolveWcGameGoalScorers(
  raw: unknown,
  ctx: WcGoalScorerResolveContext
): { ok: true; scorers: WcGameGoalScorer[] } | { ok: false; error: string } {
  if (!Array.isArray(raw)) return { ok: true, scorers: [] };

  const out: WcGameGoalScorer[] = [];
  for (let i = 0; i < raw.length; i++) {
    const item = raw[i];
    if (!item || typeof item !== "object") continue;

    const minute = parseWcGoalScorerMinute((item as WcGameGoalScorer).minute);
    const ownGoal = Boolean((item as WcGameGoalScorer).ownGoal);

    const pick = normalizeWcGoalScorerPick(item);
    if (pick) {
      out.push({ ...pick, minute, ownGoal });
      continue;
    }

    const name = String(
      (item as { name?: string; playerName?: string }).name ??
        (item as { playerName?: string }).playerName ??
        ""
    ).trim();
    if (!name) continue;

    const sideRaw = String(
      (item as { side?: string; team?: string }).side ??
        (item as { team?: string }).team ??
        ""
    )
      .trim()
      .toLowerCase();

    let teamId = String((item as WcGoalScorerPick).teamId ?? "").trim();
    if (!teamId) {
      if (sideRaw === "home" || sideRaw === "h") {
        teamId = String(ctx.homeTeamId ?? "").trim();
      } else if (sideRaw === "away" || sideRaw === "a") {
        teamId = String(ctx.awayTeamId ?? "").trim();
      }
    }

    let player:
      | ReturnType<typeof findSquadPlayerByName>
      | undefined;

    if (teamId) {
      const squad = getWcSquad(teamId);
      player = squad ? findSquadPlayerByName(squad, name) : undefined;
      if (!player) {
        return {
          ok: false,
          error: `得点者${i + 1}: 「${name}」がチームの名簿に見つかりません`,
        };
      }
    } else {
      const homeSquad = ctx.homeTeamId ? getWcSquad(ctx.homeTeamId) : null;
      const awaySquad = ctx.awayTeamId ? getWcSquad(ctx.awayTeamId) : null;
      const homeHit = homeSquad
        ? findSquadPlayerByName(homeSquad, name)
        : undefined;
      const awayHit = awaySquad
        ? findSquadPlayerByName(awaySquad, name)
        : undefined;
      if (homeHit && awayHit) {
        return {
          ok: false,
          error: `得点者${i + 1}: 「${name}」が両チームに該当します。side: "home" か "away" を指定してください`,
        };
      }
      player = homeHit ?? awayHit;
      teamId = homeHit
        ? String(ctx.homeTeamId)
        : awayHit
          ? String(ctx.awayTeamId)
          : "";
      if (!player || !teamId) {
        return {
          ok: false,
          error: `得点者${i + 1}: 「${name}」が名簿に見つかりません`,
        };
      }
    }

    out.push({
      playerId: player.id,
      teamId,
      minute,
      ownGoal,
    });
  }

  return { ok: true, scorers: out };
}

export function normalizeWcGameGoalScorers(
  raw: unknown,
  ctx?: WcGoalScorerResolveContext
): WcGameGoalScorer[] {
  if (ctx) {
    const resolved = resolveWcGameGoalScorers(raw, ctx);
    return resolved.ok ? resolved.scorers : [];
  }
  if (!Array.isArray(raw)) return [];
  const out: WcGameGoalScorer[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const pick = normalizeWcGoalScorerPick(item);
    if (!pick) continue;
    out.push({
      ...pick,
      minute: parseWcGoalScorerMinute((item as WcGameGoalScorer).minute),
      ownGoal: Boolean((item as WcGameGoalScorer).ownGoal),
    });
  }
  return out;
}

/** 得点者予想が実際の得点者（オウンゴール除く）に含まれるか */
export function wcGoalScorerPredictionHit(
  pick: WcGoalScorerPick | null | undefined,
  goalScorers: WcGameGoalScorer[] | null | undefined
): boolean {
  if (!pick?.playerId || !pick?.teamId) return false;
  const list = goalScorers ?? [];
  return list.some(
    (g) =>
      !g.ownGoal &&
      g.playerId === pick.playerId &&
      g.teamId === pick.teamId
  );
}

/** 予想スコア上で得点があるチーム ID（0-0 なら空） */
export function wcGoalScorerEligibleTeamIds(
  predictedScore: { home: number; away: number },
  homeTeamId: string | null | undefined,
  awayTeamId: string | null | undefined
): string[] {
  const ids: string[] = [];
  if (
    Number.isInteger(predictedScore.home) &&
    predictedScore.home > 0 &&
    homeTeamId
  ) {
    ids.push(homeTeamId);
  }
  if (
    Number.isInteger(predictedScore.away) &&
    predictedScore.away > 0 &&
    awayTeamId
  ) {
    ids.push(awayTeamId);
  }
  return ids;
}

export function isWcGoalScorerPickValidForPredictedScore(
  pick: WcGoalScorerPick | null | undefined,
  predictedScore: { home: number; away: number } | null | undefined,
  homeTeamId: string | null | undefined,
  awayTeamId: string | null | undefined
): boolean {
  if (!pick) return true;
  if (!predictedScore) return false;
  return wcGoalScorerEligibleTeamIds(
    predictedScore,
    homeTeamId,
    awayTeamId
  ).includes(pick.teamId);
}

/** 予想の得点者が試合の両チーム名簿に存在するか検証 */
export function validateWcGoalScorerPickForGame(
  pick: WcGoalScorerPick | null | undefined,
  homeTeamId: string | null | undefined,
  awayTeamId: string | null | undefined,
  predictedScore?: { home: number; away: number } | null
): { ok: true } | { ok: false; error: string } {
  if (!pick) return { ok: true };
  const allowed = [homeTeamId, awayTeamId].filter(Boolean) as string[];
  if (!allowed.includes(pick.teamId)) {
    return { ok: false, error: "goalScorer.teamId must be home or away" };
  }
  const squad = getWcSquad(pick.teamId);
  if (!squad?.length) {
    return { ok: false, error: "goalScorer squad not found" };
  }
  if (!findSquadPlayer(squad, pick.playerId)) {
    return { ok: false, error: "goalScorer.playerId invalid" };
  }
  if (predictedScore) {
    const eligible = wcGoalScorerEligibleTeamIds(
      predictedScore,
      homeTeamId,
      awayTeamId
    );
    if (eligible.length === 0) {
      return { ok: false, error: "goalScorer not allowed for 0-0 prediction" };
    }
    if (!eligible.includes(pick.teamId)) {
      return {
        ok: false,
        error: "goalScorer team must have predicted goals",
      };
    }
  }
  return { ok: true };
}

export function calcWcGoalScorerBonus(
  league: string | null | undefined,
  prediction: { goalScorer?: unknown } | null | undefined,
  goalScorers: WcGameGoalScorer[] | null | undefined
): number {
  if (String(league ?? "").toLowerCase() !== "wc") return 0;
  const pick = normalizeWcGoalScorerPick(prediction?.goalScorer);
  if (!pick) return 0;
  return wcGoalScorerPredictionHit(pick, goalScorers)
    ? WC_GOAL_SCORER_BONUS_POINTS
    : 0;
}
