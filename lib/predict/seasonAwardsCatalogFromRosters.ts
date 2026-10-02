/**
 * シーズンアワード候補名簿 — Firestore `nbaTeamRosters` を選手カタログに変換。
 * クライアントは公開 GET /api/nba/team-rosters のみ。BDL 直叩き禁止。
 */
import { TEAM_SHORT } from "@/lib/team-short";
import type { NbaRosterPlayer } from "@/lib/predict/nbaRoster";
import type {
  NbaAwardCandidate,
  NbaAwardId,
} from "@/lib/predict/nbaSeasonAwardsPredict";
import { AWARDS_PREVIEW_COACHES, AWARDS_PREVIEW_ROOKIES } from "@/lib/predict/nbaSeasonAwardsPreviewMocks";

export type SeasonAwardsRosterCandidate = NbaAwardCandidate & {
  draftYear?: number | null;
};

type RosterTeamLike = {
  teamId: string;
  players: readonly NbaRosterPlayer[];
};

/** `"2026-27"` → 2026（その季のドラフト年 = ルーキー年） */
export function nbaSeasonRookieDraftYear(seasonKey: string): number | null {
  const y = Number.parseInt(String(seasonKey).slice(0, 4), 10);
  return Number.isFinite(y) ? y : null;
}

export function flattenTeamRostersToAwardCandidates(
  teams: Record<string, RosterTeamLike>
): SeasonAwardsRosterCandidate[] {
  const byId = new Map<string, SeasonAwardsRosterCandidate>();
  for (const team of Object.values(teams)) {
    const teamAbbr = (
      TEAM_SHORT[team.teamId] ?? team.teamId.replace(/^nba-/, "")
    ).toUpperCase();
    for (const p of team.players) {
      const id = String(p.id ?? "").trim();
      if (!id) continue;
      const firstName = String(p.firstName ?? "").trim();
      const lastName = String(p.lastName ?? "").trim();
      if (!firstName && !lastName) continue;
      byId.set(id, {
        id,
        firstName: firstName || "—",
        lastName: lastName || "—",
        teamAbbr,
        draftYear:
          typeof p.draftYear === "number" && Number.isFinite(p.draftYear)
            ? p.draftYear
            : null,
      });
    }
  }
  return [...byId.values()].sort((a, b) => {
    const la = `${a.lastName} ${a.firstName}`.localeCompare(
      `${b.lastName} ${b.firstName}`,
      "en"
    );
    return la !== 0 ? la : a.id.localeCompare(b.id);
  });
}

export function filterRookieAwardCandidates(
  players: readonly SeasonAwardsRosterCandidate[],
  seasonKey: string
): SeasonAwardsRosterCandidate[] {
  const draftYear = nbaSeasonRookieDraftYear(seasonKey);
  if (draftYear == null) return [];
  return players.filter((p) => p.draftYear === draftYear);
}

export function seasonAwardsCatalogForAward(
  awardId: NbaAwardId,
  players: readonly SeasonAwardsRosterCandidate[],
  seasonKey: string,
  coaches: readonly NbaAwardCandidate[] = AWARDS_PREVIEW_COACHES
): readonly NbaAwardCandidate[] {
  if (awardId === "coty") return coaches;
  if (awardId === "roy") {
    const fromRoster = filterRookieAwardCandidates(players, seasonKey);
    // ロスター未反映のドラフト新人でも Featured 5 が欠けないようスタブを足す
    const byId = new Map<string, NbaAwardCandidate>();
    for (const c of fromRoster) byId.set(c.id, stripDraftYear(c));
    for (const c of AWARDS_PREVIEW_ROOKIES) {
      if (!byId.has(c.id)) byId.set(c.id, c);
    }
    return [...byId.values()];
  }
  return players.map(stripDraftYear);
}

export function stripDraftYear(
  c: SeasonAwardsRosterCandidate
): NbaAwardCandidate {
  return {
    id: c.id,
    firstName: c.firstName,
    lastName: c.lastName,
    ...(c.teamAbbr ? { teamAbbr: c.teamAbbr } : {}),
  };
}
