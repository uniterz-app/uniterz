/**
 * チーム詳細 / 選手詳細 DISCIPLINE のシーズン推移。
 * `nbaDiscipline/{season}` を 2020-21〜表示季まで fieldMask で当該チーム / 選手だけ読む。
 * 選手は `nbaPlayerCareerSeasons` の出場季だけ（デビュー前を 0 で埋めない）。
 */
import { FieldPath, type Firestore } from "firebase-admin/firestore";
import type { NbaDisciplineHistoryPoint } from "@/lib/nba/discipline/disciplineTypes";
import {
  NBA_DISCIPLINE_COLLECTION,
  parseCounts,
} from "@/lib/nba/discipline/nbaDisciplineSnapshot";
import { NBA_PLAYER_CAREER_SEASONS_COLLECTION } from "@/lib/nba/playerCareerSeasons/playerCareerSeasonsTypes";
import { nbaLeagueStatsSeasonKeys } from "@/lib/rankings/nbaSeason";

export type NbaDisciplineHistorySubject = "team" | "player";

function seasonKeyFromStart(start: number): string {
  return `${start}-${String((start + 1) % 100).padStart(2, "0")}`;
}

async function playerSeasonsPlayed(
  db: Firestore,
  playerId: string
): Promise<Set<string> | null> {
  const snap = await db.collection(NBA_PLAYER_CAREER_SEASONS_COLLECTION).doc(playerId).get();
  if (!snap.exists) return null;
  const data = snap.data() as {
    regular?: Array<{ seasonStart?: number; games?: number }>;
    playoffs?: Array<{ seasonStart?: number; games?: number }>;
  };
  const out = new Set<string>();
  for (const row of [...(data.regular ?? []), ...(data.playoffs ?? [])]) {
    if (typeof row.seasonStart === "number" && (row.games ?? 0) > 0) {
      out.add(seasonKeyFromStart(row.seasonStart));
    }
  }
  return out.size > 0 ? out : null;
}

export async function loadNbaDisciplineHistory(
  db: Firestore,
  input: { subject: NbaDisciplineHistorySubject; id: string; toSeason: string }
): Promise<NbaDisciplineHistoryPoint[]> {
  const { subject, id, toSeason } = input;
  const seasons = [...nbaLeagueStatsSeasonKeys(toSeason)].reverse();
  const root = subject === "team" ? "teams" : "players";
  const refs = seasons.map((s) => db.collection(NBA_DISCIPLINE_COLLECTION).doc(s));
  const [docs, played] = await Promise.all([
    db.getAll(...refs, {
      fieldMask: [new FieldPath(root, id, "regular"), new FieldPath(root, id, "playoffs")],
    }),
    subject === "player" ? playerSeasonsPlayed(db, id) : Promise.resolve(null),
  ]);

  const points: Array<NbaDisciplineHistoryPoint & { hasEntry: boolean }> = [];
  docs.forEach((doc, i) => {
    if (!doc.exists) return;
    const season = seasons[i]!;
    const regular = doc.get(new FieldPath(root, id, "regular"));
    const playoffs = doc.get(new FieldPath(root, id, "playoffs"));
    const hasEntry = regular != null || playoffs != null;
    if (subject === "player" && played && !hasEntry && !played.has(season) && season !== toSeason) {
      return;
    }
    points.push({
      season,
      regular: parseCounts(regular),
      playoffs: parseCounts(playoffs),
      hasEntry,
    });
  });

  // キャリア未取得の選手はデビュー前の空シーズンを落とす
  let start = 0;
  if (subject === "player" && !played) {
    const first = points.findIndex((p) => p.hasEntry);
    start = first < 0 ? Math.max(0, points.length - 1) : first;
  }
  return points.slice(start).map(({ hasEntry: _hasEntry, ...p }) => p);
}
