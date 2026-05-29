import { FieldValue } from "firebase-admin/firestore";

export type TeamSeasonRecordTarget = "regular" | "playoffs";

/**
 * 試合確定時に teams のシーズン通算（wins / losses / draws）を更新する。
 * - target regular: ルートの wins / losses / draws（レギュラー・ランキング用）
 * - target playoffs: playoff.wins / playoff.losses / playoff.draws
 */
export async function updateTeamSeasonRecord({
  db,
  league,
  homeTeamId,
  awayTeamId,
  homeScore,
  awayScore,
  target = "regular",
}: {
  db: FirebaseFirestore.Firestore;
  league?: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
  target?: TeamSeasonRecordTarget;
}): Promise<void> {
  if (!league) {
    console.warn("[updateTeamSeasonRecord] missing league, skip");
    return;
  }

  const isSoccer = league === "j1" || league === "pl" || league === "wc";
  const homeRef = db.doc(`teams/${homeTeamId}`);
  const awayRef = db.doc(`teams/${awayTeamId}`);
  const ts = FieldValue.serverTimestamp();

  const wk = target === "playoffs" ? "playoff.wins" : "wins";
  const lk = target === "playoffs" ? "playoff.losses" : "losses";
  const dk = target === "playoffs" ? "playoff.draws" : "draws";

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
    batch.update(homeRef, { [dk]: FieldValue.increment(1), updatedAt: ts });
    batch.update(awayRef, { [dk]: FieldValue.increment(1), updatedAt: ts });
    await batch.commit();
    return;
  }

  const batch = db.batch();
  if (homeScore > awayScore) {
    batch.update(homeRef, { [wk]: FieldValue.increment(1), updatedAt: ts });
    batch.update(awayRef, { [lk]: FieldValue.increment(1), updatedAt: ts });
  } else {
    batch.update(awayRef, { [wk]: FieldValue.increment(1), updatedAt: ts });
    batch.update(homeRef, { [lk]: FieldValue.increment(1), updatedAt: ts });
  }
  await batch.commit();
}
