import type { WcGroupStandingEntry } from "@/lib/wc/wcGroupStandingRank";
import { getWcGroupByCode, type WcGroupCode } from "@/lib/wc/groups";
import { normalizeWcTeamId } from "@/lib/wc/resolveWcTeamId";
import { WC_2026_GROUP_STANDINGS } from "@/lib/wc/wc-knockout-advancement-2026";

/** グループステージ確定順位（タイブレーク込み）— Firestore の簡易ソートより優先 */
const OFFICIAL_WC_2026_GROUP_RANK: Readonly<Record<string, number>> =
  buildOfficialWc2026GroupRankLookup();

function buildOfficialWc2026GroupRankLookup(): Record<string, number> {
  const ranks: Record<string, number> = {};

  for (const teamId of Object.values(WC_2026_GROUP_STANDINGS.groupWinners)) {
    if (teamId) ranks[teamId] = 1;
  }
  for (const teamId of Object.values(WC_2026_GROUP_STANDINGS.groupRunnersUp)) {
    if (teamId) ranks[teamId] = 2;
  }
  for (const teamId of Object.values(WC_2026_GROUP_STANDINGS.groupThirdPlaces)) {
    if (teamId) ranks[teamId] = 3;
  }

  const groups = Object.keys(WC_2026_GROUP_STANDINGS.groupWinners) as WcGroupCode[];
  for (const code of groups) {
    const group = getWcGroupByCode(code);
    if (!group) continue;
    for (const teamId of group.teamIds) {
      if (ranks[teamId] == null) ranks[teamId] = 4;
    }
  }

  return ranks;
}

export function resolveOfficialWc2026GroupStageRank(
  teamId: string | null | undefined
): number | null {
  const id = normalizeWcTeamId(teamId) ?? teamId?.trim() ?? "";
  if (!id) return null;
  return OFFICIAL_WC_2026_GROUP_RANK[id] ?? null;
}

function withOfficialWc2026GroupRank(
  teamId: string,
  entry: WcGroupStandingEntry
): WcGroupStandingEntry {
  const rank = resolveOfficialWc2026GroupStageRank(teamId);
  return rank == null ? entry : { ...entry, rank };
}

/**
 * 2026 グループステージ確定戦績（2026-06-28 全72試合終了時点）。
 * ノックアウト試合カード等で Firestore 待ちなく即表示する。
 */
export const WC_2026_GROUP_STAGE_FROZEN: Readonly<
  Record<string, WcGroupStandingEntry>
> = {
  "wc-arg": { wins: 3, draws: 0, losses: 0, rank: 1 },
  "wc-aut": { wins: 1, draws: 1, losses: 1, rank: 2 },
  "wc-dza": { wins: 1, draws: 1, losses: 1, rank: 3 },
  "wc-jor": { wins: 0, draws: 0, losses: 3, rank: 3 },
  "wc-usa": { wins: 2, draws: 0, losses: 1, rank: 1 },
  "wc-aus": { wins: 1, draws: 1, losses: 1, rank: 2 },
  "wc-pry": { wins: 1, draws: 1, losses: 1, rank: 3 },
  "wc-tur": { wins: 1, draws: 0, losses: 2, rank: 4 },
  "wc-bel": { wins: 1, draws: 2, losses: 0, rank: 1 },
  "wc-egy": { wins: 1, draws: 2, losses: 0, rank: 2 },
  "wc-irn": { wins: 0, draws: 3, losses: 0, rank: 4 },
  "wc-nzl": { wins: 0, draws: 1, losses: 2, rank: 4 },
  "wc-che": { wins: 2, draws: 1, losses: 0, rank: 1 },
  "wc-can": { wins: 1, draws: 1, losses: 1, rank: 2 },
  "wc-bih": { wins: 1, draws: 1, losses: 1, rank: 3 },
  "wc-qat": { wins: 0, draws: 1, losses: 2, rank: 4 },
  "wc-bra": { wins: 2, draws: 1, losses: 0, rank: 1 },
  "wc-mar": { wins: 2, draws: 1, losses: 0, rank: 2 },
  "wc-sct": { wins: 1, draws: 0, losses: 2, rank: 4 },
  "wc-hti": { wins: 0, draws: 0, losses: 3, rank: 3 },
  "wc-civ": { wins: 2, draws: 0, losses: 1, rank: 2 },
  "wc-deu": { wins: 2, draws: 0, losses: 1, rank: 1 },
  "wc-ecu": { wins: 1, draws: 1, losses: 1, rank: 3 },
  "wc-cuw": { wins: 0, draws: 1, losses: 2, rank: 4 },
  "wc-col": { wins: 2, draws: 1, losses: 0, rank: 1 },
  "wc-prt": { wins: 1, draws: 2, losses: 0, rank: 2 },
  "wc-cod": { wins: 1, draws: 1, losses: 1, rank: 3 },
  "wc-uzb": { wins: 0, draws: 0, losses: 3, rank: 4 },
  "wc-esp": { wins: 2, draws: 1, losses: 0, rank: 1 },
  "wc-cpv": { wins: 0, draws: 3, losses: 0, rank: 2 },
  "wc-sau": { wins: 0, draws: 2, losses: 1, rank: 3 },
  "wc-ury": { wins: 0, draws: 2, losses: 1, rank: 4 },
  "wc-mex": { wins: 3, draws: 0, losses: 0, rank: 1 },
  "wc-zaf": { wins: 1, draws: 1, losses: 1, rank: 2 },
  "wc-kor": { wins: 1, draws: 0, losses: 2, rank: 3 },
  "wc-cze": { wins: 0, draws: 1, losses: 2, rank: 4 },
  "wc-eng": { wins: 2, draws: 1, losses: 0, rank: 1 },
  "wc-hrv": { wins: 2, draws: 0, losses: 1, rank: 2 },
  "wc-gha": { wins: 1, draws: 1, losses: 1, rank: 3 },
  "wc-pan": { wins: 0, draws: 0, losses: 3, rank: 4 },
  "wc-fra": { wins: 3, draws: 0, losses: 0, rank: 1 },
  "wc-nor": { wins: 2, draws: 0, losses: 1, rank: 2 },
  "wc-sen": { wins: 1, draws: 0, losses: 2, rank: 3 },
  "wc-irq": { wins: 0, draws: 0, losses: 3, rank: 4 },
  "wc-nld": { wins: 2, draws: 1, losses: 0, rank: 1 },
  "wc-jpn": { wins: 1, draws: 2, losses: 0, rank: 2 },
  "wc-swe": { wins: 1, draws: 1, losses: 1, rank: 3 },
  "wc-tun": { wins: 0, draws: 0, losses: 3, rank: 4 },
};

export function resolveFrozenWc2026GroupStageStanding(
  teamId: string | null | undefined
): WcGroupStandingEntry | null {
  const id = normalizeWcTeamId(teamId) ?? teamId?.trim() ?? "";
  if (!id) return null;
  const entry = WC_2026_GROUP_STAGE_FROZEN[id];
  if (!entry) return null;
  return withOfficialWc2026GroupRank(id, entry);
}

/** 確定順位で並べ替え（同勝点のタイブレーク誤差を補正） */
export function orderGroupStandingsByOfficialWc2026Rank<
  T extends { teamId: string },
>(rows: readonly T[]): T[] {
  return [...rows].sort((a, b) => {
    const ra = resolveOfficialWc2026GroupStageRank(a.teamId) ?? 99;
    const rb = resolveOfficialWc2026GroupStageRank(b.teamId) ?? 99;
    if (ra !== rb) return ra - rb;
    return a.teamId.localeCompare(b.teamId);
  });
}
