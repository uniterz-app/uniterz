import type { NbaGameCleanRatingsDoc } from "@/lib/nba/cleanRatings/nbaCleanRatingsTypes";
import type { NbaGameDisciplineDoc } from "@/lib/nba/discipline/disciplineTypes";
import type { NbaGamePbpExtrasDoc } from "@/lib/nba/pbpExtras/nbaPbpExtrasTypes";
import type { NbaGameShotChartsDoc } from "@/lib/nba/shotCharts/shotChartTypes";

export type WindowGameKit = {
  bdlGameId: string;
  date: string;
  homeTeamId: string;
  awayTeamId: string;
  clean: NbaGameCleanRatingsDoc | null;
  extras: NbaGamePbpExtrasDoc | null;
  discipline: NbaGameDisciplineDoc | null;
  shots: Pick<NbaGameShotChartsDoc, "agg" | "date" | "empty"> | null;
};

export type WindowGameKitIndex = Map<string, WindowGameKit>;
