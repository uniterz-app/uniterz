/**
 * スタッツの答えを表にする。道具が返した数字だけを載せ、文章では作らない。
 */

import { compactNbaCardNickname, getNbaTeamFullNameById } from "@/lib/nba-team-names";

export type NbaAskBoard = {
  columns: string[];
  rows: { label: string; cells: string[] }[];
  /** 表に出しきれない所属・出場数。箇条書きにはしない */
  note?: string;
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

const METRIC_LABEL: Record<string, string> = {
  pts: "得点",
  reb: "リバウンド",
  ast: "アシスト",
  stl: "スティール",
  blk: "ブロック",
  tov: "ターンオーバー",
  ppg: "得点",
  papg: "失点",
  pace: "ペース",
  netrtg: "NET",
  ortg: "OFF",
  drtg: "DEF",
  diff: "得失点差",
  fg3m: "3ポイント",
};

const APP_QUESTION =
  /使い方|ポイント|採点|ランキング|料金|プラン|って何|とは|通知|招待|スクワッド|ログイン|プロ\b|PRO\b|あっぷせっと|アップセット|番狂わせ|\bupset\b|連勝|勝率/i;

const STATS_QUESTION =
  /平均|スタッツ|試合|得点|リバウンド|アシスト|順位|欠場|怪我|けが|結果|直近|リーダー|成績|勝敗|ボックス|スコア|契約|年俸|ショット|テクニカル|フラグラント|退場|罰金|得意形|苦手形|キャリア|通算/i;

/** スタッツの質問なら表で見せる。アプリの使い方は吹き出しのまま。 */
export function nbaAskLooksLikeStats(text: string): boolean {
  const q = text.trim();
  if (!q) return false;
  if (STATS_QUESTION.test(q) && !/使い方|採点|って何|とは|通知|招待|スクワッド/.test(q)) return true;
  if (APP_QUESTION.test(q)) return false;
  return STATS_QUESTION.test(q);
}

function percent(value: unknown): string | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const n = value > 1 ? value : value * 100;
  return `${n.toFixed(1)}%`;
}

function money(value: unknown): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  return `${sign}$${Math.round(abs).toLocaleString("en-US")}`;
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

/** 試合日の道具はカードにする。表にはしない */
export function gamesFromAskTool(name: string, result: unknown): NbaAskGameCard[] | null {
  if (name !== "get_games_on_date") return null;
  const data = asRecord(result);
  if (!data || data.error || data.found === false) return null;
  const games = rowsOf(data.games).slice(0, 8);
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

/** 道具の結果が表にできるときだけ返す。検索の途中結果は表にしない。 */
export function boardFromAskTool(name: string, result: unknown): NbaAskBoard | null {
  const data = asRecord(result);
  if (!data || data.error || data.found === false) return null;

  if (name === "get_player_season_averages" && "ppg" in data) {
    const fg = percent(data.fgPct);
    const extra = [
      data.spg != null ? `STL ${cell(data.spg)}` : "",
      data.bpg != null ? `BLK ${cell(data.bpg)}` : "",
      data.tpg != null ? `TO ${cell(data.tpg)}` : "",
    ].filter(Boolean);
    const note = [cell(data.team), data.gp != null ? `${cell(data.gp)}試合` : "", data.mpg != null ? `${cell(data.mpg)}分` : "", fg ? `FG ${fg}` : "", extra.join(" ")]
      .filter((part) => part && part !== "—")
      .join(" · ");
    return {
      columns: ["得点", "リバウンド", "アシスト"],
      rows: [{ label: "今季", cells: [cell(data.ppg), cell(data.rpg), cell(data.apg)] }],
      ...(note ? { note } : {}),
    };
  }

  if (name === "get_player_recent_games") {
    const games = rowsOf(data.games).slice(0, 5);
    if (games.length === 0) return null;
    return {
      columns: ["得点", "リバウンド", "アシスト"],
      rows: games.map((game) => ({
        label: `${cell(game.date)} ${cell(game.opp)}`.trim(),
        cells: [cell(game.pts), cell(game.reb), cell(game.ast)],
      })),
    };
  }

  if (name === "get_player_game" && data.found === true) {
    const line = asRecord(data.line);
    if (!line) return null;
    return {
      columns: ["得点", "リバウンド", "アシスト"],
      rows: [
        {
          label: cell(data.opponent),
          cells: [cell(line.pts), cell(line.reb), cell(line.ast)],
        },
      ],
    };
  }

  if (name === "get_player_leaders") {
    const metric = METRIC_LABEL[String(data.metric ?? "")] ?? "数値";
    const leaders = rowsOf(data.leaders).slice(0, 5);
    const asked = asRecord(data.team);
    const rows = leaders.map((row) => ({
      label: `${cell(row.name)} ${cell(row.team)}`.trim(),
      cells: [cell(row.rank), cell(row.value)],
    }));
    if (asked && !leaders.some((row) => cell(row.name) === cell(asked.name) && cell(row.team) === cell(asked.team))) {
      rows.push({
        label: `${cell(asked.name)} ${cell(asked.team)}`.trim(),
        cells: [cell(asked.rank), cell(asked.value)],
      });
    }
    if (rows.length === 0) return null;
    const season = String(data.season ?? "").trim();
    return {
      columns: ["順位", metric],
      rows,
      ...(season ? { note: season } : {}),
    };
  }

  if (name === "get_team_stat") {
    const metric = METRIC_LABEL[String(data.metric ?? "")] ?? "数値";
    const top = rowsOf(data.top);
    const leader = asRecord(data.leader);
    const asked = asRecord(data.team);
    const listed = top.length > 0 ? top : [leader, asked].flatMap((row) => (row ? [row] : []));
    const rows = listed
      .filter((row, index, all) => all.findIndex((other) => cell(other.team) === cell(row.team) && cell(other.rank) === cell(row.rank)) === index)
      .slice(0, 8)
      .map((row) => ({
        label: cell(row.team),
        cells: [cell(row.rank), cell(row.value)],
      }));
    if (rows.length === 0) return null;
    const season = String(data.season ?? "").trim();
    return {
      columns: ["順位", metric],
      rows,
      ...(season ? { note: season } : {}),
    };
  }

  if (name === "get_player_shot_zones") {
    const zones = rowsOf(data.zones).slice(0, 8);
    if (zones.length === 0) return null;
    return {
      columns: ["FG%", "試投"],
      rows: zones.map((zone) => ({
        label: cell(zone.zone),
        cells: [percent(zone.fgPct) ?? "—", cell(zone.fga)],
      })),
      ...(data.season ? { note: String(data.season) } : {}),
    };
  }

  if (name === "get_player_contract") {
    const seasons = rowsOf(data.seasons).slice(0, 6);
    if (seasons.length === 0) return null;
    const fa = data.freeAgencyYear ? `FA ${cell(data.freeAgencyYear)}` : "";
    return {
      columns: ["年俸"],
      rows: seasons.map((row) => ({
        label: `${cell(row.season)} ${cell(row.team)}`.trim(),
        cells: [money(row.salary)],
      })),
      ...(fa ? { note: fa } : {}),
    };
  }

  if (name === "get_player_career") {
    const seasons = rowsOf(data.seasons).slice(0, 8);
    if (seasons.length === 0) return null;
    return {
      columns: ["得点", "リバウンド", "アシスト"],
      rows: seasons.map((row) => ({
        label: `${cell(row.season)} ${cell(row.team)}`.trim(),
        cells: [cell(row.pts), cell(row.reb), cell(row.ast)],
      })),
      note: "1試合平均",
    };
  }

  if (name === "get_team_shapes") {
    const shapes = rowsOf(data.shapes).slice(0, 4);
    if (shapes.length === 0) return null;
    return {
      columns: ["勝", "敗"],
      rows: shapes.map((row) => ({
        label: `${row.kind === "weak" ? "苦手" : "得意"} ${cell(row.label)}`.trim(),
        cells: [cell(row.w), cell(row.l)],
      })),
      ...(data.record ? { note: String(data.record) } : {}),
    };
  }

  if (name === "get_discipline") {
    const players = rowsOf(data.players).slice(0, 5);
    const rows =
      players.length > 0
        ? players.map((row) => ({
            label: cell(row.name),
            cells: [cell(row.tech), cell(row.flag), cell(row.eject)],
          }))
        : [
            {
              label: cell(data.team || "今季"),
              cells: [cell(data.tech), cell(data.flag), cell(data.eject)],
            },
          ];
    const note = [
      players.length > 0 ? `チーム ${cell(data.tech)}/${cell(data.flag)}/${cell(data.eject)}` : "",
      data.fineUsd ? `罰金 ${money(data.fineUsd)}` : "",
      data.season ? String(data.season) : "",
    ]
      .filter(Boolean)
      .join(" · ")
      .slice(0, 80);
    return {
      columns: ["テクニカル", "フラグラント", "退場"],
      rows,
      ...(note ? { note } : {}),
    };
  }

  if (name === "get_daily_leaders") {
    const metric = METRIC_LABEL[String(data.metric ?? "")] ?? "数値";
    const leaders = rowsOf(data.leaders).slice(0, 5);
    if (leaders.length === 0) return null;
    return {
      columns: ["順位", metric],
      rows: leaders.map((row) => ({
        label: `${cell(row.name)} ${cell(row.team)}`.trim(),
        cells: [cell(row.rank), cell(row.value)],
      })),
      ...(data.date ? { note: String(data.date) } : {}),
    };
  }

  if (name === "get_standings") {
    const one = "w" in data && "l" in data;
    const listed = one
      ? [data]
      : [...rowsOf(data.east), ...rowsOf(data.west)].slice(0, 8);
    if (listed.length === 0) return null;
    return {
      columns: ["順位", "勝", "敗"],
      rows: listed.map((row) => ({
        label: cell(row.team),
        cells: [cell(row.rank), cell(row.w), cell(row.l)],
      })),
    };
  }

  return null;
}

export function parseNbaAskBoard(raw: unknown): NbaAskBoard | undefined {
  const data = asRecord(raw);
  if (!data || !Array.isArray(data.columns) || !Array.isArray(data.rows)) return undefined;
  const columns = data.columns.map((item) => String(item)).filter(Boolean).slice(0, 4);
  if (columns.length === 0) return undefined;
  const rows = data.rows.flatMap((item) => {
    const row = asRecord(item);
    if (!row || !Array.isArray(row.cells)) return [];
    return [
      {
        label: String(row.label ?? "").slice(0, 40),
        cells: row.cells.map((cell) => String(cell)).slice(0, columns.length),
      },
    ];
  });
  if (rows.length === 0) return undefined;
  const note = typeof data.note === "string" ? data.note.trim().slice(0, 80) : "";
  return note ? { columns, rows: rows.slice(0, 8), note } : { columns, rows: rows.slice(0, 8) };
}
