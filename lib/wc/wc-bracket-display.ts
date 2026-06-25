import {
  type WcBracketPredictMatchId,
  type WcKnockoutFeedSlot,
  getWcKnockoutMatch,
  listWcR32MatchesForDisplay,
} from "@/lib/wc/wc-knockout-bracket";
import type { WcBracketState } from "@/lib/wc/wc-knockout-bracket";
import {
  type WcMatchHitStatus,
  getWcMatchHitStatus,
  resolveWcTeamQualLabel,
  shouldShowWcSurvivorPick,
} from "@/lib/wc/wc-knockout-bracket-utils";
import type { WcKnockoutAdvancement } from "@/lib/wc/wc-knockout-bracket-utils";

export type WcBracketCardView = {
  matchId: WcBracketPredictMatchId;
  role: "home" | "away" | "winner";
  teamId: string | null;
  label: string;
  visible: boolean;
  hitStatus: WcMatchHitStatus;
  isPickedWinner: boolean;
};

function resolveFeedLabel(slot: WcKnockoutFeedSlot): string {
  return slot.label;
}

function resolveFeedTeamId(
  slot: WcKnockoutFeedSlot,
  bracket: WcBracketState,
  advancement: WcKnockoutAdvancement | null | undefined
): string | null {
  if (slot.kind === "winner_feed") {
    const parentId = slot.matchId as WcBracketPredictMatchId;
    return bracket[parentId]?.winner?.trim() ?? null;
  }
  if (!advancement) return null;
  if (slot.kind === "group_winner") {
    return advancement.groupWinners[slot.group] ?? null;
  }
  if (slot.kind === "group_runner_up") {
    return advancement.groupRunnersUp[slot.group] ?? null;
  }
  return null;
}

export function getWcMatchContestants(
  matchId: WcBracketPredictMatchId,
  bracket: WcBracketState,
  advancement?: WcKnockoutAdvancement | null
): [{ teamId: string | null; label: string }, { teamId: string | null; label: string }] {
  const def = getWcKnockoutMatch(matchId);
  if (!def) {
    return [
      { teamId: null, label: "?" },
      { teamId: null, label: "?" },
    ];
  }

  if (def.feedsFrom.length === 2) {
    const a = bracket[def.feedsFrom[0] as WcBracketPredictMatchId]?.winner?.trim() ?? null;
    const b = bracket[def.feedsFrom[1] as WcBracketPredictMatchId]?.winner?.trim() ?? null;
    const qual = (teamId: string | null) =>
      teamId && advancement ? resolveWcTeamQualLabel(teamId, advancement) : "";
    return [
      {
        teamId: a,
        label: a ? qual(a) : `W${def.feedsFrom[0].slice(1)}`,
      },
      {
        teamId: b,
        label: b ? qual(b) : `W${def.feedsFrom[1].slice(1)}`,
      },
    ];
  }

  return [
    {
      teamId: resolveFeedTeamId(def.home, bracket, advancement),
      label: resolveFeedLabel(def.home),
    },
    {
      teamId: resolveFeedTeamId(def.away, bracket, advancement),
      label: resolveFeedLabel(def.away),
    },
  ];
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

  const [home, away] = getWcMatchContestants(matchId, bracket, advancement);
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
