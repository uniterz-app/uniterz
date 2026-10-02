/**
 * /dev/predict-timing-preview 用モック（NBA）
 *
 * Pro Brief = HOME/AWAY カード
 * EDGE（英語） / SCHEDULE（日程・疲労 〜2） / CONTEXT（対戦相手の強さ）
 */

import type { PredictProBrief } from "@/lib/predict/predictProBrief";
import {
  proBriefTravelLines,
  travelSummaryForBrief,
} from "@/lib/predict/nbaProBriefTravel";

const TIMING_TIP_MS = Date.UTC(2026, 2, 13, 2, 30);
const HOUR = 60 * 60 * 1000;

const LAKERS_HOME_TRAVEL = travelSummaryForBrief({
  teamId: "nba-lakers",
  tonightVenueTeamId: "nba-lakers",
  tonightStartAtMs: TIMING_TIP_MS,
});
/** BOS → PHX（30h前）→ LAL 今夜。2レグで 2,000km 超なので 2日移動が出る */
const CELTICS_ROAD_TRIP_TRAVEL = travelSummaryForBrief({
  teamId: "nba-celtics",
  tonightVenueTeamId: "nba-lakers",
  tonightStartAtMs: TIMING_TIP_MS,
  recentStops: [
    {
      venueTeamId: "nba-celtics",
      startAtMs: TIMING_TIP_MS - 72 * HOUR,
    },
    {
      venueTeamId: "nba-suns",
      startAtMs: TIMING_TIP_MS - 30 * HOUR,
    },
  ],
});

export type PredictTimingPreviewPreset = {
  id: string;
  label: string;
  description: string;
  match: {
    homeTeamId: string;
    awayTeamId: string;
    homeTeamName: string;
    awayTeamName: string;
    homeTeamNameEn?: string;
    awayTeamNameEn?: string;
    homeRecord?: string;
    awayRecord?: string;
    groupLabel?: string;
    kickoffLabel?: string;
    isKnockout?: boolean;
  };
  market?: {
    allUsers: { homePct: number; awayPct: number; drawPct?: number };
    band?: { homePct: number; awayPct: number; drawPct?: number; bandN: number };
  };
  proBrief: PredictProBrief;
};

export const PREDICT_TIMING_PREVIEW_PRESETS: PredictTimingPreviewPreset[] = [
  {
    id: "both-teams-rich",
    label: "Brief フル",
    description:
      "EDGE英語。SCHEDULE は各2件。CONTEXT は相手強度（格下続き / 格上未勝利 など）。",
    match: {
      homeTeamId: "nba-lakers",
      awayTeamId: "nba-celtics",
      homeTeamName: "レイカーズ",
      awayTeamName: "セルティックス",
      homeTeamNameEn: "Lakers",
      awayTeamNameEn: "Celtics",
      homeRecord: "48-24",
      awayRecord: "52-20",
      groupLabel: "NBA · WEST vs EAST",
      kickoffLabel: "Fri 7:30 PM ET",
    },
    market: {
      allUsers: { homePct: 44, awayPct: 56 },
      band: { homePct: 58, awayPct: 42, bandN: 14 },
    },
    proBrief: {
      home: {
        edges: [
          {
            label: "REBOUNDING",
            detailJa: "OREB% #4 · 相手 DREB% #26",
            detailEn: "OREB% #4 · Opp DREB% #26",
          },
          {
            label: "PAINT ATTACK",
            detailJa: "ペイント得点 #5 · 相手失点 #27",
            detailEn: "Paint PPG #5 · Opp paint #27",
          },
        ],
        schedule: [
          {
            textJa: "休養 2日（ホーム連戦 3試合目）",
            textEn: "2 days rest · 3rd home game in a row",
          },
          ...proBriefTravelLines(LAKERS_HOME_TRAVEL, { homeNoTravel: true }),
        ],
        context: [
          {
            textJa: "直近3試合の相手はすべて勝率5割未満",
            textEn: "Last 3 opponents were all sub-.500",
          },
          {
            textJa: "直近10試合で勝率上位10位以内と未対戦",
            textEn: "No Top-10 win-pct foes in last 10",
          },
        ],
      },
      away: {
        edges: [
          {
            label: "3-POINT SHOOTING",
            detailJa: "3P試投率 #3 · 相手被3P高め",
            detailEn: "3PA rate #3 · Opp allows 3s",
          },
          {
            label: "BENCH SCORING",
            detailJa: "ベンチ得点リーグ上位",
            detailEn: "Bench PPG top tier",
          },
        ],
        schedule: [
          ...proBriefTravelLines(CELTICS_ROAD_TRIP_TRAVEL),
          {
            textJa: "4日間で3試合目",
            textEn: "3rd game in 4 nights",
          },
        ],
        context: [
          {
            textJa: "格上相手に直近5試合で 1勝4敗",
            textEn: "1-4 in last 5 vs above-.500 teams",
          },
          {
            textJa: "直近アウェイは強豪続き（相手平均勝率 .620）",
            textEn: "Recent road SOS elevated (opp .620)",
          },
        ],
      },
    },
  },
  {
    id: "strong-vs-neutral",
    label: "ペイント中心",
    description: "HOMEは休息あり。AWAYは3-in-4 + 高地。CONTEXTで相手強度。",
    match: {
      homeTeamId: "nba-lakers",
      awayTeamId: "nba-knicks",
      homeTeamName: "レイカーズ",
      awayTeamName: "ニックス",
      homeTeamNameEn: "Lakers",
      awayTeamNameEn: "Knicks",
      homeRecord: "48-24",
      awayRecord: "45-27",
      groupLabel: "NBA · REGULAR",
      kickoffLabel: "Sun 3:30 PM ET",
    },
    market: {
      allUsers: { homePct: 53, awayPct: 47 },
    },
    proBrief: {
      home: {
        edges: [
          {
            label: "PAINT ATTACK",
            detailJa: "ペイント得点 #4 · 相手失点 #24",
            detailEn: "Paint PPG #4 · Opp paint #24",
          },
          {
            label: "HOME COURT",
            detailJa: "ホーム直近 5-0",
            detailEn: "Home last 5: 5-0",
          },
        ],
        schedule: [
          {
            textJa: "休養 3日以上",
            textEn: "3+ days rest",
          },
          {
            textJa: "ホーム連戦 2試合目",
            textEn: "2nd home game in a row",
          },
        ],
        context: [
          {
            textJa: "過去3試合の相手は格下ばかり",
            textEn: "Last 3 opponents were all weaker seeds",
          },
        ],
      },
      away: {
        edges: [
          {
            label: "TRANSITION",
            detailJa: "速攻得点上位",
            detailEn: "Fast-break PPG high",
          },
        ],
        schedule: [
          {
            textJa: "4日間で3試合目",
            textEn: "3rd game in 4 nights",
          },
          {
            textJa: "前試合は延長戦 · 主力3人が 38分以上",
            textEn: "Came off OT · 3 stars 38+ min",
          },
        ],
        context: [
          {
            textJa: "格上には直近6試合未勝利",
            textEn: "0-6 vs Top-10 over last 6 meetings",
          },
          {
            textJa: "直近10試合で勝率上位チームと2試合のみ",
            textEn: "Only 2 of last 10 vs above-.500 teams",
          },
        ],
      },
    },
  },
  {
    id: "giant-killer-context",
    label: "プレーオフ",
    description: "AWAY守備エッジ。HOMEは疲労 + 格上未勝利のCONTEXT。",
    match: {
      homeTeamId: "nba-pistons",
      awayTeamId: "nba-thunder",
      homeTeamName: "ピストンズ",
      awayTeamName: "サンダー",
      homeTeamNameEn: "Pistons",
      awayTeamNameEn: "Thunder",
      homeRecord: "38-34",
      awayRecord: "58-14",
      groupLabel: "NBA · PLAYOFFS",
      kickoffLabel: "Tue 8:00 PM ET",
      isKnockout: true,
    },
    market: {
      allUsers: { homePct: 22, awayPct: 78 },
      band: { homePct: 28, awayPct: 72, bandN: 11 },
    },
    proBrief: {
      home: {
        edges: [
          {
            label: "REBOUNDING",
            detailJa: "OREB% 上位",
            detailEn: "OREB% top tier",
          },
        ],
        schedule: [
          {
            textJa: "4日間で3試合目",
            textEn: "3rd game in 4 nights",
          },
          {
            textJa: "前試合は延長戦後",
            textEn: "Coming off an OT game",
          },
        ],
        context: [
          {
            textJa: "格上相手にシーズン 1勝8敗",
            textEn: "1-8 vs Top-10 this season",
          },
          {
            textJa: "直近5試合の相手平均勝率は .480（やや楽）",
            textEn: "Last 5 opp win% avg .480 (soft stretch)",
          },
        ],
      },
      away: {
        edges: [
          {
            label: "DEFENSE",
            detailJa: "Def Rating #1",
            detailEn: "Def Rating #1",
          },
          {
            label: "3-POINT SHOOTING",
            detailJa: "対上位でも3P%安定",
            detailEn: "3P% holds vs Top teams",
          },
        ],
        schedule: [
          {
            textJa: "休養 3日以上",
            textEn: "3+ days rest",
          },
          {
            textJa: "アウェイ連戦 2試合目",
            textEn: "2nd away game in a row",
          },
        ],
        context: [
          {
            textJa: "直近10試合は勝率上位と6試合（強度高）",
            textEn: "6 of last 10 vs above-.500 (hard SOS)",
          },
        ],
      },
    },
  },
  {
    id: "underdog-pattern",
    label: "3P振れ",
    description: "HOME 3-in-4。AWAYはペース/ペイント。CONTEXTは相手強度。",
    match: {
      homeTeamId: "nba-warriors",
      awayTeamId: "nba-nuggets",
      homeTeamName: "ウォリアーズ",
      awayTeamName: "ナゲッツ",
      homeTeamNameEn: "Warriors",
      awayTeamNameEn: "Nuggets",
      homeRecord: "41-31",
      awayRecord: "46-26",
      groupLabel: "NBA · WEST",
      kickoffLabel: "Thu 10:00 PM ET",
    },
    market: {
      allUsers: { homePct: 41, awayPct: 59 },
    },
    proBrief: {
      home: {
        edges: [
          {
            label: "3-POINT SHOOTING",
            detailJa: "試投依存度高 · 振れ幅大",
            detailEn: "High 3PA dependence — high variance",
          },
        ],
        schedule: [
          {
            textJa: "4日間で3試合目",
            textEn: "3rd game in 4 nights",
          },
          {
            textJa: "高地での試合（DEN）",
            textEn: "Altitude game (DEN)",
          },
        ],
        context: [
          {
            textJa: "直近3試合の相手は格下ばかり",
            textEn: "Last 3 opponents were all weaker",
          },
          {
            textJa: "勝率5割超相手に直近 2勝5敗",
            textEn: "2-5 recently vs above-.500 teams",
          },
        ],
      },
      away: {
        edges: [
          {
            label: "PAINT ATTACK",
            detailJa: "ペイント得点 #6 · 相手失点 #22",
            detailEn: "Paint PPG #6 · Opp paint #22",
          },
          {
            label: "PACE CONTROL",
            detailJa: "遅いペースで勝率高",
            detailEn: "Wins more at slower pace",
          },
        ],
        schedule: [
          {
            textJa: "休養 3日以上（ホーム）",
            textEn: "3+ days rest at home",
          },
          {
            textJa: "ホーム連戦 4試合目",
            textEn: "4th home game in a row",
          },
        ],
        context: [
          {
            textJa: "直近10試合で勝率上位と7試合",
            textEn: "7 of last 10 vs above-.500 teams",
          },
        ],
      },
    },
  },
  {
    id: "sparse",
    label: "最小",
    description: "各カード薄め。SCHEDULE / CONTEXT は最低1〜2。",
    match: {
      homeTeamId: "nba-spurs",
      awayTeamId: "nba-magic",
      homeTeamName: "スパーズ",
      awayTeamName: "マジック",
      homeTeamNameEn: "Spurs",
      awayTeamNameEn: "Magic",
      groupLabel: "NBA · REGULAR",
      kickoffLabel: "Wed 8:00 PM ET",
    },
    proBrief: {
      home: {
        edges: [
          {
            label: "PACE",
            detailJa: "速いペースで得点力が出る",
            detailEn: "Offense opens at higher pace",
          },
        ],
        schedule: [
          {
            textJa: "ホーム Back-to-Back",
            textEn: "Home Back-to-Back",
          },
          {
            textJa: "休養 0日",
            textEn: "0 days rest",
          },
        ],
        context: [
          {
            textJa: "直近は勝率上位とほぼ当たっていない",
            textEn: "Rarely faced above-.500 teams lately",
          },
        ],
      },
      away: {
        edges: [
          {
            label: "DEFENSE",
            detailJa: "Def Rating 上位",
            detailEn: "Def Rating top tier",
          },
        ],
        schedule: [
          {
            textJa: "移動距離 約1200km",
            textEn: "Travel ~1200 km",
          },
          {
            textJa: "アウェイ連戦 3試合目",
            textEn: "3rd away game in a row",
          },
        ],
        context: [
          {
            textJa: "直近5試合の相手平均勝率 .550",
            textEn: "Last 5 opp win% avg .550",
          },
        ],
      },
    },
  },
];
