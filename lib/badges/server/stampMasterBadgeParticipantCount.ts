/**
 * master_badges に付与時点の参加者数を刻む。
 * 同じ回の rank1 / Top20 などが共有する。
 */

import type { Firestore } from "firebase-admin/firestore";
import { normalizeParticipantCount } from "../badgeGrant";

export async function stampMasterBadgeParticipantCount(
  db: Firestore,
  badgeIds: Iterable<string>,
  participantCount: number,
): Promise<void> {
  const count = normalizeParticipantCount(participantCount);
  if (count == null) return;
  const ids = [...new Set([...badgeIds].filter(Boolean))];
  if (ids.length === 0) return;

  let batch = db.batch();
  let ops = 0;
  const flush = async () => {
    if (ops === 0) return;
    await batch.commit();
    batch = db.batch();
    ops = 0;
  };

  for (const id of ids) {
    batch.set(
      db.collection("master_badges").doc(id),
      { participantCount: count },
      { merge: true },
    );
    ops++;
    if (ops >= 400) await flush();
  }
  await flush();
}
