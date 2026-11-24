/**
 * 期間表用の試合キット。ingest だけが読む（公開 GET はスナップショット 1 doc）。
 */
import type { Firestore } from "firebase-admin/firestore";
import { NBA_GAME_CLEAN_RATINGS_COLLECTION } from "@/lib/nba/cleanRatings/nbaCleanRatingsTypes";
import type { NbaGameCleanRatingsDoc } from "@/lib/nba/cleanRatings/nbaCleanRatingsTypes";
import { NBA_GAME_DISCIPLINE_COLLECTION } from "@/lib/nba/discipline/nbaDisciplineSnapshot";
import type { NbaGameDisciplineDoc } from "@/lib/nba/discipline/disciplineTypes";
import { NBA_GAME_PBP_EXTRAS_COLLECTION } from "@/lib/nba/pbpExtras/nbaPbpExtrasTypes";
import type { NbaGamePbpExtrasDoc } from "@/lib/nba/pbpExtras/nbaPbpExtrasTypes";
import { NBA_GAME_SHOT_CHARTS_COLLECTION } from "@/lib/nba/shotCharts/shotChartTypes";
import type { NbaGameShotChartsDoc } from "@/lib/nba/shotCharts/shotChartTypes";
import type { WindowGameKit, WindowGameKitIndex } from "@/lib/nba/leagueWindows/windowGameKits";

export async function loadWindowGameKits(
  db: Firestore,
  seasonKey: string
): Promise<WindowGameKitIndex> {
  const [cleanSnap, extrasSnap, discSnap, shotSnap] = await Promise.all([
    db
      .collection(NBA_GAME_CLEAN_RATINGS_COLLECTION)
      .where("seasonKey", "==", seasonKey)
      .select("date", "homeTeamId", "awayTeamId", "home", "away", "incomplete")
      .get(),
    db
      .collection(NBA_GAME_PBP_EXTRAS_COLLECTION)
      .where("seasonKey", "==", seasonKey)
      .get(),
    db
      .collection(NBA_GAME_DISCIPLINE_COLLECTION)
      .where("seasonKey", "==", seasonKey)
      .select("date", "events", "seasonType")
      .get(),
    db
      .collection(NBA_GAME_SHOT_CHARTS_COLLECTION)
      .where("seasonKey", "==", seasonKey)
      .select("agg", "date", "empty")
      .get(),
  ]);

  const out: WindowGameKitIndex = new Map();
  const ensure = (id: string): WindowGameKit => {
    const cur = out.get(id);
    if (cur) return cur;
    const created: WindowGameKit = {
      bdlGameId: id,
      date: "",
      homeTeamId: "",
      awayTeamId: "",
      clean: null,
      extras: null,
      discipline: null,
      shots: null,
    };
    out.set(id, created);
    return created;
  };

  for (const d of cleanSnap.docs) {
    const data = d.data() as NbaGameCleanRatingsDoc;
    if (data.incomplete) continue;
    const kit = ensure(d.id);
    kit.date = data.date ?? kit.date;
    kit.homeTeamId = data.homeTeamId ?? kit.homeTeamId;
    kit.awayTeamId = data.awayTeamId ?? kit.awayTeamId;
    kit.clean = data;
  }
  for (const d of extrasSnap.docs) {
    const data = d.data() as NbaGamePbpExtrasDoc;
    const kit = ensure(d.id);
    kit.date = data.date ?? kit.date;
    kit.homeTeamId = data.homeTeamId ?? kit.homeTeamId;
    kit.awayTeamId = data.awayTeamId ?? kit.awayTeamId;
    kit.extras = data;
  }
  for (const d of discSnap.docs) {
    const data = d.data() as NbaGameDisciplineDoc;
    const kit = ensure(d.id);
    kit.date = data.date ?? kit.date;
    kit.discipline = data;
  }
  for (const d of shotSnap.docs) {
    const data = d.data() as Pick<NbaGameShotChartsDoc, "agg" | "date" | "empty">;
    if (data.empty) continue;
    const kit = ensure(d.id);
    kit.date = data.date ?? kit.date;
    kit.shots = data;
  }
  return out;
}
