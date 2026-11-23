/**
 * ASK の質問ログ（改良用）。答え全文は残さない。
 * Admin SDK だけが書く。失敗しても質問の返答には影響させない。
 */
import type { Firestore } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import type { NbaAskIntent } from "./nbaAskIntent";

export const NBA_ASK_QUESTION_LOGS_COLLECTION = "nbaAskQuestionLogs";

const Q_MAX = 400;

export type NbaAskQuestionLogInput = {
  uid: string;
  question: string;
  language: string;
  isPro: boolean;
  usedStats: boolean;
  fast: boolean;
  leaked: boolean;
  intent: NbaAskIntent;
  promptTokens: number;
  completionTokens: number;
  cachedTokens: number;
};

function trimQ(raw: string): string {
  const s = raw.normalize("NFKC").trim();
  return s.length <= Q_MAX ? s : `${s.slice(0, Q_MAX)}…`;
}

/** 改良用の薄い 1 行。await しなくてもよい（呼び出し側で catch） */
export async function writeNbaAskQuestionLog(db: Firestore, input: NbaAskQuestionLogInput): Promise<void> {
  const q = trimQ(input.question);
  if (!q) return;
  const { intent } = input;
  await db.collection(NBA_ASK_QUESTION_LOGS_COLLECTION).add({
    uid: input.uid,
    q,
    lang: input.language.slice(0, 8),
    pro: input.isPro,
    stats: input.usedStats,
    fast: input.fast,
    leaked: input.leaked,
    kind: intent.kind,
    query: intent.query,
    appTopic: intent.app_topic,
    player: intent.player,
    player2: intent.player2,
    team: intent.team,
    metric: intent.metric,
    award: intent.award,
    season: intent.season,
    playoffs: intent.playoffs === true ? true : null,
    in: input.promptTokens,
    out: input.completionTokens,
    cached: input.cachedTokens,
    atMs: Date.now(),
    createdAt: FieldValue.serverTimestamp(),
  });
}
