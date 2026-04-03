import { FieldValue } from "firebase-admin/firestore";

/**
 * 試合確定時に teams のシーズン通算（wins / losses / draws）を更新する。
 * updateTeamStats と同様、onGameFinalV2 の becameFinal のときだけ呼ぶこと（スコア訂正の再計算は未対応）。
 *
 * - j1 / pl: 引き分けは draws を +1（updateTeamRankings と同じ draws フィールド）
 * - それ以外（nba, bj 等）: 勝ち負けのみ。同点は想定外のためログしてスキップ
 */
export async function updateTeamSeasonRecord({
  db,
  league,
  homeTeamId,
  awayTeamId,
  homeScore,
  awayScore,
}: {
  db: FirebaseFirestore.Firestore;
  league?: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
}): Promise<void> {
  if (!league) {
    console.warn("[updateTeamSeasonRecord] missing league, skip");
    return;
  }

  const isSoccer = league === "j1" || league === "pl";
  const homeRef = db.doc(`teams/${homeTeamId}`);
  const awayRef = db.doc(`teams/${awayTeamId}`);
  const ts = FieldValue.serverTimestamp();

  if (homeScore === awayScore) {
    if (!isSoccer) {
      console.warn("[updateTeamSeasonRecord] tie in non-soccer game, skip", {
        league,
        homeTeamId,
        awayTeamId,
      });
      return;
    }
    const batch = db.batch();
    batch.update(homeRef, { draws: FieldValue.increment(1), updatedAt: ts });
    batch.update(awayRef, { draws: FieldValue.increment(1), updatedAt: ts });
    await batch.commit();
    return;
  }

  const batch = db.batch();
  if (homeScore > awayScore) {
    batch.update(homeRef, { wins: FieldValue.increment(1), updatedAt: ts });
    batch.update(awayRef, { losses: FieldValue.increment(1), updatedAt: ts });
  } else {
    batch.update(awayRef, { wins: FieldValue.increment(1), updatedAt: ts });
    batch.update(homeRef, { losses: FieldValue.increment(1), updatedAt: ts });
  }
  await batch.commit();
}
