/**
 * 質問の話題（大まか）。断ったあとの続きの判定と、即答してよいかの判定に使う。
 */
import { matchNbaAskKnowledge } from "./nbaAskKnowledge";

const PRONOUN_START =
  /^(?:それ|その|そっち|じゃあ|では|昨日のは|この選手|このチーム|同じ|続き|もっと|詳しく|なんで|なぜ|つまり)/;

/** 「わかりにくい」など、直前の答えを短く言い直す続き */
const CLARIFY_FOLLOW_UP =
  /わかりにく|分かりにく|むずかし|難し|もっと簡単|簡単に|かみくだ|噛み砕|つまり|どういうこと|もう一回|もう一度|短く|なにそれ|何それ|意味がわから|意味わか/;

/** 明示した話題。続きの一言にこれが入っていたら、新しい質問として扱う */
const EXPLICIT_TOPIC =
  /通知|招待|スクワッド|プロフィール|採点|料金|ランキング|勝率|連勝|得点|契約|ショット|年俸|テクニカル|得意|苦手|キャリア/;

export function nbaAskIsPronounFollowUp(text: string): boolean {
  const q = text.trim();
  if (!q || q.length > 40) return false;
  if (CLARIFY_FOLLOW_UP.test(q)) return true;
  if (!PRONOUN_START.test(q)) return false;
  return !EXPLICIT_TOPIC.test(q);
}

export type NbaAskSubject =
  | { kind: "app"; topic: string }
  | { kind: "nba" }
  | { kind: "follow" }
  | { kind: "other" };

/** アプリの使い方か、NBA の数字か。短い続きは follow */
export function nbaAskSubject(text: string): NbaAskSubject {
  const q = text.trim();
  if (!q) return { kind: "other" };
  if (nbaAskIsPronounFollowUp(q)) return { kind: "follow" };
  const known = matchNbaAskKnowledge(q);
  if (known) return { kind: "app", topic: known.id };
  if (
    /試合|順位|勝敗|得点|リバウンド|アシスト|選手|チーム|今季|シーズン|リーダー|契約|年俸|ショット|ゾーン|テクニカル|退場|罰金|得意|苦手|キャリア|通算|今日の|昨日の|直近|欠場|怪我|けが|スタッツ|平均|ラインナップ/.test(
      q
    )
  ) {
    return { kind: "nba" };
  }
  return { kind: "other" };
}
