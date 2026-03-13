import type { SeriesId } from "@/lib/playoff-bracket";
import type { BracketState } from "@/lib/playoff-bracket-firestore";

export type Team = {
  code: string;
  seed: number;
};

export function getSeriesTeams(
  bracket: BracketState,
  teamMap: Record<string, Team>,
  a: SeriesId,
  b: SeriesId
): [Team, Team] | null {
  const aw = bracket[a]?.winner;
  const bw = bracket[b]?.winner;

  if (!aw || !bw) return null;

  const t1 = teamMap[aw];
  const t2 = teamMap[bw];

  if (!t1 || !t2) return null;

  return [t1, t2];
}

export function pruneBracket(bracket: BracketState): BracketState {
  const next: BracketState = { ...bracket };

  const keepSeriesValid = (seriesId: SeriesId, allowed: string[] | null) => {
    if (!allowed || allowed.length < 2) {
      delete next[seriesId];
      return;
    }

    const picked = next[seriesId]?.winner;
    if (picked && !allowed.includes(picked)) {
      delete next[seriesId];
    }
  };

  const allowedR2E1 =
    next["R1_E1"]?.winner && next["R1_E2"]?.winner
      ? [next["R1_E1"].winner!, next["R1_E2"].winner!]
      : null;

  const allowedR2E2 =
    next["R1_E3"]?.winner && next["R1_E4"]?.winner
      ? [next["R1_E3"].winner!, next["R1_E4"].winner!]
      : null;

  const allowedR2W1 =
    next["R1_W1"]?.winner && next["R1_W2"]?.winner
      ? [next["R1_W1"].winner!, next["R1_W2"].winner!]
      : null;

  const allowedR2W2 =
    next["R1_W3"]?.winner && next["R1_W4"]?.winner
      ? [next["R1_W3"].winner!, next["R1_W4"].winner!]
      : null;

  keepSeriesValid("R2_E1", allowedR2E1);
  keepSeriesValid("R2_E2", allowedR2E2);
  keepSeriesValid("R2_W1", allowedR2W1);
  keepSeriesValid("R2_W2", allowedR2W2);

  const allowedCFE =
    next["R2_E1"]?.winner && next["R2_E2"]?.winner
      ? [next["R2_E1"].winner!, next["R2_E2"].winner!]
      : null;

  const allowedCFW =
    next["R2_W1"]?.winner && next["R2_W2"]?.winner
      ? [next["R2_W1"].winner!, next["R2_W2"].winner!]
      : null;

  keepSeriesValid("CF_E", allowedCFE);
  keepSeriesValid("CF_W", allowedCFW);

  const allowedFinals =
    next["CF_E"]?.winner && next["CF_W"]?.winner
      ? [next["CF_E"].winner!, next["CF_W"].winner!]
      : null;

  keepSeriesValid("FINALS", allowedFinals);

  return next;
}