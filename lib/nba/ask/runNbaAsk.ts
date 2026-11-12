/**
 * UNITERZ ASK（サーバー専用）。
 * 1. よくあるアプリの質問は、言い回しの決まりで即答（AI を通さない）
 * 2. それ以外は AI が質問を読み取って「何を・誰の・いつの」を返す（`nbaAskIntent`）
 * 3. 答えはアプリのヘルプ文言（`nbaAskKnowledge`）と Firestore のデータ（`nbaAskNbaAnswer`）から組む
 * AI は答えの文も数字も作らない。
 */
import type { Firestore } from "firebase-admin/firestore";
import { nbaAskPrivateRefusal } from "./nbaAskPrivate";
import { emptyNbaAskIntent, parseNbaAskIntent, type NbaAskIntent } from "./nbaAskIntent";
import { matchNbaAskKnowledge, nbaAskKnowledgeAnswer } from "./nbaAskKnowledge";
import {
  answerNbaAskQuery,
  NBA_ASK_PRO_QUERIES,
  NBA_ASK_SCHEDULE_QUERIES,
  type NbaAskAnswer,
} from "./nbaAskNbaAnswer";
import type { NbaAskBoard, NbaAskGameCard } from "./nbaAskBoard";
import type { NbaAskDestinationId } from "./nbaAskDestinations";
import { nbaAskIsPronounFollowUp } from "./nbaAskSubject";
import { nbaAskNicknamePlayer } from "./nbaAskPlayerResolve";

export type NbaAskTurn = { role: "user" | "assistant"; content: string };

/** 送る会話の上限（古いものから捨てる） */
export const NBA_ASK_MAX_TURNS = 6;
export const NBA_ASK_MAX_CHARS = 400;

/**
 * 試合一覧の日付と同じタイムゾーン。送られてこない古いアプリは、日本語なら日本時間・それ以外は米国東部
 */
export function resolveNbaAskTimeZone(raw: unknown, language: string): string {
  const tz = typeof raw === "string" ? raw.trim().slice(0, 64) : "";
  if (tz) {
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: tz });
      return tz;
    } catch {
      // 不正な値は既定へ
    }
  }
  return language === "ja" ? "Asia/Tokyo" : "America/New_York";
}

export function sanitizeNbaAskTurns(raw: unknown): NbaAskTurn[] {
  if (!Array.isArray(raw)) return [];
  const turns: NbaAskTurn[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const role = (item as { role?: unknown }).role;
    const content = String((item as { content?: unknown }).content ?? "").trim();
    if ((role !== "user" && role !== "assistant") || !content) continue;
    turns.push({ role, content: content.slice(0, NBA_ASK_MAX_CHARS) });
  }
  return turns.slice(-NBA_ASK_MAX_TURNS);
}

export type NbaAskRunResult = {
  answer: string;
  /** スタッツの質問として数えた（無料枠） */
  usedStats: boolean;
  /** 答えの下に出す「その画面を開く」 */
  opens: NbaAskDestinationId[];
  board: NbaAskBoard | null;
  games: NbaAskGameCard[] | null;
  promptTokens: number;
  completionTokens: number;
  /** ログ用。どう読み取ったか */
  intent: NbaAskIntent;
  /** AI を通さずに答えた */
  fast: boolean;
};

const T = (lang: string, ja: string, en: string) => (lang === "ja" ? ja : en);

function plain(answer: string, opens: NbaAskDestinationId[] = []): NbaAskAnswer {
  return { answer, board: null, games: null, opens, usedStats: false };
}

/** 読み取った内容に応じた答え。回数・PRO の判定もここ */
async function answerIntent(input: {
  db: Firestore;
  turns: NbaAskTurn[];
  intent: NbaAskIntent;
  language: string;
  timeZone: string;
  allowStats: boolean;
  isPro: boolean;
  uid: string;
  question: string;
}): Promise<NbaAskAnswer> {
  const { intent, language: lang } = input;
  const kind = intent.kind === "clarify_previous" ? (intent.query ? "nba" : intent.app_topic ? "app" : "unclear") : intent.kind;

  if (kind === "private") return plain(nbaAskPrivateRefusal(lang, input.turns));
  if (kind === "off_topic") {
    return plain(T(lang, "UNITERZ の使い方と NBA のことだけ答えられます。", "I can only answer about UNITERZ and the NBA."));
  }
  if (kind === "app" && intent.app_topic) {
    const kb = nbaAskKnowledgeAnswer(intent.app_topic, lang, {
      focus: intent.scoring_focus,
      short: intent.kind === "clarify_previous",
    });
    if (kb) return plain(kb.answer, kb.opens);
  }
  if (kind === "nba" && intent.query) {
    const q = intent.query;
    if (NBA_ASK_PRO_QUERIES.has(q) && !input.isPro) {
      return plain(
        q === "pro_insight"
            ? T(lang, "試合ごとの Pro Pick の中身は PRO だけが見られます。どんな機能かは「Pro Pick とは」で聞けます。", "A game's Pro Pick is PRO-only. Ask \"what is Pro Pick\" to hear what it is.")
            : T(lang, "PRO LEAGUE の順位は PRO だけが見られます。", "The PRO LEAGUE board is PRO-only."),
        ["pro"]
      );
    }
    if (!NBA_ASK_SCHEDULE_QUERIES.has(q) && !input.allowStats) {
      return plain(
        input.isPro
          ? T(lang, "今日のスタッツの質問の上限に達しました。また明日どうぞ。", "You've reached today's stats question limit. Try again tomorrow.")
          : T(lang, "無料のスタッツ質問は使い切りました。PRO なら無制限です（アプリの使い方の質問はこのまま無料）。", "You've used your free stats questions. PRO is unlimited (app questions stay free)."),
        input.isPro ? [] : ["pro"]
      );
    }
    return answerNbaAskQuery(
      { db: input.db, language: lang, timeZone: input.timeZone, uid: input.uid, question: input.question },
      intent
    );
  }
  return plain(
    T(
      lang,
      "うまく読み取れませんでした。たとえば「エンビードの前回の試合」「レイカーズのベストラインナップ」「Unit の稼ぎ方」「言語の変え方」のように聞いてください。",
      "I couldn't tell what you meant. Try \"Embiid's last game\", \"Lakers best lineup\", \"how to earn Units\", or \"change language\"."
    )
  );
}

/** 「レブロンは？」「ザイオンじゃなくてアント」= 前の質問を別の人で。前の答えは定型文なので、そこから質問の種類を戻す */
const BARE_FOLLOW_UP = /^.{1,16}?(?:は|だと|なら|の方|のほう)[？?！!]?$|じゃなくて|ではなく|じゃなく/;
const TOPIC_WORDS =
  /その前|前の前|平均|試合|ケガ|怪我|けが|欠場|契約|年俸|キャリア|通算|ショット|テクニカル|退場|ロスター|ラインナップ|順位|成績|勝率|身長|スタッツ|得点|リバウンド|アシスト|オンオフ|オン\/オフ|マッチアップ|スタイル|タイプ/;
const ANSWER_QUERY: ReadonlyArray<[RegExp, NbaAskIntent["query"]]> = [
  [/故障者リスト/, "team_injuries"],
  [/の前回の試合|の今の試合/, "player_last_game"],
  [/直近\d+試合/, "player_recent_games"],
  [/\d{4}-\d{2} の平均/, "player_season"],
  [/テクニカル \d+・フラグラント/, "player_discipline"],
  [/）の契約/, "player_contract"],
  [/のキャリア（/, "player_career"],
  [/ — [A-Z]{2,3} \/ /, "player_profile"],
  [/ のホームとアウェー/, "player_splits"],
  [/シーズン最高（/, "player_highs"],
  [/ がコートにいると/, "on_off"],
  [/ のマッチアップ（| と .+ のマッチアップ/, "player_matchups"],
  [/のプレースタイル（/, "style_map"],
];

/** 「今季の得点王」に AI が前季を入れることがある。年や「去年」が書かれていなければ今季 */
const NAMED_SEASON = /(?:19|20)\d{2}|\d{2}-\d{2}|\d{2}年|去年|昨年|昨季|前季|昨シーズン|前シーズン|先シーズン|last (?:season|year)|previous season/i;

/** AI が NBA の答えられない質問を off_topic にしたとき、「アプリにデータが無い」と返す */
const NBA_WORDS = /NBA|バスケ|優勝|チャンピオン|ファイナル|プレーオフ|選手|ドラフト/i;

/** 採点の説明で AI が「アップセット」などに寄せすぎるとき、質問にその言葉が無ければ全体の説明 */
const FOCUS_WORDS: Partial<Record<string, RegExp>> = {
  upset: /アップセット|あっぷせっと|番狂わせ|upset/i,
  win: /勝率|win rate/i,
  streak: /連勝|streak/i,
};

/** 選手・チーム名を読めたのに「アプリの全体説明」や「読めない」になったとき、言葉から質問の種類を決める */
const PLAYER_QUERY_WORDS: ReadonlyArray<[RegExp, NbaAskIntent["query"]]> = [
  [/身長|体重|出身|何歳|年齢|ドラフト|ポジション/, "player_profile"],
  [/オンオフ|オン\/オフ|いるとき|いないとき/, "on_off"],
  [/マッチアップ|守っ|守られ|マーク/, "player_matchups"],
  [/スタイル|タイプ/, "style_map"],
  [/ホーム|アウェー/, "player_splits"],
  [/最高/, "player_highs"],
  [/ケガ|怪我|けが|欠場|出られ/, "team_injuries"],
  [/契約|年俸|給料/, "player_contract"],
  [/キャリア|通算/, "player_career"],
  [/前回|前の試合|昨日|最新/, "player_last_game"],
  [/直近|最近|調子/, "player_recent_games"],
];

function entityWithoutQuery(intent: NbaAskIntent, question: string): NbaAskIntent {
  const appGuess = intent.kind === "app" && (!intent.app_topic || intent.app_topic === "app_overview");
  if (!(appGuess || intent.kind === "unclear") || intent.query) return intent;
  if (intent.player) {
    const hit = PLAYER_QUERY_WORDS.find(([re]) => re.test(question));
    return { ...intent, kind: "nba", app_topic: null, query: hit?.[1] ?? "player_season" };
  }
  if (intent.team) return { ...intent, kind: "nba", app_topic: null, query: "team_record" };
  return intent;
}

function keepNamedSeason(intent: NbaAskIntent, turns: readonly NbaAskTurn[]): NbaAskIntent {
  if (!intent.season) return intent;
  return turns.some((t) => t.role === "user" && NAMED_SEASON.test(t.content)) ? intent : { ...intent, season: null };
}

function carryPreviousQuery(intent: NbaAskIntent, question: string, turns: readonly NbaAskTurn[]): NbaAskIntent {
  if (intent.kind !== "nba" && intent.kind !== "unclear") return intent;
  if (!intent.player || !BARE_FOLLOW_UP.test(question.trim()) || TOPIC_WORDS.test(question)) return intent;
  const prevAnswer = [...turns].reverse().find((t) => t.role === "assistant")?.content ?? "";
  const hit = ANSWER_QUERY.find(([re]) => re.test(prevAnswer));
  if (!hit) return intent;
  const count = /直近(\d+)試合/.exec(prevAnswer)?.[1];
  return { ...intent, kind: "nba", query: hit[1], ...(count ? { count: Number(count) } : {}) };
}

/** AI の読み取りを、質問文と前の答えで直す（AI を呼ばないので評価スクリプトからも使う） */
export function settleNbaAskIntent(parsed: NbaAskIntent, turns: readonly NbaAskTurn[]): NbaAskIntent {
  const question = [...turns].reverse().find((t) => t.role === "user")?.content ?? "";
  let intent = carryPreviousQuery(parsed, question, turns);
  intent = keepNamedSeason(intent, turns);
  if (intent.scoring_focus && FOCUS_WORDS[intent.scoring_focus] && !FOCUS_WORDS[intent.scoring_focus]!.test(question)) {
    intent = { ...intent, scoring_focus: "overview" };
  }
  if (intent.kind === "off_topic" && NBA_WORDS.test(question)) intent = { ...intent, kind: "nba", query: "unsupported" };
  intent = entityWithoutQuery(intent, question);
  if (intent.query === "player_highs" && /何回|回数|トリプルダブル|ダブルダブル/.test(question) && !/最高|最多|ベスト/.test(question)) {
    intent = { ...intent, query: "player_season" };
  }
  const nick = nbaAskNicknamePlayer(question);
  const nickLast = nick?.split(" ").pop()!.toLowerCase() ?? "";
  if (nick && intent.kind === "nba" && intent.query && !(intent.player2 ?? "").toLowerCase().includes(nickLast)) {
    /** 呼び名（キング → King）を綴った名前で引き直さない */
    intent = (intent.player ?? "").toLowerCase().includes(nickLast)
      ? { ...intent, player_written: null }
      : { ...intent, player: nick, player_written: null, team: null };
  }
  return intent;
}

export async function runNbaAsk(input: {
  db: Firestore;
  turns: NbaAskTurn[];
  language: string;
  /** ユーザーの表示タイムゾーン（`resolveNbaAskTimeZone` 済み） */
  timeZone: string;
  /** false のとき公開スタッツを答えない（無料枠を使い切った人、または Pro の 1 日上限） */
  allowStats: boolean;
  /** Pro Insight / PRO LEAGUE は Pro だけ */
  isPro: boolean;
  uid: string;
}): Promise<NbaAskRunResult> {
  const question = [...input.turns].reverse().find((t) => t.role === "user")?.content ?? "";
  let promptTokens = 0;
  let completionTokens = 0;
  let intent: NbaAskIntent;
  let fast = false;

  const known = nbaAskIsPronounFollowUp(question) ? null : matchNbaAskKnowledge(question);
  if (known) {
    intent = emptyNbaAskIntent({ kind: "app", app_topic: known.id, scoring_focus: known.focus ?? null });
    fast = true;
  } else {
    const parsed = await parseNbaAskIntent({ turns: input.turns, timeZone: input.timeZone });
    intent = settleNbaAskIntent(parsed.intent, input.turns);
    promptTokens += parsed.promptTokens;
    completionTokens += parsed.completionTokens;
  }

  const out = await answerIntent({ ...input, intent, question });
  return {
    answer: out.answer,
    usedStats: out.usedStats,
    opens: out.opens,
    board: out.board,
    games: out.games,
    promptTokens: promptTokens + (out.promptTokens ?? 0),
    completionTokens: completionTokens + (out.completionTokens ?? 0),
    intent,
    fast,
  };
}