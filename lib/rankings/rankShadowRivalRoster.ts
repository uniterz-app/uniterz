import type { MyRankProgressPoint } from "@/lib/rankings/myRankRankingProgress";

export type RankShadowRivalEntry = {
  uid: string;
  displayName: string;
  photoURL: string | null;
  priorRank: number;
  currentRank: number;
  /** 正 = 順位上昇（数字が小さくなった） */
  rankDelta: number;
  progressPoints: MyRankProgressPoint[];
  isSelf: boolean;
};

export function fallbackRivalProgressPoints(
  priorRank: number,
  currentRank: number
): MyRankProgressPoint[] {
  return [
    { dateKey: "prior", rank: priorRank },
    { dateKey: "now", rank: currentRank },
  ];
}

function rivalRosterSortGroup(rankDelta: number): number {
  if (rankDelta > 0) return 0;
  if (rankDelta === 0) return 1;
  return 2;
}

export function buildShadowRivalRoster(input: {
  members: Array<{
    uid: string;
    priorRank: number;
    currentRank: number;
    displayName?: string;
    photoURL?: string | null;
    progressPoints?: MyRankProgressPoint[];
  }>;
  selfUid?: string;
}): RankShadowRivalEntry[] {
  return input.members
    .map((m) => ({
      uid: m.uid,
      displayName: m.displayName?.trim() || `Rival_${m.uid.slice(-4)}`,
      photoURL: m.photoURL ?? null,
      priorRank: m.priorRank,
      currentRank: m.currentRank,
      rankDelta: m.priorRank - m.currentRank,
      progressPoints:
        m.progressPoints && m.progressPoints.length >= 2
          ? m.progressPoints
          : fallbackRivalProgressPoints(m.priorRank, m.currentRank),
      isSelf: input.selfUid != null && m.uid === input.selfUid,
    }))
    .sort((a, b) => {
      const ga = rivalRosterSortGroup(a.rankDelta);
      const gb = rivalRosterSortGroup(b.rankDelta);
      if (ga !== gb) return ga - gb;
      if (a.rankDelta > 0) return b.rankDelta - a.rankDelta;
      if (a.rankDelta < 0) return a.rankDelta - b.rankDelta;
      return a.currentRank - b.currentRank;
    });
}

/** dev プレビュー用 — サイバー風ハンドル */
export const MOCK_SHADOW_RIVAL_NAMES = [
  "NEON_VIPER",
  "CHROME_GHOST",
  "VOID_RUNNER",
  "STATIC_KID",
  "PULSE_WAVE",
  "GRID_LOCK",
  "ZERO_COOL",
  "BYTE_HUNTER",
  "FLUX_CORE",
  "NIGHT_CIRCUIT",
  "ARC_BLADE",
  "DATA_DRIFT",
  "SYNTH_WOLF",
  "HYPER_NOVA",
  "COLD_START",
  "PIXEL_RONIN",
  "TURBO_MIND",
  "ECHO_STORM",
  "VOLT_SAGE",
  "SHADOW_MUX",
  "GLITCH_KING",
] as const;
