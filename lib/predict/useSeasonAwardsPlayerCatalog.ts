/**
 * シーズンアワード選手カタログ — GET /api/nba/team-rosters をクライアント取得。
 */
import { useEffect, useState } from "react";
import { fetchTeamRostersSnapshot } from "@/lib/nba/teamRosters/fetchTeamRostersClient";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import {
  flattenTeamRostersToAwardCandidates,
  type SeasonAwardsRosterCandidate,
} from "@/lib/predict/seasonAwardsCatalogFromRosters";
import { AWARDS_PREVIEW_PLAYERS } from "@/lib/predict/nbaSeasonAwardsPreviewMocks";

export function useSeasonAwardsPlayerCatalog(options?: {
  season?: string;
  apiBaseUrl?: string | null;
}) {
  const season = (options?.season ?? CURRENT_NBA_SEASON_KEY).trim();
  const apiBaseUrl = options?.apiBaseUrl ?? null;
  const [players, setPlayers] = useState<SeasonAwardsRosterCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fromRoster, setFromRoster] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    void (async () => {
      try {
        const data = await fetchTeamRostersSnapshot({
          season,
          apiBaseUrl,
        });
        if (cancelled) return;
        const next = flattenTeamRostersToAwardCandidates(data.bundle.teams);
        if (next.length === 0) {
          setPlayers(
            AWARDS_PREVIEW_PLAYERS.map((c) => ({ ...c, draftYear: null }))
          );
          setFromRoster(false);
          setError("empty_roster");
        } else {
          setPlayers(next);
          setFromRoster(true);
        }
      } catch (e) {
        if (cancelled) return;
        setPlayers(
          AWARDS_PREVIEW_PLAYERS.map((c) => ({ ...c, draftYear: null }))
        );
        setFromRoster(false);
        setError(e instanceof Error ? e.message : "roster_fetch_failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [season, apiBaseUrl]);

  return { players, loading, error, fromRoster, season };
}
