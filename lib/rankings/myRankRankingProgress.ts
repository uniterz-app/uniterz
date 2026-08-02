/** My Rank カード内 Ranking Progress — 日次スナップショット */
export type MyRankProgressPoint = {
  dateKey: string;
  rank: number;
};

/** My Rank カード内 Ranking Progress — 一律 7 スナップショット */
export function resolveMyRankProgressSnapshotLimit(_input?: {
  displayTier?: "free" | "pro";
  isPro?: boolean;
}): number {
  return 7;
}

/** dev プレビュー — 現在順位に向かって変動する仮スナップショット */
export function buildMockMyRankProgressPoints(
  currentRank: number,
  total = 10
): MyRankProgressPoint[] {
  const count = Math.max(1, Math.min(31, Math.floor(total)));
  const today = new Date();
  const points: MyRankProgressPoint[] = [];

  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - (count - 1 - i));
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const dateKey = `${y}-${m}-${day}`;
    const drift = Math.round((count - 1 - i) * 1.6);
    const rank =
      i === count - 1
        ? currentRank
        : Math.max(1, currentRank + drift + (i % 2 === 0 ? 2 : 0));
    points.push({ dateKey, rank });
  }

  return points;
}

/** Shadow ライバル帯 — 先週順位から今週順位へ向かう仮スナップショット */
export function buildMockShadowRivalProgressPoints(
  priorRank: number,
  currentRank: number,
  total = 7
): MyRankProgressPoint[] {
  const count = Math.max(2, Math.min(7, Math.floor(total)));
  const today = new Date();
  const points: MyRankProgressPoint[] = [];
  const span = currentRank - priorRank;

  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - (count - 1 - i));
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const dateKey = `${y}-${m}-${day}`;

    let rank: number;
    if (i === 0) {
      rank = priorRank;
    } else if (i === count - 1) {
      rank = currentRank;
    } else {
      const t = i / (count - 1);
      const wobble =
        (i % 2 === 0 ? 1 : -1) *
        Math.min(2, Math.max(1, Math.round(Math.abs(span) * 0.12)));
      rank = Math.max(1, Math.round(priorRank + span * t + wobble));
    }
    points.push({ dateKey, rank });
  }

  return points;
}

/** dev プレビュー — 順位変動幅の大きい仮スナップショット（Y軸スケール確認用） */
export function buildVolatileMockMyRankProgressPoints(
  currentRank: number,
  total = 10
): MyRankProgressPoint[] {
  const count = Math.max(1, Math.min(31, Math.floor(total)));
  const today = new Date();
  const points: MyRankProgressPoint[] = [];

  /** 古いほど悪化（順位数字が大きい）— 最後だけ currentRank */
  const swingPattern = [1, 0.82, 0.94, 0.58, 0.7, 0.38, 0.48, 0.22, 0.1, 0];
  const amplitude = Math.max(
    50,
    Math.min(150, Math.round(currentRank * 0.9 + 24))
  );

  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - (count - 1 - i));
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const dateKey = `${y}-${m}-${day}`;
    const patternIdx = Math.min(
      swingPattern.length - 1,
      Math.round((i / Math.max(1, count - 1)) * (swingPattern.length - 1))
    );
    const swing = swingPattern[patternIdx] ?? 0;
    const rank =
      i === count - 1
        ? currentRank
        : Math.max(1, Math.round(currentRank + amplitude * swing));
    points.push({ dateKey, rank });
  }

  return points;
}
