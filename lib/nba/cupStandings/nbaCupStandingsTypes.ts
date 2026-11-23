/** Emirates NBA Cup グループ順位 */

export type NbaCupGroupId =
  | "east-a"
  | "east-b"
  | "east-c"
  | "west-a"
  | "west-b"
  | "west-c";

export type NbaCupStandingsRow = {
  teamId: string;
  teamName: string;
  rank: number;
  wins: number;
  losses: number;
  winPct: number;
  /** 得失点差（得点 − 失点） */
  diff: number;
  /** Games Behind */
  gb: number;
  pts: number;
  oppPts: number;
};

export type NbaCupGroupBoard = {
  id: NbaCupGroupId;
  /** 表示用: EAST · GROUP A */
  label: string;
  /** BDL ist_stage 原文 */
  istStage: string;
  rows: NbaCupStandingsRow[];
};

export type NbaCupStandingsBoard = {
  groups: NbaCupGroupBoard[];
};

export type NbaCupStandingsApiPayload = {
  ok: true;
  season: string;
  board: NbaCupStandingsBoard;
  asOfLabel: string;
  source: "firestore" | "games" | "bdl";
  updatedAt: number | null;
};

export const NBA_CUP_STANDINGS_COLLECTION = "nbaCupStandings";

export const NBA_CUP_GROUP_DEFS: readonly {
  id: NbaCupGroupId;
  label: string;
  istStage: string;
}[] = [
  { id: "east-a", label: "EAST · GROUP A", istStage: "East Group A" },
  { id: "east-b", label: "EAST · GROUP B", istStage: "East Group B" },
  { id: "east-c", label: "EAST · GROUP C", istStage: "East Group C" },
  { id: "west-a", label: "WEST · GROUP A", istStage: "West Group A" },
  { id: "west-b", label: "WEST · GROUP B", istStage: "West Group B" },
  { id: "west-c", label: "WEST · GROUP C", istStage: "West Group C" },
] as const;

export const EMPTY_NBA_CUP_STANDINGS: NbaCupStandingsBoard = {
  groups: NBA_CUP_GROUP_DEFS.map((g) => ({
    id: g.id,
    label: g.label,
    istStage: g.istStage,
    rows: [],
  })),
};
