// lib/wc/squadTypes.ts
//
// World Cup 代表名簿・予想スタメンの型定義。

import type { WcPosition } from "./rosters";

export type WcPlayerStatus = "available" | "injured" | "suspended";

/** 名簿の1選手 */
export type WcSquadPlayer = {
  /** チーム内ユニークID（例: jpn-endo） */
  id: string;
  name: string;
  pos: WcPosition;
  club?: string;
  leagueIso2?: string;
  captain?: boolean;
  status?: WcPlayerStatus;
};

export type WcFormationCode =
  | "4-3-3"
  | "4-4-2"
  | "4-2-3-1"
  | "3-5-2"
  | "3-4-3"
  | "3-4-2-1"
  | "3-4-1-2"
  | "5-3-2"
  | "5-4-1"
  | "4-1-4-1";

/** 予想スタメンの1スロット（ピッチ座標は 0–100、上=相手ゴール側） */
export type WcLineupSlot = {
  playerId: string;
  x: number;
  y: number;
};

/** 予想スタメン（11人） */
export type WcPredictedLineup = {
  formation: WcFormationCode;
  slots: WcLineupSlot[];
};

export type WcTeamSquad = {
  squad: WcSquadPlayer[];
  predictedLineup: WcPredictedLineup;
};

/** teamId（wc-jpn）から iso3（jpn） */
export function wcTeamIdToIso3(teamId: string): string | null {
  if (!teamId.startsWith("wc-")) return null;
  return teamId.slice(3).toLowerCase();
}

/** 表示用に名簿から選手を引く */
export function findSquadPlayer(
  squad: WcSquadPlayer[],
  playerId: string,
): WcSquadPlayer | undefined {
  return squad.find((p) => p.id === playerId);
}

/** 予想スタメン11人を名簿と突き合わせて返す */
export function resolveLineupPlayers(
  squad: WcSquadPlayer[],
  lineup: WcPredictedLineup,
): (WcSquadPlayer & { x: number; y: number })[] {
  return lineup.slots
    .map((slot) => {
      const p = findSquadPlayer(squad, slot.playerId);
      if (!p) return null;
      return { ...p, x: slot.x, y: slot.y };
    })
    .filter((p): p is WcSquadPlayer & { x: number; y: number } => p != null);
}
