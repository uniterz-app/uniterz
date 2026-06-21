import { footballWinsLossesDraws } from "@/lib/teamRecordDisplay";
import type { TeamRecordLine } from "@/lib/teamRecordDisplay";

type WcTeamRow = {
  id: string;
  group: string;
  wins: number;
  draws: number;
  losses: number;
};

/** Firestore teams（league=wc）からグループ内順位付きの戦績マップを作る */
export function buildWcTeamRecordMap(
  docs: ReadonlyArray<{ id: string; data: () => Record<string, unknown> }>
): Record<string, TeamRecordLine> {
  const rows: WcTeamRow[] = docs.map((docSnap) => {
    const d = docSnap.data();
    const wl = footballWinsLossesDraws(d);
    return {
      id: docSnap.id,
      group: String(d.group ?? "").trim().toUpperCase(),
      wins: wl.wins,
      draws: wl.draws,
      losses: wl.losses,
    };
  });

  const byGroup = new Map<string, WcTeamRow[]>();
  for (const row of rows) {
    const key = row.group || "_";
    const list = byGroup.get(key) ?? [];
    list.push(row);
    byGroup.set(key, list);
  }

  const out: Record<string, TeamRecordLine> = {};
  for (const groupRows of byGroup.values()) {
    const sorted = [...groupRows].sort((a, b) => {
      const pa = a.wins * 3 + a.draws;
      const pb = b.wins * 3 + b.draws;
      if (pb !== pa) return pb - pa;
      if (b.wins !== a.wins) return b.wins - a.wins;
      return a.id.localeCompare(b.id);
    });
    sorted.forEach((row, index) => {
      out[row.id] = {
        wins: row.wins,
        draws: row.draws,
        losses: row.losses,
        rank: index + 1,
      };
    });
  }
  return out;
}
