/**
 * Free ゲート下の表示イメージ用サンプル Brief。
 * 本番で出す踏み込んだ行（移動距離・エース欠場・相手強度・選手型）を入れる。
 */
import type { PredictProBrief } from "@/lib/predict/predictProBrief";
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
      {
        label: "REBOUNDING",
        detailJa: "OREB% #4 · 相手 DREB% #26",
        detailEn: "OREB% #4 · Opp DREB% #26",
      },
      {
        label: "PAINT ATTACK",
        detailJa: "ペイント得点 #5 · 相手失点 #27 · A.Davis QUES",
        detailEn: "Paint PPG #5 · Opp paint #27 · A.Davis QUES",
      },
    ],
    schedule: [
      {
        textJa: "休養 2日 · ホーム連戦 3試合目",
        textEn: "2 days rest · 3rd home game in a row",
      },
      {
        textJa: "前試合 OT · 主力 2人 36分超",
        textEn: "Last game OT · 2 starters 36+ min",
      },
    ],
    context: [
      {
        textJa: "直近3 · 相手はすべて勝率5割未満",
        textEn: "LAST 3 · all opponents sub-.500",
      },
      {
        textJa: "直近10 · 勝率上位10位以内と未対戦",
        textEn: "LAST 10 · no Top-10 win-pct foes",
      },
    ],
    players: [
      {
        playerId: "237",
        playerName: "L.James",
        label: "PAINT EDGE",
        detailJa: "ペイント得点 #6 · PAINT% #9 · 相手守備 #27",
        detailEn: "Paint PPG #6 · PAINT% #9 · Opp defense #27",
      },
      {
        playerId: "15",
        playerName: "A.Reaves",
        label: "LAST 10 FORM",
        detailJa: "直近10 得点 #18（今季 #42）· 3P% .410",
        detailEn: "Last 10 PTS #18 (season #42) · 3P% .410",
      },
    ],
  },
  away: {
    edges: [
      {
        label: "3-POINT VOLUME",
        detailJa: "3PA率 #3 · 相手被3P #24",
        detailEn: "3PA rate #3 · Opp 3P% allowed #24",
      },
      {
        label: "ACE OUT",
        detailJa: "J.Tatum OUT · 今季欠場時 11-6 · 109.9-110.1",
        detailEn: "J.Tatum OUT · when out 11-6 · 109.9-110.1",
      },
    ],
    schedule: [
      ...proBriefTravelLines(CELTICS_ROAD_TRIP_TRAVEL),
      {
        textJa: "連戦2日目 · 4日で3試合目",
        textEn: "2nd of B2B · 3rd game in 4 nights",
      },
    ],
    context: [
      {
        textJa: "格上相手に直近5で 1勝4敗",
        textEn: "VS .500+ · 1-4 in last 5",
      },
      {
        textJa: "直近アウェイ · 相手平均勝率 .620",
        textEn: "ROAD SOS · opp avg .620",
      },
    ],
    players: [
      {
        playerId: "70",
        playerName: "J.Brown",
        label: "HOT 3PT",
        detailJa: "直近10 3P% #7（今季 #28）· 3PM 3.4",
        detailEn: "Last 10 3P% #7 (season #28) · 3PM 3.4",
      },
      {
        playerId: "434",
        playerName: "D.White",
        label: "3-POINT EDGE",
        detailJa: "3PM #14 · 相手被3P #24 · Tatum OUTで使用増",
        detailEn: "3PM #14 · Opp 3P allowed #24 · usage up w/ Tatum OUT",
      },
    ],
  },
};
