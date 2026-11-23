/**
 * ASK の答えの表と試合カード。数字は Firestore から読んだ値だけ。
 */

import type { NbaOffseasonMove, NbaTeamOffseasonMoves } from "@/lib/nba/offseasonMoves/offseasonMovesTypes";
import { compactNbaCardNickname, getNbaTeamFullNameById } from "@/lib/nba-team-names";
import { DAILY_LEADER_STATS, DAILY_LEADERS_TOP_N, type DailyLeaderStatKey } from "@/lib/nba/dailyLeaders/buildDailyLeaders";
import type { NbaAskHowGroup, NbaAskHowTab } from "./nbaAskHowTheyPlay";

export type NbaAskBoard = {
  columns: string[];
  rows: { label: string; cells: string[] }[];
  /** 表に出しきれない所属・出場数。箇条書きにはしない */
  note?: string;
};

/** チーム詳細・選手詳細と同じ部品を答えの上に出す。データはアプリが詳細と同じ API から取る */
export const NBA_ASK_VIEW_SECTIONS = {
  team: [
    "position_defense",
    "splits",
    "roster",
    "lineups",
    "discipline",
    "on_off",
    "how_they_play",
    "payroll",
    "draft_picks",
    "injuries",
    "game_logs",
    "form",
    "edge",
  ],
  player: [
    "season",
    "how_they_play",
    "on_off",
    "matchups",
    "highs",
    "game_logs",
    "discipline",
    "contract",
    "career",
    "profile",
    "shot_zones",
    "splits",
  ],
} as const;

export const NBA_ASK_LADDER_AWARDS = ["mvp", "rookies", "dpoy", "sixth", "mip"] as const;

/** LEAGUE タブのセクション。mode は最初に開く切り替え（各部品の切り替えの ID） */
export const NBA_ASK_HUB_SECTIONS = {
  splits: ["homeAway", "b2b"],
  hot_cold: [],
  on_off: [],
  highs: ["pts", "reb", "ast", "fg3m", "stl", "blk"],
  top_games: [],
  value: ["best", "worst"],
  team_records: ["streak", "close", "b2b", "threeInFour", "vsOver500", "home", "away", "vsEast", "vsWest"],
  schedule: ["played", "remaining"],
  picks: [],
} as const;

export type NbaAskHubSection = keyof typeof NBA_ASK_HUB_SECTIONS;

/** 表のある答えにだけ LEAGUE のセクションを付ける（集計なし等の文だけの答えには付けない） */
export function withHubView<A extends { board?: unknown; view?: NbaAskView | null }>(out: A, id: NbaAskHubSection, mode?: string): A {
  return out.board ? { ...out, view: { kind: "hub", id, ...(mode ? { mode } : {}) } } : out;
}

export type NbaAskView =
  | {
      kind: "team";
      id: string;
      section: (typeof NBA_ASK_VIEW_SECTIONS.team)[number];
      count?: number;
      tab?: NbaAskHowTab;
      group?: NbaAskHowGroup;
      /** 最初に開く切り替え（ラインナップ = most / best / worst） */
      mode?: string;
      /** ラインナップの人数（2〜5） */
      size?: number;
    }
  | {
      kind: "player";
      id: string;
      section: (typeof NBA_ASK_VIEW_SECTIONS.player)[number];
      count?: number;
      /** HOW THEY PLAY の開くタブ（TRACKING はグループも） */
      tab?: NbaAskHowTab;
      group?: NbaAskHowGroup;
      /** 最初に開く切り替え（マッチアップ = of / df） */
      mode?: string;
    }
  | {
      /** TODAY の NBA リーダー表（id = 米国東部の試合日 YYYY-MM-DD） */
      kind: "today";
      id: string;
      stat: DailyLeaderStatKey;
      count?: number;
    }
  | {
      /** STATS 画面と同じ今季の順位表（id = east / west / all） */
      kind: "standings";
      id: "east" | "west" | "all";
    }
  | {
      /** STATS のリーダー（id = 選手リーダー / チームリーグ表の指標 ID） */
      kind: "leaders";
      id: string;
      scope: "player" | "team";
      count?: number;
      /** このチームの前後を出して強調する */
      team?: string;
      worst?: boolean;
    }
  | {
      /** LEAGUE の賞ラダー */
      kind: "ladder";
      id: (typeof NBA_ASK_LADDER_AWARDS)[number];
      count?: number;
    }
  | {
      /** LEAGUE の通算の節目（id = all か選手 ID） */
      kind: "milestones";
      id: string;
    }
  | {
      /** LEAGUE タブのセクション（id = セクション） */
      kind: "hub";
      id: NbaAskHubSection;
      mode?: string;
    };

const HOW_TABS: readonly NbaAskHowTab[] = [
  "ratings",
  "fourFactors",
  "scoring",
  "playtype",
  "clutch",
  "defense",
  "hustle",
  "rebounding",
  "tracking",
];
const HOW_GROUPS: readonly NbaAskHowGroup[] = ["shot", "drive", "pass", "ball"];

/** 知らない部品名は捨てる（古いアプリは表と文だけ出す） */
export function parseNbaAskView(raw: unknown): NbaAskView | undefined {
  const v = asRecord(raw);
  if (!v || typeof v.id !== "string" || !/^[a-z0-9_-]{1,40}$/i.test(v.id)) return undefined;
  const tab = HOW_TABS.find((t) => t === v.tab);
  const group = HOW_GROUPS.find((g) => g === v.group);
  const mode = typeof v.mode === "string" && /^[a-z0-9]{1,20}$/i.test(v.mode) ? v.mode : undefined;
  const size = typeof v.size === "number" && v.size >= 2 && v.size <= 5 ? Math.floor(v.size) : undefined;
  const how = { ...(tab ? { tab } : {}), ...(group ? { group } : {}), ...(mode ? { mode } : {}) };
  const count = typeof v.count === "number" && v.count > 0 ? Math.min(20, Math.floor(v.count)) : undefined;
  if (v.kind === "today") {
    const stat = DAILY_LEADER_STATS.find((s) => s.key === v.stat)?.key;
    if (!stat || !/^\d{4}-\d{2}-\d{2}$/.test(v.id)) return undefined;
    const top = count ? Math.min(DAILY_LEADERS_TOP_N, count) : undefined;
    return { kind: "today", id: v.id, stat, ...(top ? { count: top } : {}) };
  }
  if (v.kind === "standings") {
    return v.id === "east" || v.id === "west" || v.id === "all" ? { kind: "standings", id: v.id } : undefined;
  }
  if (v.kind === "leaders" && (v.scope === "player" || v.scope === "team")) {
    const team = typeof v.team === "string" && /^[a-z0-9-]{1,20}$/i.test(v.team) ? v.team : undefined;
    return {
      kind: "leaders",
      id: v.id,
      scope: v.scope,
      ...(count ? { count } : {}),
      ...(team ? { team } : {}),
      ...(v.worst === true ? { worst: true } : {}),
    };
  }
  if (v.kind === "ladder") {
    const award = NBA_ASK_LADDER_AWARDS.find((a) => a === v.id);
    return award ? { kind: "ladder", id: award, ...(count ? { count } : {}) } : undefined;
  }
  if (v.kind === "milestones") return { kind: "milestones", id: v.id };
  if (v.kind === "hub" && Object.prototype.hasOwnProperty.call(NBA_ASK_HUB_SECTIONS, v.id)) {
    const id = v.id as NbaAskHubSection;
    const modes: readonly string[] = NBA_ASK_HUB_SECTIONS[id];
    const hubMode = mode && modes.includes(mode) ? mode : undefined;
    return { kind: "hub", id, ...(hubMode ? { mode: hubMode } : {}) };
  }
  if (v.kind === "team" && (NBA_ASK_VIEW_SECTIONS.team as readonly string[]).includes(String(v.section))) {
    return {
      kind: "team",
      id: v.id,
      section: v.section as (typeof NBA_ASK_VIEW_SECTIONS.team)[number],
      ...(count ? { count } : {}),
      ...(size ? { size } : {}),
      ...how,
    };
  }
  if (v.kind === "player" && (NBA_ASK_VIEW_SECTIONS.player as readonly string[]).includes(String(v.section))) {
    return {
      kind: "player",
      id: v.id,
      section: v.section as (typeof NBA_ASK_VIEW_SECTIONS.player)[number],
      ...(count ? { count } : {}),
      ...how,
    };
  }
  return undefined;
}

/** オフシーズンの IN / OUT。チーム詳細と同じ部品で描く */
export type NbaAskMoves = {
  teamId: string;
  moves: NbaTeamOffseasonMoves;
};

const GAME_DOC_ID = /^[a-zA-Z0-9_-]{1,128}$/;

/** 予想画面へ渡す試合 ID。形が違うものは捨てる */
export function nbaAskGameCardId(raw: unknown): string {
  const id = String(raw ?? "").trim();
  return GAME_DOC_ID.test(id) ? id : "";
}

/** 試合一覧と同じカードで見せる。数字の表にはしない */
export type NbaAskGameCard = {
  /** Firestore の試合 ID。予想画面を開く */
  id: string;
  away: string;
  home: string;
  awayTeamId: string;
  homeTeamId: string;
  /** 一覧カードのニックネーム（CAVALIERS など） */
  awayName: string;
  homeName: string;
  awayRecord: string;
  homeRecord: string;
  start: string;
  pickup: boolean;
  score: string | null;
  /** 終了・進行中だけ。ホームが左 */
  scoreHome: number | null;
  scoreAway: number | null;
  status: string;
  /** 上辺。REGULAR SEASON など */
  round: string;
};

/** 試合一覧と同じ短いチーム名。道具が略称だけでもチーム ID から戻す */
export function nbaAskCardTeamName(teamId: string, abbr: string, named?: string | null): string {
  const given = typeof named === "string" ? named.trim() : "";
  if (given && given !== "—") return given;
  const full = getNbaTeamFullNameById(teamId);
  const source = full && full !== teamId ? full : abbr;
  return compactNbaCardNickname(source, teamId).toLocaleUpperCase("en-US");
}

function cell(value: unknown): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    if (Math.abs(value - Math.round(value)) < 0.05) return String(Math.round(value));
    return value.toFixed(1);
  }
  const text = String(value ?? "").trim();
  return text || "—";
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function rowsOf(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const row = asRecord(item);
    return row ? [row] : [];
  });
}

/** 1 日の NBA は最大 15 試合 */
export const NBA_ASK_MAX_GAME_CARDS = 15;

/** 試合日の結果はカードにする。表にはしない */
export function gamesFromAskTool(name: string, result: unknown): NbaAskGameCard[] | null {
  if (name !== "get_games_on_date") return null;
  const data = asRecord(result);
  if (!data || data.error || data.found === false) return null;
  const games = rowsOf(data.games).slice(0, NBA_ASK_MAX_GAME_CARDS);
  if (games.length === 0) return null;
  return games.map((game) => {
    const awayTeamId = String(game.awayTeamId ?? "");
    const homeTeamId = String(game.homeTeamId ?? "");
    const away = cell(game.away);
    const home = cell(game.home);
    const scoreHome = typeof game.scoreHome === "number" ? game.scoreHome : null;
    const scoreAway = typeof game.scoreAway === "number" ? game.scoreAway : null;
    return {
      id: nbaAskGameCardId(game.id),
      away,
      home,
      awayTeamId,
      homeTeamId,
      awayName: nbaAskCardTeamName(awayTeamId, away),
      homeName: nbaAskCardTeamName(homeTeamId, home),
      awayRecord: cell(game.awayRecord) === "—" ? "(0-0)" : cell(game.awayRecord),
      homeRecord: cell(game.homeRecord) === "—" ? "(0-0)" : cell(game.homeRecord),
      start: cell(game.start) === "—" ? "" : cell(game.start),
      pickup: game.pickup === true,
      score: game.score == null || game.score === "" ? null : cell(game.score),
      scoreHome,
      scoreAway,
      status: String(game.status ?? "scheduled"),
      round: cell(game.round) === "—" ? "" : cell(game.round),
    };
  });
}

export function parseNbaAskBoard(raw: unknown): NbaAskBoard | undefined {
  const data = asRecord(raw);
  if (!data || !Array.isArray(data.columns) || !Array.isArray(data.rows)) return undefined;
  const columns = data.columns.map((item) => String(item)).filter(Boolean).slice(0, 6);
  if (columns.length === 0) return undefined;
  const rows = data.rows.flatMap((item) => {
    const row = asRecord(item);
    if (!row || !Array.isArray(row.cells)) return [];
    return [
      {
        label: String(row.label ?? "").slice(0, 48),
        cells: row.cells.map((cell) => String(cell)).slice(0, columns.length),
      },
    ];
  });
  if (rows.length === 0) return undefined;
  const note = typeof data.note === "string" ? data.note.trim().slice(0, 160) : "";
  return note ? { columns, rows: rows.slice(0, 24), note } : { columns, rows: rows.slice(0, 24) };
}

const MOVE_KINDS = new Set(["draft", "acquired", "signed", "departed", "waived", "unsigned"]);

function moveOf(raw: unknown): NbaOffseasonMove | null {
  const m = asRecord(raw);
  if (!m || typeof m.playerId !== "string" || !MOVE_KINDS.has(String(m.kind))) return null;
  const n = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
  return {
    playerId: m.playerId,
    firstName: String(m.firstName ?? ""),
    lastName: String(m.lastName ?? ""),
    kind: m.kind as NbaOffseasonMove["kind"],
    otherTeamId: typeof m.otherTeamId === "string" ? m.otherTeamId : null,
    draftRound: n(m.draftRound),
    draftNumber: n(m.draftNumber),
    isTwoWay: m.isTwoWay === true,
    salary: n(m.salary),
  };
}

export function parseNbaAskMoves(raw: unknown): NbaAskMoves | undefined {
  const data = asRecord(raw);
  const moves = asRecord(data?.moves);
  if (!data || typeof data.teamId !== "string" || !moves) return undefined;
  const list = (v: unknown) => (Array.isArray(v) ? v.map(moveOf).filter((m): m is NbaOffseasonMove => m != null).slice(0, 30) : []);
  return {
    teamId: data.teamId,
    moves: {
      seasonKey: String(moves.seasonKey ?? ""),
      priorSeasonKey: String(moves.priorSeasonKey ?? ""),
      incoming: list(moves.incoming),
      outgoing: list(moves.outgoing),
    },
  };
}
