declare module "@/app/component/predict/NbaPostseasonMatchupPanel" {
  export type NbaH2HGameInactiveFooterSummary = {
    ja: string;
    en: string;
  };

  export type NbaH2HGameCard = {
    id: string;
    dateEt: string;
    dateJst: string;
    leftTeamDisplay: string;
    rightTeamDisplay: string;
    scoreLeft: number | null;
    scoreRight: number | null;
    injuriesLeft: string[];
    injuriesRight: string[];
    homeTeamSide?: "left" | "right";
    wentToOvertime?: boolean;
    seriesGameLabel?: string;
    inactiveFooterSummary?: NbaH2HGameInactiveFooterSummary;
  };

  export type NbaH2HAverages = {
    homeAvgPts: number | null;
    awayAvgPts: number | null;
    homeAvgPtsAllowed: number | null;
    awayAvgPtsAllowed: number | null;
    homeNetRtg: number | null;
    awayNetRtg: number | null;
  };
}

