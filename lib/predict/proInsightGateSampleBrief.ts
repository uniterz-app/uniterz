/**
 * Free ゲート下の表示イメージ用サンプル Brief。
 * 本番で出す踏み込んだ行（移動距離・エース欠場・相手強度・選手型）を入れる。
 */
import type { PredictProBrief } from "@/lib/predict/predictProBrief";
import {
  proBriefEdge,
  proBriefLine,
  proBriefPlayer,
} from "@/lib/predict/predictProBrief";
import {
  proBriefTravelLines,
  travelSummaryForBrief,
} from "@/lib/predict/nbaProBriefTravel";

const TIP_MS = Date.UTC(2026, 2, 13, 2, 30);
const HOUR = 60 * 60 * 1000;

/** BOS → PHX（30h前）→ LAL 今夜。2レグで 2,000km 超 */
const CELTICS_ROAD_TRIP_TRAVEL = travelSummaryForBrief({
  teamId: "nba-celtics",
  tonightVenueTeamId: "nba-lakers",
  tonightStartAtMs: TIP_MS,
  recentStops: [
    {
      venueTeamId: "nba-celtics",
      startAtMs: TIP_MS - 72 * HOUR,
    },
    {
      venueTeamId: "nba-suns",
      startAtMs: TIP_MS - 30 * HOUR,
    },
  ],
});

export const PRO_INSIGHT_GATE_SAMPLE_BRIEF: PredictProBrief = {
  phase: "full",
  gamesPlayed: 58,
  home: {
    edges: [
      proBriefEdge("REBOUNDING", {
        ja: "OREB% #4 · 相手 DREB% #26",
        en: "OREB% #4 · Opp DREB% #26",
        ko: "OREB% #4 · 상대 DREB% #26",
        zh: "进攻篮板率 #4 · 对手防守篮板率 #26",
        es: "OREB% #4 · DREB% rival #26",
        pt: "OREB% #4 · DREB% adv. #26",
        fr: "OREB% #4 · DREB% adv. #26",
      }),
      proBriefEdge("PAINT ATTACK", {
        ja: "ペイント得点 #5 · 相手失点 #27 · A.Davis QUES",
        en: "Paint PPG #5 · Opp paint #27 · A.Davis QUES",
        ko: "페인트 득점 #5 · 상대 페인트 실점 #27 · A.Davis 출전 불투명",
        zh: "油漆区得分 #5 · 对手油漆区失分 #27 · A.Davis 出战成疑",
        es: "PTS en pintura #5 · Pintura rival #27 · A.Davis en duda",
        pt: "PTS no garrafão #5 · Garrafão adv. #27 · A.Davis em dúvida",
        fr: "Pts dans la raquette #5 · Raquette adv. #27 · A.Davis incertain",
      }),
    ],
    schedule: [
      proBriefLine({
        ja: "休養 2日 · ホーム連戦 3試合目",
        en: "2 days rest · 3rd home game in a row",
        ko: "2일 휴식 · 홈 연전 3번째 경기",
        zh: "休息 2 天 · 主场连战第 3 场",
        es: "2 días de descanso · 3.er partido seguido en casa",
        pt: "2 dias de descanso · 3.º jogo seguido em casa",
        fr: "2 jours de repos · 3e match d'affilée à domicile",
      }),
      proBriefLine({
        ja: "前試合 OT · 主力 2人 36分超",
        en: "Last game OT · 2 starters 36+ min",
        ko: "직전 경기 연장 · 주전 2명 36분 이상",
        zh: "上一场加时 · 2 名首发出场 36 分钟以上",
        es: "Prórroga en el último · 2 titulares con 36+ min",
        pt: "Prorrogação no último · 2 titulares com 36+ min",
        fr: "Prolongation au dernier match · 2 titulaires à 36+ min",
      }),
    ],
    context: [
      proBriefLine({
        ja: "直近3 · 相手はすべて勝率5割未満",
        en: "LAST 3 · all opponents sub-.500",
        ko: "최근 3경기 · 상대 모두 승률 5할 미만",
        zh: "近 3 场 · 对手胜率均低于五成",
        es: "Últimos 3 · todos los rivales sub-.500",
        pt: "Últimos 3 · todos os adversários abaixo de .500",
        fr: "3 derniers · tous les adversaires sous .500",
      }),
      proBriefLine({
        ja: "直近10 · 勝率上位10位以内と未対戦",
        en: "LAST 10 · no Top-10 win-pct foes",
        ko: "최근 10경기 · 승률 상위 10팀과 미대결",
        zh: "近 10 场 · 未遇胜率前十球队",
        es: "Últimos 10 · sin rivales del Top-10 en % de victorias",
        pt: "Últimos 10 · sem adversários do Top-10 em aproveitamento",
        fr: "10 derniers · aucun adversaire du Top-10 en % de victoires",
      }),
    ],
    players: [
      proBriefPlayer(
        { playerId: "237", playerName: "L.James", label: "PAINT EDGE" },
        {
          ja: "ペイント得点 #6 · PAINT% #9 · 相手守備 #27",
          en: "Paint PPG #6 · PAINT% #9 · Opp defense #27",
          ko: "페인트 득점 #6 · PAINT% #9 · 상대 수비 #27",
          zh: "油漆区得分 #6 · 油漆区占比 #9 · 对手防守 #27",
          es: "PTS en pintura #6 · PAINT% #9 · Defensa rival #27",
          pt: "PTS no garrafão #6 · PAINT% #9 · Defesa adv. #27",
          fr: "Pts dans la raquette #6 · PAINT% #9 · Défense adv. #27",
        }
      ),
      proBriefPlayer(
        { playerId: "15", playerName: "A.Reaves", label: "LAST 10 FORM" },
        {
          ja: "直近10 得点 #18（今季 #42）· 3P% .410",
          en: "Last 10 PTS #18 (season #42) · 3P% .410",
          ko: "최근 10경기 득점 #18 (시즌 #42) · 3P% .410",
          zh: "近 10 场得分 #18（赛季 #42）· 三分命中率 .410",
          es: "Últimos 10 PTS #18 (temporada #42) · 3P% .410",
          pt: "Últimos 10 PTS #18 (temporada #42) · 3P% .410",
          fr: "10 derniers PTS #18 (saison #42) · 3P% .410",
        }
      ),
    ],
  },
  away: {
    edges: [
      proBriefEdge("3-POINT VOLUME", {
        ja: "3PA率 #3 · 相手被3P #24",
        en: "3PA rate #3 · Opp 3P% allowed #24",
        ko: "3PA 비율 #3 · 상대 3P% 허용 #24",
        zh: "三分出手占比 #3 · 对手三分被命中率 #24",
        es: "Tasa de 3PA #3 · 3P% permitido rival #24",
        pt: "Taxa de 3PA #3 · 3P% cedido adv. #24",
        fr: "Taux de 3PA #3 · 3P% concédé adv. #24",
      }),
      proBriefEdge("ACE OUT", {
        ja: "J.Tatum OUT · 今季欠場時 11-6 · 109.9-110.1",
        en: "J.Tatum OUT · when out 11-6 · 109.9-110.1",
        ko: "J.Tatum 결장 · 이번 시즌 결장 시 11-6 · 109.9-110.1",
        zh: "J.Tatum 缺阵 · 本季缺阵时 11-6 · 109.9-110.1",
        es: "J.Tatum fuera · sin él esta temp. 11-6 · 109.9-110.1",
        pt: "J.Tatum fora · sem ele nesta temp. 11-6 · 109.9-110.1",
        fr: "J.Tatum absent · sans lui cette saison 11-6 · 109.9-110.1",
      }),
    ],
    schedule: [
      ...proBriefTravelLines(CELTICS_ROAD_TRIP_TRAVEL),
      proBriefLine({
        ja: "連戦2日目 · 4日で3試合目",
        en: "2nd of B2B · 3rd game in 4 nights",
        ko: "백투백 2번째 · 4일간 3번째 경기",
        zh: "背靠背第 2 场 · 4 天内第 3 场",
        es: "2.º del B2B · 3.er partido en 4 días",
        pt: "2.º do B2B · 3.º jogo em 4 dias",
        fr: "2e du B2B · 3e match en 4 jours",
      }),
    ],
    context: [
      proBriefLine({
        ja: "格上相手に直近5で 1勝4敗",
        en: "VS .500+ · 1-4 in last 5",
        ko: "승률 5할 이상 상대 최근 5경기 1승 4패",
        zh: "对阵五成胜率以上球队近 5 场 1 胜 4 负",
        es: "vs equipos .500+ · 1-4 en los últimos 5",
        pt: "vs times .500+ · 1-4 nos últimos 5",
        fr: "vs équipes .500+ · 1-4 sur les 5 derniers",
      }),
      proBriefLine({
        ja: "直近アウェイ · 相手平均勝率 .620",
        en: "ROAD SOS · opp avg .620",
        ko: "최근 원정 · 상대 평균 승률 .620",
        zh: "近期客场 · 对手平均胜率 .620",
        es: "Calendario fuera · rival medio .620",
        pt: "Calendário fora · adversário médio .620",
        fr: "Calendrier à l'extérieur · adversaire moyen .620",
      }),
    ],
    players: [
      proBriefPlayer(
        { playerId: "70", playerName: "J.Brown", label: "HOT 3PT" },
        {
          ja: "直近10 3P% #7（今季 #28）· 3PM 3.4",
          en: "Last 10 3P% #7 (season #28) · 3PM 3.4",
          ko: "최근 10경기 3P% #7 (시즌 #28) · 3PM 3.4",
          zh: "近 10 场三分命中率 #7（赛季 #28）· 场均三分 3.4",
          es: "Últimos 10 3P% #7 (temporada #28) · 3PM 3.4",
          pt: "Últimos 10 3P% #7 (temporada #28) · 3PM 3.4",
          fr: "10 derniers 3P% #7 (saison #28) · 3PM 3.4",
        }
      ),
      proBriefPlayer(
        { playerId: "434", playerName: "D.White", label: "3-POINT EDGE" },
        {
          ja: "3PM #14 · 相手被3P #24 · Tatum OUTで使用増",
          en: "3PM #14 · Opp 3P allowed #24 · usage up w/ Tatum OUT",
          ko: "3PM #14 · 상대 3P 허용 #24 · Tatum 결장으로 사용률 증가",
          zh: "三分命中 #14 · 对手三分被命中 #24 · Tatum 缺阵下球权提升",
          es: "3PM #14 · 3P permitido rival #24 · más uso sin Tatum",
          pt: "3PM #14 · 3P cedido adv. #24 · mais uso sem Tatum",
          fr: "3PM #14 · 3P concédé adv. #24 · usage accru sans Tatum",
        }
      ),
    ],
  },
};
