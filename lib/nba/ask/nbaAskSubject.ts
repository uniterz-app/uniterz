/**
 * 質問の話題。話題が変わったら前の会話をモデルに渡さない。
 * 採点のあとに別のことを聞いても、前のガイドを引きずらない。
 */
import {
  nbaAskIsClarifyFollowUp,
  nbaAskIsScoringQuestion,
  type NbaAskAppTopic,
} from "./nbaAskAppGuide";

const PRONOUN_START =
  /^(?:それ|その|そっち|じゃあ|では|昨日のは|この選手|このチーム|同じ|続き|もっと|詳しく|なんで|なぜ|つまり)/;

/** 明示した話題。続きの一言にこれが入っていたら、新しい質問として扱う */
const EXPLICIT_TOPIC =
  /通知|招待|スクワッド|プロフィール|採点|料金|ランキング|勝率|連勝|得点|契約|ショット|年俸|テクニカル|得意|苦手|キャリア/;

export function nbaAskIsPronounFollowUp(text: string): boolean {
  const q = text.trim();
  if (!q || q.length > 40) return false;
  if (nbaAskIsClarifyFollowUp(q)) return true;
  if (!PRONOUN_START.test(q)) return false;
  return !EXPLICIT_TOPIC.test(q);
}

export type NbaAskSubject =
  | { kind: "app"; topic: NbaAskAppTopic }
  | { kind: "nba" }
  | { kind: "follow" }
  | { kind: "other" };

/** アプリの使い方か、NBA の数字か。短い続きは follow */
export function nbaAskSubject(text: string): NbaAskSubject {
  const q = text.trim();
  if (!q) return { kind: "other" };
  if (nbaAskIsPronounFollowUp(q)) return { kind: "follow" };
  if (/通知/.test(q)) return { kind: "app", topic: "notifications" };
  if (/招待/.test(q)) return { kind: "app", topic: "invite" };
  if (/スクワッド|squad/i.test(q)) return { kind: "app", topic: "squads" };
  if (/プロフィール/.test(q)) return { kind: "app", topic: "profile" };
  if (/料金|月額|年額|サブスク|プロ(?:プラン|会員)|PRO(?:の|は)?(?:料金|プラン)/i.test(q)) {
    return { kind: "app", topic: "pro_plans" };
  }
  if (nbaAskIsScoringQuestion(q)) return { kind: "app", topic: "scoring" };
  if (/ランキングの|順位の見方|ポイントで順位/.test(q)) return { kind: "app", topic: "ranking" };
  if (/予想の(?:仕方|方法|やり方)|どう(?:やって)?予想|ピックの仕方/.test(q)) {
    return { kind: "app", topic: "prediction_form" };
  }
  if (/スタッツの見方|どこで見/.test(q)) return { kind: "app", topic: "stats" };
  if (/このチャット|何回聞ける|無料で何回/.test(q)) return { kind: "app", topic: "ask_chat" };
  if (
    /試合|順位|勝敗|得点|リバウンド|アシスト|選手|チーム|今季|シーズン|リーダー|契約|年俸|ショット|ゾーン|テクニカル|退場|罰金|得意|苦手|キャリア|通算|今日の|昨日の|直近|欠場|怪我|けが|スタッツ|平均/.test(
      q
    )
  ) {
    return { kind: "nba" };
  }
  return { kind: "other" };
}

type Turn = { role: string; content: string };

const NAME_SKIP = new Set(["pro", "nba", "the", "and", "for", "per"]);

/** カタカナか英字の固有名。リバウンドだけ、のような続きには名前が無い */
function nameTokens(text: string): string[] {
  const kata = text.match(/[ァ-ヶー]{3,}/g) ?? [];
  const latin = text.match(/[A-Za-z]{3,}/g) ?? [];
  return [...kata, ...latin.map((s) => s.toLowerCase())].filter((s) => !NAME_SKIP.has(s));
}

/**
 * 直前と話題が違うとき、前の往復は渡さない。
 * 「その選手」「わかりにくい」「リバウンドは」は同じ話題の続きとして残す。
 * 別の選手名やチーム名が出たら、前の会話は渡さない。
 */
export function nbaAskDropPriorTurns(turns: readonly Turn[]): boolean {
  const users = turns.filter((t) => t.role === "user");
  if (users.length < 2) return false;
  const latest = users[users.length - 1]?.content ?? "";
  const prev = users[users.length - 2]?.content ?? "";
  if (nbaAskIsPronounFollowUp(latest)) return false;
  const a = nbaAskSubject(prev);
  const b = nbaAskSubject(latest);
  if (b.kind === "follow") return false;
  if (a.kind === "app" && b.kind === "app") return a.topic !== b.topic;
  if (a.kind === "nba" && b.kind === "nba") {
    const prevNames = new Set(nameTokens(prev));
    const nextNames = nameTokens(latest);
    if (nextNames.length === 0) return false;
    return nextNames.some((n) => !prevNames.has(n));
  }
  return a.kind !== "other" && b.kind !== "other" && a.kind !== b.kind;
}
