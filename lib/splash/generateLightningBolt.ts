/**
 * ジグザグ雷 Path 生成 — アニメ開始時に一度だけ呼ぶ。
 * 毎フレーム再生成しないこと。
 */

export type LightningPoint = { x: number; y: number };

export type LightningBranch = {
  points: LightningPoint[];
  /** 0 = メインからの枝、1 = 小枝 */
  depth: number;
};

export type LightningBoltResult = {
  main: LightningPoint[];
  branches: LightningBranch[];
};

export type GenerateLightningBoltOptions = {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  /** メインのセグメント数（推奨 8〜16） */
  segments?: number;
  /** 横方向振れ幅（画面幅の割合ではなく絶対 px） */
  jitter?: number;
  /** 各セグメントで枝を出す確率 0〜1 */
  branchProbability?: number;
  /** 枝の再帰深さ（1 = 枝のみ、2 = 小枝まで） */
  maxDepth?: number;
  /** 0〜1 の乱数。未指定時は Math.random */
  rng?: () => number;
};

function defaultRng(): number {
  return Math.random();
}

function buildSegmentChain(
  start: LightningPoint,
  end: LightningPoint,
  segments: number,
  jitter: number,
  rng: () => number
): LightningPoint[] {
  const points: LightningPoint[] = [{ ...start }];
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  // 進行方向に直交する単位ベクトル（横振れ用）
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;

  for (let i = 1; i < segments; i++) {
    const t = i / segments;
    // 端に近いほど jitter を抑える
    const edgeFade = Math.sin(Math.PI * t);
    const offset = (rng() * 2 - 1) * jitter * edgeFade;
    points.push({
      x: start.x + dx * t + nx * offset,
      y: start.y + dy * t + ny * offset,
    });
  }
  points.push({ ...end });
  return points;
}

function spawnBranch(
  from: LightningPoint,
  parentDir: LightningPoint,
  depth: number,
  maxDepth: number,
  jitter: number,
  branchProbability: number,
  rng: () => number,
  out: LightningBranch[],
  branchBudget: { remaining: number }
): void {
  if (depth > maxDepth || branchBudget.remaining <= 0) return;

  const parentLen = Math.hypot(parentDir.x, parentDir.y) || 1;
  const ux = parentDir.x / parentLen;
  const uy = parentDir.y / parentLen;
  // 左右に振り分け
  const side = rng() < 0.5 ? -1 : 1;
  const angle = (0.35 + rng() * 0.55) * side; // ラジアン相当の横振り
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const rx = ux * cos - uy * sin;
  const ry = ux * sin + uy * cos;

  const lengthScale = depth === 1 ? 0.28 + rng() * 0.35 : 0.14 + rng() * 0.22;
  const branchLen = parentLen * lengthScale;
  const end: LightningPoint = {
    x: from.x + rx * branchLen,
    y: from.y + ry * branchLen,
  };

  const segs = depth === 1 ? 4 + Math.floor(rng() * 4) : 3 + Math.floor(rng() * 3);
  const points = buildSegmentChain(
    from,
    end,
    segs,
    jitter * (depth === 1 ? 0.55 : 0.35),
    rng
  );
  out.push({ points, depth });
  branchBudget.remaining -= 1;

  // 小枝
  if (depth < maxDepth && branchBudget.remaining > 0) {
    for (let i = 1; i < points.length - 1; i++) {
      if (rng() > branchProbability * 0.7) continue;
      if (branchBudget.remaining <= 0) break;
      const a = points[i]!;
      const b = points[i + 1]!;
      spawnBranch(
        a,
        { x: b.x - a.x, y: b.y - a.y },
        depth + 1,
        maxDepth,
        jitter,
        branchProbability,
        rng,
        out,
        branchBudget
      );
    }
  }
}

/**
 * メイン雷 + 枝分かれを一度に生成する。
 * 枝合計はおおよそ 4〜20 本に収まるよう budget で制限。
 */
export function generateLightningBolt(
  options: GenerateLightningBoltOptions
): LightningBoltResult {
  const {
    startX,
    startY,
    endX,
    endY,
    segments = 12,
    jitter = 28,
    branchProbability = 0.42,
    maxDepth = 2,
    rng = defaultRng,
  } = options;

  const start = { x: startX, y: startY };
  const end = { x: endX, y: endY };
  const main = buildSegmentChain(start, end, segments, jitter, rng);

  const branches: LightningBranch[] = [];
  // メイン 1 + 枝 4〜10 + 小枝で合計 ~20 以内
  const branchBudget = { remaining: 8 + Math.floor(rng() * 8) };

  for (let i = 2; i < main.length - 2; i++) {
    if (branchBudget.remaining <= 0) break;
    if (rng() > branchProbability) continue;
    const a = main[i]!;
    const b = main[i + 1]!;
    spawnBranch(
      a,
      { x: b.x - a.x, y: b.y - a.y },
      1,
      maxDepth,
      jitter,
      branchProbability,
      rng,
      branches,
      branchBudget
    );
  }

  return { main, branches };
}

/** シード付き RNG（リプレイでも形を変えたい場合は playKey を混ぜる） */
export function createSeededRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

/** 点列 → SVG path 文字列（デバッグ / 非 Skia 用） */
export function lightningPointsToPathD(points: LightningPoint[]): string {
  if (points.length === 0) return "";
  const [first, ...rest] = points;
  let d = `M${first!.x.toFixed(2)} ${first!.y.toFixed(2)}`;
  for (const p of rest) {
    d += `L${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
  }
  return d;
}
