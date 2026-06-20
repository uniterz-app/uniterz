import { Expo, ExpoPushMessage, ExpoPushTicket } from "expo-server-sdk";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import {
  buildPushNotificationCopy,
  normalizePushLanguage,
  type GameMatchupCopyInput,
  type PushNotificationData,
  type PushNotificationType,
} from "./pushNotificationCopy";

const expo = new Expo();

type SendTarget = {
  uid: string;
  data?: PushNotificationData;
};

type TokenRecord = {
  uid: string;
  tokenId: string;
  expoPushToken: string;
};

async function loadTokensForUids(uids: string[]): Promise<TokenRecord[]> {
  const firestore = getFirestore();
  const unique = [...new Set(uids.filter(Boolean))];
  if (unique.length === 0) return [];

  const out: TokenRecord[] = [];
  const chunkSize = 10;
  for (let i = 0; i < unique.length; i += chunkSize) {
    const chunk = unique.slice(i, i + chunkSize);
    const snaps = await Promise.all(
      chunk.map((uid) =>
        firestore.collection(`users/${uid}/pushTokens`).get()
      )
    );
    for (let j = 0; j < chunk.length; j++) {
      const uid = chunk[j];
      for (const doc of snaps[j].docs) {
        const token = doc.data()?.expoPushToken;
        if (typeof token === "string" && Expo.isExpoPushToken(token)) {
          out.push({ uid, tokenId: doc.id, expoPushToken: token });
        }
      }
    }
  }
  return out;
}

async function loadLanguages(uids: string[]): Promise<Map<string, "ja" | "en">> {
  const firestore = getFirestore();
  const unique = [...new Set(uids.filter(Boolean))];
  const map = new Map<string, "ja" | "en">();
  const chunkSize = 30;
  for (let i = 0; i < unique.length; i += chunkSize) {
    const chunk = unique.slice(i, i + chunkSize);
    const refs = chunk.map((uid) => firestore.doc(`users/${uid}`));
    const snaps = await firestore.getAll(...refs);
    for (const snap of snaps) {
      map.set(snap.id, normalizePushLanguage(snap.data()?.language));
    }
  }
  return map;
}

async function deleteInvalidTokens(records: TokenRecord[]): Promise<void> {
  const firestore = getFirestore();
  const batch = firestore.batch();
  let ops = 0;
  for (const rec of records) {
    batch.delete(firestore.doc(`users/${rec.uid}/pushTokens/${rec.tokenId}`));
    ops++;
    if (ops >= 400) {
      await batch.commit();
      ops = 0;
    }
  }
  if (ops > 0) await batch.commit();
}

export async function sendExpoPushToUids(input: {
  type: PushNotificationType;
  targets: SendTarget[];
  matchup?: GameMatchupCopyInput;
}): Promise<{ sent: number; skipped: number }> {
  const uids = input.targets.map((t) => t.uid);
  const [tokens, languages] = await Promise.all([
    loadTokensForUids(uids),
    loadLanguages(uids),
  ]);

  if (tokens.length === 0) {
    return { sent: 0, skipped: input.targets.length };
  }

  const dataByUid = new Map(input.targets.map((t) => [t.uid, t.data]));

  const messages: ExpoPushMessage[] = [];
  for (const rec of tokens) {
    const lang = languages.get(rec.uid) ?? "ja";
    const copy = buildPushNotificationCopy(input.type, lang, input.matchup);
    const data = dataByUid.get(rec.uid) ?? { type: input.type };
    messages.push({
      to: rec.expoPushToken,
      sound: "default",
      title: copy.title,
      body: copy.body,
      data: data as Record<string, unknown>,
    });
  }

  const chunks = expo.chunkPushNotifications(messages);
  const invalid: TokenRecord[] = [];
  let sent = 0;
  let offset = 0;

  for (const chunk of chunks) {
    const tickets: ExpoPushTicket[] = await expo.sendPushNotificationsAsync(chunk);
    for (let i = 0; i < tickets.length; i++) {
      const ticket = tickets[i];
      const rec = tokens[offset + i];
      if (!rec) continue;
      if (ticket.status === "ok") {
        sent++;
        continue;
      }
      const detail = ticket.details?.error;
      if (detail === "DeviceNotRegistered") {
        invalid.push(rec);
      }
    }
    offset += chunk.length;
  }

  if (invalid.length > 0) {
    await deleteInvalidTokens(invalid);
  }

  return { sent, skipped: Math.max(0, input.targets.length - sent) };
}

export async function markGamePushNotified(
  gameId: string,
  field: "pushNotifiedStartAt" | "pushNotifiedFinalAt"
): Promise<void> {
  await getFirestore()
    .doc(`games/${gameId}`)
    .set({ [field]: FieldValue.serverTimestamp() }, { merge: true });
}

export function uniqueAuthorTargetsFromPosts(
  docs: FirebaseFirestore.QueryDocumentSnapshot[],
  type: PushNotificationType,
  gameId: string
): SendTarget[] {
  const byUid = new Map<string, SendTarget>();
  for (const doc of docs) {
    const uid = doc.data()?.authorUid;
    if (typeof uid !== "string" || !uid) continue;
    if (!byUid.has(uid)) {
      byUid.set(uid, {
        uid,
        data: { type, gameId, postId: doc.id },
      });
    }
  }
  return [...byUid.values()];
}
