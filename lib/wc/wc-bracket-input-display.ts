import type { WcBracketPredictMatchId } from "@/lib/wc/wc-knockout-bracket";
import { listWcR32MatchesForDisplay } from "@/lib/wc/wc-knockout-bracket";
import type { WcBracketState } from "@/lib/wc/wc-knockout-bracket";
import type { WcBracketInputPhase } from "@/lib/wc/wc-bracket-input-phases";
import { WC_BRACKET_INPUT_PHASES } from "@/lib/wc/wc-bracket-input-phases";
import {
  type WcKnockoutAdvancement,
  type WcResolveParticipantsOptions,
  resolveWcMatchParticipants,
} from "@/lib/wc/wc-knockout-bracket-utils";

export type WcInputCardView = {
  matchId: WcBracketPredictMatchId;
  role: "home" | "away";
  teamId: string | null;
  label: string;
  isPickedWinner: boolean;
  pickable: boolean;
};

export type WcInputMatchView = {
  matchId: WcBracketPredictMatchId;
  home: { teamId: string | null; label: string };
  away: { teamId: string | null; label: string };
  pickedWinner: string | null;
  ready: boolean;
};

export function buildWcInputMatchView(
  matchId: WcBracketPredictMatchId,
  bracket: WcBracketState,
  advancement: WcKnockoutAdvancement,
  participantOptions?: WcResolveParticipantsOptions
): WcInputMatchView | null {
  const cards = buildWcInputMatchCardViews(
    matchId,
    bracket,
    advancement,
    participantOptions
  );
  if (cards.length < 2) return null;
  const home = cards.find((c) => c.role === "home");
  const away = cards.find((c) => c.role === "away");
  if (!home || !away) return null;
  const picked = bracket[matchId]?.winner?.trim() ?? null;
  const ready = Boolean(home.teamId && away.teamId);
  return {
    matchId,
    home: { teamId: home.teamId, label: home.label },
    away: { teamId: away.teamId, label: away.label },
    pickedWinner: picked,
    ready,
  };
}

export function buildWcInputMatchCardViews(
  matchId: WcBracketPredictMatchId,
  bracket: WcBracketState,
  advancement: WcKnockoutAdvancement,
  participantOptions?: WcResolveParticipantsOptions
): WcInputCardView[] {
  const resolved = resolveWcMatchParticipants(
    matchId,
    bracket,
    advancement,
    participantOptions
  );
  if (!resolved) return [];

  const [home, away] = resolved;
  if (!home && !away) return [];

  const picked = bracket[matchId]?.winner?.trim() ?? null;

  const mk = (
    role: "home" | "away",
    p: (typeof resolved)[0]
  ): WcInputCardView | null => {
    if (!p) return null;
    const teamId = p.teamId?.trim() || null;
    const label = p.label;
    if (!teamId && !label) return null;
    return {
      matchId,
      role,
      teamId,
      label,
      isPickedWinner: Boolean(teamId && picked && picked === teamId),
      pickable: Boolean(teamId),
    };
  };

  const cards = [mk("home", home), mk("away", away)].filter(
    (c): c is WcInputCardView => c !== null
  );

  if (cards.length < 2) return [];
  if (!cards[0].teamId && !cards[1].teamId) return [];

  return cards;
}

/** 次ラウンドの全試合が両チーム確定済みか（スライド昇格のトリガー用） */
export function isWcBracketRoundInputReady(
  phase: WcBracketInputPhase,
  bracket: WcBracketState,
  advancement: WcKnockoutAdvancement
): boolean {
  const def = WC_BRACKET_INPUT_PHASES.find((p) => p.id === phase);
  if (!def) return false;
  return def.matchIds.every((id) => {
    const view = buildWcInputMatchView(id, bracket, advancement);
    return Boolean(view?.ready);
  });
}

export function buildWcInputR32CardViews(
  half: "left" | "right",
  bracket: WcBracketState,
  advancement: WcKnockoutAdvancement
): WcInputCardView[][] {
  return listWcR32MatchesForDisplay(half).map((m) =>
    buildWcInputMatchCardViews(
      m.id as WcBracketPredictMatchId,
      bracket,
      advancement
    )
  );
}
