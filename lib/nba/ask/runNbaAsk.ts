/**
 * UNITERZ ASK（サーバー専用）。
 * 1. よくあるアプリの質問は、言い回しの決まりで即答（AI を通さない）
 * 2. それ以外は AI が質問を読み取って「何を・誰の・いつの」を返す（`nbaAskIntent`）
 * 3. 答えはアプリのヘルプ文言（`nbaAskKnowledge`）と Firestore のデータ（`nbaAskNbaAnswer`）から組む
 * NBA の答えは AI に文も数字も作らせない。アプリの質問だけ、ヘルプ文言に書いてあることから AI が短く答える（`nbaAskAppCompose`）。
 */
import type { Firestore } from "firebase-admin/firestore";
import { nbaAskPrivateRefusal } from "./nbaAskPrivate";
import { emptyNbaAskIntent, parseNbaAskIntent, type NbaAskIntent } from "./nbaAskIntent";
import { matchNbaAskKnowledge, nbaAskKnowledgeAnswer } from "./nbaAskKnowledge";
import { composeNbaAskAppAnswer } from "./nbaAskAppCompose";
import {
  answerNbaAskQuery,
  NBA_ASK_PRO_QUERIES,
  NBA_ASK_SCHEDULE_QUERIES,
  type NbaAskAnswer,
} from "./nbaAskNbaAnswer";
import type { NbaAskBoard, NbaAskGameCard, NbaAskMoves, NbaAskView } from "./nbaAskBoard";
import type { NbaAskDestinationId } from "./nbaAskDestinations";
import { nbaAskIsPronounFollowUp } from "./nbaAskSubject";
import { nbaAskIsPicksCompare, nbaAskRelativeSeason } from "./nbaAskCompare";
import { nbaAskGameCondOf, nbaAskPoolOf, nbaAskRegionOf } from "./nbaAskCombo";
import { nbaAskNicknamePlayer } from "./nbaAskPlayerResolve";
import { normalizeNbaAskQuestion } from "./nbaAskKana";
import { findNbaKanaPlayersInText, loadNbaPlayerKanaNames, lookupNbaKanaPlayer } from "./nbaPlayerKanaNames";
import { NBA_ASK_PLAYER_STAT_WORDS, NBA_ASK_TEAM_STAT_WORDS, nbaAskStatWord } from "./nbaAskStatWords";
import { findNbaAskTeamsInText } from "./nbaAskTeamNames";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";

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
  moves: NbaAskMoves | null;
  view: NbaAskView | null;
  promptTokens: number;
  completionTokens: number;
  cachedTokens: number;
  /** ログ用。どう読み取ったか */
  intent: NbaAskIntent;
  /** AI を通さずに答えた */
  fast: boolean;
};

const T = (lang: string, ja: string, en: string) => (lang === "ja" ? ja : en);

function plain(answer: string, opens: NbaAskDestinationId[] = []): NbaAskAnswer {
  return { answer, board: null, games: null, opens, usedStats: false };
}

function statsLimit(lang: string, isPro: boolean): string {
  return isPro
    ? T(lang, "今日のスタッツの質問の上限に達しました。また明日どうぞ。", "You've reached today's stats question limit. Try again tomorrow.")
    : T(lang, "無料のスタッツ質問は使い切りました。PRO なら無制限です（アプリの使い方の質問はこのまま無料）。", "You've used your free stats questions. PRO is unlimited (app questions stay free).");
}

/**
 * 決まった説明文では足りない聞き方（条件・比較・可否）。言い回しで話題が分かっても、AI に説明文から答えさせる。
 * 「Unit の稼ぎ方」「PRO でできること」のような話題そのものの質問は即答のまま。
 */
const APP_DETAIL_WORDS =
  /たら|ったら|れば|なら|場合|ても|でも|後から|あとから|途中|同点|違い|かかる|送れ|消え|残る|どうなる|いつ|何人|何回|何点|当たる|当たら|できる[？?]?$|られる[？?]?$|ある[？?]?$|\bif\b|\bwhen\b|\bcan i\b|what happens/i;

/** AI が「関係ない話」と読んだが、アカウント・端末・アプリの話 */
const APP_RESCUE_WORDS = /機種変|引き継|再インストール|アカウント|ログイン|iphone|android|アンドロイド|アプリ|広告|返金/i;

/** 質問の文からシーズン・プレーオフを補う読み取り */
const SEASON_QUERIES = new Set(["player_season", "player_career", "player_splits", "player_shot_zones", "team_stat", "team_record", "standings", "player_leaders"]);

/** 試合単位の質問の言葉（無ければ「ヨキッチのトリプルダブル」はシーズンの項目） */
const GAME_WORDS = /試合|前回|直近|最近|昨日|きのう|今日|ここ\s*\d|ラスト|ゲーム|\bgames?\b|先週|今週|\d+\s*月|調子/i;
/** スタイルマップの質問の言葉 */
const STYLE_WORDS = /スタイル|特徴|どんな(?:選手|チーム)|タイプの|型の?(?:選手|チーム)?$|得意|苦手|展開/;
/** HOW THEY PLAY のジャンルだけを聞く言葉（項目の言葉が無くても選手のシーズンの答え） */
const PLAYER_GENRE_WORDS = /プレー.?タイプ|プレイ.?タイプ|play.?types?|ハッスル|\bhustle\b|シュートの(?:スタッツ|データ|打ち方|種類)/i;
/** 日程・イベントの質問（データが無いので「アプリに無い」と答える） */
const NBA_EVENT_WORDS = /オールスター|トレード(?:期限|デッドライン)|ドラフト(?:会議)?(?:は|って)?いつ|プレーオフ(?:は|って)?いつ|開幕(?:は|って)?いつ|all.?star|trade\s*deadline/i;

/** AI の振り分けを質問の言葉で直す（項目の言葉があるのに直近の試合・スタイルマップに振った等） */
function queryByWords(intent: NbaAskIntent, question: string): NbaAskIntent {
  if (intent.kind !== "nba" || !intent.query) return intent;
  const q = intent.query;
  const teamsInText = findNbaAskTeamsInText(question);
  if (
    intent.player &&
    (q === "player_recent_games" || q === "player_last_game" || q === "style_map") &&
    !GAME_WORDS.test(question) &&
    !(q === "style_map" && STYLE_WORDS.test(question)) &&
    (nbaAskStatWord(NBA_ASK_PLAYER_STAT_WORDS, question) || PLAYER_GENRE_WORDS.test(question))
  ) {
    return { ...intent, query: "player_season" };
  }
  const lastN = /(?:直近|ここ|最近|ラスト)\s*(\d+)\s*試合|last\s*(\d+)\s*games?/i.exec(question.normalize("NFKC"));
  if (intent.player && q === "player_season" && lastN && !/比べ|比較|シーズン平均|と比/.test(question)) {
    return { ...intent, query: "player_recent_games", count: Number(lastN[1] ?? lastN[2]) };
  }
  if (
    (q === "team_shapes" || q === "style_map") &&
    teamsInText.length === 0 &&
    /チーム|どこ/.test(question) &&
    !STYLE_WORDS.test(question) &&
    nbaAskStatWord(NBA_ASK_TEAM_STAT_WORDS, question)
  ) {
    return { ...intent, query: "team_stat", team: null };
  }
  if (intent.team && q === "team_recent_games" && /連勝|連敗/.test(question) && !/直近|最近|ここ\s*\d/.test(question)) {
    return { ...intent, query: "team_record" };
  }
  /** 「テキサスの3チームで一番強い」「DRTG上位10チームの中で」「延長戦の成績」= 勝敗予想・日程ではなくスタッツ（無料枠を数える） */
  if (
    NBA_ASK_SCHEDULE_QUERIES.has(q) &&
    q !== "news" &&
    (nbaAskRegionOf(question) || nbaAskPoolOf(question) || nbaAskGameCondOf(question)) &&
    !/勝つ|勝てる|今日|明日|次の|予想|予定|いつ/.test(question)
  ) {
    return { ...intent, query: "team_record", team: teamsInText[0] ?? null };
  }
  /** 「サンダーとナゲッツはどっちが強い」= 勝敗予想ではなく 2 チームの比較 */
  if (q === "who_wins" && teamsInText.length >= 2 && /強い|上|比べ|比較/.test(question) && !/勝つ|勝てる|試合|今日|明日|次|予想/.test(question)) {
    return { ...intent, query: "team_stat" };
  }
  /** 「レイカーズは昨季と比べてどう」= 入れ替わりではなく成績の比較 */
  if (q === "team_moves" && nbaAskRelativeSeason(question) && /比べ|比較|より|どう/.test(question) && !/補強|入れ替|加入|移籍|放出|\bIN\b|\bOUT\b/i.test(question)) {
    return { ...intent, query: "team_stat" };
  }
  /** 「ぜいたく税を払っているチーム」= リーグ全体 */
  if (q === "team_payroll" && !intent.team && /ぜいたく税|贅沢税|タックス|luxury\s*tax/i.test(question)) {
    return { ...intent, query: "salary_ranking" };
  }
  return intent;
}

/** 読み取れなかった質問でも、言葉で拾う処理に回す目印 */
const UNCLEAR_NBA_WORDS = /選手|誰|だれ|チーム|どこ|B2B|連戦|ホーム|アウェー|接戦|勝率|成績|負け越|勝ち越|プレーオフ|ルーキー|新人|出身/i;

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
    /** 「今季いちばんすごかった試合」のように AI が関係ない話と読んでも、NBA の言葉で拾えるなら答える */
    if (/試合|選手|チーム/.test(input.question)) {
      const out = await answerNbaAskQuery(
        { db: input.db, language: lang, timeZone: input.timeZone, uid: input.uid, question: input.question, isPro: input.isPro },
        { ...intent, kind: "nba", query: "unsupported" }
      );
      if (out.usedStats) return input.allowStats ? out : plain(statsLimit(lang, input.isPro), input.isPro ? [] : ["pro"]);
    }
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
    if (NBA_ASK_PRO_QUERIES.has(q) && !input.isPro && !nbaAskIsPicksCompare(input.question)) {
      return plain(
        q === "pro_insight"
            ? T(lang, "試合ごとの Pro Pick の中身は PRO だけが見られます。どんな機能かは「Pro Pick とは」で聞けます。", "A game's Pro Pick is PRO-only. Ask \"what is Pro Pick\" to hear what it is.")
            : T(lang, "PRO LEAGUE の順位は PRO だけが見られます。", "The PRO LEAGUE board is PRO-only."),
        ["pro"]
      );
    }
    if (!NBA_ASK_SCHEDULE_QUERIES.has(q) && !input.allowStats) {
      return plain(statsLimit(lang, input.isPro), input.isPro ? [] : ["pro"]);
    }
    const out = await answerNbaAskQuery(
      { db: input.db, language: lang, timeZone: input.timeZone, uid: input.uid, question: input.question, isPro: input.isPro },
      intent
    );
    /** unsupported は回数の判定を通さないので、言葉で拾ってスタッツを答えたときだけここで止める */
    if (out.usedStats && !input.allowStats) return plain(statsLimit(lang, input.isPro), input.isPro ? [] : ["pro"]);
    return out;
  }
  /** AI が読めなくても「B2Bの2日目に一番弱いチーム」のような言い回しは条件・比較の言葉で拾える */
  if (kind === "unclear" && UNCLEAR_NBA_WORDS.test(input.question)) {
    const out = await answerNbaAskQuery(
      { db: input.db, language: lang, timeZone: input.timeZone, uid: input.uid, question: input.question, isPro: input.isPro },
      { ...intent, kind: "nba", query: "unsupported" }
    );
    if (out.usedStats) return input.allowStats ? out : plain(statsLimit(lang, input.isPro), input.isPro ? [] : ["pro"]);
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
  [/ のホームとアウェー|はホーム [\d.]+.{0,8}・アウェー /, "player_splits"],
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
  /** 「ハーデンのハッスル」を AI が関係ない話と読んだとき */
  const offTopicStat =
    intent.kind === "off_topic" && Boolean(intent.player) && (Boolean(nbaAskStatWord(NBA_ASK_PLAYER_STAT_WORDS, question)) || PLAYER_GENRE_WORDS.test(question));
  if (!(appGuess || intent.kind === "unclear" || offTopicStat) || intent.query) return intent;
  if (intent.player) {
    const hit = PLAYER_QUERY_WORDS.find(([re]) => re.test(question));
    return { ...intent, kind: "nba", app_topic: null, query: hit?.[1] ?? "player_season" };
  }
  if (intent.team) return { ...intent, kind: "nba", app_topic: null, query: "team_record" };
  /** 名前は無いがスタッツの言葉で「誰 / どのチーム」を聞いている（「得点にムラがある選手は」） */
  if (intent.kind === "unclear" && /選手|誰|だれ|チーム|どこ/.test(question)) {
    if (/チーム|どこ/.test(question) && nbaAskStatWord(NBA_ASK_TEAM_STAT_WORDS, question)) return { ...intent, kind: "nba", query: "team_stat" };
    if (nbaAskStatWord(NBA_ASK_PLAYER_STAT_WORDS, question)) return { ...intent, kind: "nba", query: "player_leaders" };
  }
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
/** 「昨日の試合」はチームの直近の試合ではなく、その日の全試合 */
function dayGamesWithoutTeam(intent: NbaAskIntent, question: string): NbaAskIntent {
  if (intent.kind !== "nba" || intent.team || intent.player) return intent;
  if (intent.query !== "team_recent_games" && intent.query !== "team_record") return intent;
  const day = /昨日|きのう|yesterday/i.test(question)
    ? "yesterday"
    : /明日|あした|tomorrow/i.test(question)
      ? "tomorrow"
      : /今日|きょう|今夜|today|tonight/i.test(question)
        ? "today"
        : null;
  if (!day) return intent;
  return { ...intent, query: "games_on_date", date: intent.date ?? day };
}

/** 引退したレジェンド（今季のロスターに同じ姓の現役がいる名前は、名まで書いたときだけ） */
const LEGEND_WORDS =
  /マイケル.?ジョーダン|(?<![・\s]|デアンドレ|ディアンドレ)ジョーダン(?![・\s]?(?:プール|クラークソン|ホーキンス|グッドウィン|ウォルシュ|ミラー|クレイボーン|ベル))|コービー(?![・\s]?バフキン)|シャック|シャキール.?オニール|ティム.?ダンカン|ノビツキー|ノヴィツキー|アイバーソン|マジック.?ジョンソン|ラリー.?バード|michael\s+jordan|kobe(?!\s+bufkin)/i;

/** 「ウェンビーえぐい」「サンダー強すぎない？」= 感想の形でも選手 / チームの成績を聞いている */
const EVALUATIVE_WORDS = /すご|凄|えぐ|やば|ヤバ|強すぎ|強い|うま|上手|どう(?:なの|です|かな)?[？?]?$|何が/;
const NOT_STATS_WORDS = /引退|いつ|年齢|何歳|結婚|家族|彼女|性格|インスタ|SNS|ニュース|噂/i;

/** 質問の言葉で読み取りを直す（2 回目: 種類のまちがい・名前と読んだ条件） */
function fixByWords(intent: NbaAskIntent, question: string, turns: readonly NbaAskTurn[]): NbaAskIntent {
  const teamsInText = findNbaAskTeamsInText(question);
  /** 「フレグラントファウルの数」をアプリの質問と読んだとき */
  if (intent.kind !== "nba" && intent.kind !== "private" && /テクニカル|フ[ラレ]グラント|退場|出場停止/.test(question) && !/アプリ|UNITERZ|ユニターズ|ポイント|Unit/i.test(question)) {
    intent = { ...intent, kind: "nba", query: "player_discipline", app_topic: null };
  }
  if ((intent.kind === "off_topic" || intent.kind === "unclear") && !NOT_STATS_WORDS.test(question)) {
    /** 「Drivetop10」「3p%top5」= 項目のリーダー */
    if (nbaAskStatWord(NBA_ASK_PLAYER_STAT_WORDS, question) && /top|トップ|ランキング|上位|一番|いちばん|1位/i.test(question) && !intent.player && teamsInText.length === 0) {
      return { ...intent, kind: "nba", query: "player_leaders", app_topic: null };
    }
    if (EVALUATIVE_WORDS.test(question)) {
      if (intent.player) return { ...intent, kind: "nba", query: "player_season", app_topic: null };
      if (teamsInText.length === 1) return { ...intent, kind: "nba", query: "team_record", team: teamsInText[0]!, app_topic: null };
      if (intent.team) return { ...intent, kind: "nba", query: "team_record", app_topic: null };
      /** 名前は辞書で読む（applyKanaDictionary） */
      if (!/選手|誰|だれ|チーム|どこ/.test(question)) return { ...intent, kind: "nba", query: "player_season", app_topic: null };
    }
  }
  if (intent.kind !== "nba" || !intent.query) return intent;
  const q = intent.query;
  /** 「ブランソンは何試合出てる」= 出場試合数（シーズン） */
  if (intent.player && q === "player_recent_games" && /何試合(?!連続)(?:.{0,3}(?:出|出場))|出場試合数/.test(question) && !/直近|最近|ここ\s*\d/.test(question)) {
    return { ...intent, query: "player_season", count: null };
  }
  /** 「SGAって何がすごいの」= 経歴ではなく成績 */
  if (intent.player && q === "player_profile" && EVALUATIVE_WORDS.test(question) && !/身長|体重|出身|国|ドラフト|背番号|ポジション|大学/.test(question)) {
    return { ...intent, query: "player_season" };
  }
  /** 「プルアップ3Pが一番うまい選手」をスタイルマップと読んだとき = 項目のリーダー */
  if (q === "style_map" && !intent.player && !STYLE_WORDS.test(question) && /選手|誰|だれ/.test(question) && nbaAskStatWord(NBA_ASK_PLAYER_STAT_WORDS, question)) {
    return { ...intent, query: "player_leaders" };
  }
  /** 「レイカーズとナゲッツのゲーム差」= 順位表 */
  if (/ゲーム差/.test(question) && q !== "standings") return { ...intent, query: "standings" };
  /** 「前の試合」を直近 1 試合と読んだとき */
  if (q === "player_recent_games" && intent.count === 1) return { ...intent, query: "player_last_game", count: null };
  /** 「ケンタッキー大学出身の選手」= 名前ではなく条件 */
  if (intent.player && /(?:大学|カレッジ|college)(?:出身)?の?(?:選手|人|は)/i.test(question)) {
    return { ...intent, player: null, player_written: null, query: q === "player_profile" || q === "player_season" ? "player_leaders" : q };
  }
  /** 「キャバリアーズの失点」「マジックのディフェンス」= チームの守備（ポジション別ではない） */
  if (q === "team_position_defense" && !/ポジション|ガード|フォワード|センター|\b[GFC]\b|位置/.test(question)) {
    return { ...intent, query: "team_stat" };
  }
  /** 「セルティックスの5人組で一番いいのは」= ラインナップ */
  const lineup = /([2-5])\s*人(?:組|の組み合わせ|ユニット|ラインナップ)|ラインナップ|ユニット|組み合わせ/.exec(question.normalize("NFKC"));
  if (lineup && q !== "team_lineups" && (teamsInText.length === 1 || intent.team) && !/オン.?オフ|いるとき/.test(question)) {
    const order = /悪い|ワースト|最低|worst/i.test(question) ? "worst" : /長い|多い|よく使|一番出|時間/.test(question) ? "most" : "best";
    return {
      ...intent,
      query: "team_lineups",
      team: teamsInText[0] ?? intent.team,
      player: null,
      player2: null,
      player_written: null,
      lineup_size: lineup[1] ? Number(lineup[1]) : intent.lineup_size ?? 5,
      order,
    };
  }
  /** 「オンのネットが一番高い選手」= リーグ全体のオン / オフ */
  if (/オン.{0,4}(?:ネット|NET)|オン.?オフ/i.test(question) && /選手|誰|だれ/.test(question) && /一番|いちばん|最も|高い|低い|大きい|トップ|上位/.test(question) && teamsInText.length === 0) {
    return { ...intent, query: "on_off", player: null, player2: null, player_written: null, team: null };
  }
  /** 「今季ブレイクしてる選手」= MIP ラダー */
  if (!intent.player && /(?<!ファスト)ブレイク(?:した|して|中|選手|スルー)|急成長|一番成長|成長(?:した|株|してる)/.test(question)) {
    return { ...intent, query: "award_ladder", award: "mip" };
  }
  /** 「プレーイン争い」= 順位表 */
  if (!intent.player && /プレーイン|プレーオフ(?:圏|争い|ライン)/.test(question) && !/何位|成績|勝率/.test(question) && q !== "standings" && teamsInText.length === 0) {
    return { ...intent, query: "standings" };
  }
  /** 「テクニカルが一番多い選手」「退場した選手」= 規律（名前なしなら順位） */
  if (!intent.player && /テクニカル|フ[ラレ]グラント|退場|罰金|出場停止/.test(question) && !/discipline$/.test(q) && q !== "news") {
    const team = /チーム|どこ/.test(question) && !/選手|誰|だれ/.test(question);
    return teamsInText.length === 1
      ? { ...intent, query: "team_discipline", team: teamsInText[0]! }
      : { ...intent, query: team ? "team_discipline" : "player_discipline", team: team ? null : intent.team };
  }
  void turns;
  return intent;
}

export function settleNbaAskIntent(parsed: NbaAskIntent, turns: readonly NbaAskTurn[]): NbaAskIntent {
  const question = [...turns].reverse().find((t) => t.role === "user")?.content ?? "";
  let intent = carryPreviousQuery(parsed, question, turns);
  intent = keepNamedSeason(intent, turns);
  if (intent.scoring_focus && FOCUS_WORDS[intent.scoring_focus] && !FOCUS_WORDS[intent.scoring_focus]!.test(question)) {
    intent = { ...intent, scoring_focus: "overview" };
  }
  if (intent.kind === "off_topic" && NBA_WORDS.test(question)) intent = { ...intent, kind: "nba", query: "unsupported" };
  if (intent.kind === "off_topic" && APP_RESCUE_WORDS.test(question)) intent = { ...intent, kind: "app", app_topic: "account" };
  if (intent.kind === "nba" && intent.query === "who_wins" && !intent.team && /予想(?:は|も)?(?:でき|する|出せ)/.test(question)) {
    intent = { ...intent, kind: "app", query: null, app_topic: "prediction_how" };
  }
  /** AI がシーズン・プレーオフを読み落としたとき（比較の質問は比較の処理が質問の文から読む） */
  if (intent.kind === "nba" && intent.query && SEASON_QUERIES.has(intent.query) && !/比べ|比較|より|伸び|上が|下が|変わ|変化|違い|差/.test(question)) {
    const explicit = /(20\d{2})\s*[-–/]\s*(\d{2})/.exec(question.normalize("NFKC"));
    const season = intent.season ?? (explicit ? `${explicit[1]}-${explicit[2]}` : nbaAskRelativeSeason(question));
    if (season && season !== CURRENT_NBA_SEASON_KEY && season !== intent.season) intent = { ...intent, season };
    if (!intent.playoffs && /プレーオフ(?!圏|進出|争い|ライン|出場|に出|に行|行き)|\bplayoffs?\b/i.test(question)) intent = { ...intent, playoffs: true };
  }
  /** 「プレーオフ圏外」はプレーオフの成績ではない */
  if (intent.playoffs && /プレーオフ(?:圏|進出|争い|ライン)|プレーイン/.test(question) && !/プレーオフ(?!圏|進出|争い|ライン)/.test(question)) {
    intent = { ...intent, playoffs: false };
  }
  /** 「不調な選手」「デューク大学」「ペイントタッチ」を選手名と読んだとき（名前ではなく条件） */
  if (
    intent.player &&
    (/選手|誰|だれ|チーム|好調|不調|ルーキー|新人|大学|高校|マイナス|プラス|ベスト|ワースト|University|College|play-?in|playoff/i.test(intent.player) ||
      (!/[a-z]/i.test(intent.player) && nbaAskStatWord(NBA_ASK_PLAYER_STAT_WORDS, intent.player)))
  ) {
    intent = { ...intent, player: null, player_written: null, ...(intent.query === "style_map" || intent.query === "player_profile" ? { query: "player_leaders" as const } : {}) };
  }
  if (intent.kind !== "nba" && NBA_EVENT_WORDS.test(question)) intent = { ...intent, kind: "nba", query: "unsupported", app_topic: null };
  intent = queryByWords(intent, question);
  intent = fixByWords(intent, question, turns);
  intent = entityWithoutQuery(intent, question);
  intent = dayGamesWithoutTeam(intent, question);
  if (intent.query === "player_highs" && /何回|回数|トリプルダブル|ダブルダブル/.test(question) && !/最高|最多|ベスト/.test(question)) {
    intent = { ...intent, query: "player_season" };
  }
  const nick = nbaAskNicknamePlayer(question);
  if (nick && intent.kind === "nba" && intent.query) {
    const key = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");
    const nickKey = key(nick);
    /** もう一方が同じ選手のときは上書きしない。同姓（James）だけでは Bronny を残さない */
    if (key(intent.player2 ?? "") !== nickKey) {
      const same = key(intent.player ?? "") === nickKey;
      intent = {
        ...intent,
        player: nick,
        player_written: null,
        ...(same ? {} : { team: null }),
      };
    }
  }
  return intent;
}

function sameNbaName(a: string, b: string): boolean {
  const n = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^a-z]/g, "");
  return n(a) === n(b);
}

/**
 * 質問の文を選手名の辞書で読み、出てきた選手を AI の読み取りより優先する（AI は新人・若手を似た有名選手に取り違える）。
 * 文中で一意に決まる選手は AI が別人を返していても差し替える。1 つの書き方が複数の選手に当たるときは AI の答えを残す。
 */
async function applyKanaDictionary(db: Firestore, intent: NbaAskIntent, question: string): Promise<NbaAskIntent> {
  if (intent.kind !== "nba") return intent;
  const players = await loadNbaPlayerKanaNames(db).catch(() => null);
  if (!players || Object.keys(players).length === 0) return intent;
  const pick = (names: string[], ai: string | null) =>
    names.length === 1 ? names[0]! : ai && names.find((n) => sameNbaName(n, ai)) ? ai : null;
  const keys = (["player", "player2", "player3"] as const).filter((k) => intent[k]);
  const mentions = findNbaKanaPlayersInText(players, question);
  if (keys.length > 0 && mentions.length === keys.length) {
    const out = { ...intent };
    keys.forEach((k, i) => {
      const name = pick(mentions[i]!.names, intent[k]);
      if (!name) return;
      out[k] = name;
      if (k === "player") out.player_written = null;
    });
    return out;
  }
  /** 「ブランソンとハリバートンの直近5試合」で AI が 1 人しか読まなかったとき */
  if (keys.length === 1 && keys[0] === "player" && mentions.length === 2 && /と|vs|＆|&/i.test(question) && intent.query?.startsWith("player_")) {
    const a = pick(mentions[0]!.names, intent.player);
    const b = pick(mentions[1]!.names, intent.player);
    if (a && b && a !== b) return { ...intent, player: a, player2: b, player_written: null };
  }
  /**
   * 文中に辞書で一意の選手が 1 人だけいるのに、AI が別人にした / 読めなかった。
   * 比較（2 人）や同姓の曖昧さがあるときは触らない。
   */
  const unique = mentions.filter((m) => m.names.length === 1).map((m) => m.names[0]!);
  const uniqueNames = [...new Set(unique)];
  if (uniqueNames.length === 1 && !intent.player2 && !intent.player3) {
    const name = uniqueNames[0]!;
    if (!intent.player || !sameNbaName(intent.player, name)) {
      return { ...intent, player: name, player_written: null };
    }
  }
  /** AI が選手名を読めなかった感想の質問（「ウェンビーえぐい」）は辞書の 1 人で */
  if (keys.length === 0 && mentions.length === 1 && intent.query === "player_season") {
    const a = pick(mentions[0]!.names, null);
    if (a) return { ...intent, player: a, player_written: null };
  }
  if (intent.player && intent.player_written) {
    const name = pick(lookupNbaKanaPlayer(players, intent.player_written), intent.player);
    if (name) return { ...intent, player: name, player_written: null };
  }
  return intent;
}

export async function runNbaAsk(raw: {
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
  const input = {
    ...raw,
    turns: raw.turns.map((t) => (t.role === "user" ? { ...t, content: normalizeNbaAskQuestion(t.content) } : t)),
  };
  const question = [...input.turns].reverse().find((t) => t.role === "user")?.content ?? "";
  let promptTokens = 0;
  let completionTokens = 0;
  let cachedTokens = 0;
  let intent: NbaAskIntent;
  let fast = false;

  /** 「みんなの予想を裏切ってるチーム」はアプリの「みんなの予想」の説明ではなくチームの比較 */
  const picksTeams = nbaAskIsPicksCompare(question) && /チーム|どこ|\bteams?\b|的中|当た|実際|差/i.test(question);
  const known = picksTeams || nbaAskIsPronounFollowUp(question) ? null : matchNbaAskKnowledge(question);
  if (known) {
    intent = emptyNbaAskIntent({ kind: "app", app_topic: known.id, scoring_focus: known.focus ?? null });
    fast = !APP_DETAIL_WORDS.test(question);
  } else if (picksTeams) {
    intent = emptyNbaAskIntent({ kind: "nba", query: "unsupported" });
  } else {
    const parsed = await parseNbaAskIntent({ turns: input.turns, timeZone: input.timeZone });
    intent = await applyKanaDictionary(input.db, settleNbaAskIntent(parsed.intent, input.turns), question);
    promptTokens += parsed.promptTokens;
    completionTokens += parsed.completionTokens;
    cachedTokens += parsed.cachedTokens;
  }

  if (!fast && intent.kind === "app" && intent.app_topic) {
    const composed = await composeNbaAskAppAnswer({ turns: input.turns, language: input.language });
    promptTokens += composed.promptTokens;
    completionTokens += composed.completionTokens;
    cachedTokens += composed.cachedTokens;
    const kb = nbaAskKnowledgeAnswer(intent.app_topic, input.language);
    const opens = kb?.opens ?? [];
    /**
     * 言い回しで話題が分かった質問は、説明文から答えられなくてもその話題の説明を出す。
     * AI が app と読んだが compose が「書いてない」としたときも、話題の定型文があれば問い合わせに落とさない。
     */
    const answer =
      composed.answer ??
      (composed.failed || known
        ? null
        : kb?.answer ??
          T(
            input.language,
            "その点はここでは答えられません。プロフィールのメニュー → SUPPORT の「お問い合わせ」から聞いてください。",
            "I can't answer that here. Please ask via Profile → MENU → SUPPORT → Contact."
          ));
    if (answer) {
      return {
        answer,
        usedStats: false,
        opens: composed.answer || kb?.answer ? opens : ["help"],
        board: null,
        games: null,
        moves: null,
        view: null,
        promptTokens,
        completionTokens,
        cachedTokens,
        intent,
        fast: false,
      };
    }
  }

  /** 「3Pは？」→「リーグ何位？」= 前の質問の項目のまま順位を聞いている */
  let answerQuestion = question;
  if (intent.kind === "nba" && intent.query === "player_season" && /何位|順位|ランク/.test(question) && !nbaAskStatWord(NBA_ASK_PLAYER_STAT_WORDS, question)) {
    const prev = input.turns
      .slice(0, -1)
      .reverse()
      .find((t) => t.role === "user" && nbaAskStatWord(NBA_ASK_PLAYER_STAT_WORDS, t.content));
    if (prev) answerQuestion = `${prev.content} ${question}`;
  }
  /** 「ナゲッツでヨキッチの次に点を取ってるのは」= チーム内の 2 番目 */
  if (intent.kind === "nba" && intent.player && /の次に/.test(question) && (findNbaAskTeamsInText(question).length === 1 || /選手|誰|だれ/.test(question))) {
    intent = { ...intent, query: "player_leaders", player: null, player2: intent.player, player_written: null };
  }
  /** 「ジョーダンとレブロン」= 引退した選手（似た名前の現役に差し替えない） */
  if (intent.kind === "nba" && LEGEND_WORDS.test(question)) {
    intent = { ...intent, query: "player_season", player: LEGEND_WORDS.exec(question)![0], player2: null, player3: null, player_written: null };
  }
  const out = await answerIntent({ ...input, intent, question: answerQuestion });
  return {
    answer: out.answer,
    usedStats: out.usedStats,
    opens: out.opens,
    board: out.board,
    games: out.games,
    moves: out.moves ?? null,
    view: out.view ?? null,
    promptTokens: promptTokens + (out.promptTokens ?? 0),
    completionTokens: completionTokens + (out.completionTokens ?? 0),
    cachedTokens,
    intent,
    fast,
  };
}