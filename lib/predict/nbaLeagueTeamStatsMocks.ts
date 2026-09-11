/**
 * リーグ視点の Team Stats mock（30 チーム）。
 * 予想オーバーレイの 2 チーム比較とは別。後で BallDontLie / 自前集計に差し替え。
 */
import type { UiStrings } from "@/lib/i18n/ui";
import { NBA_TEAM_NAME_BY_ID } from "@/lib/nba-team-names";
import {
  NBA_EAST_TEAM_IDS,
  NBA_WEST_TEAM_IDS,
  type NbaConferenceId,
} from "@/lib/nba/nbaConferenceTeams";
import type { NbaLeagueAdvancedCategory } from "@/lib/predict/nbaLeagueStatBoard";
import {
  chunkForChipGrid,
  NBA_LEAGUE_STAT_CHIP_COLS,
  NBA_LEAGUE_TEAM_ADVANCED_CATEGORIES,
} from "@/lib/predict/nbaLeagueStatBoard";
import {
  buildLeagueTeamAdvancedFields,
  formatTeamAdvancedValue,
  NBA_LEAGUE_TEAM_ADVANCED_METRIC_DEFS,
  teamAdvancedMetricsForCategory,
  type NbaLeagueTeamAdvancedFields,
  type NbaLeagueTeamAdvancedMetric,
} from "@/lib/predict/nbaLeagueTeamStatsAdvanced";
import { allowNbaStatsMockFallback } from "@/lib/nba/nbaStatsSnapshotCacheControl";
import type { NbaStatsSnapshotSource } from "@/lib/nba/nbaStatsSnapshotCacheControl";

export type NbaLeagueTeamCoreMetric =
  | "netrtg"
  | "ortg"
  | "drtg"
  | "pace"
  | "winPct"
  | "diff"
  | "ppg"
  | "papg"
  | "efgPct"
  | "fg3Pct"
  | "fg3a"
  | "tovPct";

export type NbaLeagueTeamStatMetric =
  | NbaLeagueTeamCoreMetric
  | NbaLeagueTeamAdvancedMetric;

export type NbaLeagueTeamStatWindow = "season" | "last10";

export type NbaLeagueTeamStatCoreRow = {
  teamId: string;
  teamName: string;
  conference: NbaConferenceId;
  wins: number;
  losses: number;
  winPct: number;
  ppg: number;
  papg: number;
  diff: number;
  ortg: number;
  drtg: number;
  netrtg: number;
  pace: number;
  /** Effective FG% (0–1) */
  efgPct: number;
  /** 3P% (0–1) */
  fg3Pct: number;
  /** 3PA per game */
  fg3a: number;
  /** Turnover % of possessions (0–1) */
  tovPct: number;
  /** Opponent FG% allowed (0–1) */
  oppFgPct: number;
  /** Opponent 3P% allowed (0–1) */
  oppFg3Pct: number;
  /** Opponent FT% allowed (0–1) */
  oppFtPct: number;
  /** Opponent rebounds allowed per game */
  oppReb: number;
  /** Opponent assists allowed per game */
  oppAst: number;
  /** Opponent turnovers forced per game */
  oppTov: number;
  /** Opponent offensive rebounds allowed per game */
  oppOreb: number;
  /** Opponent eFG% allowed (0–1) */
  oppEfgPct: number;
};

export type NbaLeagueTeamStatRow = NbaLeagueTeamStatCoreRow &
  NbaLeagueTeamAdvancedFields;

export type NbaLeagueTeamStatsBundle = {
  season: NbaLeagueTeamStatRow[];
  last10: NbaLeagueTeamStatRow[];
  asOfLabel: string;
};

export type NbaLeagueTeamStatMetricDef = {
  id: NbaLeagueTeamStatMetric;
  label: string;
  short: string;
  higherIsBetter: boolean;
  hint: UiStrings;
};

export const NBA_LEAGUE_TEAM_STAT_METRICS: readonly NbaLeagueTeamStatMetricDef[] =
  [
    {
      id: "winPct",
      label: "Win %",
      short: "W%",
      higherIsBetter: true,
      hint: {
        ja: "勝率。結果そのものの順位。",
        en: "Win percentage. Standings outcome.",
        ko: "승률. 결과 그 자체의 순위.",
        zh: "胜率。最直接的战绩排名。",
        es: "Porcentaje de victorias. El resultado puro.",
        pt: "Percentual de vitórias. O resultado puro.",
        fr: "Pourcentage de victoires. Le résultat brut.",
      },
    },
    {
      id: "netrtg",
      label: "Net Rating",
      short: "NET",
      higherIsBetter: true,
      hint: {
        ja: "100possあたりの得失点差。チームの強さの目安。",
        en: "Point diff per 100 possessions. Overall team strength.",
        ko: "100포제션당 득실 차. 팀 전력의 기준.",
        zh: "每100回合净胜分。衡量球队整体实力。",
        es: "Diferencial por 100 posesiones. Fuerza global del equipo.",
        pt: "Saldo de pontos por 100 posses. Força geral do time.",
        fr: "Différentiel par 100 possessions. Force globale de l’équipe.",
      },
    },
    {
      id: "ortg",
      label: "Off Rating",
      short: "ORTG",
      higherIsBetter: true,
      hint: {
        ja: "100possあたりの得点。攻撃力。",
        en: "Points scored per 100 possessions. Offense.",
        ko: "100포제션당 득점. 공격력.",
        zh: "每100回合得分。进攻能力。",
        es: "Puntos por 100 posesiones. Ataque.",
        pt: "Pontos por 100 posses. Ataque.",
        fr: "Points par 100 possessions. Attaque.",
      },
    },
    {
      id: "drtg",
      label: "Def Rating",
      short: "DRTG",
      higherIsBetter: false,
      hint: {
        ja: "100possあたりの失点。低いほど DF がいい。",
        en: "Points allowed per 100 possessions. Lower is better defense.",
        ko: "100포제션당 실점. 낮을수록 수비가 좋음.",
        zh: "每100回合失分。越低说明防守越好。",
        es: "Puntos concedidos por 100 posesiones. Más bajo = mejor defensa.",
        pt: "Pontos cedidos por 100 posses. Menor = melhor defesa.",
        fr: "Points concédés par 100 possessions. Plus bas = meilleure défense.",
      },
    },
    {
      id: "pace",
      label: "Pace",
      short: "PACE",
      higherIsBetter: true,
      hint: {
        ja: "1試合あたりの poss 数。高いほどテンポが速い。",
        en: "Possessions per game. Higher means faster pace.",
        ko: "경기당 포제션 수. 높을수록 템포가 빠름.",
        zh: "场均回合数。越高说明节奏越快。",
        es: "Posesiones por partido. Más alto = ritmo más rápido.",
        pt: "Posses por jogo. Maior = ritmo mais rápido.",
        fr: "Possessions par match. Plus haut = rythme plus rapide.",
      },
    },
    {
      id: "diff",
      label: "Point Diff",
      short: "DIFF",
      higherIsBetter: true,
      hint: {
        ja: "1 試合平均の得失点差。",
        en: "Average point differential per game.",
        ko: "경기당 평균 득실 차.",
        zh: "场均净胜分。",
        es: "Diferencial de puntos por partido.",
        pt: "Saldo de pontos por jogo.",
        fr: "Différentiel de points par match.",
      },
    },
    {
      id: "ppg",
      label: "Points / G",
      short: "PPG",
      higherIsBetter: true,
      hint: {
        ja: "1 試合平均得点。",
        en: "Average points scored per game.",
        ko: "경기당 평균 득점.",
        zh: "场均得分。",
        es: "Puntos anotados por partido.",
        pt: "Pontos marcados por jogo.",
        fr: "Points marqués par match.",
      },
    },
    {
      id: "papg",
      label: "Opp Points / G",
      short: "PA",
      higherIsBetter: false,
      hint: {
        ja: "1 試合平均失点。低いほど良い。",
        en: "Average points allowed per game. Lower is better.",
        ko: "경기당 평균 실점. 낮을수록 좋음.",
        zh: "场均失分。越低越好。",
        es: "Puntos concedidos por partido. Más bajo, mejor.",
        pt: "Pontos cedidos por jogo. Menor é melhor.",
        fr: "Points concédés par match. Plus bas, mieux.",
      },
    },
    {
      id: "efgPct",
      label: "eFG%",
      short: "EFG",
      higherIsBetter: true,
      hint: {
        ja: "実効 FG%。3P の価値を込めたシュート精度。",
        en: "Effective FG%. Shooting efficiency including 3s.",
        ko: "실질 야투 성공률(eFG%). 3점의 가치를 반영.",
        zh: "有效命中率：计入三分价值的投篮效率。",
        es: "eFG%: eficiencia de tiro contando el valor del triple.",
        pt: "eFG%: eficiência de arremesso contando o valor do 3.",
        fr: "eFG% : efficacité au tir intégrant la valeur du 3 pts.",
      },
    },
    {
      id: "fg3Pct",
      label: "3P%",
      short: "3P%",
      higherIsBetter: true,
      hint: {
        ja: "3 ポイント成功率。",
        en: "Three-point percentage.",
        ko: "3점 성공률.",
        zh: "三分命中率。",
        es: "Porcentaje de triples.",
        pt: "Aproveitamento de 3 pontos.",
        fr: "Pourcentage à 3 points.",
      },
    },
    {
      id: "fg3a",
      label: "3PA / G",
      short: "3PA",
      higherIsBetter: true,
      hint: {
        ja: "1 試合平均の 3 ポイント試投数。外への依存度。",
        en: "Three-point attempts per game. Perimeter volume.",
        ko: "경기당 3점 시도. 외곽 의존도.",
        zh: "场均三分出手数。外线依赖程度。",
        es: "Triples intentados por partido. Volumen exterior.",
        pt: "Tentativas de 3 por jogo. Volume de perímetro.",
        fr: "Tirs à 3 pts tentés par match. Volume extérieur.",
      },
    },
    {
      id: "tovPct",
      label: "TOV%",
      short: "TOV",
      higherIsBetter: false,
      hint: {
        ja: "possあたりのターンオーバー率。低いほど良い。",
        en: "Turnover rate on possessions. Lower is better.",
        ko: "포제션당 턴오버 비율. 낮을수록 좋음.",
        zh: "每回合失误率。越低越好。",
        es: "Tasa de pérdidas por posesión. Más bajo, mejor.",
        pt: "Taxa de turnovers por posse. Menor é melhor.",
        fr: "Taux de pertes de balle par possession. Plus bas, mieux.",
      },
    },
  ] as const;

/** 指標チップ 2 行（6 + 6）— Team Detail など既存画面用 */
export const NBA_LEAGUE_TEAM_STAT_METRIC_ROWS: readonly (
  readonly NbaLeagueTeamStatMetricDef[]
)[] = [
  NBA_LEAGUE_TEAM_STAT_METRICS.slice(0, 6),
  NBA_LEAGUE_TEAM_STAT_METRICS.slice(6, 12),
];

const CORE_METRIC_BY_ID = new Map(
  NBA_LEAGUE_TEAM_STAT_METRICS.map((m) => [m.id, m])
);
const ADV_METRIC_BY_ID = new Map(
  NBA_LEAGUE_TEAM_ADVANCED_METRIC_DEFS.map((m) => [m.id, m])
);

function coreDef(id: NbaLeagueTeamCoreMetric): NbaLeagueTeamStatMetricDef {
  const found = CORE_METRIC_BY_ID.get(id);
  if (!found) throw new Error(`unknown core metric ${id}`);
  return found;
}

function advAsBoardDef(
  id: NbaLeagueTeamAdvancedMetric
): NbaLeagueTeamStatMetricDef {
  const found = ADV_METRIC_BY_ID.get(id);
  if (!found) throw new Error(`unknown advanced metric ${id}`);
  return {
    id: found.id,
    short: found.short,
    label: found.label,
    higherIsBetter: found.higherIsBetter,
    hint: found.hint,
  };
}

/** Basic 先頭（勝率 + レーティング） */
export const NBA_LEAGUE_TEAM_PINNED_METRICS: readonly NbaLeagueTeamStatMetricDef[] =
  [
    coreDef("winPct"),
    coreDef("netrtg"),
    coreDef("ortg"),
    coreDef("drtg"),
    coreDef("pace"),
    advAsBoardDef("tsPct"),
  ];

/** Basic タブのチップ（レーティング + ボックス） */
export const NBA_LEAGUE_TEAM_BASIC_METRICS: readonly NbaLeagueTeamStatMetricDef[] =
  [
    ...NBA_LEAGUE_TEAM_PINNED_METRICS,
    coreDef("ppg"),
    coreDef("papg"),
    coreDef("diff"),
    advAsBoardDef("fgPct"),
    coreDef("fg3Pct"),
    coreDef("fg3a"),
    advAsBoardDef("ftPct"),
  ];

export const NBA_LEAGUE_TEAM_BASIC_METRIC_ROWS = chunkForChipGrid(
  NBA_LEAGUE_TEAM_BASIC_METRICS,
  NBA_LEAGUE_STAT_CHIP_COLS
);

const TEAM_ADVANCED_CORE_BY_CATEGORY: Record<
  NbaLeagueAdvancedCategory,
  readonly NbaLeagueTeamCoreMetric[]
> = {
  ratings: [],
  fourFactors: ["efgPct", "tovPct"],
  scoring: [],
  shooting: [],
  clutch: [],
  playtype: [],
  defense: [],
  tracking: [],
  hustle: [],
};

export function teamBoardMetricsForCategory(
  category: NbaLeagueAdvancedCategory
): NbaLeagueTeamStatMetricDef[] {
  const core = TEAM_ADVANCED_CORE_BY_CATEGORY[category].map(coreDef);
  const extra = teamAdvancedMetricsForCategory(category).map((m) =>
    advAsBoardDef(m.id)
  );
  return [...core, ...extra];
}

export function teamBoardMetricChipRows(category: NbaLeagueAdvancedCategory) {
  return chunkForChipGrid(
    teamBoardMetricsForCategory(category),
    NBA_LEAGUE_STAT_CHIP_COLS
  );
}

export type NbaLeagueTeamRailGroup = {
  id: string;
  short: string;
  metrics: readonly NbaLeagueTeamStatMetricDef[];
};

/** 左レール。BASIC の下に Advanced カテゴリが親として並ぶ。 */
export function leagueTeamRailGroups(): NbaLeagueTeamRailGroup[] {
  return [
    {
      id: "basic",
      short: "BASIC",
      metrics: NBA_LEAGUE_TEAM_BASIC_METRICS,
    },
    ...NBA_LEAGUE_TEAM_ADVANCED_CATEGORIES.map((c) => ({
      id: c.id,
      short: c.short,
      metrics: teamBoardMetricsForCategory(c.id),
    })),
  ].filter((g) => g.metrics.length > 0);
}

/**
 * Last 10 はリーグ表タブでは出さない（BDL に season 同粒度なし）。
 * マッチアップ FORM 用に rows には残す: W–L/PPG + box 推定 ORTG/DRTG/NET/pace/3P。
 * @deprecated レール用。Team 表は常に `leagueTeamRailGroups()`。
 */
export const NBA_LEAGUE_TEAM_LAST10_METRICS: readonly NbaLeagueTeamStatMetricDef[] =
  [coreDef("winPct"), coreDef("ppg"), coreDef("papg"), coreDef("diff")];

export function leagueTeamRailGroupsForMode(
  mode: "per_game" | "total" | "last10"
): NbaLeagueTeamRailGroup[] {
  // Team Last 10 タブ廃止 — どの mode でもフルレール（PER GAME / TOTAL）
  void mode;
  return leagueTeamRailGroups();
}

export function leagueMetricDef(
  id: NbaLeagueTeamStatMetric
): NbaLeagueTeamStatMetricDef {
  const core = CORE_METRIC_BY_ID.get(id as NbaLeagueTeamCoreMetric);
  if (core) return core;
  return advAsBoardDef(id as NbaLeagueTeamAdvancedMetric);
}

export function isLeagueTeamAdvancedMetric(
  id: NbaLeagueTeamStatMetric
): id is NbaLeagueTeamAdvancedMetric {
  return ADV_METRIC_BY_ID.has(id as NbaLeagueTeamAdvancedMetric);
}

export function zeroFillLeagueTeamAdvancedFields(): NbaLeagueTeamAdvancedFields {
  const out = {} as NbaLeagueTeamAdvancedFields;
  for (const d of NBA_LEAGUE_TEAM_ADVANCED_METRIC_DEFS) {
    out[d.id] = 0;
  }
  return out;
}

function coreFromRow(row: NbaLeagueTeamStatRow): NbaLeagueTeamStatCoreRow {
  const {
    teamId,
    teamName,
    conference,
    wins,
    losses,
    winPct,
    ppg,
    papg,
    diff,
    ortg,
    drtg,
    netrtg,
    pace,
    efgPct,
    fg3Pct,
    fg3a,
    tovPct,
    oppFgPct,
    oppFg3Pct,
    oppFtPct,
    oppReb,
    oppAst,
    oppTov,
    oppOreb,
    oppEfgPct,
  } = row;
  return {
    teamId,
    teamName,
    conference,
    wins,
    losses,
    winPct,
    ppg,
    papg,
    diff,
    ortg,
    drtg,
    netrtg,
    pace,
    efgPct,
    fg3Pct,
    fg3a,
    tovPct,
    oppFgPct,
    oppFg3Pct,
    oppFtPct,
    oppReb,
    oppAst,
    oppTov,
    oppOreb,
    oppEfgPct,
  };
}

function advancedPartialFromRow(
  row: NbaLeagueTeamStatRow | Record<string, unknown>
): Partial<NbaLeagueTeamAdvancedFields> {
  const out: Partial<NbaLeagueTeamAdvancedFields> = {};
  for (const d of NBA_LEAGUE_TEAM_ADVANCED_METRIC_DEFS) {
    const v = row[d.id];
    if (typeof v === "number" && Number.isFinite(v)) out[d.id] = v;
  }
  return out;
}

/** Firestore / 実データ行 — advanced は渡された値のみ、無ければ 0 */
export function attachLeagueTeamAdvanced(
  row: NbaLeagueTeamStatCoreRow,
  _window: NbaLeagueTeamStatWindow,
  advanced?: Partial<NbaLeagueTeamAdvancedFields>
): NbaLeagueTeamStatRow {
  const base = zeroFillLeagueTeamAdvancedFields();
  if (advanced) {
    for (const d of NBA_LEAGUE_TEAM_ADVANCED_METRIC_DEFS) {
      const v = advanced[d.id];
      if (typeof v === "number" && Number.isFinite(v)) base[d.id] = v;
    }
  }
  return { ...row, ...base };
}

/** モック bundle 専用 — mulberry で clutch / playtype を生成 */
export function attachMockLeagueTeamAdvanced(
  row: NbaLeagueTeamStatCoreRow,
  window: NbaLeagueTeamStatWindow
): NbaLeagueTeamStatRow {
  return {
    ...row,
    ...buildLeagueTeamAdvancedFields(row, window),
  };
}

function ensureRowAdvanced(
  row: NbaLeagueTeamStatRow,
  window: NbaLeagueTeamStatWindow
): NbaLeagueTeamStatRow {
  return attachLeagueTeamAdvanced(
    coreFromRow(row),
    window,
    advancedPartialFromRow(row)
  );
}

/** API / Firestore の行 — 偽 advanced を足さない */
export function enrichLeagueTeamStatsBundle(
  bundle: NbaLeagueTeamStatsBundle,
  source?: NbaStatsSnapshotSource
): NbaLeagueTeamStatsBundle {
  const useMock = allowNbaStatsMockFallback() && source === "mock";
  if (useMock) {
    return {
      asOfLabel: bundle.asOfLabel,
      season: bundle.season.map((row) =>
        attachMockLeagueTeamAdvanced(coreFromRow(row), "season")
      ),
      last10: bundle.last10.map((row) =>
        attachMockLeagueTeamAdvanced(coreFromRow(row), "last10")
      ),
    };
  }
  return {
    asOfLabel: bundle.asOfLabel,
    season: bundle.season.map((row) => ensureRowAdvanced(row, "season")),
    last10: bundle.last10.map((row) => ensureRowAdvanced(row, "last10")),
  };
}

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function pct3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

function buildRow(
  teamId: string,
  conference: NbaConferenceId,
  window: NbaLeagueTeamStatWindow
): NbaLeagueTeamStatRow {
  const rnd = mulberry32(hashSeed(`${teamId}:${window}:v2`));
  const tier = rnd();
  const winPctBase = 0.28 + tier * 0.44 + (rnd() - 0.5) * 0.06;
  const winPct = Math.min(0.82, Math.max(0.18, winPctBase));
  const games = window === "season" ? 72 : 10;
  const wins = Math.round(winPct * games);
  const losses = games - wins;

  const netBase = (winPct - 0.5) * 28 + (rnd() - 0.5) * 2.4;
  const pace = round1(96 + rnd() * 8 + (window === "last10" ? (rnd() - 0.5) * 2 : 0));
  const ortg = round1(108 + netBase * 0.55 + (rnd() - 0.5) * 3);
  const drtg = round1(ortg - netBase + (rnd() - 0.5) * 1.2);
  const netrtg = round1(ortg - drtg);
  const ppg = round1(pace * (ortg / 100) * 0.98 + (rnd() - 0.5) * 1.5);
  const papg = round1(ppg - netrtg * 0.95 + (rnd() - 0.5) * 1.2);
  const diff = round1(ppg - papg);

  const fg3Pct = pct3(0.335 + tier * 0.06 + (rnd() - 0.5) * 0.02);
  const fg3a = round1(32 + tier * 10 + rnd() * 6);
  const efgPct = pct3(0.51 + tier * 0.05 + fg3Pct * 0.08 + (rnd() - 0.5) * 0.015);
  const tovPct = pct3(0.145 - tier * 0.02 + (rnd() - 0.5) * 0.012);

  const core: NbaLeagueTeamStatCoreRow = {
    teamId,
    teamName: NBA_TEAM_NAME_BY_ID[teamId] ?? teamId,
    conference,
    wins,
    losses,
    winPct: pct3(winPct),
    ppg,
    papg,
    diff,
    ortg,
    drtg,
    netrtg,
    pace,
    efgPct,
    fg3Pct,
    fg3a,
    tovPct,
    oppFgPct: 0,
    oppFg3Pct: 0,
    oppFtPct: 0,
    oppReb: 0,
    oppAst: 0,
    oppTov: 0,
    oppOreb: 0,
    oppEfgPct: 0,
  };
  return attachMockLeagueTeamAdvanced(core, window);
}

function buildWindow(window: NbaLeagueTeamStatWindow): NbaLeagueTeamStatRow[] {
  const rows: NbaLeagueTeamStatRow[] = [];
  for (const id of NBA_EAST_TEAM_IDS) {
    rows.push(buildRow(id, "east", window));
  }
  for (const id of NBA_WEST_TEAM_IDS) {
    rows.push(buildRow(id, "west", window));
  }
  return rows;
}

let cached: NbaLeagueTeamStatsBundle | null = null;
let cacheVer: string | null = null;
const MOCK_CACHE_KEY = "v7-team-detail-how";

/** 安定モック（呼び出しごとに同じ値） */
export function getNbaLeagueTeamStatsMock(): NbaLeagueTeamStatsBundle {
  if (cached && cacheVer === MOCK_CACHE_KEY) return cached;
  cacheVer = MOCK_CACHE_KEY;
  cached = {
    season: buildWindow("season"),
    last10: buildWindow("last10"),
    asOfLabel: "MOCK · 2025-26",
  };
  return cached;
}

export function metricValue(
  row: NbaLeagueTeamStatRow,
  metric: NbaLeagueTeamStatMetric
): number {
  const v = row[metric];
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

export function formatMetricValue(
  metric: NbaLeagueTeamStatMetric,
  value: number | null | undefined
): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  if (isLeagueTeamAdvancedMetric(metric)) {
    return formatTeamAdvancedValue(metric, value);
  }
  if (metric === "winPct" || metric === "efgPct" || metric === "fg3Pct") {
    return `${(value * 100).toFixed(1)}%`;
  }
  if (metric === "tovPct") {
    return `${(value * 100).toFixed(1)}%`;
  }
  if (metric === "diff" || metric === "netrtg") {
    return `${value > 0 ? "+" : ""}${value.toFixed(1)}`;
  }
  return value.toFixed(1);
}

export function teamGamesPlayed(row: NbaLeagueTeamStatRow): number {
  return row.wins + row.losses;
}

export function formatTeamRecord(row: NbaLeagueTeamStatRow): string {
  return `${row.wins}-${row.losses}`;
}

/** 表の並び順（指標値の大小） */
export type NbaLeagueTeamStatSortDir = "desc" | "asc";

/** 指標の「良い方向」をデフォルトの並びにする */
export function defaultLeagueTeamStatSortDir(
  higherIsBetter: boolean
): NbaLeagueTeamStatSortDir {
  return higherIsBetter ? "desc" : "asc";
}

export function sortLeagueTeamRows(
  rows: readonly NbaLeagueTeamStatRow[],
  metric: NbaLeagueTeamStatMetric,
  dir: NbaLeagueTeamStatSortDir
): NbaLeagueTeamStatRow[] {
  return [...rows].sort((a, b) => {
    const av = metricValue(a, metric);
    const bv = metricValue(b, metric);
    if (av === bv) return a.teamName.localeCompare(b.teamName);
    const cmp = bv - av;
    return dir === "desc" ? cmp : -cmp;
  });
}
