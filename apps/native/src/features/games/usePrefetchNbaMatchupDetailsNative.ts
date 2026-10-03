import { useEffect, useMemo } from "react";
import { prefetchMatchupDetailBundles } from "../../../../../lib/nba/predict/fetchMatchupDetailClient";
import { getUniterzApiBaseUrl } from "./submitPredictionApi";

function teamIdOf(side: unknown, fallback: unknown): string {
  const id = (side as { teamId?: string } | undefined)?.teamId ?? fallback;
  return typeof id === "string" ? id.trim() : "";
}

/** 一覧に出た NBA カードの予想ツール用データ（injury / roster / stats）を先に温める */
export function usePrefetchNbaMatchupDetailsNative(
  games: ReadonlyArray<Record<string, unknown>>
): void {
  const pairsKey = useMemo(
    () =>
      games
        .filter((g) => String(g.league ?? "").toLowerCase() === "nba")
        .map((g) => {
          const home = teamIdOf(g.home, g.homeTeamId);
          const away = teamIdOf(g.away, g.awayTeamId);
          return home && away ? `${home}:${away}` : "";
        })
        .filter(Boolean)
        .join(","),
    [games]
  );

  useEffect(() => {
    if (!pairsKey) return;
    void prefetchMatchupDetailBundles(
      pairsKey.split(",").map((pair) => {
        const [homeTeamId, awayTeamId] = pair.split(":");
        return { homeTeamId, awayTeamId };
      }),
      { apiBaseUrl: getUniterzApiBaseUrl() }
    );
  }, [pairsKey]);
}
