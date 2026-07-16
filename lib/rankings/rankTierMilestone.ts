/**
 * Pro My Rank — 現在順位から「次に狙う順位帯」を決める。
 * 例: 120位→100位 / 80位→50位 / 48位→20位 / 15位→10位
 */

export const RANK_TIER_MILESTONES = [10, 20, 50, 100, 200, 500] as const;

export type RankTierMilestone = (typeof RANK_TIER_MILESTONES)[number];

/** 現在順位より上で、最も近いマイルストーン（未到達の帯） */
export function resolveNextRankTierMilestone(
  currentRank: number
): RankTierMilestone | null {
  if (!Number.isFinite(currentRank) || currentRank < 1) return null;
  const r = Math.floor(currentRank);
  if (r <= RANK_TIER_MILESTONES[0]) return null;

  let target: RankTierMilestone | null = null;
  for (const m of RANK_TIER_MILESTONES) {
    if (r > m) target = m;
  }
  return target;
}

export type RankTierGapHint =
  | {
      kind: "gap";
      targetRank: RankTierMilestone;
      /** 総合得点であと何点必要か（正の数） */
      pointsGap: number;
    }
  | {
      kind: "inside";
      /** 例: TOP10 */
      tierLabel: string;
    };

export function formatRankTierGapHintJa(hint: RankTierGapHint): string {
  return formatRankTierGapForHud(hint, "ja").text;
}

export function formatRankTierGapHintEn(hint: RankTierGapHint): string {
  return formatRankTierGapForHud(hint, "en").text;
}

/** My Rank HUD — アバター下の1行表示 */
export type RankTierGapHudSegment = {
  text: string;
  tone: "tier" | "body";
};

export type RankTierGapHudText = {
  text: string;
  segments: RankTierGapHudSegment[];
};

function formatPointsGap(hint: Extract<RankTierGapHint, { kind: "gap" }>): string {
  return hint.pointsGap < 10
    ? hint.pointsGap.toFixed(1)
    : String(Math.round(hint.pointsGap));
}

export function formatRankTierGapForHud(
  hint: RankTierGapHint,
  language: "ja" | "en"
): RankTierGapHudText {
  if (hint.kind === "inside") {
    const label = hint.tierLabel.replace(/\s+/g, "");
    if (language === "en") {
      const text = `Inside ${label}`;
      return {
        text,
        segments: [
          { text: "Inside ", tone: "body" },
          { text: label, tone: "tier" },
        ],
      };
    }
    const text = `${label}圏内`;
    return {
      text,
      segments: [
        { text: label, tone: "tier" },
        { text: "圏内", tone: "body" },
      ],
    };
  }

  const gap = formatPointsGap(hint);
  const tierLabel = `TOP${hint.targetRank}`;
  if (language === "en") {
    const text = `+${gap}pt to TOP ${hint.targetRank}`;
    return {
      text,
      segments: [
        { text: `+${gap}pt to `, tone: "body" },
        { text: `TOP ${hint.targetRank}`, tone: "tier" },
      ],
    };
  }
  const text = `${tierLabel}圏内まで＋${gap}pt`;
  return {
    text,
    segments: [
      { text: tierLabel, tone: "tier" },
      { text: `圏内まで＋${gap}pt`, tone: "body" },
    ],
  };
}

/** @deprecated splitRankTierGapHint — use formatRankTierGapForHud */
export type RankTierGapHudLines = {
  primary: string;
  secondary?: string | null;
};

export function splitRankTierGapHint(
  hint: RankTierGapHint,
  language: "ja" | "en"
): RankTierGapHudLines {
  const { text } = formatRankTierGapForHud(hint, language);
  return { primary: text };
}

type RowWithRankAndPoints = {
  rank?: number;
  totalPoints?: number;
};

/**
 * スナップショット Top 行から、targetRank 地点の総合得点カットラインを取得。
 * （本番: ranking bulk の rows + myRow）
 */
export function cutoffTotalPointsAtRank(
  rows: RowWithRankAndPoints[],
  targetRank: number
): number | null {
  if (!rows.length || targetRank < 1) return null;

  let best: number | null = null;
  for (const row of rows) {
    const rank =
      typeof row.rank === "number" && Number.isFinite(row.rank)
        ? Math.floor(row.rank)
        : null;
    const pts = row.totalPoints;
    if (rank == null || rank !== targetRank) continue;
    if (typeof pts !== "number" || !Number.isFinite(pts)) continue;
    best = best == null ? pts : Math.max(best, pts);
  }
  return best;
}

export function buildRankTierGapHint(input: {
  currentRank: number;
  myTotalPoints: number;
  cutoffRows?: RowWithRankAndPoints[];
}): RankTierGapHint | null {
  const target = resolveNextRankTierMilestone(input.currentRank);
  if (target == null) {
    return { kind: "inside", tierLabel: "TOP10" };
  }

  const cutoff =
    input.cutoffRows != null
      ? cutoffTotalPointsAtRank(input.cutoffRows, target)
      : null;

  if (cutoff == null) return null;

  const gap = cutoff - input.myTotalPoints;
  if (!Number.isFinite(gap) || gap <= 0) {
    return { kind: "inside", tierLabel: `TOP${target}` };
  }

  return {
    kind: "gap",
    targetRank: target,
    pointsGap: gap,
  };
}

/** dev プレビュー用 — 順位帯ごとの仮カットライン */
export function mockCutoffTotalPointsAtRank(targetRank: number): number {
  return Math.round(1520 - targetRank * 1.35);
}
