/**
 * リーグ Team Stats の Advanced 指標（モック）。
 * Firestore スナップショットにはまだ無いので、core 行に後付けする。
 */
import type { UiStrings } from "@/lib/i18n/ui";
import type { NbaLeagueAdvancedCategory } from "@/lib/predict/nbaLeagueStatBoard";
import { chunkForChipGrid, NBA_LEAGUE_STAT_CHIP_COLS } from "@/lib/predict/nbaLeagueStatBoard";

type TeamStatWindow = "season" | "last10";

export type NbaLeagueTeamAdvancedMetric =
  | "fgPct"
  | "ftPct"
  | "tsPct"
  | "ftaRate"
  | "orebPct"
  | "oppEfgPct"
  | "oppTovPct"
  | "oppFtaRate"
  | "oppOrebPct"
  | "pctPts3"
  | "pctPtsPaint"
  | "pctPtsFt"
  | "pctPtsFb"
  | "pctPtsTov"
  | "pts3"
  | "ptsPaint"
  | "ptsFt"
  | "ptsFb"
  | "ptsTov"
  | "ptsSecondChance"
  | "oppPtsPaint"
  | "oppPtsFb"
  | "oppPtsOffTov"
  | "oppPtsSecondChance"
  | "clutchNet"
  | "clutchOrtg"
  | "clutchDrtg"
  | "clutchEfg"
  | "isoPpp"
  | "pnrBhPpp"
  | "pnrRollPpp"
  | "spotupPpp"
  | "transPpp"
  | "cutPpp"
  | "postPpp"
  | "isoPts"
  | "pnrBhPts"
  | "pnrRollPts"
  | "spotupPts"
  | "transPts"
  | "cutPts"
  | "postPts"
  | "isoFreq"
  | "pnrBhFreq"
  | "pnrRollFreq"
  | "spotupFreq"
  | "transFreq"
  | "cutFreq"
  | "postFreq"
  | "rimFgPct"
  | "corner3Pct"
  | "fgPctAllowed"
  | "fg3PctAllowed"
  | "rebAllowed"
  | "astAllowed"
  | "tovForced"
  | "drives"
  | "drivePts"
  | "cnsFgPct"
  | "cnsPts"
  | "pullupFgPct"
  | "pullupPts"
  | "passes"
  | "speed"
  | "paintTouches"
  | "paintTouchPts"
  | "deflections"
  | "charges"
  | "looseBalls"
  | "screenAst"
  | "contestedShots";

export type NbaLeagueTeamAdvancedFields = Record<
  NbaLeagueTeamAdvancedMetric,
  number
>;

export type NbaLeagueTeamAdvancedMetricDef = {
  id: NbaLeagueTeamAdvancedMetric;
  short: string;
  label: string;
  higherIsBetter: boolean;
  hint: UiStrings;
  category: NbaLeagueAdvancedCategory | "basic";
  format: "pct" | "signed" | "ppp" | "one";
  /** false = リーグ表チップに出さない（詳細専用） */
  showInLeague: boolean;
};

function def(
  id: NbaLeagueTeamAdvancedMetric,
  short: string,
  label: string,
  category: NbaLeagueAdvancedCategory | "basic",
  higherIsBetter: boolean,
  format: NbaLeagueTeamAdvancedMetricDef["format"],
  hint: UiStrings,
  showInLeague = true
): NbaLeagueTeamAdvancedMetricDef {
  return {
    id,
    short,
    label,
    category,
    higherIsBetter,
    format,
    hint,
    showInLeague,
  };
}

export const NBA_LEAGUE_TEAM_ADVANCED_METRIC_DEFS: readonly NbaLeagueTeamAdvancedMetricDef[] =
  [
    def("fgPct", "FG%", "Field Goal %", "basic", true, "pct", {
      ja: "フィールドゴール成功率。",
      en: "Field goal percentage.",
      ko: "필드골 성공률.",
      zh: "投篮命中率。",
      es: "Porcentaje de tiros de campo.",
      pt: "Aproveitamento de arremessos de quadra.",
      fr: "Pourcentage aux tirs.",
    }),
    def("ftPct", "FT%", "Free Throw %", "basic", true, "pct", {
      ja: "フリースロー成功率。",
      en: "Free throw percentage.",
      ko: "자유투 성공률.",
      zh: "罚球命中率。",
      es: "Porcentaje de tiros libres.",
      pt: "Aproveitamento de lances livres.",
      fr: "Pourcentage aux lancers francs.",
    }),
    def("tsPct", "TS%", "True Shooting %", "basic", true, "pct", {
      ja: "3P と FT を込めたシュート効率。",
      en: "True shooting. Efficiency including 3s and FTs.",
      ko: "3점과 자유투를 포함한 슈팅 효율(TS%).",
      zh: "真实命中率：包含三分与罚球的投篮效率。",
      es: "True shooting: eficiencia incluyendo triples y libres.",
      pt: "True shooting: eficiência incluindo 3 e lances livres.",
      fr: "True shooting : efficacité incluant 3 pts et lancers.",
    }),
    def("ftaRate", "FTr", "FT Attempt Rate", "fourFactors", true, "pct", {
      ja: "FGA に対する FTA。フリースローをもらう力。",
      en: "FTA per FGA. Ability to get to the line.",
      ko: "야투 시도당 자유투 시도. 자유투를 얻어내는 능력.",
      zh: "罚球出手／投篮出手。造罚球的能力。",
      es: "FTA por FGA. Capacidad de ir a la línea.",
      pt: "FTA por FGA. Capacidade de ir à linha.",
      fr: "LF tentés par tir tenté. Capacité à provoquer des fautes.",
    }),
    def("orebPct", "OREB%", "Offensive Rebound %", "fourFactors", true, "pct", {
      ja: "オフェンスリバウンド率。",
      en: "Offensive rebound percentage.",
      ko: "공격 리바운드 비율.",
      zh: "进攻篮板率。",
      es: "Porcentaje de rebote ofensivo.",
      pt: "Percentual de rebote ofensivo.",
      fr: "Pourcentage de rebonds offensifs.",
    }),
    def("oppEfgPct", "oEFG", "Opp eFG%", "fourFactors", false, "pct", {
      ja: "相手に許した eFG%。低いほど良い。",
      en: "Opponent eFG%. Lower is better.",
      ko: "상대에게 허용한 eFG%. 낮을수록 좋음.",
      zh: "对手 eFG%。越低越好。",
      es: "eFG% del rival. Cuanto más bajo, mejor.",
      pt: "eFG% do adversário. Quanto menor, melhor.",
      fr: "eFG% adverse. Plus bas, mieux c’est.",
    }),
    def("oppTovPct", "oTOV", "Opp TOV%", "fourFactors", true, "pct", {
      ja: "相手のターンオーバー率。高いほど誘発できている。",
      en: "Opponent turnover rate. Higher means more forced TOs.",
      ko: "상대 턴오버 비율. 높을수록 많이 유도.",
      zh: "对手失误率。越高说明造失误越多。",
      es: "Tasa de pérdidas del rival. Más alta = más robos forzados.",
      pt: "Taxa de turnovers do adversário. Maior = mais erros forçados.",
      fr: "Taux de pertes de balle adverse. Plus haut = plus provoqué.",
    }),
    def("oppFtaRate", "oFTr", "Opp FT Rate", "fourFactors", false, "pct", {
      ja: "相手の FTA レート。低いほどファウルが少ない。",
      en: "Opponent FT rate. Lower means fewer fouls.",
      ko: "상대 자유투 비율. 낮을수록 파울이 적음.",
      zh: "对手罚球率。越低说明犯规越少。",
      es: "Tasa de FT del rival. Más baja = menos faltas.",
      pt: "Taxa de FT do adversário. Menor = menos faltas.",
      fr: "Taux de LF adverse. Plus bas = moins de fautes.",
    }),
    def("oppOrebPct", "oORB", "Opp OREB%", "fourFactors", false, "pct", {
      ja: "相手の OREB%。低いほどボックスアウトが良い。",
      en: "Opponent OREB%. Lower is better boxing out.",
      ko: "상대 OREB%. 낮을수록 박스아웃이 좋음.",
      zh: "对手进攻篮板率。越低说明卡位越好。",
      es: "OREB% del rival. Más bajo = mejor bloqueo de rebote.",
      pt: "OREB% do adversário. Menor = melhor bloqueio.",
      fr: "OREB% adverse. Plus bas = meilleur écran de rebond.",
    }),
    def(
      "pctPts3",
      "3PT%",
      "% PTS from 3",
      "scoring",
      true,
      "pct",
      {
        ja: "得点のうち 3P の割合。",
        en: "Share of points from threes.",
        ko: "득점 중 3점 비중.",
        zh: "三分得分占比。",
        es: "Porcentaje de puntos desde el triple.",
        pt: "Percentual de pontos vindos do 3.",
        fr: "Part des points venant du 3 pts.",
      },
      false
    ),
    def(
      "pctPtsPaint",
      "PAINT%",
      "% PTS in paint",
      "scoring",
      true,
      "pct",
      {
        ja: "得点のうちペイントの割合。",
        en: "Share of points in the paint.",
        ko: "득점 중 페인트존 비중.",
        zh: "禁区得分占比。",
        es: "Porcentaje de puntos en la zona.",
        pt: "Percentual de pontos no garrafão.",
        fr: "Part des points dans la raquette.",
      },
      false
    ),
    def(
      "pctPtsFt",
      "FT%",
      "% PTS from FT",
      "scoring",
      true,
      "pct",
      {
        ja: "得点のうちフリースローの割合。",
        en: "Share of points from free throws.",
        ko: "득점 중 자유투 비중.",
        zh: "罚球得分占比。",
        es: "Porcentaje de puntos desde la línea.",
        pt: "Percentual de pontos em lances livres.",
        fr: "Part des points venant des lancers francs.",
      },
      false
    ),
    def(
      "pctPtsFb",
      "FB%",
      "% PTS fast break",
      "scoring",
      true,
      "pct",
      {
        ja: "得点のうちファストブレイクの割合。",
        en: "Share of points from fast breaks.",
        ko: "득점 중 속공 비중.",
        zh: "快攻得分占比。",
        es: "Porcentaje de puntos al contragolpe.",
        pt: "Percentual de pontos em contra-ataque.",
        fr: "Part des points en contre-attaque.",
      },
      false
    ),
    def(
      "pctPtsTov",
      "TO%",
      "% PTS off TO",
      "scoring",
      true,
      "pct",
      {
        ja: "得点のうち相手 TO 後の割合。",
        en: "Share of points off turnovers.",
        ko: "득점 중 상대 턴오버 이후 비중.",
        zh: "由对手失误转化的得分占比。",
        es: "Porcentaje de puntos tras pérdida rival.",
        pt: "Percentual de pontos após turnover.",
        fr: "Part des points après perte de balle adverse.",
      },
      false
    ),
    def("pts3", "3PT", "Points from 3 / G", "scoring", true, "one", {
      ja: "1試合あたりの3P得点。",
      en: "Points per game from threes.",
      ko: "경기당 3점 득점.",
      zh: "场均三分得分。",
      es: "Puntos por partido de triple.",
      pt: "Pontos por jogo em bolas de 3.",
      fr: "Points par match à 3 pts.",
    }),
    def("ptsPaint", "PAINT", "Paint points / G", "scoring", true, "one", {
      ja: "1試合あたりのペイント得点。",
      en: "Points per game in the paint.",
      ko: "경기당 페인트존 득점.",
      zh: "场均禁区得分。",
      es: "Puntos por partido en la zona.",
      pt: "Pontos por jogo no garrafão.",
      fr: "Points par match dans la raquette.",
    }),
    def("ptsFt", "FT", "FT points / G", "scoring", true, "one", {
      ja: "1試合あたりのフリースロー得点。",
      en: "Points per game from free throws.",
      ko: "경기당 자유투 득점.",
      zh: "场均罚球得分。",
      es: "Puntos por partido en tiros libres.",
      pt: "Pontos por jogo em lances livres.",
      fr: "Points par match aux lancers francs.",
    }),
    def("ptsFb", "FB", "Fast-break points / G", "scoring", true, "one", {
      ja: "1試合あたりのファストブレイク得点。",
      en: "Points per game on the break.",
      ko: "경기당 속공 득점.",
      zh: "场均快攻得分。",
      es: "Puntos por partido al contragolpe.",
      pt: "Pontos por jogo em contra-ataque.",
      fr: "Points par match en contre-attaque.",
    }),
    def("ptsTov", "TO", "Points off TO / G", "scoring", true, "one", {
      ja: "1試合あたりの相手TO後の得点。",
      en: "Points per game off turnovers.",
      ko: "경기당 상대 턴오버 이후 득점.",
      zh: "场均由失误转化的得分。",
      es: "Puntos por partido tras pérdida rival.",
      pt: "Pontos por jogo após turnover.",
      fr: "Points par match après perte adverse.",
    }),
    def(
      "ptsSecondChance",
      "2ND",
      "Second-chance PTS / G",
      "scoring",
      true,
      "one",
      {
        ja: "1試合あたりのセカンドチャンス得点。",
        en: "Second-chance points per game.",
        ko: "경기당 세컨드찬스 득점.",
        zh: "场均二次进攻得分。",
        es: "Puntos de segunda oportunidad por partido.",
        pt: "Pontos de segunda chance por jogo.",
        fr: "Points de seconde chance par match.",
      }
    ),
    def(
      "oppPtsPaint",
      "OPP PAINT",
      "Opp paint PTS / G",
      "scoring",
      false,
      "one",
      {
        ja: "1試合あたりのペイント失点。低いほど良い。",
        en: "Opponent paint points allowed per game. Lower is better.",
        ko: "경기당 페인트 실점. 낮을수록 좋음.",
        zh: "场均禁区失分。越低越好。",
        es: "Puntos en pintura permitidos. Más bajo, mejor.",
        pt: "Pontos no garrafão cedidos. Quanto menor, melhor.",
        fr: "Points dans la raquette concédés. Plus bas = mieux.",
      }
    ),
    def(
      "oppPtsFb",
      "OPP FB",
      "Opp fast-break PTS / G",
      "scoring",
      false,
      "one",
      {
        ja: "1試合あたりのファストブレイク失点。低いほど良い。",
        en: "Opponent fast-break points allowed. Lower is better.",
        ko: "경기당 속공 실점. 낮을수록 좋음.",
        zh: "场均快攻失分。越低越好。",
        es: "Puntos al contragolpe permitidos. Más bajo, mejor.",
        pt: "Pontos de contra-ataque cedidos. Quanto menor, melhor.",
        fr: "Points en contre-attaque concédés. Plus bas = mieux.",
      }
    ),
    def(
      "oppPtsOffTov",
      "OPP TO",
      "Opp PTS off TO / G",
      "scoring",
      false,
      "one",
      {
        ja: "1試合あたりの被TO失点。低いほど良い。",
        en: "Opponent points off turnovers allowed. Lower is better.",
        ko: "경기당 턴오버 이후 실점. 낮을수록 좋음.",
        zh: "场均被失误转化失分。越低越好。",
        es: "Puntos tras pérdida permitidos. Más bajo, mejor.",
        pt: "Pontos após turnover cedidos. Quanto menor, melhor.",
        fr: "Points après perte concédés. Plus bas = mieux.",
      }
    ),
    def(
      "oppPtsSecondChance",
      "OPP 2ND",
      "Opp second-chance PTS / G",
      "scoring",
      false,
      "one",
      {
        ja: "1試合あたりのセカンドチャンス失点。低いほど良い。",
        en: "Opponent second-chance points allowed. Lower is better.",
        ko: "경기당 세컨드찬스 실점. 낮을수록 좋음.",
        zh: "场均二次进攻失分。越低越好。",
        es: "Puntos de 2ª oportunidad permitidos. Más bajo, mejor.",
        pt: "Pontos de 2ª chance cedidos. Quanto menor, melhor.",
        fr: "Points de 2e chance concédés. Plus bas = mieux.",
      }
    ),
    def("clutchNet", "NET", "Clutch Net Rating", "clutch", true, "signed", {
      ja: "僅差・終盤のネットレーティング。",
      en: "Net rating in the clutch.",
      ko: "클러치 상황 넷 레이팅.",
      zh: "关键时刻净效率值。",
      es: "Net rating en clutch.",
      pt: "Net rating no clutch.",
      fr: "Net rating en clutch.",
    }),
    def("clutchOrtg", "ORTG", "Clutch Off Rating", "clutch", true, "one", {
      ja: "僅差・終盤のオフェンスレーティング。",
      en: "Offensive rating in the clutch.",
      ko: "클러치 상황 공격 레이팅.",
      zh: "关键时刻进攻效率值。",
      es: "Offensive rating en clutch.",
      pt: "Offensive rating no clutch.",
      fr: "Offensive rating en clutch.",
    }),
    def("clutchDrtg", "DRTG", "Clutch Def Rating", "clutch", false, "one", {
      ja: "僅差・終盤のディフェンスレーティング。低いほど良い。",
      en: "Defensive rating in the clutch. Lower is better.",
      ko: "클러치 상황 수비 레이팅. 낮을수록 좋음.",
      zh: "关键时刻防守效率值。越低越好。",
      es: "Defensive rating en clutch. Más bajo, mejor.",
      pt: "Defensive rating no clutch. Menor é melhor.",
      fr: "Defensive rating en clutch. Plus bas, mieux.",
    }),
    def("clutchEfg", "EFG", "Clutch eFG%", "clutch", true, "pct", {
      ja: "僅差・終盤の eFG%。",
      en: "eFG% in the clutch.",
      ko: "클러치 상황 eFG%.",
      zh: "关键时刻 eFG%。",
      es: "eFG% en clutch.",
      pt: "eFG% no clutch.",
      fr: "eFG% en clutch.",
    }),
    def(
      "isoPpp",
      "ISO",
      "Isolation PPP",
      "playtype",
      true,
      "ppp",
      {
        ja: "アイソレーションの得点効率。",
        en: "Isolation points per possession.",
        ko: "아이솔레이션 포제션당 득점(PPP).",
        zh: "单打每回合得分（PPP）。",
        es: "PPP en isolación.",
        pt: "PPP em isolamento.",
        fr: "PPP en isolation.",
      },
      false
    ),
    def(
      "pnrBhPpp",
      "PnR-B",
      "PnR ball-handler PPP",
      "playtype",
      true,
      "ppp",
      {
        ja: "ピック&ロール（ボールハンドラー）の PPP。",
        en: "Pick-and-roll ball-handler PPP.",
        ko: "픽앤롤 볼핸들러 PPP.",
        zh: "挡拆持球人 PPP。",
        es: "PPP del manejador en pick-and-roll.",
        pt: "PPP do condutor no pick-and-roll.",
        fr: "PPP du porteur sur pick-and-roll.",
      },
      false
    ),
    def(
      "pnrRollPpp",
      "PnR-R",
      "PnR roll man PPP",
      "playtype",
      true,
      "ppp",
      {
        ja: "ピック&ロール（ロールマン）の PPP。",
        en: "Pick-and-roll roll man PPP.",
        ko: "픽앤롤 롤맨 PPP.",
        zh: "挡拆顺下者 PPP。",
        es: "PPP del roll man en pick-and-roll.",
        pt: "PPP do roll man no pick-and-roll.",
        fr: "PPP du roll man sur pick-and-roll.",
      },
      false
    ),
    def(
      "spotupPpp",
      "SPOT",
      "Spot-up PPP",
      "playtype",
      true,
      "ppp",
      {
        ja: "スポットアップの PPP。",
        en: "Spot-up PPP.",
        ko: "스팟업 PPP.",
        zh: "定点接球投篮 PPP。",
        es: "PPP en spot-up.",
        pt: "PPP em spot-up.",
        fr: "PPP en spot-up.",
      },
      false
    ),
    def(
      "transPpp",
      "TRAN",
      "Transition PPP",
      "playtype",
      true,
      "ppp",
      {
        ja: "トランジションの PPP。",
        en: "Transition PPP.",
        ko: "트랜지션 PPP.",
        zh: "转换进攻 PPP。",
        es: "PPP en transición.",
        pt: "PPP em transição.",
        fr: "PPP en transition.",
      },
      false
    ),
    def(
      "cutPpp",
      "CUT",
      "Cut PPP",
      "playtype",
      true,
      "ppp",
      {
        ja: "カットの PPP。",
        en: "Cut PPP.",
        ko: "컷인 PPP.",
        zh: "空切 PPP。",
        es: "PPP en cortes.",
        pt: "PPP em cortes.",
        fr: "PPP sur les coupes.",
      },
      false
    ),
    def(
      "postPpp",
      "POST",
      "Post-up PPP",
      "playtype",
      true,
      "ppp",
      {
        ja: "ポストアップの PPP。",
        en: "Post-up PPP.",
        ko: "포스트업 PPP.",
        zh: "背身单打 PPP。",
        es: "PPP en post-up.",
        pt: "PPP em post-up.",
        fr: "PPP en poste bas.",
      },
      false
    ),
    def("isoPts", "ISO", "Isolation PTS / G", "playtype", true, "one", {
      ja: "1試合あたりのアイソ得点。",
      en: "Isolation points per game.",
      ko: "경기당 아이솔레이션 득점.",
      zh: "场均单打得分。",
      es: "Puntos por partido en isolación.",
      pt: "Pontos por jogo em isolamento.",
      fr: "Points par match en isolation.",
    }),
    def(
      "pnrBhPts",
      "PnR-B",
      "PnR ball-handler PTS / G",
      "playtype",
      true,
      "one",
      {
        ja: "1試合あたりの PnR ハンドラー得点。",
        en: "Pick-and-roll ball-handler points per game.",
        ko: "경기당 픽앤롤 볼핸들러 득점.",
        zh: "场均挡拆持球人得分。",
        es: "Puntos por partido del manejador en pick-and-roll.",
        pt: "Pontos por jogo do condutor no pick-and-roll.",
        fr: "Points par match du porteur sur pick-and-roll.",
      }
    ),
    def(
      "pnrRollPts",
      "PnR-R",
      "PnR roll man PTS / G",
      "playtype",
      true,
      "one",
      {
        ja: "1試合あたりの PnR ロール得点。",
        en: "Pick-and-roll roll-man points per game.",
        ko: "경기당 픽앤롤 롤맨 득점.",
        zh: "场均挡拆顺下者得分。",
        es: "Puntos por partido del roll man.",
        pt: "Pontos por jogo do roll man.",
        fr: "Points par match du roll man.",
      }
    ),
    def("spotupPts", "SPOT", "Spot-up PTS / G", "playtype", true, "one", {
      ja: "1試合あたりのスポットアップ得点。",
      en: "Spot-up points per game.",
      ko: "경기당 스팟업 득점.",
      zh: "场均定点投篮得分。",
      es: "Puntos por partido en spot-up.",
      pt: "Pontos por jogo em spot-up.",
      fr: "Points par match en spot-up.",
    }),
    def("transPts", "TRAN", "Transition PTS / G", "playtype", true, "one", {
      ja: "1試合あたりのトランジション得点。",
      en: "Transition points per game.",
      ko: "경기당 트랜지션 득점.",
      zh: "场均转换进攻得分。",
      es: "Puntos por partido en transición.",
      pt: "Pontos por jogo em transição.",
      fr: "Points par match en transition.",
    }),
    def("cutPts", "CUT", "Cut PTS / G", "playtype", true, "one", {
      ja: "1試合あたりのカット得点。",
      en: "Cut points per game.",
      ko: "경기당 컷인 득점.",
      zh: "场均空切得分。",
      es: "Puntos por partido en cortes.",
      pt: "Pontos por jogo em cortes.",
      fr: "Points par match sur les coupes.",
    }),
    def("postPts", "POST", "Post-up PTS / G", "playtype", true, "one", {
      ja: "1試合あたりのポストアップ得点。",
      en: "Post-up points per game.",
      ko: "경기당 포스트업 득점.",
      zh: "场均背身单打得分。",
      es: "Puntos por partido en post-up.",
      pt: "Pontos por jogo em post-up.",
      fr: "Points par match en poste bas.",
    }),
    def(
      "isoFreq",
      "ISO%",
      "Isolation freq",
      "playtype",
      true,
      "pct",
      {
        ja: "アイソの使用割合。",
        en: "Isolation possession share.",
        ko: "아이솔레이션 사용 비중.",
        zh: "单打回合占比。",
        es: "Cuota de posesiones en isolación.",
        pt: "Fatia de posses em isolamento.",
        fr: "Part des possessions en isolation.",
      },
      false
    ),
    def(
      "pnrBhFreq",
      "PnR-B%",
      "PnR handler freq",
      "playtype",
      true,
      "pct",
      {
        ja: "PnR ハンドラーの使用割合。",
        en: "PnR ball-handler possession share.",
        ko: "픽앤롤 볼핸들러 사용 비중.",
        zh: "挡拆持球人回合占比。",
        es: "Cuota de posesiones del manejador en PnR.",
        pt: "Fatia de posses do condutor no PnR.",
        fr: "Part des possessions du porteur sur PnR.",
      },
      false
    ),
    def(
      "pnrRollFreq",
      "PnR-R%",
      "PnR roll freq",
      "playtype",
      true,
      "pct",
      {
        ja: "PnR ロールの使用割合。",
        en: "PnR roll possession share.",
        ko: "픽앤롤 롤맨 사용 비중.",
        zh: "挡拆顺下回合占比。",
        es: "Cuota de posesiones del roll man.",
        pt: "Fatia de posses do roll man.",
        fr: "Part des possessions du roll man.",
      },
      false
    ),
    def(
      "spotupFreq",
      "SPOT%",
      "Spot-up freq",
      "playtype",
      true,
      "pct",
      {
        ja: "スポットアップの使用割合。",
        en: "Spot-up possession share.",
        ko: "스팟업 사용 비중.",
        zh: "定点投篮回合占比。",
        es: "Cuota de posesiones en spot-up.",
        pt: "Fatia de posses em spot-up.",
        fr: "Part des possessions en spot-up.",
      },
      false
    ),
    def(
      "transFreq",
      "TRAN%",
      "Transition freq",
      "playtype",
      true,
      "pct",
      {
        ja: "トランジションの使用割合。",
        en: "Transition possession share.",
        ko: "트랜지션 사용 비중.",
        zh: "转换进攻回合占比。",
        es: "Cuota de posesiones en transición.",
        pt: "Fatia de posses em transição.",
        fr: "Part des possessions en transition.",
      },
      false
    ),
    def(
      "cutFreq",
      "CUT%",
      "Cut freq",
      "playtype",
      true,
      "pct",
      {
        ja: "カットの使用割合。",
        en: "Cut possession share.",
        ko: "컷인 사용 비중.",
        zh: "空切回合占比。",
        es: "Cuota de posesiones en cortes.",
        pt: "Fatia de posses em cortes.",
        fr: "Part des possessions sur les coupes.",
      },
      false
    ),
    def(
      "postFreq",
      "POST%",
      "Post-up freq",
      "playtype",
      true,
      "pct",
      {
        ja: "ポストアップの使用割合。",
        en: "Post-up possession share.",
        ko: "포스트업 사용 비중.",
        zh: "背身单打回合占比。",
        es: "Cuota de posesiones en post-up.",
        pt: "Fatia de posses em post-up.",
        fr: "Part des possessions en poste bas.",
      },
      false
    ),
    def(
      "rimFgPct",
      "RIM",
      "Restricted FG%",
      "shooting",
      true,
      "pct",
      {
        ja: "restricted area の FG%。",
        en: "Restricted-area FG%.",
        ko: "제한구역 야투 성공률.",
        zh: "禁区（限制区）命中率。",
        es: "FG% en zona restringida.",
        pt: "FG% na área restrita.",
        fr: "FG% dans la zone restreinte.",
      },
      false
    ),
    def(
      "corner3Pct",
      "C3",
      "Corner 3%",
      "shooting",
      true,
      "pct",
      {
        ja: "コーナー3の成功率。",
        en: "Corner three percentage.",
        ko: "코너 3점 성공률.",
        zh: "底角三分命中率。",
        es: "Porcentaje en triples de esquina.",
        pt: "Aproveitamento em 3 de canto.",
        fr: "Pourcentage à 3 pts de coin.",
      },
      false
    ),
    def("fgPctAllowed", "FG%", "Opp FG%", "defense", false, "pct", {
      ja: "相手に許した FG%。低いほど良い。",
      en: "Opponent FG%. Lower is better.",
      ko: "상대에게 허용한 야투 성공률. 낮을수록 좋음.",
      zh: "对手投篮命中率。越低越好。",
      es: "FG% del rival. Más bajo, mejor.",
      pt: "FG% do adversário. Menor é melhor.",
      fr: "FG% adverse. Plus bas, mieux.",
    }),
    def("fg3PctAllowed", "3P%", "Opp 3P%", "defense", false, "pct", {
      ja: "相手に許した 3P%。低いほど良い。",
      en: "Opponent 3P%. Lower is better.",
      ko: "상대에게 허용한 3점 성공률. 낮을수록 좋음.",
      zh: "对手三分命中率。越低越好。",
      es: "3P% del rival. Más bajo, mejor.",
      pt: "3P% do adversário. Menor é melhor.",
      fr: "3P% adverse. Plus bas, mieux.",
    }),
    def("rebAllowed", "REB", "Opp REB / G", "defense", false, "one", {
      ja: "相手に許したリバウンド。低いほど良い。",
      en: "Rebounds allowed per game. Lower is better.",
      ko: "경기당 허용 리바운드. 낮을수록 좋음.",
      zh: "场均被对手抢下的篮板。越低越好。",
      es: "Rebotes concedidos por partido. Más bajo, mejor.",
      pt: "Rebotes concedidos por jogo. Menor é melhor.",
      fr: "Rebonds concédés par match. Plus bas, mieux.",
    }),
    def("astAllowed", "AST", "Opp AST / G", "defense", false, "one", {
      ja: "相手に許したアシスト。低いほど良い。",
      en: "Assists allowed per game. Lower is better.",
      ko: "경기당 허용 어시스트. 낮을수록 좋음.",
      zh: "场均被对手打出的助攻。越低越好。",
      es: "Asistencias concedidas por partido. Más bajo, mejor.",
      pt: "Assistências concedidas por jogo. Menor é melhor.",
      fr: "Passes décisives concédées par match. Plus bas, mieux.",
    }),
    def("tovForced", "TOV", "TOs forced / G", "defense", true, "one", {
      ja: "誘発したターンオーバー。高いほど良い。",
      en: "Turnovers forced per game.",
      ko: "경기당 유도한 턴오버. 높을수록 좋음.",
      zh: "场均造成对手失误。越高越好。",
      es: "Pérdidas forzadas por partido.",
      pt: "Turnovers forçados por jogo.",
      fr: "Pertes de balle provoquées par match.",
    }),
    def("drives", "DRIVE", "Drives / G", "tracking", true, "one", {
      ja: "1試合あたりのドライブ数。",
      en: "Drives per game.",
      ko: "경기당 드라이브 횟수.",
      zh: "场均突破次数。",
      es: "Penetraciones por partido.",
      pt: "Drives por jogo.",
      fr: "Pénétrations par match.",
    }),
    def("drivePts", "D-PTS", "Drive PTS / G", "tracking", true, "one", {
      ja: "ドライブからの1試合平均得点。",
      en: "Points per game from drives.",
      ko: "경기당 드라이브 득점.",
      zh: "场均突破得分。",
      es: "Puntos por partido en penetraciones.",
      pt: "Pontos por jogo em drives.",
      fr: "Points par match sur pénétrations.",
    }),
    def("cnsFgPct", "C&S", "Catch & Shoot FG%", "tracking", true, "pct", {
      ja: "キャッチ&シュートの FG%。",
      en: "Catch-and-shoot FG%.",
      ko: "캐치&슛 야투 성공률.",
      zh: "接球即投命中率。",
      es: "FG% en catch-and-shoot.",
      pt: "FG% em catch-and-shoot.",
      fr: "FG% en catch-and-shoot.",
    }),
    def("cnsPts", "CS-PTS", "Catch & Shoot PTS / G", "tracking", true, "one", {
      ja: "キャッチ&シュートからの1試合平均得点。",
      en: "Points per game from catch-and-shoot.",
      ko: "경기당 캐치&슛 득점.",
      zh: "场均接球即投得分。",
      es: "Puntos por partido en catch-and-shoot.",
      pt: "Pontos por jogo em catch-and-shoot.",
      fr: "Points par match en catch-and-shoot.",
    }),
    def("pullupFgPct", "PULL", "Pull-up FG%", "tracking", true, "pct", {
      ja: "プルアップの FG%。",
      en: "Pull-up FG%.",
      ko: "풀업 점퍼 야투 성공률.",
      zh: "拉杆／急停跳投命中率。",
      es: "FG% en pull-up.",
      pt: "FG% em pull-up.",
      fr: "FG% en pull-up.",
    }),
    def("pullupPts", "PU-PTS", "Pull-up PTS / G", "tracking", true, "one", {
      ja: "プルアップからの1試合平均得点。",
      en: "Points per game from pull-ups.",
      ko: "경기당 풀업 점퍼 득점.",
      zh: "场均急停跳投得分。",
      es: "Puntos por partido en pull-up.",
      pt: "Pontos por jogo em pull-up.",
      fr: "Points par match en pull-up.",
    }),
    def("paintTouches", "PAINT", "Paint touches / G", "tracking", true, "one", {
      ja: "ペイントタッチ数。",
      en: "Paint touches per game.",
      ko: "경기당 페인트존 터치.",
      zh: "场均禁区触球次数。",
      es: "Toques en la zona por partido.",
      pt: "Toques no garrafão por jogo.",
      fr: "Ballons touchés dans la raquette par match.",
    }),
    def(
      "paintTouchPts",
      "PT-PTS",
      "Paint-touch PTS / G",
      "tracking",
      true,
      "one",
      {
        ja: "ペイントタッチからの1試合平均得点。",
        en: "Points per game from paint touches.",
        ko: "경기당 페인트존 터치 득점.",
        zh: "场均禁区触球得分。",
        es: "Puntos por partido tras toques en la zona.",
        pt: "Pontos por jogo após toques no garrafão.",
        fr: "Points par match après ballon dans la raquette.",
      }
    ),
    def("passes", "PASS", "Passes / G", "tracking", true, "one", {
      ja: "1試合あたりのパス数。",
      en: "Passes per game.",
      ko: "경기당 패스 횟수.",
      zh: "场均传球次数。",
      es: "Pases por partido.",
      pt: "Passes por jogo.",
      fr: "Passes par match.",
    }),
    def("speed", "SPD", "Avg speed", "tracking", true, "one", {
      ja: "平均スピード。",
      en: "Average speed.",
      ko: "평균 스피드.",
      zh: "平均移动速度。",
      es: "Velocidad media.",
      pt: "Velocidade média.",
      fr: "Vitesse moyenne.",
    }),
    def("deflections", "DEFL", "Deflections / G", "hustle", true, "one", {
      ja: "ディフレクション。",
      en: "Deflections per game.",
      ko: "경기당 디플렉션.",
      zh: "场均干扰球次数。",
      es: "Desvíos por partido.",
      pt: "Desvios por jogo.",
      fr: "Déviations par match.",
    }),
    def("charges", "CHG", "Charges drawn / G", "hustle", true, "one", {
      ja: "チャージングをもらった数。",
      en: "Charges drawn per game.",
      ko: "경기당 유도한 차징 파울.",
      zh: "场均造对手带球撞人。",
      es: "Cargas provocadas por partido.",
      pt: "Faltas de ataque provocadas por jogo.",
      fr: "Fautes offensives provoquées par match.",
    }),
    def("looseBalls", "LOOSE", "Loose balls / G", "hustle", true, "one", {
      ja: "ルーズボールリカバー。",
      en: "Loose balls recovered per game.",
      ko: "경기당 루즈볼 획득.",
      zh: "场均争抢到的球。",
      es: "Balones sueltos recuperados por partido.",
      pt: "Bolas soltas recuperadas por jogo.",
      fr: "Ballons perdus récupérés par match.",
    }),
    def("screenAst", "SCRN", "Screen assists / G", "hustle", true, "one", {
      ja: "スクリーンアシスト。",
      en: "Screen assists per game.",
      ko: "경기당 스크린 어시스트.",
      zh: "场均掩护助攻。",
      es: "Asistencias de bloqueo por partido.",
      pt: "Assistências de bloqueio por jogo.",
      fr: "Passes décisives sur écran par match.",
    }),
    def(
      "contestedShots",
      "CONT",
      "Contested shots / G",
      "hustle",
      true,
      "one",
      {
        ja: "コンテストしたシュート。",
        en: "Contested shots per game.",
        ko: "경기당 컨테스트한 슈팅.",
        zh: "场均干扰对手出手次数。",
        es: "Tiros disputados por partido.",
        pt: "Arremessos contestados por jogo.",
        fr: "Tirs contestés par match.",
      }
    ),
  ];

export const NBA_LEAGUE_TEAM_BASIC_EXTRA_METRICS =
  NBA_LEAGUE_TEAM_ADVANCED_METRIC_DEFS.filter((m) => m.category === "basic");

export function teamAdvancedMetricsForCategory(
  category: NbaLeagueAdvancedCategory
): readonly NbaLeagueTeamAdvancedMetricDef[] {
  return NBA_LEAGUE_TEAM_ADVANCED_METRIC_DEFS.filter(
    (m) => m.category === category && m.showInLeague
  );
}

export function teamAdvancedMetricChipRows(
  category: NbaLeagueAdvancedCategory
) {
  return chunkForChipGrid(
    teamAdvancedMetricsForCategory(category),
    NBA_LEAGUE_STAT_CHIP_COLS
  );
}

type CoreAnchor = {
  teamId: string;
  netrtg: number;
  ortg: number;
  drtg: number;
  efgPct: number;
  tovPct: number;
  papg: number;
  fg3Pct: number;
  ppg: number;
  pace: number;
};

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

function ppp(n: number): number {
  return Math.round(n * 100) / 100;
}

export function buildLeagueTeamAdvancedFields(
  core: CoreAnchor,
  window: TeamStatWindow
): NbaLeagueTeamAdvancedFields {
  const rnd = mulberry32(hashSeed(`${core.teamId}:${window}:adv:v1`));
  const tier = Math.max(0, Math.min(1, (core.netrtg + 12) / 24));
  const noise = window === "last10" ? 0.08 : 0.03;

  const fgPct = pct3(0.44 + tier * 0.06 + (rnd() - 0.5) * 0.02);
  const ftPct = pct3(0.74 + tier * 0.08 + (rnd() - 0.5) * 0.03);
  const tsPct = pct3(core.efgPct + 0.04 + (rnd() - 0.5) * 0.015);
  const ftaRate = pct3(0.22 + tier * 0.08 + (rnd() - 0.5) * noise);
  const orebPct = pct3(0.24 + (rnd() - 0.5) * 0.06);
  const oppEfgPct = pct3(0.54 - tier * 0.05 + (rnd() - 0.5) * 0.02);
  const oppTovPct = pct3(0.13 + tier * 0.03 + (rnd() - 0.5) * 0.015);
  const oppFtaRate = pct3(0.26 - tier * 0.05 + (rnd() - 0.5) * noise);
  const oppOrebPct = pct3(0.26 - tier * 0.04 + (rnd() - 0.5) * 0.03);

  const pctPts3 = pct3(0.28 + rnd() * 0.18);
  const pctPtsPaint = pct3(0.32 + rnd() * 0.16);
  const pctPtsFt = pct3(0.12 + rnd() * 0.1);
  const pctPtsFb = pct3(0.08 + rnd() * 0.08);
  const pctPtsTov = pct3(Math.max(0.08, 1 - pctPts3 - pctPtsPaint - pctPtsFt - pctPtsFb));

  const clutchShift = (rnd() - 0.45) * 6;
  const clutchNet = round1(core.netrtg * 0.7 + clutchShift);
  const clutchOrtg = round1(core.ortg + clutchShift * 0.6 + (rnd() - 0.5) * 3);
  const clutchDrtg = round1(clutchOrtg - clutchNet);
  const clutchEfg = pct3(core.efgPct + (rnd() - 0.5) * 0.04);

  const pppBase = 0.88 + tier * 0.22;
  const isoPpp = ppp(pppBase - 0.08 + rnd() * 0.16);
  const pnrBhPpp = ppp(pppBase + (rnd() - 0.5) * 0.14);
  const pnrRollPpp = ppp(1.05 + tier * 0.15 + (rnd() - 0.5) * 0.12);
  const spotupPpp = ppp(0.95 + (rnd() - 0.5) * 0.16);
  const transPpp = ppp(1.12 + tier * 0.1 + (rnd() - 0.5) * 0.1);
  const cutPpp = ppp(1.18 + (rnd() - 0.5) * 0.1);
  const postPpp = ppp(0.9 + (rnd() - 0.5) * 0.16);

  const freqRaw = [
    0.4 + rnd(),
    0.5 + rnd() * 1.2,
    0.35 + rnd(),
    0.45 + rnd() * 1.1,
    0.3 + rnd() * 0.9,
    0.2 + rnd() * 0.7,
    0.15 + rnd() * 0.6,
  ];
  const freqSum = freqRaw.reduce((a, b) => a + b, 0);
  const freqScale = 0.82;
  const isoFreq = pct3((freqRaw[0]! / freqSum) * freqScale);
  const pnrBhFreq = pct3((freqRaw[1]! / freqSum) * freqScale);
  const pnrRollFreq = pct3((freqRaw[2]! / freqSum) * freqScale);
  const spotupFreq = pct3((freqRaw[3]! / freqSum) * freqScale);
  const transFreq = pct3((freqRaw[4]! / freqSum) * freqScale);
  const cutFreq = pct3((freqRaw[5]! / freqSum) * freqScale);
  const postFreq = pct3((freqRaw[6]! / freqSum) * freqScale);

  const rimFgPct = pct3(0.58 + tier * 0.1 + (rnd() - 0.5) * 0.04);
  const corner3Pct = pct3(0.34 + tier * 0.06 + (rnd() - 0.5) * 0.04);

  const fgPctAllowed = pct3(0.48 - tier * 0.04 + (rnd() - 0.5) * 0.02);
  const fg3PctAllowed = pct3(0.37 - tier * 0.03 + (rnd() - 0.5) * 0.02);
  const rebAllowed = round1(42 + (1 - tier) * 6 + (rnd() - 0.5) * 3);
  const astAllowed = round1(24 + (1 - tier) * 5 + (rnd() - 0.5) * 2);
  const tovForced = round1(13 + core.tovPct * 20 + rnd() * 3);

  const drives = round1(40 + rnd() * 22);
  const cnsFgPct = pct3(0.35 + rnd() * 0.08);
  const pullupFgPct = pct3(0.32 + rnd() * 0.1);
  const passes = round1(280 + rnd() * 80);
  const speed = round1(4.2 + rnd() * 0.7);
  const paintTouches = round1(28 + rnd() * 18);

  const deflections = round1(12 + rnd() * 8);
  const charges = round1(0.2 + rnd() * 0.8);
  const looseBalls = round1(6 + rnd() * 4);
  const screenAst = round1(8 + rnd() * 7);
  const contestedShots = round1(40 + rnd() * 18);

  const pts3 = round1(core.ppg * pctPts3);
  const ptsPaint = round1(core.ppg * pctPtsPaint);
  const ptsFt = round1(core.ppg * pctPtsFt);
  const ptsFb = round1(core.ppg * pctPtsFb);
  const ptsTov = round1(core.ppg * pctPtsTov);
  const isoPts = round1(isoPpp * core.pace * isoFreq);
  const pnrBhPts = round1(pnrBhPpp * core.pace * pnrBhFreq);
  const pnrRollPts = round1(pnrRollPpp * core.pace * pnrRollFreq);
  const spotupPts = round1(spotupPpp * core.pace * spotupFreq);
  const transPts = round1(transPpp * core.pace * transFreq);
  const cutPts = round1(cutPpp * core.pace * cutFreq);
  const postPts = round1(postPpp * core.pace * postFreq);
  const drivePts = round1(drives * (0.4 + pctPtsPaint * 0.28));
  const cnsPts = round1(core.ppg * spotupFreq * 0.85);
  const pullupPts = round1(core.ppg * (isoFreq * 0.7 + pnrBhFreq * 0.22));
  const paintTouchPts = round1(paintTouches * (0.26 + rimFgPct * 0.22));

  return {
    fgPct,
    ftPct,
    tsPct,
    ftaRate,
    orebPct,
    oppEfgPct,
    oppTovPct,
    oppFtaRate,
    oppOrebPct,
    pctPts3,
    pctPtsPaint,
    pctPtsFt,
    pctPtsFb,
    pctPtsTov,
    pts3,
    ptsPaint,
    ptsFt,
    ptsFb,
    ptsTov,
    ptsSecondChance: round1(ptsPaint * 0.28),
    oppPtsPaint: round1(42 + (1 - tier) * 12 + (rnd() - 0.5) * 6),
    oppPtsFb: round1(12 + (1 - tier) * 6 + (rnd() - 0.5) * 3),
    oppPtsOffTov: round1(14 + (1 - tier) * 6 + (rnd() - 0.5) * 3),
    oppPtsSecondChance: round1(12 + (1 - tier) * 5 + (rnd() - 0.5) * 3),
    clutchNet,
    clutchOrtg,
    clutchDrtg,
    clutchEfg,
    isoPpp,
    pnrBhPpp,
    pnrRollPpp,
    spotupPpp,
    transPpp,
    cutPpp,
    postPpp,
    isoPts,
    pnrBhPts,
    pnrRollPts,
    spotupPts,
    transPts,
    cutPts,
    postPts,
    isoFreq,
    pnrBhFreq,
    pnrRollFreq,
    spotupFreq,
    transFreq,
    cutFreq,
    postFreq,
    rimFgPct,
    corner3Pct,
    fgPctAllowed,
    fg3PctAllowed,
    rebAllowed,
    astAllowed,
    tovForced,
    drives,
    drivePts,
    cnsFgPct,
    cnsPts,
    pullupFgPct,
    pullupPts,
    passes,
    speed,
    paintTouches,
    paintTouchPts,
    deflections,
    charges,
    looseBalls,
    screenAst,
    contestedShots,
  };
}

export function formatTeamAdvancedValue(
  metric: NbaLeagueTeamAdvancedMetric,
  value: number | null | undefined
): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  const meta = NBA_LEAGUE_TEAM_ADVANCED_METRIC_DEFS.find((m) => m.id === metric);
  const format = meta?.format ?? "one";
  if (format === "pct") return `${(value * 100).toFixed(1)}%`;
  if (format === "signed") return `${value > 0 ? "+" : ""}${value.toFixed(1)}`;
  if (format === "ppp") return value.toFixed(2);
  return value.toFixed(1);
}
