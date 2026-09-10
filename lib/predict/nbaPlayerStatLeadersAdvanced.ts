/**
 * リーグ Player Leaders の Advanced 指標（モック）。
 * BDL leaders の 19 stat_type とは別。season averages 系の置き場。
 */
import type { UiStrings } from "@/lib/i18n/ui";
import type { NbaLeagueAdvancedCategory } from "@/lib/predict/nbaLeagueStatBoard";
import {
  chunkForChipGrid,
  NBA_LEAGUE_STAT_CHIP_COLS,
} from "@/lib/predict/nbaLeagueStatBoard";

export type NbaPlayerAdvancedLeaderMetric =
  | "per"
  | "ts_pct"
  | "usg"
  | "pie"
  | "ast_pct"
  | "reb_pct"
  | "ast_to"
  | "ortg"
  | "drtg"
  | "efg_pct"
  | "fta_rate"
  | "oreb_pct"
  | "tov_pct"
  | "pct_pts_3"
  | "pct_pts_paint"
  | "pct_pts_mid"
  | "pct_pts_ft"
  | "pct_pts_fb"
  | "pct_pts_tov"
  | "pts_3"
  | "pts_paint"
  | "pts_mid"
  | "pts_ft"
  | "pts_fb"
  | "pts_tov"
  | "clutch_pts"
  | "clutch_fg_pct"
  | "clutch_usg"
  | "iso_ppp"
  | "pnr_bh_ppp"
  | "pnr_roll_ppp"
  | "spotup_ppp"
  | "trans_ppp"
  | "cut_ppp"
  | "post_ppp"
  | "handoff_ppp"
  | "offscreen_ppp"
  | "oreb_ppp"
  | "iso_freq"
  | "pnr_bh_freq"
  | "pnr_roll_freq"
  | "spotup_freq"
  | "trans_freq"
  | "cut_freq"
  | "post_freq"
  | "handoff_freq"
  | "offscreen_freq"
  | "oreb_freq"
  | "iso_pts"
  | "pnr_bh_pts"
  | "pnr_roll_pts"
  | "spotup_pts"
  | "trans_pts"
  | "cut_pts"
  | "post_pts"
  | "handoff_pts"
  | "offscreen_pts"
  | "oreb_pts"
  | "matchup_fg_pct"
  | "matchup_3pt_pct"
  | "opp_2p_pct"
  | "opp_3p_pct"
  | "opp_lt6_pct"
  | "restricted_fg_pct"
  | "restricted_pts"
  | "corner3_pct"
  | "corner3_pts"
  | "drives"
  | "drive_pts"
  | "cns_fg_pct"
  | "cns_pts"
  | "pullup_fg_pct"
  | "pullup_pts"
  | "passes"
  | "speed"
  | "paint_touches"
  | "paint_touch_pts"
  | "deflections"
  | "charges"
  | "loose_balls"
  | "screen_ast"
  | "contested_shots";

export type NbaPlayerLeaderMetricKindEx =
  | "pct"
  | "perGame"
  | "minutes"
  | "eff"
  | "ppp"
  | "ratio"
  | "rating";

export type NbaPlayerAdvancedLeaderMetricDef = {
  id: NbaPlayerAdvancedLeaderMetric;
  label: string;
  short: string;
  higherIsBetter: boolean;
  hint: UiStrings;
  kind: NbaPlayerLeaderMetricKindEx;
  category: NbaLeagueAdvancedCategory;
  /** false = リーグ表チップに出さない（詳細専用） */
  showInLeague: boolean;
};

function def(
  id: NbaPlayerAdvancedLeaderMetric,
  short: string,
  label: string,
  category: NbaLeagueAdvancedCategory,
  higherIsBetter: boolean,
  kind: NbaPlayerLeaderMetricKindEx,
  hint: UiStrings,
  showInLeague = true
): NbaPlayerAdvancedLeaderMetricDef {
  return {
    id,
    short,
    label,
    category,
    higherIsBetter,
    kind,
    hint,
    showInLeague,
  };
}

/** playtype は PPP / 使用率 / 得点の 3 面を同じ語彙で回す */
const PT = {
  iso: {
    ppp: {
      ja: "アイソレーションの PPP。",
      en: "Isolation points per possession.",
      ko: "아이솔레이션 PPP.",
      zh: "单打每回合得分（PPP）。",
      es: "PPP en isolación.",
      pt: "PPP em isolamento.",
      fr: "PPP en isolation.",
    },
    freq: {
      ja: "アイソレーションの使用率。",
      en: "Isolation possession frequency.",
      ko: "아이솔레이션 사용 비중.",
      zh: "单打回合占比。",
      es: "Frecuencia de isolación.",
      pt: "Frequência de isolamento.",
      fr: "Fréquence des isolations.",
    },
    pts: {
      ja: "1試合あたりのアイソ得点。",
      en: "Isolation points per game.",
      ko: "경기당 아이솔레이션 득점.",
      zh: "场均单打得分。",
      es: "Puntos por partido en isolación.",
      pt: "Pontos por jogo em isolamento.",
      fr: "Points par match en isolation.",
    },
  },
  pnrBh: {
    ppp: {
      ja: "PnR ボールハンドラーの PPP。",
      en: "Pick-and-roll ball-handler PPP.",
      ko: "픽앤롤 볼핸들러 PPP.",
      zh: "挡拆持球人 PPP。",
      es: "PPP del manejador en pick-and-roll.",
      pt: "PPP do condutor no pick-and-roll.",
      fr: "PPP du porteur sur pick-and-roll.",
    },
    freq: {
      ja: "PnR ボールハンドラーの使用率。",
      en: "Pick-and-roll ball-handler frequency.",
      ko: "픽앤롤 볼핸들러 사용 비중.",
      zh: "挡拆持球人回合占比。",
      es: "Frecuencia como manejador en pick-and-roll.",
      pt: "Frequência como condutor no pick-and-roll.",
      fr: "Fréquence comme porteur sur pick-and-roll.",
    },
    pts: {
      ja: "1試合あたりの PnR ハンドラー得点。",
      en: "Pick-and-roll ball-handler points per game.",
      ko: "경기당 픽앤롤 볼핸들러 득점.",
      zh: "场均挡拆持球人得分。",
      es: "Puntos por partido como manejador en pick-and-roll.",
      pt: "Pontos por jogo como condutor no pick-and-roll.",
      fr: "Points par match comme porteur sur pick-and-roll.",
    },
  },
  pnrRoll: {
    ppp: {
      ja: "PnR ロールマンの PPP。",
      en: "Pick-and-roll roll man PPP.",
      ko: "픽앤롤 롤맨 PPP.",
      zh: "挡拆顺下者 PPP。",
      es: "PPP del roll man en pick-and-roll.",
      pt: "PPP do roll man no pick-and-roll.",
      fr: "PPP du roll man sur pick-and-roll.",
    },
    freq: {
      ja: "PnR ロールマンの使用率。",
      en: "Pick-and-roll roll man frequency.",
      ko: "픽앤롤 롤맨 사용 비중.",
      zh: "挡拆顺下回合占比。",
      es: "Frecuencia como roll man en pick-and-roll.",
      pt: "Frequência como roll man no pick-and-roll.",
      fr: "Fréquence comme roll man sur pick-and-roll.",
    },
    pts: {
      ja: "1試合あたりの PnR ロール得点。",
      en: "Pick-and-roll roll-man points per game.",
      ko: "경기당 픽앤롤 롤맨 득점.",
      zh: "场均挡拆顺下得分。",
      es: "Puntos por partido como roll man.",
      pt: "Pontos por jogo como roll man.",
      fr: "Points par match comme roll man.",
    },
  },
  spotup: {
    ppp: {
      ja: "スポットアップの PPP。",
      en: "Spot-up PPP.",
      ko: "스팟업 PPP.",
      zh: "定点接球投篮 PPP。",
      es: "PPP en spot-up.",
      pt: "PPP em spot-up.",
      fr: "PPP en spot-up.",
    },
    freq: {
      ja: "スポットアップの使用率。",
      en: "Spot-up frequency.",
      ko: "스팟업 사용 비중.",
      zh: "定点投篮回合占比。",
      es: "Frecuencia de spot-up.",
      pt: "Frequência de spot-up.",
      fr: "Fréquence des spot-up.",
    },
    pts: {
      ja: "1試合あたりのスポットアップ得点。",
      en: "Spot-up points per game.",
      ko: "경기당 스팟업 득점.",
      zh: "场均定点投篮得分。",
      es: "Puntos por partido en spot-up.",
      pt: "Pontos por jogo em spot-up.",
      fr: "Points par match en spot-up.",
    },
  },
  trans: {
    ppp: {
      ja: "トランジションの PPP。",
      en: "Transition PPP.",
      ko: "트랜지션 PPP.",
      zh: "转换进攻 PPP。",
      es: "PPP en transición.",
      pt: "PPP em transição.",
      fr: "PPP en transition.",
    },
    freq: {
      ja: "トランジションの使用率。",
      en: "Transition frequency.",
      ko: "트랜지션 사용 비중.",
      zh: "转换进攻回合占比。",
      es: "Frecuencia de transición.",
      pt: "Frequência de transição.",
      fr: "Fréquence des transitions.",
    },
    pts: {
      ja: "1試合あたりのトランジション得点。",
      en: "Transition points per game.",
      ko: "경기당 트랜지션 득점.",
      zh: "场均转换进攻得分。",
      es: "Puntos por partido en transición.",
      pt: "Pontos por jogo em transição.",
      fr: "Points par match en transition.",
    },
  },
  cut: {
    ppp: {
      ja: "カットの PPP。",
      en: "Cut PPP.",
      ko: "컷인 PPP.",
      zh: "空切 PPP。",
      es: "PPP en cortes.",
      pt: "PPP em cortes.",
      fr: "PPP sur les coupes.",
    },
    freq: {
      ja: "カットの使用率。",
      en: "Cut frequency.",
      ko: "컷인 사용 비중.",
      zh: "空切回合占比。",
      es: "Frecuencia de cortes.",
      pt: "Frequência de cortes.",
      fr: "Fréquence des coupes.",
    },
    pts: {
      ja: "1試合あたりのカット得点。",
      en: "Cut points per game.",
      ko: "경기당 컷인 득점.",
      zh: "场均空切得分。",
      es: "Puntos por partido en cortes.",
      pt: "Pontos por jogo em cortes.",
      fr: "Points par match sur les coupes.",
    },
  },
  post: {
    ppp: {
      ja: "ポストアップの PPP。",
      en: "Post-up PPP.",
      ko: "포스트업 PPP.",
      zh: "背身单打 PPP。",
      es: "PPP en post-up.",
      pt: "PPP em post-up.",
      fr: "PPP en poste bas.",
    },
    freq: {
      ja: "ポストアップの使用率。",
      en: "Post-up frequency.",
      ko: "포스트업 사용 비중.",
      zh: "背身单打回合占比。",
      es: "Frecuencia de post-up.",
      pt: "Frequência de post-up.",
      fr: "Fréquence des poste bas.",
    },
    pts: {
      ja: "1試合あたりのポストアップ得点。",
      en: "Post-up points per game.",
      ko: "경기당 포스트업 득점.",
      zh: "场均背身单打得分。",
      es: "Puntos por partido en post-up.",
      pt: "Pontos por jogo em post-up.",
      fr: "Points par match en poste bas.",
    },
  },
  handoff: {
    ppp: {
      ja: "ハンドオフの PPP。",
      en: "Handoff PPP.",
      ko: "핸드오프 PPP.",
      zh: "手递手 PPP。",
      es: "PPP en handoff.",
      pt: "PPP em handoff.",
      fr: "PPP sur passe main à main.",
    },
    freq: {
      ja: "ハンドオフの使用率。",
      en: "Handoff frequency.",
      ko: "핸드오프 사용 비중.",
      zh: "手递手回合占比。",
      es: "Frecuencia de handoff.",
      pt: "Frequência de handoff.",
      fr: "Fréquence des passes main à main.",
    },
    pts: {
      ja: "1試合あたりのハンドオフ得点。",
      en: "Handoff points per game.",
      ko: "경기당 핸드오프 득점.",
      zh: "场均手递手得分。",
      es: "Puntos por partido en handoff.",
      pt: "Pontos por jogo em handoff.",
      fr: "Points par match sur passe main à main.",
    },
  },
  offscreen: {
    ppp: {
      ja: "オフスクリーンの PPP。",
      en: "Off-screen PPP.",
      ko: "오프스크린 PPP.",
      zh: "无球掩护出手 PPP。",
      es: "PPP en off-screen.",
      pt: "PPP em off-screen.",
      fr: "PPP en sortie d’écran.",
    },
    freq: {
      ja: "オフスクリーンの使用率。",
      en: "Off-screen frequency.",
      ko: "오프스크린 사용 비중.",
      zh: "无球掩护回合占比。",
      es: "Frecuencia de off-screen.",
      pt: "Frequência de off-screen.",
      fr: "Fréquence des sorties d’écran.",
    },
    pts: {
      ja: "1試合あたりのオフスクリーン得点。",
      en: "Off-screen points per game.",
      ko: "경기당 오프스크린 득점.",
      zh: "场均无球掩护得分。",
      es: "Puntos por partido en off-screen.",
      pt: "Pontos por jogo em off-screen.",
      fr: "Points par match en sortie d’écran.",
    },
  },
  putback: {
    ppp: {
      ja: "オフリブ・プットバックの PPP。",
      en: "Offensive rebound putback PPP.",
      ko: "공격 리바운드 풋백 PPP.",
      zh: "进攻篮板补篮 PPP。",
      es: "PPP en putback tras rebote ofensivo.",
      pt: "PPP em putback após rebote ofensivo.",
      fr: "PPP en putback après rebond offensif.",
    },
    freq: {
      ja: "プットバックの使用率。",
      en: "Putback frequency.",
      ko: "풋백 사용 비중.",
      zh: "补篮回合占比。",
      es: "Frecuencia de putback.",
      pt: "Frequência de putback.",
      fr: "Fréquence des putbacks.",
    },
    pts: {
      ja: "1試合あたりのプットバック得点。",
      en: "Putback points per game.",
      ko: "경기당 풋백 득점.",
      zh: "场均补篮得分。",
      es: "Puntos por partido en putback.",
      pt: "Pontos por jogo em putback.",
      fr: "Points par match en putback.",
    },
  },
} as const satisfies Record<string, Record<"ppp" | "freq" | "pts", UiStrings>>;

export const NBA_PLAYER_ADVANCED_LEADER_METRICS: readonly NbaPlayerAdvancedLeaderMetricDef[] =
  [
    def("per", "PER", "Player Efficiency Rating", "ratings", true, "rating", {
      ja: "得点・リバウンド・アシストなどを足した総合点。高いほど何でもできている。",
      en: "All-in-one box score. Higher = does more of everything.",
      ko: "득점·리바운드·어시스트 등을 합친 종합 지표. 높을수록 다방면에서 활약.",
      zh: "综合得分、篮板、助攻等的全能指标。越高说明贡献越全面。",
      es: "Índice global de box score. Más alto = aporta en todo.",
      pt: "Índice global do box score. Maior = contribui em tudo.",
      fr: "Indice global du box score. Plus haut = fait tout mieux.",
    }),
    def("ts_pct", "TS%", "True Shooting %", "ratings", true, "pct", {
      ja: "3PとFTも入れたシュート効率。高いほど『同じ試投で点が入る』。",
      en: "Shooting efficiency including 3s and FTs. Higher = more points per shot.",
      ko: "3점과 자유투를 포함한 슈팅 효율. 높을수록 같은 시도로 더 많이 득점.",
      zh: "含三分与罚球的投篮效率。越高说明同样出手得分更多。",
      es: "Eficiencia de tiro con triples y libres. Más alto = más puntos por intento.",
      pt: "Eficiência de arremesso com 3 e lances livres. Maior = mais pontos por tentativa.",
      fr: "Efficacité au tir avec 3 pts et lancers. Plus haut = plus de points par tir.",
    }),
    def("usg", "USG", "Usage %", "ratings", true, "pct", {
      ja: "チームの攻撃のうち、何割を自分が使ったか。高い＝ボールを集める主役。点が取れるかは別。",
      en: "Share of team plays that go through this player. High = the offense runs through them, not that they score well.",
      ko: "팀 공격 중 이 선수가 소모한 비중. 높으면 공격의 중심이라는 뜻(효율과는 별개).",
      zh: "球队进攻中经由该球员的比例。越高说明进攻围绕他运转，与效率无关。",
      es: "Cuota de jugadas del equipo que pasan por él. Alta = el ataque gira a su alrededor, no que anote bien.",
      pt: "Fatia das jogadas do time que passam por ele. Alta = o ataque gira nele, não que acerte bem.",
      fr: "Part des actions de l’équipe qui passent par lui. Élevée = l’attaque tourne autour de lui, pas qu’il marque bien.",
    }),
    def("pie", "PIE", "Player Impact Estimate", "ratings", true, "pct", {
      ja: "試合の出来事のうち、自分が占めた割合。高いほど勝敗への影響が大きい。",
      en: "Share of the game’s events. Higher = more impact on the result.",
      ko: "경기에서 발생한 스탯 중 이 선수의 비중. 높을수록 승패에 큰 영향.",
      zh: "球员在全场数据事件中的占比。越高说明对胜负影响越大。",
      es: "Cuota de los eventos del partido. Más alto = más impacto en el resultado.",
      pt: "Fatia dos eventos do jogo. Maior = mais impacto no resultado.",
      fr: "Part des actions du match. Plus haut = plus d’impact sur le résultat.",
    }),
    def("ast_pct", "AST%", "Assist %", "ratings", true, "pct", {
      ja: "味方が決めた得点のうち、自分のパスから生まれた割合。高いほど組み立て役。",
      en: "Share of teammate buckets that started with this player’s pass. Higher = the setup guy.",
      ko: "동료 득점 중 이 선수의 패스에서 시작된 비율. 높을수록 조율자 역할.",
      zh: "队友进球中由他传球创造的比例。越高说明越是组织者。",
      es: "Cuota de canastas de compañeros iniciadas con su pase. Más alto = el organizador.",
      pt: "Fatia das cestas dos companheiros iniciadas no passe dele. Maior = o organizador.",
      fr: "Part des paniers des coéquipiers issus de sa passe. Plus haut = le meneur de jeu.",
    }),
    def("reb_pct", "REB%", "Rebound %", "ratings", true, "pct", {
      ja: "落ちたボールのうち、自分が取った割合。高いほどボードを支配している。",
      en: "Share of available rebounds grabbed. Higher = owns the glass.",
      ko: "잡을 수 있는 리바운드 중 획득 비율. 높을수록 보드를 지배.",
      zh: "可争抢篮板中被他拿下的比例。越高说明越掌控篮板。",
      es: "Cuota de rebotes disponibles capturados. Más alto = domina el rebote.",
      pt: "Fatia dos rebotes disponíveis conquistados. Maior = domina as tabelas.",
      fr: "Part des rebonds disponibles pris. Plus haut = maîtrise le rebond.",
    }),
    def("ast_to", "A/TO", "AST / TO", "ratings", true, "ratio", {
      ja: "ミス1回あたり何回アシストできたか。高いほどパスが安定している。",
      en: "Assists per turnover. Higher = cleaner passer.",
      ko: "턴오버 1회당 어시스트 수. 높을수록 안정적인 패서.",
      zh: "每次失误对应的助攻数。越高说明传球越稳。",
      es: "Asistencias por pérdida. Más alto = pasador más fiable.",
      pt: "Assistências por turnover. Maior = passador mais seguro.",
      fr: "Passes décisives par perte de balle. Plus haut = passeur plus fiable.",
    }),
    def("ortg", "ORTG", "Offensive Rating", "ratings", true, "rating", {
      ja: "コートにいるときの100possあたり得点。高いほど、自分がいると点が取れる。",
      en: "Points per 100 poss while on court. Higher = offense works with them out there.",
      ko: "출전 중 100포제션당 득점. 높을수록 함께 있을 때 공격이 잘 돌아감.",
      zh: "在场时每100回合得分。越高说明他在场进攻更顺畅。",
      es: "Puntos por 100 posesiones en pista. Más alto = el ataque funciona con él.",
      pt: "Pontos por 100 posses em quadra. Maior = o ataque funciona com ele.",
      fr: "Points par 100 possessions sur le terrain. Plus haut = l’attaque fonctionne avec lui.",
    }),
    def("drtg", "DRTG", "Defensive Rating", "ratings", false, "rating", {
      ja: "コートにいるときの100possあたり失点。低いほど、自分がいると点が止まる。",
      en: "Points allowed per 100 poss while on court. Lower = defense holds with them out there.",
      ko: "출전 중 100포제션당 실점. 낮을수록 함께 있을 때 수비가 버팀.",
      zh: "在场时每100回合失分。越低说明他在场防守更稳。",
      es: "Puntos concedidos por 100 posesiones en pista. Más bajo = la defensa aguanta con él.",
      pt: "Pontos cedidos por 100 posses em quadra. Menor = a defesa segura com ele.",
      fr: "Points concédés par 100 possessions sur le terrain. Plus bas = la défense tient avec lui.",
    }),
    def("efg_pct", "EFG", "Effective FG%", "fourFactors", true, "pct", {
      ja: "3Pを1.5本分と数えたシュート精度。FG%より『本当に点が入るか』。",
      en: "FG% that counts a three as 1.5 makes. Fairer than raw FG%.",
      ko: "3점을 1.5개로 계산한 야투 성공률. 단순 FG%보다 정확.",
      zh: "将三分记为1.5球的命中率。比原始命中率更公平。",
      es: "FG% que cuenta el triple como 1,5 canastas. Más justo que el FG% simple.",
      pt: "FG% que conta o 3 como 1,5 cesta. Mais justo que o FG% puro.",
      fr: "FG% comptant un 3 pts comme 1,5 panier. Plus juste que le FG% brut.",
    }),
    def("fta_rate", "FTr", "FT Attempt Rate", "fourFactors", true, "pct", {
      ja: "シュート1本あたり何回FTをもらえるか。高いほどゴール下やファウルが上手い。",
      en: "FTAs per field-goal attempt. Higher = gets to the line.",
      ko: "야투 시도당 자유투 시도. 높을수록 파울을 잘 얻어냄.",
      zh: "每次投篮对应的罚球出手。越高说明越会造犯规。",
      es: "FTA por intento de campo. Más alto = pisa más la línea.",
      pt: "FTA por tentativa de quadra. Maior = vai mais à linha.",
      fr: "LF tentés par tir tenté. Plus haut = provoque plus de fautes.",
    }),
    def("oreb_pct", "OREB%", "Offensive Rebound %", "fourFactors", true, "pct", {
      ja: "味方のミスショットのうち、自分が拾った割合。高いほどセカンドチャンスを作れる。",
      en: "Share of missed shots grabbed on offense. Higher = extra possessions.",
      ko: "실패한 슈팅 중 공격 리바운드로 잡은 비율. 높을수록 세컨드 찬스 창출.",
      zh: "投失球中由他抢下的进攻篮板比例。越高说明创造更多二次机会。",
      es: "Cuota de tiros fallados capturados en ataque. Más alto = más posesiones extra.",
      pt: "Fatia dos arremessos errados recuperados no ataque. Maior = mais posses extra.",
      fr: "Part des tirs manqués récupérés en attaque. Plus haut = plus de possessions bonus.",
    }),
    def("tov_pct", "TOV%", "Turnover %", "fourFactors", false, "pct", {
      ja: "自分の攻撃のうち、ミスで終わる割合。低いほどボールを大事にしている。",
      en: "Share of plays that end in a turnover. Lower = takes care of the ball.",
      ko: "자신의 공격 중 턴오버로 끝나는 비율. 낮을수록 볼 관리가 좋음.",
      zh: "他的进攻回合中以失误结束的比例。越低说明护球越好。",
      es: "Cuota de jugadas que acaban en pérdida. Más bajo = cuida el balón.",
      pt: "Fatia das jogadas que terminam em turnover. Menor = cuida da bola.",
      fr: "Part des actions finissant en perte de balle. Plus bas = protège le ballon.",
    }),
    def(
      "pct_pts_3",
      "3PT%",
      "% PTS from 3",
      "scoring",
      true,
      "pct",
      {
        ja: "得点のうち 3P。",
        en: "Share of points from threes.",
        ko: "득점 중 3점 비중.",
        zh: "三分得分占比。",
        es: "Cuota de puntos de triple.",
        pt: "Fatia de pontos em bolas de 3.",
        fr: "Part des points à 3 pts.",
      },
      false
    ),
    def(
      "pct_pts_paint",
      "PAINT%",
      "% PTS in paint",
      "scoring",
      true,
      "pct",
      {
        ja: "得点のうちペイント。",
        en: "Share of points in the paint.",
        ko: "득점 중 페인트존 비중.",
        zh: "禁区得分占比。",
        es: "Cuota de puntos en la zona.",
        pt: "Fatia de pontos no garrafão.",
        fr: "Part des points dans la raquette.",
      },
      false
    ),
    def(
      "pct_pts_mid",
      "MID%",
      "% PTS mid-range",
      "scoring",
      true,
      "pct",
      {
        ja: "得点のうちミッドレンジ。",
        en: "Share of points from mid-range.",
        ko: "득점 중 미드레인지 비중.",
        zh: "中距离得分占比。",
        es: "Cuota de puntos de media distancia.",
        pt: "Fatia de pontos de média distância.",
        fr: "Part des points à mi-distance.",
      },
      false
    ),
    def(
      "pct_pts_ft",
      "FT%",
      "% PTS from FT",
      "scoring",
      true,
      "pct",
      {
        ja: "得点のうち FT。",
        en: "Share of points from free throws.",
        ko: "득점 중 자유투 비중.",
        zh: "罚球得分占比。",
        es: "Cuota de puntos de tiros libres.",
        pt: "Fatia de pontos em lances livres.",
        fr: "Part des points aux lancers francs.",
      },
      false
    ),
    def(
      "pct_pts_fb",
      "FB%",
      "% PTS fast break",
      "scoring",
      true,
      "pct",
      {
        ja: "得点のうちファストブレイク。",
        en: "Share of points from fast breaks.",
        ko: "득점 중 속공 비중.",
        zh: "快攻得分占比。",
        es: "Cuota de puntos al contragolpe.",
        pt: "Fatia de pontos em contra-ataque.",
        fr: "Part des points en contre-attaque.",
      },
      false
    ),
    def(
      "pct_pts_tov",
      "TO%",
      "% PTS off TO",
      "scoring",
      true,
      "pct",
      {
        ja: "得点のうち TO 後。",
        en: "Share of points off turnovers.",
        ko: "득점 중 상대 턴오버 이후 비중.",
        zh: "由对手失误转化的得分占比。",
        es: "Cuota de puntos tras pérdida rival.",
        pt: "Fatia de pontos após turnover.",
        fr: "Part des points après perte adverse.",
      },
      false
    ),
    def("pts_3", "3PT", "Points from 3 / G", "scoring", true, "perGame", {
      ja: "1試合あたりの3P得点。",
      en: "Points per game from threes.",
      ko: "경기당 3점 득점.",
      zh: "场均三分得分。",
      es: "Puntos por partido de triple.",
      pt: "Pontos por jogo em bolas de 3.",
      fr: "Points par match à 3 pts.",
    }),
    def("pts_paint", "PAINT", "Paint points / G", "scoring", true, "perGame", {
      ja: "1試合あたりのペイント得点。",
      en: "Points per game in the paint.",
      ko: "경기당 페인트존 득점.",
      zh: "场均禁区得分。",
      es: "Puntos por partido en la zona.",
      pt: "Pontos por jogo no garrafão.",
      fr: "Points par match dans la raquette.",
    }),
    def(
      "pts_mid",
      "MID",
      "Mid-range points / G",
      "scoring",
      true,
      "perGame",
      {
        ja: "1試合あたりのミッドレンジ得点。",
        en: "Points per game from mid-range.",
        ko: "경기당 미드레인지 득점.",
        zh: "场均中距离得分。",
        es: "Puntos por partido de media distancia.",
        pt: "Pontos por jogo de média distância.",
        fr: "Points par match à mi-distance.",
      }
    ),
    def("pts_ft", "FT", "FT points / G", "scoring", true, "perGame", {
      ja: "1試合あたりのフリースロー得点。",
      en: "Points per game from free throws.",
      ko: "경기당 자유투 득점.",
      zh: "场均罚球得分。",
      es: "Puntos por partido en tiros libres.",
      pt: "Pontos por jogo em lances livres.",
      fr: "Points par match aux lancers francs.",
    }),
    def(
      "pts_fb",
      "FB",
      "Fast-break points / G",
      "scoring",
      true,
      "perGame",
      {
        ja: "1試合あたりのファストブレイク得点。",
        en: "Points per game on the break.",
        ko: "경기당 속공 득점.",
        zh: "场均快攻得分。",
        es: "Puntos por partido al contragolpe.",
        pt: "Pontos por jogo em contra-ataque.",
        fr: "Points par match en contre-attaque.",
      }
    ),
    def("pts_tov", "TO", "Points off TO / G", "scoring", true, "perGame", {
      ja: "1試合あたりの相手TO後の得点。",
      en: "Points per game off turnovers.",
      ko: "경기당 상대 턴오버 이후 득점.",
      zh: "场均由失误转化的得分。",
      es: "Puntos por partido tras pérdida rival.",
      pt: "Pontos por jogo após turnover.",
      fr: "Points par match après perte adverse.",
    }),
    def("clutch_pts", "PTS", "Clutch PTS / G", "clutch", true, "perGame", {
      ja: "僅差・終盤の平均得点。",
      en: "Points per game in the clutch.",
      ko: "클러치 상황 경기당 득점.",
      zh: "关键时刻场均得分。",
      es: "Puntos por partido en clutch.",
      pt: "Pontos por jogo no clutch.",
      fr: "Points par match en clutch.",
    }),
    def("clutch_fg_pct", "FG%", "Clutch FG%", "clutch", true, "pct", {
      ja: "僅差・終盤の FG%。",
      en: "FG% in the clutch.",
      ko: "클러치 상황 야투 성공률.",
      zh: "关键时刻投篮命中率。",
      es: "FG% en clutch.",
      pt: "FG% no clutch.",
      fr: "FG% en clutch.",
    }),
    def("clutch_usg", "USG", "Clutch usage", "clutch", true, "pct", {
      ja: "僅差・終盤で、攻撃のボールをどれだけ自分が使ったか。高い＝終盤の主役。",
      en: "Share of clutch plays that go through this player. High = the closer, not that they hit.",
      ko: "클러치 상황에서 공격을 소모한 비중. 높으면 마무리 역할(성공률과는 별개).",
      zh: "关键时刻经由他的进攻比例。越高说明他是终结者，与命中率无关。",
      es: "Cuota de jugadas clutch que pasan por él. Alta = es el closer, no que acierte.",
      pt: "Fatia das jogadas de clutch que passam por ele. Alta = é o closer, não que acerte.",
      fr: "Part des actions clutch qui passent par lui. Élevée = c’est le closer, pas qu’il réussit.",
    }),
    def("iso_ppp", "ISO", "Isolation PPP", "playtype", true, "ppp", PT.iso.ppp, false),
    def("pnr_bh_ppp", "PnR-B", "PnR handler PPP", "playtype", true, "ppp", PT.pnrBh.ppp, false),
    def("pnr_roll_ppp", "PnR-R", "PnR roll PPP", "playtype", true, "ppp", PT.pnrRoll.ppp, false),
    def("spotup_ppp", "SPOT", "Spot-up PPP", "playtype", true, "ppp", PT.spotup.ppp, false),
    def("trans_ppp", "TRAN", "Transition PPP", "playtype", true, "ppp", PT.trans.ppp, false),
    def("cut_ppp", "CUT", "Cut PPP", "playtype", true, "ppp", PT.cut.ppp, false),
    def("post_ppp", "POST", "Post-up PPP", "playtype", true, "ppp", PT.post.ppp, false),
    def("handoff_ppp", "HND", "Handoff PPP", "playtype", true, "ppp", PT.handoff.ppp, false),
    def("offscreen_ppp", "OFFS", "Off-screen PPP", "playtype", true, "ppp", PT.offscreen.ppp, false),
    def("oreb_ppp", "PUTB", "OREB putback PPP", "playtype", true, "ppp", PT.putback.ppp, false),
    def("iso_freq", "ISO%", "Isolation freq", "playtype", true, "pct", PT.iso.freq, false),
    def("pnr_bh_freq", "PnR-B%", "PnR handler freq", "playtype", true, "pct", PT.pnrBh.freq, false),
    def("pnr_roll_freq", "PnR-R%", "PnR roll freq", "playtype", true, "pct", PT.pnrRoll.freq, false),
    def("spotup_freq", "SPOT%", "Spot-up freq", "playtype", true, "pct", PT.spotup.freq, false),
    def("trans_freq", "TRAN%", "Transition freq", "playtype", true, "pct", PT.trans.freq, false),
    def("cut_freq", "CUT%", "Cut freq", "playtype", true, "pct", PT.cut.freq, false),
    def("post_freq", "POST%", "Post-up freq", "playtype", true, "pct", PT.post.freq, false),
    def("handoff_freq", "HND%", "Handoff freq", "playtype", true, "pct", PT.handoff.freq, false),
    def("offscreen_freq", "OFFS%", "Off-screen freq", "playtype", true, "pct", PT.offscreen.freq, false),
    def("oreb_freq", "PUTB%", "Putback freq", "playtype", true, "pct", PT.putback.freq, false),
    def("iso_pts", "ISO", "Isolation PTS / G", "playtype", true, "perGame", PT.iso.pts),
    def("pnr_bh_pts", "PnR-B", "PnR handler PTS / G", "playtype", true, "perGame", PT.pnrBh.pts),
    def("pnr_roll_pts", "PnR-R", "PnR roll PTS / G", "playtype", true, "perGame", PT.pnrRoll.pts),
    def("spotup_pts", "SPOT", "Spot-up PTS / G", "playtype", true, "perGame", PT.spotup.pts),
    def("trans_pts", "TRAN", "Transition PTS / G", "playtype", true, "perGame", PT.trans.pts),
    def("cut_pts", "CUT", "Cut PTS / G", "playtype", true, "perGame", PT.cut.pts),
    def("post_pts", "POST", "Post-up PTS / G", "playtype", true, "perGame", PT.post.pts),
    def("handoff_pts", "HND", "Handoff PTS / G", "playtype", true, "perGame", PT.handoff.pts),
    def("offscreen_pts", "OFFS", "Off-screen PTS / G", "playtype", true, "perGame", PT.offscreen.pts),
    def("oreb_pts", "PUTB", "Putback PTS / G", "playtype", true, "perGame", PT.putback.pts),
    def("matchup_fg_pct", "M-FG%", "Matchup FG%", "defense", false, "pct", {
      ja: "マッチアップ相手の FG%。低いほど守れている。",
      en: "Opponent FG% when guarded. Lower is better.",
      ko: "매치업 상대의 야투 성공률. 낮을수록 잘 막고 있음.",
      zh: "对位对手的投篮命中率。越低说明防守越好。",
      es: "FG% del rival al que defiende. Más bajo, mejor.",
      pt: "FG% do adversário que marca. Menor é melhor.",
      fr: "FG% de l’adversaire défendu. Plus bas, mieux.",
    }),
    def("matchup_3pt_pct", "M-3P%", "Matchup 3P%", "defense", false, "pct", {
      ja: "マッチアップ相手の 3P%。低いほど守れている。",
      en: "Opponent 3P% when guarded. Lower is better.",
      ko: "매치업 상대의 3점 성공률. 낮을수록 잘 막고 있음.",
      zh: "对位对手的三分命中率。越低说明防守越好。",
      es: "3P% del rival al que defiende. Más bajo, mejor.",
      pt: "3P% do adversário que marca. Menor é melhor.",
      fr: "3P% de l’adversaire défendu. Plus bas, mieux.",
    }),
    def("opp_2p_pct", "D-2P", "Opponent 2P%", "defense", false, "pct", {
      ja: "相手の 2P%。低いほど守れている。",
      en: "Opponent 2P%. Lower is better.",
      ko: "상대 2점 성공률. 낮을수록 잘 막고 있음.",
      zh: "对手两分命中率。越低说明防守越好。",
      es: "2P% del rival. Más bajo, mejor.",
      pt: "2P% do adversário. Menor é melhor.",
      fr: "2P% adverse. Plus bas, mieux.",
    }),
    def("opp_3p_pct", "D-3P", "Opponent 3P%", "defense", false, "pct", {
      ja: "相手の 3P%。低いほど守れている。",
      en: "Opponent 3P%. Lower is better.",
      ko: "상대 3점 성공률. 낮을수록 잘 막고 있음.",
      zh: "对手三分命中率。越低说明防守越好。",
      es: "3P% del rival. Más bajo, mejor.",
      pt: "3P% do adversário. Menor é melhor.",
      fr: "3P% adverse. Plus bas, mieux.",
    }),
    def("opp_lt6_pct", "D-6ft", "Opp FG% < 6ft", "defense", false, "pct", {
      ja: "6ft 以内の相手 FG%。低いほどリムを守れている。",
      en: "Opponent FG% inside 6 feet. Lower is better.",
      ko: "6피트 이내 상대 야투 성공률. 낮을수록 골밑을 잘 지킴.",
      zh: "对手6英尺内命中率。越低说明护框越好。",
      es: "FG% del rival dentro de 6 pies. Más bajo, mejor protección del aro.",
      pt: "FG% do adversário dentro de 6 pés. Menor = melhor proteção do aro.",
      fr: "FG% adverse à moins de 6 pieds. Plus bas = meilleure protection du cercle.",
    }),
    def(
      "restricted_fg_pct",
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
      }
    ),
    def(
      "restricted_pts",
      "R-PTS",
      "Restricted PTS / G",
      "shooting",
      true,
      "perGame",
      {
        ja: "restricted からの1試合平均得点。",
        en: "Points per game from the restricted area.",
        ko: "경기당 제한구역 득점.",
        zh: "场均禁区（限制区）得分。",
        es: "Puntos por partido en zona restringida.",
        pt: "Pontos por jogo na área restrita.",
        fr: "Points par match dans la zone restreinte.",
      }
    ),
    def("corner3_pct", "C3", "Corner 3%", "shooting", true, "pct", {
      ja: "コーナー3の成功率。",
      en: "Corner three percentage.",
      ko: "코너 3점 성공률.",
      zh: "底角三分命中率。",
      es: "Porcentaje en triples de esquina.",
      pt: "Aproveitamento em 3 de canto.",
      fr: "Pourcentage à 3 pts de coin.",
    }),
    def(
      "corner3_pts",
      "C3-PTS",
      "Corner 3 PTS / G",
      "shooting",
      true,
      "perGame",
      {
        ja: "コーナー3からの1試合平均得点。",
        en: "Points per game from corner threes.",
        ko: "경기당 코너 3점 득점.",
        zh: "场均底角三分得分。",
        es: "Puntos por partido en triples de esquina.",
        pt: "Pontos por jogo em 3 de canto.",
        fr: "Points par match à 3 pts de coin.",
      }
    ),
    def("drives", "DRIVE", "Drives / G", "tracking", true, "perGame", {
      ja: "ドライブ数。",
      en: "Drives per game.",
      ko: "경기당 드라이브 횟수.",
      zh: "场均突破次数。",
      es: "Penetraciones por partido.",
      pt: "Drives por jogo.",
      fr: "Pénétrations par match.",
    }),
    def("drive_pts", "D-PTS", "Drive PTS / G", "tracking", true, "perGame", {
      ja: "ドライブからの1試合平均得点。",
      en: "Points per game from drives.",
      ko: "경기당 드라이브 득점.",
      zh: "场均突破得分。",
      es: "Puntos por partido en penetraciones.",
      pt: "Pontos por jogo em drives.",
      fr: "Points par match sur pénétrations.",
    }),
    def("cns_fg_pct", "C&S", "Catch & Shoot FG%", "tracking", true, "pct", {
      ja: "キャッチ&シュート FG%。",
      en: "Catch-and-shoot FG%.",
      ko: "캐치&슛 야투 성공률.",
      zh: "接球即投命中率。",
      es: "FG% en catch-and-shoot.",
      pt: "FG% em catch-and-shoot.",
      fr: "FG% en catch-and-shoot.",
    }),
    def(
      "cns_pts",
      "CS-PTS",
      "Catch & Shoot PTS / G",
      "tracking",
      true,
      "perGame",
      {
        ja: "キャッチ&シュートからの1試合平均得点。",
        en: "Points per game from catch-and-shoot.",
        ko: "경기당 캐치&슛 득점.",
        zh: "场均接球即投得分。",
        es: "Puntos por partido en catch-and-shoot.",
        pt: "Pontos por jogo em catch-and-shoot.",
        fr: "Points par match en catch-and-shoot.",
      }
    ),
    def("pullup_fg_pct", "PULL", "Pull-up FG%", "tracking", true, "pct", {
      ja: "プルアップ FG%。",
      en: "Pull-up FG%.",
      ko: "풀업 점퍼 야투 성공률.",
      zh: "急停跳投命中率。",
      es: "FG% en pull-up.",
      pt: "FG% em pull-up.",
      fr: "FG% en pull-up.",
    }),
    def(
      "pullup_pts",
      "PU-PTS",
      "Pull-up PTS / G",
      "tracking",
      true,
      "perGame",
      {
        ja: "プルアップからの1試合平均得点。",
        en: "Points per game from pull-ups.",
        ko: "경기당 풀업 점퍼 득점.",
        zh: "场均急停跳投得分。",
        es: "Puntos por partido en pull-up.",
        pt: "Pontos por jogo em pull-up.",
        fr: "Points par match en pull-up.",
      }
    ),
    def(
      "paint_touches",
      "PAINT",
      "Paint touches / G",
      "tracking",
      true,
      "perGame",
      {
        ja: "ペイントタッチ。",
        en: "Paint touches per game.",
        ko: "경기당 페인트존 터치.",
        zh: "场均禁区触球次数。",
        es: "Toques en la zona por partido.",
        pt: "Toques no garrafão por jogo.",
        fr: "Ballons touchés dans la raquette par match.",
      }
    ),
    def(
      "paint_touch_pts",
      "PT-PTS",
      "Paint-touch PTS / G",
      "tracking",
      true,
      "perGame",
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
    def("passes", "PASS", "Passes / G", "tracking", true, "perGame", {
      ja: "パス数。",
      en: "Passes per game.",
      ko: "경기당 패스 횟수.",
      zh: "场均传球次数。",
      es: "Pases por partido.",
      pt: "Passes por jogo.",
      fr: "Passes par match.",
    }),
    def("speed", "SPD", "Avg speed", "tracking", true, "rating", {
      ja: "平均スピード。",
      en: "Average speed.",
      ko: "평균 스피드.",
      zh: "平均移动速度。",
      es: "Velocidad media.",
      pt: "Velocidade média.",
      fr: "Vitesse moyenne.",
    }),
    def("deflections", "DEFL", "Deflections / G", "hustle", true, "perGame", {
      ja: "ディフレクション。",
      en: "Deflections per game.",
      ko: "경기당 디플렉션.",
      zh: "场均干扰球次数。",
      es: "Desvíos por partido.",
      pt: "Desvios por jogo.",
      fr: "Déviations par match.",
    }),
    def("charges", "CHG", "Charges drawn / G", "hustle", true, "perGame", {
      ja: "チャージング。",
      en: "Charges drawn per game.",
      ko: "경기당 유도한 차징 파울.",
      zh: "场均造对手带球撞人。",
      es: "Cargas provocadas por partido.",
      pt: "Faltas de ataque provocadas por jogo.",
      fr: "Fautes offensives provoquées par match.",
    }),
    def("loose_balls", "LOOSE", "Loose balls / G", "hustle", true, "perGame", {
      ja: "ルーズボール。",
      en: "Loose balls recovered per game.",
      ko: "경기당 루즈볼 획득.",
      zh: "场均争抢到的球。",
      es: "Balones sueltos recuperados por partido.",
      pt: "Bolas soltas recuperadas por jogo.",
      fr: "Ballons perdus récupérés par match.",
    }),
    def(
      "screen_ast",
      "SCRN",
      "Screen assists / G",
      "hustle",
      true,
      "perGame",
      {
        ja: "スクリーンアシスト。",
        en: "Screen assists per game.",
        ko: "경기당 스크린 어시스트.",
        zh: "场均掩护助攻。",
        es: "Asistencias de bloqueo por partido.",
        pt: "Assistências de bloqueio por jogo.",
        fr: "Passes décisives sur écran par match.",
      }
    ),
    def(
      "contested_shots",
      "CONT",
      "Contested shots / G",
      "hustle",
      true,
      "perGame",
      {
        ja: "コンテストショット。",
        en: "Contested shots per game.",
        ko: "경기당 컨테스트한 슈팅.",
        zh: "场均干扰对手出手次数。",
        es: "Tiros disputados por partido.",
        pt: "Arremessos contestados por jogo.",
        fr: "Tirs contestés par match.",
      }
    ),
  ];

export function playerAdvancedMetricsForCategory(
  category: NbaLeagueAdvancedCategory
): readonly NbaPlayerAdvancedLeaderMetricDef[] {
  return NBA_PLAYER_ADVANCED_LEADER_METRICS.filter(
    (m) => m.category === category && m.showInLeague
  );
}

export function playerAdvancedMetricChipRows(category: NbaLeagueAdvancedCategory) {
  return chunkForChipGrid(
    playerAdvancedMetricsForCategory(category),
    NBA_LEAGUE_STAT_CHIP_COLS
  );
}

export function playerAdvancedMetricDef(
  id: NbaPlayerAdvancedLeaderMetric
): NbaPlayerAdvancedLeaderMetricDef {
  const found = NBA_PLAYER_ADVANCED_LEADER_METRICS.find((m) => m.id === id);
  if (!found) throw new Error(`unknown player advanced metric ${id}`);
  return found;
}

function pct(n: number) {
  return Math.round(n * 1000) / 1000;
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

function ppp(n: number) {
  return Math.round(n * 100) / 100;
}

export function buildPlayerAdvancedMetricValue(
  metric: NbaPlayerAdvancedLeaderMetric,
  rnd: () => number
): number {
  switch (metric) {
    case "per":
      return round1(8 + rnd() * 22);
    case "ts_pct":
      return pct(0.48 + rnd() * 0.2);
    case "usg":
      return pct(0.12 + rnd() * 0.22);
    case "pie":
      return pct(0.04 + rnd() * 0.14);
    case "ast_pct":
      return pct(0.08 + rnd() * 0.32);
    case "reb_pct":
      return pct(0.05 + rnd() * 0.18);
    case "ast_to":
      return round1(0.8 + rnd() * 3.2);
    case "ortg":
      return round1(98 + rnd() * 28);
    case "drtg":
      return round1(102 + rnd() * 22);
    case "efg_pct":
      return pct(0.42 + rnd() * 0.2);
    case "fta_rate":
      return pct(0.12 + rnd() * 0.28);
    case "oreb_pct":
      return pct(0.02 + rnd() * 0.14);
    case "tov_pct":
      return pct(0.08 + rnd() * 0.12);
    case "pct_pts_3":
      return pct(0.1 + rnd() * 0.4);
    case "pct_pts_paint":
      return pct(0.2 + rnd() * 0.4);
    case "pct_pts_mid":
      return pct(0.06 + rnd() * 0.22);
    case "pct_pts_ft":
      return pct(0.08 + rnd() * 0.18);
    case "pct_pts_fb":
      return pct(0.04 + rnd() * 0.14);
    case "pct_pts_tov":
      return pct(0.06 + rnd() * 0.12);
    case "pts_3":
      return round1(1 + rnd() * 12);
    case "pts_paint":
      return round1(2 + rnd() * 16);
    case "pts_mid":
      return round1(0.6 + rnd() * 8);
    case "pts_ft":
      return round1(0.8 + rnd() * 8);
    case "pts_fb":
      return round1(0.4 + rnd() * 6);
    case "pts_tov":
      return round1(0.6 + rnd() * 6);
    case "clutch_pts":
      return round1(1 + rnd() * 8);
    case "clutch_fg_pct":
      return pct(0.32 + rnd() * 0.22);
    case "clutch_usg":
      return pct(0.14 + rnd() * 0.24);
    case "iso_ppp":
    case "pnr_bh_ppp":
    case "spotup_ppp":
    case "post_ppp":
      return ppp(0.72 + rnd() * 0.45);
    case "pnr_roll_ppp":
    case "trans_ppp":
    case "cut_ppp":
      return ppp(0.95 + rnd() * 0.4);
    case "handoff_ppp":
    case "offscreen_ppp":
      return ppp(0.78 + rnd() * 0.42);
    case "oreb_ppp":
      return ppp(1.05 + rnd() * 0.35);
    case "iso_freq":
    case "pnr_bh_freq":
    case "spotup_freq":
      return pct(0.06 + rnd() * 0.22);
    case "pnr_roll_freq":
    case "trans_freq":
    case "cut_freq":
      return pct(0.04 + rnd() * 0.16);
    case "post_freq":
    case "handoff_freq":
    case "offscreen_freq":
      return pct(0.03 + rnd() * 0.14);
    case "oreb_freq":
      return pct(0.02 + rnd() * 0.1);
    case "iso_pts":
    case "pnr_bh_pts":
    case "spotup_pts":
      return round1(0.6 + rnd() * 9);
    case "pnr_roll_pts":
    case "trans_pts":
    case "cut_pts":
      return round1(0.4 + rnd() * 7);
    case "post_pts":
    case "handoff_pts":
    case "offscreen_pts":
      return round1(0.3 + rnd() * 6);
    case "oreb_pts":
      return round1(0.2 + rnd() * 4);
    case "matchup_fg_pct":
      return pct(0.4 + rnd() * 0.16);
    case "matchup_3pt_pct":
      return pct(0.32 + rnd() * 0.14);
    case "opp_2p_pct":
      return pct(0.46 + rnd() * 0.14);
    case "opp_3p_pct":
      return pct(0.33 + rnd() * 0.12);
    case "opp_lt6_pct":
      return pct(0.55 + rnd() * 0.16);
    case "restricted_fg_pct":
      return pct(0.55 + rnd() * 0.22);
    case "restricted_pts":
      return round1(1.2 + rnd() * 12);
    case "corner3_pct":
      return pct(0.32 + rnd() * 0.18);
    case "corner3_pts":
      return round1(0.3 + rnd() * 5);
    case "drives":
      return round1(1 + rnd() * 14);
    case "drive_pts":
      return round1(0.5 + rnd() * 8);
    case "cns_fg_pct":
      return pct(0.32 + rnd() * 0.16);
    case "cns_pts":
      return round1(0.5 + rnd() * 8);
    case "pullup_fg_pct":
      return pct(0.28 + rnd() * 0.16);
    case "pullup_pts":
      return round1(0.4 + rnd() * 9);
    case "passes":
      return round1(12 + rnd() * 50);
    case "speed":
      return round1(3.8 + rnd() * 1.2);
    case "paint_touches":
      return round1(1 + rnd() * 10);
    case "paint_touch_pts":
      return round1(0.4 + rnd() * 7);
    case "deflections":
      return round1(0.4 + rnd() * 3.2);
    case "charges":
      return round1(rnd() * 0.6);
    case "loose_balls":
      return round1(0.3 + rnd() * 2.2);
    case "screen_ast":
      return round1(0.2 + rnd() * 4);
    case "contested_shots":
      return round1(2 + rnd() * 10);
    default:
      return rnd();
  }
}

export function formatPlayerAdvancedLeaderValue(
  metric: NbaPlayerAdvancedLeaderMetric,
  value: number | null | undefined
): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  const kind = playerAdvancedMetricDef(metric).kind;
  if (kind === "pct") return `${(value * 100).toFixed(1)}%`;
  if (kind === "ppp") return value.toFixed(2);
  if (kind === "ratio") return value.toFixed(2);
  return value.toFixed(1);
}
