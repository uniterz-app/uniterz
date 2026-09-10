/**
 * リーグ表（Team / Player）共通: Season·L10 の中の Basic / Advanced。
 * 選択タブ本体は触らない。並びとチップ分割だけここで持つ。
 */
import type { UiStrings } from "@/lib/i18n/ui";

export type NbaLeagueStatBoardMode = "basic" | "advanced";

export type NbaLeagueAdvancedCategory =
  | "ratings"
  | "fourFactors"
  | "scoring"
  | "shooting"
  | "clutch"
  | "playtype"
  | "defense"
  | "tracking"
  | "hustle";

export type NbaLeagueAdvancedCategoryDef = {
  id: NbaLeagueAdvancedCategory;
  short: string;
  label: string;
  hint: UiStrings;
};

export const NBA_LEAGUE_ADVANCED_CATEGORIES: readonly NbaLeagueAdvancedCategoryDef[] =
  [
    {
      id: "ratings",
      short: "RATINGS",
      label: "Ratings",
      hint: {
        ja: "レーティング。総合の効率。",
        en: "On-court ratings and efficiency.",
        ko: "레이팅. 종합 효율.",
        zh: "效率值。整体效率表现。",
        es: "Ratings en pista y eficiencia.",
        pt: "Ratings em quadra e eficiência.",
        fr: "Ratings sur le terrain et efficacité.",
      },
    },
    {
      id: "fourFactors",
      short: "4FCT",
      label: "Four Factors",
      hint: {
        ja: "Four Factors。シュート・TO・FT・OREB。",
        en: "Four Factors: shooting, TOs, free throws, OREB.",
        ko: "포 팩터: 슈팅·턴오버·자유투·공격 리바운드.",
        zh: "四大要素：投篮、失误、罚球、进攻篮板。",
        es: "Four Factors: tiro, pérdidas, tiros libres, OREB.",
        pt: "Four Factors: arremesso, turnovers, lances livres, OREB.",
        fr: "Four Factors : tir, pertes de balle, lancers francs, OREB.",
      },
    },
    {
      id: "scoring",
      short: "SCORING",
      label: "Scoring mix",
      hint: {
        ja: "どこから何点取っているか（1試合平均）。",
        en: "Points per game from each source.",
        ko: "어디서 몇 점을 얻는지(경기당).",
        zh: "各得分来源的场均得分。",
        es: "Puntos por partido según su origen.",
        pt: "Pontos por jogo por origem.",
        fr: "Points par match selon leur origine.",
      },
    },
    {
      id: "shooting",
      short: "SHOT",
      label: "Shot spots",
      hint: {
        ja: "restricted とコーナー3。精度と、そこからの得点。",
        en: "Restricted area and corner 3s — accuracy and points.",
        ko: "제한구역과 코너 3점. 성공률과 득점.",
        zh: "禁区与底角三分：命中率与得分。",
        es: "Zona restringida y triples de esquina: acierto y puntos.",
        pt: "Área restrita e 3 de canto: acerto e pontos.",
        fr: "Zone restreinte et 3 pts de coin : réussite et points.",
      },
    },
    {
      id: "clutch",
      short: "CLUTCH",
      label: "Clutch",
      hint: {
        ja: "残り5分・僅差の数字。",
        en: "Last 5 minutes, close games.",
        ko: "종료 5분 전, 접전 상황 수치.",
        zh: "最后5分钟、分差接近时的数据。",
        es: "Últimos 5 minutos en partidos ajustados.",
        pt: "Últimos 5 minutos em jogos apertados.",
        fr: "5 dernières minutes, matchs serrés.",
      },
    },
    {
      id: "playtype",
      short: "PLAYTYPE",
      label: "Playtype",
      hint: {
        ja: "どう点を取っているか（1試合あたりの得点）。",
        en: "How points are created (points per game).",
        ko: "어떻게 득점하는지(경기당 득점).",
        zh: "得分是如何创造的（场均得分）。",
        es: "Cómo se generan los puntos (por partido).",
        pt: "Como os pontos são criados (por jogo).",
        fr: "Comment les points sont créés (par match).",
      },
    },
    {
      id: "defense",
      short: "DEFENSE",
      label: "Defense",
      hint: {
        ja: "相手に許している数字 / マッチアップ。",
        en: "What opponents get / matchup defense.",
        ko: "상대에게 허용한 수치 / 매치업 수비.",
        zh: "对手取得的数据／对位防守。",
        es: "Lo que logra el rival / defensa en matchup.",
        pt: "O que o adversário consegue / defesa no matchup.",
        fr: "Ce que concède l’équipe / défense en duel.",
      },
    },
    {
      id: "tracking",
      short: "TRACK",
      label: "Tracking",
      hint: {
        ja: "ドライブ回数と得点。C&S / プルアップは精度と得点。",
        en: "Drive volume and points. Catch-and-shoot / pull-up FG% plus points.",
        ko: "드라이브 횟수와 득점. 캐치&슛 / 풀업은 성공률과 득점.",
        zh: "突破次数与得分。接球投与拉杆跳投的命中率和得分。",
        es: "Volumen de penetraciones y puntos. FG% y puntos en catch-and-shoot / pull-up.",
        pt: "Volume de drives e pontos. FG% e pontos em catch-and-shoot / pull-up.",
        fr: "Volume de pénétrations et points. FG% et points en catch-and-shoot / pull-up.",
      },
    },
    {
      id: "hustle",
      short: "HUSTLE",
      label: "Hustle",
      hint: {
        ja: "ディフレクション、チャージ、ルーズボール。",
        en: "Deflections, charges, loose balls.",
        ko: "디플렉션, 차징 유도, 루즈볼.",
        zh: "干扰球、造进攻犯规、争抢球。",
        es: "Desvíos, cargas provocadas, balones sueltos.",
        pt: "Desvios, faltas de ataque provocadas, bolas soltas.",
        fr: "Déviations, fautes offensives provoquées, ballons perdus.",
      },
    },
  ] as const;

export const NBA_LEAGUE_STAT_CHIP_COLS = 6;
export const NBA_LEAGUE_ADV_CATEGORY_COLS = 4;

export function chunkForChipGrid<T>(
  items: readonly T[],
  cols: number
): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += cols) {
    rows.push([...items.slice(i, i + cols)]);
  }
  return rows;
}

export const NBA_LEAGUE_ADVANCED_CATEGORY_ROWS = chunkForChipGrid(
  NBA_LEAGUE_ADVANCED_CATEGORIES,
  NBA_LEAGUE_ADV_CATEGORY_COLS
);

/** チーム表: Ratings は Basic、SHOT は選手のみ */
export const NBA_LEAGUE_TEAM_ADVANCED_CATEGORIES =
  NBA_LEAGUE_ADVANCED_CATEGORIES.filter(
    (c) => c.id !== "ratings" && c.id !== "shooting"
  );

export const NBA_LEAGUE_TEAM_ADVANCED_CATEGORY_ROWS = chunkForChipGrid(
  NBA_LEAGUE_TEAM_ADVANCED_CATEGORIES,
  NBA_LEAGUE_ADV_CATEGORY_COLS
);

export function leagueAdvancedCategoryDef(
  id: NbaLeagueAdvancedCategory
): NbaLeagueAdvancedCategoryDef {
  const found = NBA_LEAGUE_ADVANCED_CATEGORIES.find((c) => c.id === id);
  if (!found) throw new Error(`unknown advanced category ${id}`);
  return found;
}
