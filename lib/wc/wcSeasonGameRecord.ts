import type { WcStandingGame } from "@/lib/wc/computeGroupStandings";

/** 順位集計 + 過去試合表示用の WC 試合レコード */
export type WcSeasonGameRecord = WcStandingGame & {
  id: string;
  startAtMs: number | null;
  roundLabel: string | null;
};

export type WcTeamPastResultRow = {
  gameId: string;
  opponentTeamId: string;
  goalsFor: number;
  goalsAgainst: number;
  outcome: "W" | "D" | "L";
  startAtMs: number | null;
  roundLabel: string | null;
  isHome: boolean;
};

export function selectWcTeamPastResults(
  games: readonly WcSeasonGameRecord[],
  teamId: string,
  options?: { excludeGameId?: string | null },
): WcTeamPastResultRow[] {
  const exclude = options?.excludeGameId?.trim() || null;
  const rows: WcTeamPastResultRow[] = [];

  for (const g of games) {
    if (g.status !== "final") continue;
    if (exclude && g.id === exclude) continue;
    if (g.homeScore == null || g.awayScore == null) continue;

    const isHome = g.homeTeamId === teamId;
    const isAway = g.awayTeamId === teamId;
    if (!isHome && !isAway) continue;

    const goalsFor = isHome ? g.homeScore : g.awayScore;
    const goalsAgainst = isHome ? g.awayScore : g.homeScore;
    let outcome: "W" | "D" | "L" = "D";
    if (goalsFor > goalsAgainst) outcome = "W";
    else if (goalsFor < goalsAgainst) outcome = "L";

    rows.push({
      gameId: g.id,
      opponentTeamId: isHome ? g.awayTeamId : g.homeTeamId,
      goalsFor,
      goalsAgainst,
      outcome,
      startAtMs: g.startAtMs,
      roundLabel: g.roundLabel,
      isHome,
    });
  }

  return rows.sort((a, b) => (b.startAtMs ?? 0) - (a.startAtMs ?? 0));
}

export function formatWcPastResultDate(
  startAtMs: number | null,
  language: "ja" | "en",
): string {
  if (startAtMs == null) return "—";
  const dt = new Date(startAtMs);
  if (language === "en") {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(dt);
  }
  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
  }).format(dt);
}
