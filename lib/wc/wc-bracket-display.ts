import {
  type WcBracketPredictMatchId,
  getWcKnockoutMatch,
  listWcR32MatchesForDisplay,
} from "@/lib/wc/wc-knockout-bracket";
import type { WcBracketState } from "@/lib/wc/wc-knockout-bracket";
import {
  type WcMatchHitStatus,
  type WcResolveParticipantsOptions,
  type WcResolvedParticipant,
  getWcMatchHitStatus,
  resolveWcMatchParticipants,
  resolveWcTeamQualLabel,
  shouldShowWcSurvivorPick,
} from "@/lib/wc/wc-knockout-bracket-utils";
import type { WcKnockoutAdvancement } from "@/lib/wc/wc-knockout-bracket-utils";
import type { WcOfficialWinners } from "@/lib/wc/wc-bracket-results-types";

export type WcBracketCardView = {
  matchId: WcBracketPredictMatchId;
  role: "home" | "away" | "winner";
  teamId: string | null;
  label: string;
  visible: boolean;
  hitStatus: WcMatchHitStatus;
  isPickedWinner: boolean;
};

function toContestantSlot(
  participant: WcResolvedParticipant | null
): { teamId: string | null; label: string } {
  const teamId = participant?.teamId?.trim() || null;
  return {
    teamId,
    label: participant?.label?.trim() || "?",
  };
}

export function getWcMatchContestants(
  matchId: WcBracketPredictMatchId,
  bracket: WcBracketState,
  advancement?: WcKnockoutAdvancement | null,
  participantOptions?: WcResolveParticipantsOptions
): [{ teamId: string | null; label: string }, { teamId: string | null; label: string }] {
  const def = getWcKnockoutMatch(matchId);
  if (!def) {
    return [
      { teamId: null, label: "?" },
      { teamId: null, label: "?" },
    ];
  }

  if (!advancement) {
    if (def.feedsFrom.length === 2) {
      const a =
        bracket[def.feedsFrom[0] as WcBracketPredictMatchId]?.winner?.trim() ?? null;
      const b =
        bracket[def.feedsFrom[1] as WcBracketPredictMatchId]?.winner?.trim() ?? null;
      return [
        {
          teamId: a,
          label: a ? a : `W${def.feedsFrom[0].slice(1)}`,
        },
        {
          teamId: b,
          label: b ? b : `W${def.feedsFrom[1].slice(1)}`,
        },
      ];
    }
    return [
      { teamId: null, label: "?" },
      { teamId: null, label: "?" },
    ];
  }

  const resolved = resolveWcMatchParticipants(
    matchId,
    bracket,
    advancement,
    participantOptions
  );
  if (!resolved) {
    return [
      { teamId: null, label: "?" },
      { teamId: null, label: "?" },
    ];
  }

  return [toContestantSlot(resolved[0]), toContestantSlot(resolved[1])];
}

export function buildWcMatchCardViews(
  matchId: WcBracketPredictMatchId,
  bracket: WcBracketState,
  officialWinners: Partial<Record<WcBracketPredictMatchId, string>>,
  firstMissMatchId: WcBracketPredictMatchId | null,
  advancement?: WcKnockoutAdvancement | null
): WcBracketCardView[] {
  const hitStatus = getWcMatchHitStatus(matchId, bracket, officialWinners);
  const visible = shouldShowWcSurvivorPick(matchId, hitStatus, firstMissMatchId);
  if (!visible) return [];

  const [home, away] = getWcMatchContestants(
    matchId,
    bracket,
    advancement,
    {
      officialWinners,
      preferOfficialFeeders: true,
    }
  );
  const picked = bracket[matchId]?.winner?.trim() ?? null;
  const official = officialWinners[matchId]?.trim() ?? null;

  const mk = (
    role: "home" | "away",
    teamId: string | null,
    label: string
  ): WcBracketCardView => {
    const isPickedWinner = Boolean(picked && teamId && picked === teamId);
    const slotHit: WcMatchHitStatus =
      official && picked
        ? picked === official && isPickedWinner
          ? "hit"
          : hitStatus === "miss" && isPickedWinner
            ? "miss"
            : hitStatus
        : hitStatus;
    return {
      matchId,
      role,
      teamId,
      label: teamId ? (label || (advancement ? resolveWcTeamQualLabel(teamId, advancement) : "")) : label,
      visible: true,
      hitStatus: isPickedWinner ? slotHit : "pending",
      isPickedWinner,
    };
  };

  return [mk("home", home.teamId, home.label), mk("away", away.teamId, away.label)];
}

export function buildWcR32CardViews(
  half: "left" | "right",
  bracket: WcBracketState,
  officialWinners: Partial<Record<WcBracketPredictMatchId, string>>,
  firstMissMatchId: WcBracketPredictMatchId | null,
  advancement?: WcKnockoutAdvancement | null
): WcBracketCardView[][] {
  return listWcR32MatchesForDisplay(half).map((m) =>
    buildWcMatchCardViews(
      m.id as WcBracketPredictMatchId,
      bracket,
      officialWinners,
      firstMissMatchId,
      advancement
    )
  );
}
